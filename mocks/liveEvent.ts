export interface LiveEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
}

export const upcomingEvent: LiveEvent = {
  id: '1',
  title: 'Winter Wonderland Weekend',
  startDate: '2025-12-14T10:00:00',
  endDate: '2025-12-15T20:00:00',
  description: 'Join us for our special live weekend event!',
};
