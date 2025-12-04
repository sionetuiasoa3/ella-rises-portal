import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAuthToken, clearAuthToken } from '@/services/api';
import authService from '@/services/auth';
import participantsService from '@/services/participants';
import type { Participant, SignupData, LoginData, AuthResponse } from '@/types/portal';

interface AuthContextType {
  participant: Participant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<AuthResponse>;
  signup: (data: SignupData) => Promise<AuthResponse>;
  logout: () => void;
  refreshParticipant: () => Promise<void>;
  updateParticipant: (participant: Participant) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshParticipant = useCallback(async () => {
    try {
      const data = await participantsService.getMe();
      setParticipant(data);
    } catch (error) {
      console.error('Failed to fetch participant:', error);
    }
  }, []);

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          // Fetch current participant data
          const participantData = await participantsService.getMe();
          setParticipant(participantData);
        } catch (error) {
          // Token invalid or expired
          clearAuthToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginData): Promise<AuthResponse> => {
    const response = await authService.login(data);
    setParticipant(response.participant);
    return response;
  };

  const signup = async (data: SignupData): Promise<AuthResponse> => {
    const response = await authService.signup(data);
    setParticipant(response.participant);
    return response;
  };

  const logout = () => {
    authService.logout();
    setParticipant(null);
  };

  const updateParticipant = (updatedParticipant: Participant) => {
    setParticipant(updatedParticipant);
  };

  return (
    <AuthContext.Provider
      value={{
        participant,
        isLoading,
        isAuthenticated: !!participant,
        login,
        signup,
        logout,
        refreshParticipant,
        updateParticipant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
