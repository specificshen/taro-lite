import { Events } from '../event-emitter';
import { hooks } from '../runtime-hooks';

const eventCenter = hooks.call('getEventCenter', Events)!;

export type EventsType = typeof Events;
export { Events, eventCenter };
