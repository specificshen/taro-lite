import { isFunction, isNumber } from '../shared-primitives';
import { throttle } from '../utils';

interface Rect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

interface IntersectionObserverEntryInit {
  time: number;
  target: Element;
  rootBounds: Rect | null;
  boundingClientRect: Rect;
  intersectionRect?: Rect | false | undefined;
}

interface IntersectionObserverEntryLike {
  time: number;
  target: Element;
  rootBounds: Rect | null;
  boundingClientRect: Rect;
  intersectionRect: Rect;
  isIntersecting: boolean;
  intersectionRatio: number;
}

interface ObservationTarget {
  element: Element;
  entry: IntersectionObserverEntry | null;
}

interface RootMargin {
  value: number;
  unit: string;
}

interface IntersectionObserverLike {
  THROTTLE_TIMEOUT: number;
  POLL_INTERVAL: number | null;
  USE_MUTATION_OBSERVER: boolean;
  _checkForIntersections: () => void;
  _callback: IntersectionObserverCallback;
  _observationTargets: ObservationTarget[];
  _queuedEntries: IntersectionObserverEntry[];
  _rootMarginValues: RootMargin[];
  thresholds: number[];
  root: Element | null;
  rootMargin: string;
  _monitoringIntersections?: boolean;
  _monitoringInterval?: ReturnType<typeof setInterval> | null;
  _domObserver?: MutationObserver | null;
  observe(target: Element): void;
  unobserve(target: Element): void;
  disconnect(): void;
  takeRecords(): IntersectionObserverEntry[];
  _initThresholds(opt_threshold: number | number[] | undefined): number[];
  _parseRootMargin(opt_rootMargin: string | undefined): RootMargin[];
  _monitorIntersections(): void;
  _unmonitorIntersections(): void;
  _computeTargetAndRootIntersection(target: Element, rootRect: Rect): Rect | false | undefined;
  _getRootRect(): Rect;
  _expandRectByRootMargin(rect: Rect): Rect;
  _hasCrossedThreshold(
    oldEntry: IntersectionObserverEntry | null | undefined,
    newEntry: IntersectionObserverEntry,
  ): boolean | undefined;
  _rootIsInDom(): boolean;
  _rootContainsTarget(target: Element): boolean;
  _registerInstance(): void;
  _unregisterInstance(): void;
}

interface LegacyEventTarget extends EventTarget {
  attachEvent(event: string, fn: (...args: unknown[]) => void): void;
  detachEvent(event: string, fn: (...args: unknown[]) => void): void;
}

export function handleIntersectionObserverPolyfill() {
  // Exit early if all IntersectionObserver and IntersectionObserverEntry
  // features are natively supported.
  if (
    'IntersectionObserver' in window &&
    'IntersectionObserverEntry' in window &&
    'intersectionRatio' in window.IntersectionObserverEntry.prototype
  ) {
    if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
      // Minimal polyfill for Edge 15's lack of `isIntersecting`
      // See: https://github.com/w3c/IntersectionObserver/issues/211
      Object.defineProperty(window.IntersectionObserverEntry.prototype, 'isIntersecting', {
        get: function () {
          return this.intersectionRatio > 0;
        },
      });
    }
  } else {
    handleIntersectionObserverObjectPolyfill();
  }
}

