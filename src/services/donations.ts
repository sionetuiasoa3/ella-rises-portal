import api from './api';

export type DonationFrequency = 'one-time' | 'monthly' | 'quarterly' | 'yearly';
export type DonationStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Donation {
  DonationID: number;
  ParticipantID: number | null; // null for anonymous donations
  DonationAmount: number;
  DonationFrequency: DonationFrequency;
  DonationStatus: DonationStatus;
  DonationComment: string | null;
  DonationDate: string;
  DonorName: string | null; // For non-participant donors
  DonorEmail: string | null;
}

export interface CreateDonationData {
  Amount: number;
  Frequency: DonationFrequency;
  Comment?: string;
  // For non-logged-in donors
  DonorName?: string;
  DonorEmail?: string;
}

export interface DonationStats {
  totalRaised: number;
  goal: number;
  donorCount: number;
}

// Mock mode - matches other services
const MOCK_MODE = true;

let mockDonations: Donation[] = [];

export const donationsService = {
  async create(data: CreateDonationData): Promise<Donation> {
    if (MOCK_MODE) {
      const newDonation: Donation = {
        DonationID: Date.now(),
        ParticipantID: 1, // Would come from auth
        DonationAmount: data.Amount,
        DonationFrequency: data.Frequency,
        DonationStatus: 'pending',
        DonationComment: data.Comment || null,
        DonationDate: new Date().toISOString(),
        DonorName: data.DonorName || null,
        DonorEmail: data.DonorEmail || null,
      };
      mockDonations.push(newDonation);
      return newDonation;
    }
    return api.post<Donation>('/donations', data);
  },

  async getMyDonations(): Promise<Donation[]> {
    if (MOCK_MODE) {
      return mockDonations;
    }
    return api.get<Donation[]>('/donations/my');
  },

  async getStats(): Promise<DonationStats> {
    if (MOCK_MODE) {
      return {
        totalRaised: 981,
        goal: 100000,
        donorCount: 15,
      };
    }
    return api.get<DonationStats>('/donations/stats');
  },
};

export default donationsService;
