import { Events } from '../event-emitter';
import { hooks } from '../runtime-hooks';
import { getGlobalSingleton } from '../shared-primitives';

const eventCenter = getGlobalSingleton('__TARO_EVENT_CENTER__', () => hooks.call('getEventCenter', Events)!);

export type EventsType = typeof Events;
export { Events, eventCenter };
