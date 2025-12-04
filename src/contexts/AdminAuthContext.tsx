import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminAuthService } from '@/services/admin';

interface AdminUser {
  email: string;
  name: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing admin session
    const storedAdmin = adminAuthService.getAdmin();
    if (storedAdmin && adminAuthService.isAuthenticated()) {
      setAdmin(storedAdmin);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { admin: adminUser } = await adminAuthService.login(email, password);
    setAdmin(adminUser);
  }, []);

  const logout = useCallback(() => {
    adminAuthService.logout();
    setAdmin(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated: !!admin,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
