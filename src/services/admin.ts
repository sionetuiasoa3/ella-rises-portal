// Mock Admin Services
import type { Participant, Event, Registration, Milestone, MilestoneType } from '@/types/portal';

// Mock data
const mockParticipants: Participant[] = [
  {
    ParticipantID: 1,
    ParticipantEmail: 'maria@example.com',
    ParticipantFirstName: 'Maria',
    ParticipantLastName: 'Garcia',
    ParticipantDOB: '2005-03-15',
    ParticipantRole: 'participant',
    ParticipantPhone: '(555) 123-4567',
    ParticipantCity: 'Salt Lake City',
    ParticipantState: 'UT',
    ParticipantZip: '84101',
    ParticipantSchoolOrEmployer: 'West High School',
    ParticipantFieldOfInterest: 'Arts',
    ParticipantPhotoPath: null,
  },
  {
    ParticipantID: 2,
    ParticipantEmail: 'sofia@example.com',
    ParticipantFirstName: 'Sofia',
    ParticipantLastName: 'Rodriguez',
    ParticipantDOB: '2006-07-22',
    ParticipantRole: 'participant',
    ParticipantPhone: '(555) 234-5678',
    ParticipantCity: 'Provo',
    ParticipantState: 'UT',
    ParticipantZip: '84601',
    ParticipantSchoolOrEmployer: 'Timpview High School',
    ParticipantFieldOfInterest: 'STEM',
    ParticipantPhotoPath: null,
  },
  {
    ParticipantID: 3,
    ParticipantEmail: 'emma@example.com',
    ParticipantFirstName: 'Emma',
    ParticipantLastName: 'Johnson',
    ParticipantDOB: '2004-11-08',
    ParticipantRole: 'admin',
    ParticipantPhone: '(555) 345-6789',
    ParticipantCity: 'Ogden',
    ParticipantState: 'UT',
    ParticipantZip: '84401',
    ParticipantSchoolOrEmployer: 'University of Utah',
    ParticipantFieldOfInterest: 'Both',
    ParticipantPhotoPath: null,
  },
];

export interface EventTemplate {
  TemplateID: number;
  TemplateName: string;
  TemplateDescription: string;
  TemplateCategory: string;
  TemplateDefaultCapacity: number;
  TemplateCreatedAt: string;
}

const mockEventTemplates: EventTemplate[] = [
  {
    TemplateID: 1,
    TemplateName: 'Folklorico Dance Workshop',
    TemplateDescription: 'Traditional Mexican folk dance classes for beginners and intermediate dancers.',
    TemplateCategory: 'Arts',
    TemplateDefaultCapacity: 25,
    TemplateCreatedAt: '2024-01-15T10:00:00Z',
  },
  {
    TemplateID: 2,
    TemplateName: 'STEM Career Exploration',
    TemplateDescription: 'Hands-on workshops exploring various STEM career paths.',
    TemplateCategory: 'STEM',
    TemplateDefaultCapacity: 30,
    TemplateCreatedAt: '2024-02-01T10:00:00Z',
  },
  {
    TemplateID: 3,
    TemplateName: 'Mentorship Session',
    TemplateDescription: 'One-on-one and group mentorship sessions with industry professionals.',
    TemplateCategory: 'Leadership',
    TemplateDefaultCapacity: 15,
    TemplateCreatedAt: '2024-02-15T10:00:00Z',
  },
];

const mockEvents: Event[] = [
  {
    EventID: 1,
    EventName: 'Spring Folklorico Workshop',
    EventDateTimeStart: '2025-03-15T10:00:00Z',
    EventDateTimeEnd: '2025-03-15T12:00:00Z',
    EventLocation: 'Community Center, SLC',
    EventCapacity: 25,
    EventRegistrationDeadline: '2025-03-10T23:59:59Z',
    EventPhotoPath: null,
  },
  {
    EventID: 2,
    EventName: 'Coding Bootcamp Introduction',
    EventDateTimeStart: '2025-04-01T14:00:00Z',
    EventDateTimeEnd: '2025-04-01T17:00:00Z',
    EventLocation: 'Tech Hub, Provo',
    EventCapacity: 30,
    EventRegistrationDeadline: '2025-03-28T23:59:59Z',
    EventPhotoPath: null,
  },
  {
    EventID: 3,
    EventName: 'Career Mentorship Day',
    EventDateTimeStart: '2024-11-20T09:00:00Z',
    EventDateTimeEnd: '2024-11-20T15:00:00Z',
    EventLocation: 'University of Utah',
    EventCapacity: 15,
    EventRegistrationDeadline: '2024-11-15T23:59:59Z',
    EventPhotoPath: null,
  },
];

