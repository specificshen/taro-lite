import { parseUrl } from '../bom/url';
import { TaroElement } from './element';

enum AnchorElementAttrs {
  HREF = 'href',
  PROTOCOL = 'protocol',
  HOST = 'host',
  SEARCH = 'search',
  HASH = 'hash',
  HOSTNAME = 'hostname',
  PORT = 'port',
  PATHNAME = 'pathname',
}

export class AnchorElement extends TaroElement {
  private getAttr(key: AnchorElementAttrs): string {
    return (this.props[key] as string | undefined) ?? '';
  }

  public get href() {
    return this.getAttr(AnchorElementAttrs.HREF);
  }

  public set href(val: string) {
    this.setAttribute(AnchorElementAttrs.HREF, val);
  }

  get protocol() {
    return this.getAttr(AnchorElementAttrs.PROTOCOL);
  }

  get host() {
    return this.getAttr(AnchorElementAttrs.HOST);
  }

  get search() {
    return this.getAttr(AnchorElementAttrs.SEARCH);
  }

  get hash() {
    return this.getAttr(AnchorElementAttrs.HASH);
  }

  get hostname() {
    return this.getAttr(AnchorElementAttrs.HOSTNAME);
  }

  get port() {
    return this.getAttr(AnchorElementAttrs.PORT);
  }

  get pathname() {
    return this.getAttr(AnchorElementAttrs.PATHNAME);
  }

  public setAttribute(qualifiedName: string, value: unknown): void {
    if (qualifiedName === AnchorElementAttrs.HREF) {
      const willSetAttr = parseUrl(String(value)) as Record<string, string>;
      for (const k in willSetAttr) {
        super.setAttribute(k, willSetAttr[k]);
      }
    } else {
      super.setAttribute(qualifiedName, value);
    }
  }
}
