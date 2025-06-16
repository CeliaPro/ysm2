"use client";

import Image from "next/image";
import assets from "../assets/assets";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useEffect, useRef, useState, useMemo } from "react";
import PromptBox from "@/components/promptBox";
import Message from "@/components/Message";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import CompareModal from "@/components/CompareModal";

// Documents chip styled like AI modal, not green
const DocumentsChip = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1 bg-[#23272e] border border-gray-700 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm tracking-tight max-w-xs truncate hover:bg-[#22262c] transition"
    style={{ outline: "none" }}
  >
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className="mr-1 opacity-60">
      <path d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 01-7.78-7.78l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.19 9.19a1.5 1.5 0 01-2.12-2.12l9.19-9.19"/>
    </svg>
    Documents
  </button>
);

const AiPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { selectedConversation } = useAppContext();
  const [expand, setExpand] = useState(false);
  const [open, setOpen] = useState(false);
  const [hasDocs, setHasDocs] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() =>
    selectedConversation?.messages?.map((msg) => ({
      role: msg.role === "USER" || msg.role === "ASSISTANT" ? msg.role : "USER",
      content: msg.content,
    })) ?? [],
    [selectedConversation]
  );
  const noMessages = messages.length === 0;

  // --- Protected: redirect if not auth
  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/");
  }, [isAuthLoading, user, router]);

  // --- Detect if docs exist for conversation
  useEffect(() => {
    const fetchDocs = async () => {
      if (!selectedConversation?.id) return setHasDocs(false);
      try {
        const res = await fetch(`/api/chat/getDocs?conversationId=${selectedConversation.id}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) setHasDocs(true);
        else if (data?.data && Array.isArray(data.data) && data.data.length > 0) setHasDocs(true);
        else setHasDocs(false);
      } catch {
        setHasDocs(false);
      }
    };
    fetchDocs();
  }, [selectedConversation?.id]);

  // Auto-scroll
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isLoading]);

  const [showScrollButton, setShowScrollButton] = useState(false);

  // Gérer la visibilité du bouton de scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom =
        container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
      setShowScrollButton(!isAtBottom && messages.length > 0);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleScroll();
    });

    container.addEventListener("scroll", handleScroll);
    resizeObserver.observe(container);

    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [messages.length]);

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="flex h-screen bg-[#292a2d] text-white transition-colors overflow-hidden">
      {/* Sidebar */}
      <Sidebar expand={expand} setExpand={setExpand} />

      <div className="flex-1 flex flex-col h-screen min-h-0 bg-[#292a2d] text-white transition-colors relative">
        {/* Navbar */}
        <Navbar expand={expand} setExpand={setExpand} />

        {/* Floating header with Documents chip if docs exist */}
        {selectedConversation?.title && hasDocs && (
          <div
            className="fixed left-1/2 -translate-x-1/2 top-16 flex items-center gap-3 z-50
                        bg-[#23272e] px-4 py-2 rounded-xl shadow-lg border border-gray-700/30"
            style={{ minWidth: 250, marginTop: 6 }}
          >
            <p className="border border-transparent py-1 px-2 rounded-lg font-semibold truncate max-w-[180px]">
              {selectedConversation.title}
            </p>
            <DocumentsChip onClick={() => setOpen(true)} />
            <CompareModal
              open={open}
              onClose={() => setOpen(false)}
              conversationId={selectedConversation.id}
            />
          </div>
        )}

        {/* Mobile nav */}
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
                     bg-[#292a2d] transition-colors"
        >
          {noMessages ? (
            <>
              <div className="flex items-center gap-3 mt-4">
                <Image src={assets.logo} alt="logo" className="h-8" width={35} />
                <p className="text-2xl font-medium">Salut, je suis le chatbot YMS_BIM</p>
              </div>
              <p className="text-sm mt-2 text-gray-300">Comment puis-je vous aider aujourd&apos;hui ?</p>
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
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Prompt box + Footer */}
        <div className="w-full flex flex-col items-center bg-[#292a2d] transition-colors">
          <div className="w-full max-w-2xl px-4 pb-2">
            <PromptBox isLoading={isLoading} setIsLoading={setIsLoading} />
          </div>
          <p className="text-xs text-gray-400 text-center mb-2 select-none pointer-events-none">
            Vinci-AI généré, ©2025 YMS_BIM. Tous droits réservés.
          </p>
        </div>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-28 right-6 bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg z-50 transition-all duration-200 hover:scale-105"
            title="Revenir en bas"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default AiPage;
