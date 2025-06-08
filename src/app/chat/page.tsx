"use client";
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar'; // <-- import Navbar here
import { ProjectsSidebar } from '@/components/LiveChat/ProjectsSidebar';
import { ChatRoom } from '@/components/LiveChat/ChatRoom';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const ChatPage = () => {
  const { user, isLoading } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const router = useRouter();

  // 🔵 Redirect to /login after render if not logged in
  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    // Optionally show a loader or nothing
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Navbar at the very top */}
      <Navbar />
      <div className="flex flex-1 min-h-0">
        {/* Projects Sidebar */}
        <div className="w-80 border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
          <ProjectsSidebar
            onProjectSelect={setSelectedProjectId}
            selectedProjectId={selectedProjectId}
          />
        </div>
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedProjectId ? (
            <ChatRoom projectId={selectedProjectId} currentUser={user} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <div className="w-64 h-64 mx-auto mb-8 opacity-20">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-gray-400">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.29 0-2.53-.3-3.64-.84L2 20l.84-6.36C2.3 12.53 2 11.29 2 10c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Welcome to ProjectHub Chat
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Select a project from the sidebar to start chatting with your team
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
