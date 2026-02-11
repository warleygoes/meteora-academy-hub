import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';

export const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};
