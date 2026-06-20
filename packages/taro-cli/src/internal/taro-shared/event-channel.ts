import { Events } from './event-emitter';

interface ExeListItem {
  eventName: string;
  data: Record<string, unknown>;
}

interface RouteEvt extends Events {
  addEvents: (events: Record<string, (...args: any[]) => void>) => void;
  emit?: (events: string, data: Record<string, unknown>) => void;
}

interface PageEvt extends Events {
  exeList: ExeListItem[];
  emit?: (events: string, data: Record<string, unknown>) => void;
}

let routeChannel: RouteEvt;

class PageEvts extends Events {
  exeList: ExeListItem[] = [];

  on(eventName: string, callback: (...args: any[]) => void) {
    super.on(eventName, callback, this);
    this.exeList = this.exeList.reduce<ExeListItem[]>((prev, item) => {
      if (item.eventName === eventName) {
        super.trigger(item.eventName, item.data);
      } else {
        prev.push(item);
      }
      return prev;
    }, []);
    return this;
  }

  emit(events: string, data: Record<string, unknown>) {
    routeChannel.trigger(events, data);
  }
}

const pageChannel: PageEvt = new PageEvts();

class RouteEvts extends Events {
  emit(events: string, data: Record<string, unknown>) {
    pageChannel.off(events);
    pageChannel.exeList.push({
      eventName: events,
      data,
    });
  }

  addEvents(events: Record<string, (...args: any[]) => void>) {
    if (!events || typeof events !== 'object') return;
    Object.keys(events).forEach((key) => {
      this.off(key);
      this.on(key, events[key], this);
    });
  }
}

routeChannel = new RouteEvts();

export const EventChannel = { pageChannel, routeChannel };
