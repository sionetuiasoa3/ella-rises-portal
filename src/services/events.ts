import api from './api';
import type { Event, Registration } from '@/types/portal';

// Mock mode - matches auth.ts
const MOCK_MODE = true;

const MOCK_EVENTS: Event[] = [
  {
    EventID: 1,
    EventName: 'STEM Workshop: Robotics Basics',
    EventDateTimeStart: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    EventDateTimeEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    EventLocation: 'Ella Rises Center, Room 101',
    EventCapacity: 25,
    EventRegistrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    EventPhotoPath: null,
    isRegistered: false,
    spotsRemaining: 12,
  },
  {
    EventID: 2,
    EventName: 'Art & Culture: Folklorico Dance',
    EventDateTimeStart: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    EventDateTimeEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    EventLocation: 'Community Dance Hall',
    EventCapacity: 30,
    EventRegistrationDeadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    EventPhotoPath: null,
    isRegistered: true,
    spotsRemaining: 8,
  },
  {
    EventID: 3,
    EventName: 'Leadership Summit 2024',
    EventDateTimeStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    EventDateTimeEnd: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    EventLocation: 'UVU Conference Center',
    EventCapacity: 50,
    EventRegistrationDeadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    EventPhotoPath: null,
    isRegistered: true,
    spotsRemaining: 0,
  },
];

let mockRegistrations: Registration[] = [
  {
    RegistrationID: 1,
    ParticipantID: 1,
    EventID: 2,
    RegistrationStatus: 'confirmed',
    RegistrationAttendedFlag: false,
    RegistrationCheckInTime: null,
    RegistrationCreatedAt: new Date().toISOString(),
    Event: MOCK_EVENTS[1],
  },
  {
    RegistrationID: 2,
    ParticipantID: 1,
    EventID: 3,
    RegistrationStatus: 'confirmed',
    RegistrationAttendedFlag: true,
    RegistrationCheckInTime: MOCK_EVENTS[2].EventDateTimeStart,
    RegistrationCreatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    Event: MOCK_EVENTS[2],
  },
];

export const eventsService = {
  async getAll(): Promise<Event[]> {
    if (MOCK_MODE) {
      return MOCK_EVENTS;
    }
    return api.get<Event[]>('/events');
  },

  async getMyEvents(): Promise<Registration[]> {
    if (MOCK_MODE) {
      return mockRegistrations;
    }
    return api.get<Registration[]>('/events/my');
  },

  async getById(eventId: number): Promise<Event> {
    if (MOCK_MODE) {
      const event = MOCK_EVENTS.find(e => e.EventID === eventId);
      if (!event) throw new Error('Event not found');
      return event;
    }
    return api.get<Event>(`/events/${eventId}`);
  },

  async register(eventId: number): Promise<Registration> {
    if (MOCK_MODE) {
      const event = MOCK_EVENTS.find(e => e.EventID === eventId);
      if (!event) throw new Error('Event not found');
      const newReg: Registration = {
        RegistrationID: Date.now(),
        ParticipantID: 1,
        EventID: eventId,
        RegistrationStatus: 'confirmed',
        RegistrationAttendedFlag: false,
        RegistrationCheckInTime: null,
        RegistrationCreatedAt: new Date().toISOString(),
        Event: event,
      };
      mockRegistrations.push(newReg);
      event.isRegistered = true;
      return newReg;
    }
    return api.post<Registration>(`/events/${eventId}/register`);
  },

  async unregister(eventId: number): Promise<{ message: string }> {
    if (MOCK_MODE) {
      mockRegistrations = mockRegistrations.filter(r => r.EventID !== eventId);
      const event = MOCK_EVENTS.find(e => e.EventID === eventId);
      if (event) event.isRegistered = false;
      return { message: 'Unregistered successfully' };
    }
    return api.delete<{ message: string }>(`/events/${eventId}/register`);
  },
};

export default eventsService;