// Extended event with template reference
export interface AdminEvent extends Event {
  TemplateID: number;
}

const mockAdminEvents: AdminEvent[] = [
  { ...mockEvents[0], TemplateID: 1 },
  { ...mockEvents[1], TemplateID: 2 },
  { ...mockEvents[2], TemplateID: 3 },
];

export interface AdminRegistration extends Registration {
  Participant?: Participant;
  SurveyCompleted: boolean;
}

const mockRegistrations: AdminRegistration[] = [
  {
    RegistrationID: 1,
    ParticipantID: 1,
    EventID: 1,
    RegistrationStatus: 'confirmed',
    RegistrationAttendedFlag: false,
    RegistrationCheckInTime: null,
    RegistrationCreatedAt: '2025-02-01T10:00:00Z',
    SurveyCompleted: false,
    Participant: mockParticipants[0],
  },
  {
    RegistrationID: 2,
    ParticipantID: 2,
    EventID: 1,
    RegistrationStatus: 'confirmed',
    RegistrationAttendedFlag: false,
    RegistrationCheckInTime: null,
    RegistrationCreatedAt: '2025-02-05T14:30:00Z',
    SurveyCompleted: false,
    Participant: mockParticipants[1],
  },
  {
    RegistrationID: 3,
    ParticipantID: 1,
    EventID: 3,
    RegistrationStatus: 'confirmed',
    RegistrationAttendedFlag: true,
    RegistrationCheckInTime: '2024-11-20T09:15:00Z',
    RegistrationCreatedAt: '2024-11-01T09:00:00Z',
    SurveyCompleted: true,
    Participant: mockParticipants[0],
  },
];

export interface Donation {
  DonationID: number;
  ParticipantID: number | null;
  DonorName: string;
  DonorEmail: string;
  DonationAmount: number;
  DonationFrequency: 'one-time' | 'monthly' | 'annual';
  DonationDate: string;
  DonationNotes: string | null;
  Participant?: Participant;
}

const mockDonations: Donation[] = [
  {
    DonationID: 1,
    ParticipantID: 1,
    DonorName: 'Maria Garcia',
    DonorEmail: 'maria@example.com',
    DonationAmount: 50,
    DonationFrequency: 'one-time',
    DonationDate: '2024-12-01T10:00:00Z',
    DonationNotes: 'In support of arts programs',
    Participant: mockParticipants[0],
  },
  {
    DonationID: 2,
    ParticipantID: null,
    DonorName: 'Anonymous Donor',
    DonorEmail: 'donor@example.com',
    DonationAmount: 250,
    DonationFrequency: 'monthly',
    DonationDate: '2024-11-15T14:00:00Z',
    DonationNotes: null,
  },
  {
    DonationID: 3,
    ParticipantID: 2,
    DonorName: 'Sofia Rodriguez',
    DonorEmail: 'sofia@example.com',
    DonationAmount: 100,
    DonationFrequency: 'one-time',
    DonationDate: '2024-10-20T09:00:00Z',
    DonationNotes: 'For STEM workshops',
    Participant: mockParticipants[1],
  },
  {
    DonationID: 4,
    ParticipantID: 1,
    DonorName: 'Maria Garcia',
    DonorEmail: 'maria@example.com',
    DonationAmount: 25,
    DonationFrequency: 'one-time',
    DonationDate: '2024-09-10T16:00:00Z',
    DonationNotes: null,
    Participant: mockParticipants[0],
  },
];

