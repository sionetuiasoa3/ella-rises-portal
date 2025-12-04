import api from './api';
import type { Participant } from '@/types/portal';

// Mock mode - matches auth.ts
const MOCK_MODE = true;

export interface UpdateParticipantData {
  ParticipantFirstName?: string;
  ParticipantLastName?: string;
  ParticipantPhone?: string;
  ParticipantCity?: string;
  ParticipantState?: string;
  ParticipantZip?: string;
  ParticipantSchoolOrEmployer?: string;
  ParticipantFieldOfInterest?: 'Arts' | 'STEM' | 'Both';
}

export const participantsService = {
  async getMe(): Promise<Participant> {
    if (MOCK_MODE) {
      const stored = localStorage.getItem('mock_participant');
      if (stored) {
        return JSON.parse(stored);
      }
      throw new Error('Not authenticated');
    }
    return api.get<Participant>('/participants/me');
  },

  async updateMe(data: UpdateParticipantData): Promise<Participant> {
    if (MOCK_MODE) {
      const stored = localStorage.getItem('mock_participant');
      if (stored) {
        const participant = JSON.parse(stored);
        const updated = { ...participant, ...data, ParticipantUpdatedAt: new Date().toISOString() };
        localStorage.setItem('mock_participant', JSON.stringify(updated));
        return updated;
      }
      throw new Error('Not authenticated');
    }
    return api.put<Participant>('/participants/me', data);
  },

  async uploadPhoto(file: File): Promise<{ photoPath: string }> {
    if (MOCK_MODE) {
      // Create a fake URL for the uploaded photo
      const photoPath = URL.createObjectURL(file);
      const stored = localStorage.getItem('mock_participant');
      if (stored) {
        const participant = JSON.parse(stored);
        participant.ParticipantPhotoPath = photoPath;
        localStorage.setItem('mock_participant', JSON.stringify(participant));
      }
      return { photoPath };
    }
    const formData = new FormData();
    formData.append('photo', file);
    return api.upload<{ photoPath: string }>('/participants/me/photo', formData);
  },

  async deleteAccount(): Promise<{ message: string }> {
    if (MOCK_MODE) {
      localStorage.removeItem('mock_participant');
      return { message: 'Account deleted (mock)' };
    }
    return api.delete<{ message: string }>('/participants/me');
  },
};

export default participantsService;
