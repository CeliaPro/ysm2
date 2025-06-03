'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import PromptBox from '@/components/promptBox';
import Message from '@/components/Message';
import CompareModal from '@/components/CompareModal';
import assets from '@/app/assets/assets';
import { useAuth } from '@/contexts/AuthContext';
import { useAppContext } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';

const AiPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { selectedConversation } = useAppContext();
  const [expand, setExpand] = useState(false);
  const [openCompare, setOpenCompare] = useState(false);
  const [messages, setMessages] = useState<{ role: 'USER' | 'ASSISTANT'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (selectedConversation) {
      setMessages(
        selectedConversation.messages.map((msg) => ({
          role: msg.role === 'USER' || msg.role === 'ASSISTANT' ? msg.role : 'USER',
          content: msg.content,
        }))
      );
    } else {
      setMessages([]);
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/');
    }
  }, [isAuthLoading, user, router]);

  const noMessages = messages.length === 0;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#1a1d21] text-gray-900 dark:text-white overflow-hidden transition-colors">
      {/* Sidebar */}
      <Sidebar expand={expand} setExpand={setExpand} />

      {/* Main chat column */}
      <div className="flex-1 flex flex-col h-screen min-h-0 bg-white dark:bg-[#23272e] transition-colors">
        {/* Navbar */}
        <Navbar expand={expand} setExpand={setExpand} />

        {/* Floating chat header with CompareModal */}
        {selectedConversation?.title && (
          <div className="fixed left-1/2 -translate-x-1/2 top-24 md:top-16 flex items-center gap-3 z-50
                          bg-white dark:bg-[#23272e]
                          border border-gray-200 dark:border-gray-700/20
                          px-4 py-2 rounded-lg shadow-md min-w-[280px]
                          transition-colors"
          >
            <p className="border border-transparent hover:border-gray-400 dark:hover:border-gray-500/50 py-1 px-2 rounded-lg font-semibold truncate max-w-[200px]">
              {selectedConversation.title}
            </p>
            <button
              onClick={() => setOpenCompare(true)}
              className="ml-2 text-primary-foreground px-3 py-1 rounded
                         hover:bg-blue-600/90 hover:text-white
                         transition-colors text-xs font-semibold border
                         border-[#555] bg-blue-100 dark:bg-[#232427] dark:text-white"
              type="button"
            >
              📎 Compare Documents
            </button>
            <CompareModal
              open={openCompare}
              onClose={() => setOpenCompare(false)}
              conversationId={selectedConversation.id}
            />
          </div>
        )}

        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden absolute px-4 top-6 flex items-center justify-between w-full z-50">
          <Image
            onClick={() => setExpand((prev) => !prev)}
            className="rotate-180 cursor-pointer"
            src={assets.sidebar}
            alt="toggle sidebar"
            width={30}
            height={30}
            priority
          />
          <Image
            className="opacity-50"
            src={assets.chat}
            alt="chat icon"
            width={30}
            height={30}
          />
        </div>

        {/* Main chat/messages area (scrollable) */}
        <div
          ref={containerRef}
          className="flex-1 flex flex-col items-center justify-start w-full
                     pt-28 md:pt-24 pb-4 overflow-y-auto min-h-0
                     bg-white dark:bg-[#23272e] transition-colors"
        >
          {noMessages ? (
            <>
              <div className="flex items-center gap-3 mt-4">
                <Image src={assets.logo} alt="logo" className="h-8" width={35} />
                <p className="text-2xl font-medium dark:text-white text-gray-900">Hi, I&apos;m VINCI Chatbot</p>
              </div>
              <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">How can I help you today?</p>
            </>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <Message key={idx} role={msg.role} content={msg.content} />
              ))}
              {isLoading && (
                <div className="flex gap-4 max-w-3xl w-full py-3">
                  <Image
                    src={assets.logo}
                    alt="logo"
                    className="h-9 w-9 p-1 border border-white/15 rounded-full"
                    width={40}
                    height={40}
                    priority
                  />
                  <div className="loader flex justify-center items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-gray-600 dark:bg-white animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-600 dark:bg-white animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-gray-600 dark:bg-white animate-bounce"></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Prompt box + Footer at the bottom */}
        <div className="w-full flex flex-col items-center bg-white dark:bg-[#23272e] transition-colors">
          <div className="w-full max-w-2xl px-4 pb-2">
            <PromptBox isLoading={isLoading} setIsLoading={setIsLoading} />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-2 select-none pointer-events-none">
            Vinci-AI-generated, ©2025 YMS_BIM. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiPage;
