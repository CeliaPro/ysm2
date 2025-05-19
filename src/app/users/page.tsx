'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import UserManagement from '@/components/UserManagement';
import FloatingChat from '@/components/FloatingChat';
import { useAuth } from '@/contexts/AuthContext';

const UsersPage = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/'); // Redirect to login
      } else if (!isAdmin()) {
        router.replace('/dashboard'); // Redirect to dashboard
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <UserManagement />
      </main>
      <FloatingChat />
    </div>
  );
}

export default UsersPage;