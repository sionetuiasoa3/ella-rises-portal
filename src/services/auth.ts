import api, { setAuthToken, clearAuthToken } from './api';
import type { AuthResponse, SignupData, LoginData, Participant } from '@/types/portal';

// Mock mode - set to true to bypass API calls for testing
const MOCK_MODE = true;

const createMockResponse = (data: SignupData | LoginData): AuthResponse => {
  const isSignup = 'FirstName' in data;
  const mockParticipant: Participant = {
    ParticipantID: 1,
    ParticipantFirstName: isSignup ? (data as SignupData).FirstName : 'Test',
    ParticipantLastName: isSignup ? (data as SignupData).LastName : 'User',
    ParticipantEmail: data.Email,
    ParticipantFieldOfInterest: isSignup ? (data as SignupData).FieldOfInterest : 'Both',
    ParticipantDOB: isSignup ? (data as SignupData).DateOfBirth : '2000-01-01',
    ParticipantRole: 'participant',
    ParticipantCity: isSignup ? (data as SignupData).City : 'Salt Lake City',
    ParticipantState: isSignup ? (data as SignupData).State : 'UT',
    ParticipantZip: isSignup ? (data as SignupData).Zip : '84101',
    ParticipantPhone: isSignup ? (data as SignupData).PhoneNumber : '555-1234',
    ParticipantSchoolOrEmployer: isSignup ? (data as SignupData).SchoolOrEmployer || null : 'Test School',
    ParticipantPhotoPath: null,
  };

  // Store mock participant for getMe calls
  localStorage.setItem('mock_participant', JSON.stringify(mockParticipant));

  return {
    token: 'mock-jwt-token-for-testing',
    participant: mockParticipant,
  };
};

export const authService = {
  async signup(data: SignupData): Promise<AuthResponse> {
    if (MOCK_MODE) {
      const response = createMockResponse(data);
      setAuthToken(response.token);
      return response;
    }

    if (data.ProfilePicture) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      const response = await api.upload<AuthResponse>('/auth/signup', formData);
      if (response.token) {
        setAuthToken(response.token);
      }
      return response;
    }

    const { ProfilePicture, ...jsonData } = data;
    const response = await api.post<AuthResponse>('/auth/signup', jsonData, { skipAuth: true });
    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    if (MOCK_MODE) {
      const response = createMockResponse(data);
      setAuthToken(response.token);
      return response;
    }

    const response = await api.post<AuthResponse>('/auth/login', data, { skipAuth: true });
    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    if (MOCK_MODE) {
      return { message: 'Password reset email sent (mock)' };
    }
    return api.post('/auth/forgot-password', { email }, { skipAuth: true });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    if (MOCK_MODE) {
      return { message: 'Password reset successful (mock)' };
    }
    return api.post('/auth/reset-password', { token, newPassword }, { skipAuth: true });
  },

  logout(): void {
    clearAuthToken();
    localStorage.removeItem('mock_participant');
  },
};

export default authService;