function handleIntersectionObserverObjectPolyfill() {
  const document = window.document;

  /**
   * An IntersectionObserver registry. This registry exists to hold a strong
   * reference to IntersectionObserver instances currently observing a target
   * element. Without this registry, instances without another reference may be
   * garbage collected.
   */
  const registry: IntersectionObserverLike[] = [];

  /**
   * Creates the global IntersectionObserverEntry constructor.
   * https://w3c.github.io/IntersectionObserver/#intersection-observer-entry
   * @param {Object} entry A dictionary of instance properties.
   * @constructor
   */
  function IntersectionObserverEntry(this: IntersectionObserverEntryLike, entry: IntersectionObserverEntryInit) {
    this.time = entry.time;
    this.target = entry.target;
    this.rootBounds = entry.rootBounds;
    this.boundingClientRect = entry.boundingClientRect;
    this.intersectionRect = entry.intersectionRect || getEmptyRect();
    this.isIntersecting = !!entry.intersectionRect;

    // Calculates the intersection ratio.
    const targetRect = this.boundingClientRect;
    const targetArea = targetRect.width * targetRect.height;
    const intersectionRect = this.intersectionRect;
    const intersectionArea = intersectionRect.width * intersectionRect.height;

    // Sets intersection ratio.
    if (targetArea) {
      // Round the intersection ratio to avoid floating point math issues:
      // https://github.com/w3c/IntersectionObserver/issues/324
      this.intersectionRatio = Number((intersectionArea / targetArea).toFixed(4));
    } else {
      // If area is zero and is intersecting, sets to 1, otherwise to 0
      this.intersectionRatio = this.isIntersecting ? 1 : 0;
    }
  }

  /**
   * Creates the global IntersectionObserver constructor.
   * https://w3c.github.io/IntersectionObserver/#intersection-observer-interface
   * @param {Function} callback The function to be invoked after intersection
   *     changes have queued. The function is not invoked if the queue has
   *     been emptied by calling the `takeRecords` method.
   * @param {Object=} opt_options Optional configuration options.
   * @constructor
   */
  function IntersectionObserver(
    this: IntersectionObserverLike,
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {},
  ) {
    if (!isFunction(callback)) {
      throw new Error('callback must be a function');
    }

    if (options.root && options.root.nodeType !== 1) {
      throw new Error('root must be an Element');
    }

    // Binds and throttles `this._checkForIntersections`.
    this._checkForIntersections = throttle(this._checkForIntersections.bind(this), this.THROTTLE_TIMEOUT);

    // Private properties.
    this._callback = callback;
    this._observationTargets = [];
    this._queuedEntries = [];
    this._rootMarginValues = this._parseRootMargin(options.rootMargin);

    // Public properties.
    this.thresholds = this._initThresholds(options.threshold);
    this.root = (options.root as Element | null) || null;
    this.rootMargin = this._rootMarginValues
      .map(function (margin: RootMargin) {
        return margin.value + margin.unit;
      })
      .join(' ');
  }

  /**
   * The minimum interval within which the document will be checked for
   * intersection changes.
   */
  IntersectionObserver.prototype.THROTTLE_TIMEOUT = 100;

  /**
   * The frequency in which the polyfill polls for intersection changes.
   * this can be updated on a per instance basis and must be set prior to
   * calling `observe` on the first target.
   */
  IntersectionObserver.prototype.POLL_INTERVAL = null;

  /**
   * Use a mutation observer on the root element
   * to detect intersection changes.
   */
  IntersectionObserver.prototype.USE_MUTATION_OBSERVER = true;

  /**
   * Starts observing a target element for intersection changes based on
   * the thresholds values.
   * @param {Element} target The DOM element to observe.
   */
  IntersectionObserver.prototype.observe = function (this: IntersectionObserverLike, target: Element) {
    const isTargetAlreadyObserved = this._observationTargets.some(function (item: ObservationTarget) {
      return item.element === target;
    });

    if (isTargetAlreadyObserved) return;

    if (!(target && target.nodeType === 1)) {
      throw new Error('target must be an Element');
    }

    this._registerInstance();
    this._observationTargets.push({ element: target, entry: null });
    this._monitorIntersections();
    this._checkForIntersections();
  };

  /**
   * Stops observing a target element for intersection changes.
   * @param {Element} target The DOM element to observe.
   */
  IntersectionObserver.prototype.unobserve = function (this: IntersectionObserverLike, target: Element) {
    this._observationTargets = this._observationTargets.filter(function (item: ObservationTarget) {
      return item.element !== target;
    });
    if (!this._observationTargets.length) {
      this._unmonitorIntersections();
      this._unregisterInstance();
    }
  };

  /**
   * Stops observing all target elements for intersection changes.
   */
  IntersectionObserver.prototype.disconnect = function (this: IntersectionObserverLike) {
    this._observationTargets = [];
    this._unmonitorIntersections();
    this._unregisterInstance();
  };

  /**
   * Returns any queue entries that have not yet been reported to the
   * callback and clears the queue. This can be used in conjunction with the
   * callback to obtain the absolute most up-to-date intersection information.
   * @return {Array} The currently queued entries.
   */
  IntersectionObserver.prototype.takeRecords = function (this: IntersectionObserverLike): IntersectionObserverEntry[] {
    const records = this._queuedEntries.slice();
    this._queuedEntries = [];
    return records as IntersectionObserverEntry[];
  };

  /**
   * Accepts the threshold value from the user configuration object and
   * returns a sorted array of unique threshold values. If a value is not
   * between 0 and 1 and error is thrown.
   * @private
   * @param {Array|number=} opt_threshold An optional threshold value or
   *     a list of threshold values, defaulting to [0].
   * @return {Array} A sorted list of unique and valid threshold values.
   */
  IntersectionObserver.prototype._initThresholds = function (
    this: IntersectionObserverLike,
    opt_threshold: number | number[] | undefined,
  ): number[] {
    let threshold: number | number[] = opt_threshold || [0];
    if (!Array.isArray(threshold)) threshold = [threshold];

    return threshold.sort().filter(function (t: number, i: number, a: number[]) {
      if (!isNumber(t) || Number.isNaN(t) || t < 0 || t > 1) {
        throw new Error('threshold must be a number between 0 and 1 inclusively');
      }
      return t !== a[i - 1];
    });
  };

  /**
   * Accepts the rootMargin value from the user configuration object
   * and returns an array of the four margin values as an object containing
   * the value and unit properties. If any of the values are not properly
   * formatted or use a unit other than px or %, and error is thrown.
   * @private
   * @param {string=} opt_rootMargin An optional rootMargin value,
   *     defaulting to '0px'.
   * @return {Array<Object>} An array of margin objects with the keys
   *     value and unit.
   */
  IntersectionObserver.prototype._parseRootMargin = function (
    this: IntersectionObserverLike,
    opt_rootMargin: string | undefined,
  ): RootMargin[] {
    const marginString = opt_rootMargin || '0px';
    const margins = marginString.split(/\s+/).map(function (margin: string): RootMargin {
      const parts = /^(-?\d*\.?\d+)(px|%)$/.exec(margin);
      if (!parts) {
        throw new Error('rootMargin must be specified in pixels or percent');
      }
      return { value: parseFloat(parts[1]), unit: parts[2] };
    });

    // Handles shorthand.
    margins[1] = margins[1] || margins[0];
    margins[2] = margins[2] || margins[0];
    margins[3] = margins[3] || margins[1];

    return margins;
  };

  /**
   * Starts polling for intersection changes if the polling is not already
   * happening, and if the page's visibility state is visible.
   * @private
   */
  IntersectionObserver.prototype._monitorIntersections = function (this: IntersectionObserverLike) {
    if (!this._monitoringIntersections) {
      this._monitoringIntersections = true;

      // If a poll interval is set, use polling instead of listening to
      // resize and scroll events or DOM mutations.
      if (this.POLL_INTERVAL) {
        this._monitoringInterval = setInterval(this._checkForIntersections, this.POLL_INTERVAL);
      } else {
        addEvent(window, 'resize', this._checkForIntersections, true);
        addEvent(document, 'scroll', this._checkForIntersections, true);

        if (this.USE_MUTATION_OBSERVER && 'MutationObserver' in window) {
          this._domObserver = new MutationObserver(this._checkForIntersections);
          this._domObserver.observe(document, {
            attributes: true,
            childList: true,
            characterData: true,
            subtree: true,
          });
        }
      }
    }
  };

  /**
   * Stops polling for intersection changes.
   * @private
   */
  IntersectionObserver.prototype._unmonitorIntersections = function (this: IntersectionObserverLike) {
    if (this._monitoringIntersections) {
      this._monitoringIntersections = false;

      clearInterval(this._monitoringInterval!);
      this._monitoringInterval = null;

      removeEvent(window, 'resize', this._checkForIntersections, true);
      removeEvent(document, 'scroll', this._checkForIntersections, true);

      if (this._domObserver) {
        this._domObserver.disconnect();
        this._domObserver = null;
      }
    }
  };

  /**
   * Scans each observation target for intersection changes and adds them
   * to the internal entries queue. If new entries are found, it
   * schedules the callback to be invoked.
   * @private
   */
  IntersectionObserver.prototype._checkForIntersections = function (this: IntersectionObserverLike) {
    const rootIsInDom = this._rootIsInDom();
    const rootRect = rootIsInDom ? this._getRootRect() : getEmptyRect();

    this._observationTargets.forEach((item: ObservationTarget) => {
      const target = item.element;
      const targetRect = getBoundingClientRect(target);
      const rootContainsTarget = this._rootContainsTarget(target);
      const oldEntry = item.entry;
      const intersectionRect =
        rootIsInDom && rootContainsTarget && this._computeTargetAndRootIntersection(target, rootRect);

      item.entry = new (
        IntersectionObserverEntry as unknown as new (
          entry: IntersectionObserverEntryInit,
        ) => IntersectionObserverEntry
      )({
        time: now(),
        target: target,
        boundingClientRect: targetRect,
        rootBounds: rootRect,
        intersectionRect: intersectionRect,
      });
      const newEntry = item.entry;

      if (!oldEntry) {
        this._queuedEntries.push(newEntry);
      } else if (rootIsInDom && rootContainsTarget) {
        // If the new entry intersection ratio has crossed any of the
        // thresholds, add a new entry.
        if (this._hasCrossedThreshold(oldEntry, newEntry)) {
          this._queuedEntries.push(newEntry);
        }
      } else {
        // If the root is not in the DOM or target is not contained within
        // root but the previous entry for this target had an intersection,
        // add a new record indicating removal.
        if (oldEntry && oldEntry.isIntersecting) {
          this._queuedEntries.push(newEntry);
        }
      }
    });

    if (this._queuedEntries.length) {
      this._callback(this.takeRecords(), this as unknown as IntersectionObserver);
    }
  };

  /**
   * Accepts a target and root rect computes the intersection between then
   * following the algorithm in the spec.
   * At this time clip-path is not considered.
   * https://w3c.github.io/IntersectionObserver/#calculate-intersection-rect-algo
   * @param {Element} target The target DOM element
   * @param {Object} rootRect The bounding rect of the root after being
   *     expanded by the rootMargin value.
   * @return {?Object} The final intersection rect object or undefined if no
   *     intersection is found.
   * @private
   */
  IntersectionObserver.prototype._computeTargetAndRootIntersection = function (
    this: IntersectionObserverLike,
    target: Element,
    rootRect: Rect,
  ): Rect | false | undefined {
    // If the element isn't displayed, an intersection can't happen.
    if (window.getComputedStyle(target).display === 'none') return;

    const targetRect = getBoundingClientRect(target);
    let intersectionRect: Rect | false | undefined = targetRect;
    let parent: Node | null = getParentNode(target);
    let atRoot = false;

    while (!atRoot) {
      let parentRect: Rect | null = null;
      const parentComputedStyle: Partial<CSSStyleDeclaration> =
        (parent as Node).nodeType === 1 ? window.getComputedStyle(parent as Element) : {};

      // If the parent isn't displayed, an intersection can't happen.
      if (parentComputedStyle.display === 'none') return;

      if (parent === this.root || parent === document) {
        atRoot = true;
        parentRect = rootRect;
      } else {
        // If the element has a non-visible overflow, and it's not the <body>
        // or <html> element, update the intersection rect.
        // Note: <body> and <html> cannot be clipped to a rect that's not also
        // the document rect, so no need to compute a new intersection.
        if (
          parent !== document.body &&
          parent !== document.documentElement &&
          parentComputedStyle.overflow !== 'visible'
        ) {
          parentRect = getBoundingClientRect(parent as Element);
        }
      }

      // If either of the above conditionals set a new parentRect,
      // calculate new intersection data.
      if (parentRect) {
        intersectionRect = computeRectIntersection(parentRect, intersectionRect as Rect);

        if (!intersectionRect) break;
      }
      parent = getParentNode(parent as Node);
    }
    return intersectionRect;
  };

  /**
   * Returns the root rect after being expanded by the rootMargin value.
   * @return {Object} The expanded root rect.
   * @private
   */
  IntersectionObserver.prototype._getRootRect = function (this: IntersectionObserverLike): Rect {
    let rootRect: Rect;
    if (this.root) {
      rootRect = getBoundingClientRect(this.root);
    } else {
      // Use <html>/<body> instead of window since scroll bars affect size.
      const html = document.documentElement;
      const body = document.body;
      rootRect = {
        top: 0,
        left: 0,
        right: html.clientWidth || body.clientWidth,
        width: html.clientWidth || body.clientWidth,
        bottom: html.clientHeight || body.clientHeight,
        height: html.clientHeight || body.clientHeight,
      };
    }
    return this._expandRectByRootMargin(rootRect);
  };

  /**
   * Accepts a rect and expands it by the rootMargin value.
   * @param {Object} rect The rect object to expand.
   * @return {Object} The expanded rect.
   * @private
   */
  IntersectionObserver.prototype._expandRectByRootMargin = function (this: IntersectionObserverLike, rect: Rect): Rect {
    const margins = this._rootMarginValues.map(function (margin: RootMargin, i: number) {
      return margin.unit === 'px' ? margin.value : (margin.value * (i % 2 ? rect.width : rect.height)) / 100;
    });
    const newRect = {
      top: rect.top - margins[0],
      right: rect.right + margins[1],
      bottom: rect.bottom + margins[2],
      left: rect.left - margins[3],
    } as Rect;
    newRect.width = newRect.right - newRect.left;
    newRect.height = newRect.bottom - newRect.top;

    return newRect;
  };

  /**
   * Accepts an old and new entry and returns true if at least one of the
   * threshold values has been crossed.
   * @param {?IntersectionObserverEntry} oldEntry The previous entry for a
   *    particular target element or null if no previous entry exists.
   * @param {IntersectionObserverEntry} newEntry The current entry for a
   *    particular target element.
   * @return {boolean} Returns true if a any threshold has been crossed.
   * @private
   */
  IntersectionObserver.prototype._hasCrossedThreshold = function (
    this: IntersectionObserverLike,
    oldEntry: IntersectionObserverEntry | null | undefined,
    newEntry: IntersectionObserverEntry,
  ): boolean | undefined {
    // To make comparing easier, an entry that has a ratio of 0
    // but does not actually intersect is given a value of -1
    const oldRatio = oldEntry && oldEntry.isIntersecting ? oldEntry.intersectionRatio || 0 : -1;
    const newRatio = newEntry.isIntersecting ? newEntry.intersectionRatio || 0 : -1;

    // Ignore unchanged ratios
    if (oldRatio === newRatio) return;

    for (let i = 0; i < this.thresholds.length; i++) {
      const threshold = this.thresholds[i];

      // Return true if an entry matches a threshold or if the new ratio
      // and the old ratio are on the opposite sides of a threshold.
      if (threshold === oldRatio || threshold === newRatio || threshold < oldRatio !== threshold < newRatio) {
        return true;
      }
    }
  };

  /**
   * Returns whether or not the root element is an element and is in the DOM.
   * @return {boolean} True if the root element is an element and is in the DOM.
   * @private
   */
  IntersectionObserver.prototype._rootIsInDom = function (this: IntersectionObserverLike) {
    return !this.root || containsDeep(document, this.root);
  };

  /**
   * Returns whether or not the target element is a child of root.
   * @param {Element} target The target element to check.
   * @return {boolean} True if the target element is a child of root.
   * @private
   */
  IntersectionObserver.prototype._rootContainsTarget = function (this: IntersectionObserverLike, target: Element) {
    return containsDeep(this.root || document, target);
  };

  /**
   * Adds the instance to the global IntersectionObserver registry if it isn't
   * already present.
   * @private
   */
  IntersectionObserver.prototype._registerInstance = function (this: IntersectionObserverLike) {
    if (registry.indexOf(this) < 0) {
      registry.push(this);
    }
  };

  /**
   * Removes the instance from the global IntersectionObserver registry.
   * @private
   */
  IntersectionObserver.prototype._unregisterInstance = function (this: IntersectionObserverLike) {
    const index = registry.indexOf(this);
    if (index !== -1) registry.splice(index, 1);
  };

  /**
   * Returns the result of the performance.now() method or null in browsers
   * that don't support the API.
   * @return {number} The elapsed time since the page was requested.
   */
  function now() {
    return window.performance && performance.now && performance.now();
  }

  /**
   * Adds an event handler to a DOM node ensuring cross-browser compatibility.
   * @param {Node} node The DOM node to add the event handler to.
   * @param {string} event The event name.
   * @param {Function} fn The event handler to add.
   * @param {boolean} opt_useCapture Optionally adds the even to the capture
   *     phase. Note: this only works in modern browsers.
   */
  function addEvent(node: EventTarget, event: string, fn: (...args: unknown[]) => void, opt_useCapture?: boolean) {
    if (isFunction(node.addEventListener)) {
      node.addEventListener(event, fn as EventListener, opt_useCapture || false);
    } else if (isFunction((node as LegacyEventTarget).attachEvent)) {
      (node as LegacyEventTarget).attachEvent('on' + event, fn);
    }
  }

  /**
   * Removes a previously added event handler from a DOM node.
   * @param {Node} node The DOM node to remove the event handler from.
   * @param {string} event The event name.
   * @param {Function} fn The event handler to remove.
   * @param {boolean} opt_useCapture If the event handler was added with this
   *     flag set to true, it should be set to true here in order to remove it.
   */
  function removeEvent(node: EventTarget, event: string, fn: (...args: unknown[]) => void, opt_useCapture?: boolean) {
    if (isFunction(node.removeEventListener)) {
      node.removeEventListener(event, fn as EventListener, opt_useCapture || false);
    } else if (isFunction((node as LegacyEventTarget).detachEvent)) {
      (node as LegacyEventTarget).detachEvent('on' + event, fn);
    }
  }

  /**
   * Returns the intersection between two rect objects.
   * @param {Object} rect1 The first rect.
   * @param {Object} rect2 The second rect.
   * @return {?Object} The intersection rect or undefined if no intersection
   *     is found.
   */
  function computeRectIntersection(rect1: Rect, rect2: Rect): Rect | false {
    const top = Math.max(rect1.top, rect2.top);
    const bottom = Math.min(rect1.bottom, rect2.bottom);
    const left = Math.max(rect1.left, rect2.left);
    const right = Math.min(rect1.right, rect2.right);
    const width = right - left;
    const height = bottom - top;

    return (
      width >= 0 &&
      height >= 0 && {
        top: top,
        bottom: bottom,
        left: left,
        right: right,
        width: width,
        height: height,
      }
    );
  }

  /**
   * Shims the native getBoundingClientRect for compatibility with older IE.
   * @param {Element} el The element whose bounding rect to get.
   * @return {Object} The (possibly shimmed) rect of the element.
   */
  function getBoundingClientRect(el: Element): Rect {
    let rect: DOMRect | undefined;

    try {
      rect = el.getBoundingClientRect();
    } catch (_err) {
      // Ignore Windows 7 IE11 "Unspecified error"
      // https://github.com/w3c/IntersectionObserver/pull/205
    }

    if (!rect) return getEmptyRect();

    // Older IE
    if (!(rect.width && rect.height)) {
      return {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
      };
    }
    return rect;
  }

  /**
   * Returns an empty rect object. An empty rect is returned when an element
   * is not in the DOM.
   * @return {Object} The empty rect.
   */
  function getEmptyRect(): Rect {
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: 0,
      height: 0,
    };
  }

  /**
   * Checks to see if a parent element contains a child element (including inside
   * shadow DOM).
   * @param {Node} parent The parent element.
   * @param {Node} child The child element.
   * @return {boolean} True if the parent node contains the child node.
   */
  function containsDeep(parent: Node, child: Node) {
    let node: Node | null = child;
    while (node) {
      if (node === parent) return true;

      node = getParentNode(node);
    }
    return false;
  }

  /**
   * Gets the parent node of an element or its host element if the parent node
   * is a shadow root.
   * @param {Node} node The node whose parent to get.
   * @return {Node|null} The parent node or null if no parent exists.
   */
  function getParentNode(node: Node): Node | null {
    const parent = node.parentNode;

    if (parent && parent.nodeType === 11 && (parent as ShadowRoot).host) {
      // If the parent is a shadow root, return the host element.
      return (parent as ShadowRoot).host;
    }

    if (parent && (parent as Element).assignedSlot) {
      // If the parent is distributed in a <slot>, return the parent of a slot.
      return ((parent as Element).assignedSlot as HTMLSlotElement).parentNode;
    }

    return parent;
  }

  // Exposes the constructors globally.
  window.IntersectionObserver = IntersectionObserver as unknown as typeof window.IntersectionObserver;
  window.IntersectionObserverEntry = IntersectionObserverEntry as unknown as typeof window.IntersectionObserverEntry;
}
