import { Events, hooks } from '@spcsn/taro-shared';

const eventCenter = hooks.call('getEventCenter', Events)!;

export type EventsType = typeof Events;
export { Events, eventCenter };
