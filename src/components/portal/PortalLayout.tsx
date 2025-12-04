import React from 'react';
import PortalNavbar from './PortalNavbar';

interface PortalLayoutProps {
  children: React.ReactNode;
}

const PortalLayout: React.FC<PortalLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <PortalNavbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default PortalLayout;
