import api from './api';
import type { Milestone, MilestoneType } from '@/types/portal';

// Mock mode - matches auth.ts
const MOCK_MODE = true;

let mockMilestones: Milestone[] = [
  {
    MilestoneID: 1,
    ParticipantID: 1,
    MilestoneDate: '2024-06-15',
    MilestoneTitle: 'High School Diploma',
  },
  {
    MilestoneID: 2,
    ParticipantID: 1,
    MilestoneDate: '2024-09-01',
    MilestoneTitle: 'Mentorship Program',
  },
];

const MOCK_MILESTONE_TYPES: MilestoneType[] = [
  { MilestoneID: 1, MilestoneTitle: 'High School Diploma' },
  { MilestoneID: 2, MilestoneTitle: 'Mentorship Program' },
  { MilestoneID: 3, MilestoneTitle: 'Internship' },
  { MilestoneID: 4, MilestoneTitle: 'Competition Award' },
  { MilestoneID: 5, MilestoneTitle: 'Published Project' },
  { MilestoneID: 99, MilestoneTitle: 'Other' },
];

export interface CreateMilestoneData {
  MilestoneID: number;
  MilestoneDate: string;
  CustomLabel?: string;
}

export interface UpdateMilestoneData {
  MilestoneDate?: string;
  CustomLabel?: string;
}

export const milestonesService = {
  async getAll(): Promise<Milestone[]> {
    if (MOCK_MODE) {
      return mockMilestones;
    }
    return api.get<Milestone[]>('/milestones');
  },

  async getMilestoneTypes(): Promise<MilestoneType[]> {
    if (MOCK_MODE) {
      return MOCK_MILESTONE_TYPES;
    }
    return api.get<MilestoneType[]>('/milestones/types');
  },

  async create(data: CreateMilestoneData): Promise<Milestone> {
    if (MOCK_MODE) {
      const type = MOCK_MILESTONE_TYPES.find(t => t.MilestoneID === data.MilestoneID);
      const newMilestone: Milestone = {
        MilestoneID: Date.now(),
        ParticipantID: 1,
        MilestoneDate: data.MilestoneDate,
        MilestoneTitle: type?.MilestoneTitle || 'Other',
        CustomLabel: data.CustomLabel,
      };
      mockMilestones.push(newMilestone);
      return newMilestone;
    }
    return api.post<Milestone>('/milestones', data);
  },

  async update(id: number, data: UpdateMilestoneData): Promise<Milestone> {
    if (MOCK_MODE) {
      const idx = mockMilestones.findIndex(m => m.MilestoneID === id);
      if (idx === -1) throw new Error('Milestone not found');
      mockMilestones[idx] = { ...mockMilestones[idx], ...data };
      return mockMilestones[idx];
    }
    return api.put<Milestone>(`/milestones/${id}`, data);
  },

  async delete(id: number): Promise<{ message: string }> {
    if (MOCK_MODE) {
      mockMilestones = mockMilestones.filter(m => m.MilestoneID !== id);
      return { message: 'Milestone deleted' };
    }
    return api.delete<{ message: string }>(`/milestones/${id}`);
  },
};

// Predefined milestone options
export const MILESTONE_OPTIONS = [
  'AA in Art & Design',
  'Clinical Data Coordinator',
  'Middle School Diploma',
  'Published Project',
  'High School Diploma',
  'Mentorship Program',
  'Internship',
  'BS in Information Systems',
  'Junior QA Tester',
  'Product Designer',
  'BA in Studio Arts',
  'Systems Analyst',
  'IT Help Desk Trainee',
  'Digital Illustration Certificate',
  'Competition Award',
  'Customer Support Rep',
  'MFA in Studio Arts',
  'Data Analytics Certificate',
  'Camp Counselor',
  'AAS in Drafting & Design',
  'BS in Mechanical Engineering',
  'Studio Assistant',
  'Web Development Certificate',
  'MBA',
  'Retail Assistant',
  'Lifeguard',
  'AS in Information Systems',
  'BS in Data Analytics',
  'AS in Computer Science',
  'MS in Information Systems',
  'Lab Assistant',
  'Data Analyst',
  'BS in Computer Science',
  'Junior Art Assistant',
  'IT Support Certificate',
  'MS in Data Science',
  'Software Engineer I',
  'Apprentice Technician',
  'Other',
] as const;

export default milestonesService;