const mockMilestoneTypes: MilestoneType[] = [
  { MilestoneID: 1, MilestoneTitle: 'AA in Art & Design' },
  { MilestoneID: 2, MilestoneTitle: 'Clinical Data Coordinator' },
  { MilestoneID: 3, MilestoneTitle: 'Middle School Diploma' },
  { MilestoneID: 4, MilestoneTitle: 'Published Project' },
  { MilestoneID: 5, MilestoneTitle: 'High School Diploma' },
  { MilestoneID: 6, MilestoneTitle: 'Mentorship Program' },
  { MilestoneID: 7, MilestoneTitle: 'Internship' },
  { MilestoneID: 8, MilestoneTitle: 'BS in Information Systems' },
  { MilestoneID: 9, MilestoneTitle: 'Junior QA Tester' },
  { MilestoneID: 10, MilestoneTitle: 'Product Designer' },
  { MilestoneID: 11, MilestoneTitle: 'Other' },
];

const mockMilestones: Milestone[] = [
  { MilestoneID: 1, ParticipantID: 1, MilestoneDate: '2024-06-01', MilestoneTitle: 'High School Diploma' },
  { MilestoneID: 2, ParticipantID: 1, MilestoneDate: '2024-09-15', MilestoneTitle: 'Mentorship Program' },
  { MilestoneID: 3, ParticipantID: 2, MilestoneDate: '2024-05-20', MilestoneTitle: 'Middle School Diploma' },
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Admin Auth
export const adminAuthService = {
  async login(email: string, password: string): Promise<{ token: string; admin: { email: string; name: string } }> {
    await delay(500);
    // Mock admin credentials
    if (email === 'admin@ellarises.org' && password === 'admin123') {
      const admin = { email, name: 'Admin User' };
      localStorage.setItem('admin_token', 'mock_admin_token');
      localStorage.setItem('admin_user', JSON.stringify(admin));
      return { token: 'mock_admin_token', admin };
    }
    throw new Error('Invalid credentials');
  },

  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },

  getAdmin() {
    const stored = localStorage.getItem('admin_user');
    return stored ? JSON.parse(stored) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('admin_token');
  },
};

// Participants
export const adminParticipantsService = {
  async getAll(): Promise<Participant[]> {
    await delay(300);
    return [...mockParticipants];
  },

  async getById(id: number): Promise<Participant | undefined> {
    await delay(200);
    return mockParticipants.find(p => p.ParticipantID === id);
  },

  async update(id: number, data: Partial<Participant>): Promise<Participant> {
    await delay(300);
    const index = mockParticipants.findIndex(p => p.ParticipantID === id);
    if (index === -1) throw new Error('Participant not found');
    mockParticipants[index] = { ...mockParticipants[index], ...data };
    return mockParticipants[index];
  },

  async delete(id: number): Promise<void> {
    await delay(300);
    const index = mockParticipants.findIndex(p => p.ParticipantID === id);
    if (index !== -1) mockParticipants.splice(index, 1);
  },

  async toggleAdmin(id: number): Promise<Participant> {
    await delay(300);
    const participant = mockParticipants.find(p => p.ParticipantID === id);
    if (!participant) throw new Error('Participant not found');
    participant.ParticipantRole = participant.ParticipantRole === 'admin' ? 'participant' : 'admin';
    return participant;
  },

  async getRegistrations(participantId: number): Promise<AdminRegistration[]> {
    await delay(200);
    return mockRegistrations.filter(r => r.ParticipantID === participantId);
  },

  async getMilestones(participantId: number): Promise<Milestone[]> {
    await delay(200);
    return mockMilestones.filter(m => m.ParticipantID === participantId);
  },

  async getDonations(participantId: number): Promise<Donation[]> {
    await delay(200);
    return mockDonations.filter(d => d.ParticipantID === participantId);
  },
};

// Event Templates
export const adminEventTemplatesService = {
  async getAll(): Promise<EventTemplate[]> {
    await delay(300);
    return [...mockEventTemplates];
  },

  async create(data: Omit<EventTemplate, 'TemplateID' | 'TemplateCreatedAt'>): Promise<EventTemplate> {
    await delay(300);
    const newTemplate: EventTemplate = {
      ...data,
      TemplateID: mockEventTemplates.length + 1,
      TemplateCreatedAt: new Date().toISOString(),
    };
    mockEventTemplates.push(newTemplate);
    return newTemplate;
  },

  async update(id: number, data: Partial<EventTemplate>): Promise<EventTemplate> {
    await delay(300);
    const index = mockEventTemplates.findIndex(t => t.TemplateID === id);
    if (index === -1) throw new Error('Template not found');
    mockEventTemplates[index] = { ...mockEventTemplates[index], ...data };
    return mockEventTemplates[index];
  },

  async delete(id: number): Promise<void> {
    await delay(300);
    const index = mockEventTemplates.findIndex(t => t.TemplateID === id);
    if (index !== -1) mockEventTemplates.splice(index, 1);
  },
};

// Events
export const adminEventsService = {
  async getAll(): Promise<AdminEvent[]> {
    await delay(300);
    return [...mockAdminEvents];
  },

  async getByTemplate(templateId: number): Promise<AdminEvent[]> {
    await delay(200);
    return mockAdminEvents.filter(e => e.TemplateID === templateId);
  },

  async create(data: Omit<AdminEvent, 'EventID'>): Promise<AdminEvent> {
    await delay(300);
    const newEvent: AdminEvent = {
      ...data,
      EventID: mockAdminEvents.length + 1,
    };
    mockAdminEvents.push(newEvent);
    return newEvent;
  },

  async update(id: number, data: Partial<AdminEvent>): Promise<AdminEvent> {
    await delay(300);
    const index = mockAdminEvents.findIndex(e => e.EventID === id);
    if (index === -1) throw new Error('Event not found');
    mockAdminEvents[index] = { ...mockAdminEvents[index], ...data };
    return mockAdminEvents[index];
  },

  async delete(id: number): Promise<void> {
    await delay(300);
    const index = mockAdminEvents.findIndex(e => e.EventID === id);
    if (index !== -1) mockAdminEvents.splice(index, 1);
  },
};

// Registrations
export const adminRegistrationsService = {
  async getByEvent(eventId: number): Promise<AdminRegistration[]> {
    await delay(300);
    return mockRegistrations.filter(r => r.EventID === eventId);
  },

  async update(id: number, data: Partial<AdminRegistration>): Promise<AdminRegistration> {
    await delay(300);
    const index = mockRegistrations.findIndex(r => r.RegistrationID === id);
    if (index === -1) throw new Error('Registration not found');
    mockRegistrations[index] = { ...mockRegistrations[index], ...data };
    return mockRegistrations[index];
  },

  async delete(id: number): Promise<void> {
    await delay(300);
    const index = mockRegistrations.findIndex(r => r.RegistrationID === id);
    if (index !== -1) mockRegistrations.splice(index, 1);
  },
};

// Milestone Types
export const adminMilestoneTypesService = {
  async getAll(): Promise<MilestoneType[]> {
    await delay(300);
    return [...mockMilestoneTypes];
  },

  async create(title: string): Promise<MilestoneType> {
    await delay(300);
    const newType: MilestoneType = {
      MilestoneID: mockMilestoneTypes.length + 1,
      MilestoneTitle: title,
    };
    mockMilestoneTypes.push(newType);
    return newType;
  },

  async update(id: number, title: string): Promise<MilestoneType> {
    await delay(300);
    const index = mockMilestoneTypes.findIndex(t => t.MilestoneID === id);
    if (index === -1) throw new Error('Milestone type not found');
    mockMilestoneTypes[index].MilestoneTitle = title;
    return mockMilestoneTypes[index];
  },

  async delete(id: number): Promise<void> {
    await delay(300);
    const index = mockMilestoneTypes.findIndex(t => t.MilestoneID === id);
    if (index !== -1) mockMilestoneTypes.splice(index, 1);
  },
};

// Donations
export const adminDonationsService = {
  async getAll(): Promise<Donation[]> {
    await delay(300);
    return [...mockDonations];
  },

  async getSummary(): Promise<{ totalAmount: number; totalDonors: number; avgDonation: number }> {
    await delay(200);
    const total = mockDonations.reduce((sum, d) => sum + d.DonationAmount, 0);
    const uniqueDonors = new Set(mockDonations.map(d => d.DonorEmail)).size;
    return {
      totalAmount: total,
      totalDonors: uniqueDonors,
      avgDonation: total / mockDonations.length,
    };
  },

  async getByParticipant(participantId: number): Promise<Donation[]> {
    await delay(200);
    return mockDonations.filter(d => d.ParticipantID === participantId);
  },
};
