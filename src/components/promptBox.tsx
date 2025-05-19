// components/PromptBox.tsx
"use client";

import assets from "../assets/assets";
import Image from "next/image";
import UploadModal from './UploadModal'; // importe ton modal
import React, {
  useState,
  useCallback,
  FormEvent,
} from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

interface PromptBoxProps {
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
}

interface Message {
  role: "USER" | "ASSISTANT";
  content: string;
  timestamp: number;
}

type Mode = "deepseek" | "search";

const PromptBox: React.FC<PromptBoxProps> = ({
  setIsLoading,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Mode>("deepseek");
  const [showModal, setShowModal] = useState(false);
  

  const {
    user,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    createNewConversation,
  } = useAppContext();

  const handleKeyDown = (event:React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit(event );
    }
  };

  // 1️⃣ File upload & vectorization
  const handleFilesUpload = async (files: File[]) => {
    if (!user || !selectedConversation) {
      return alert("Please select a conversation and log in first.")
    }

    const formData = new FormData()
    files.forEach((file) => formData.append("file", file))
    formData.append("conversationId", selectedConversation.id)
    formData.append("userId", user.id)

    const res = await fetch("/api/chat/vectorize", {
      method: "POST",
      body: formData,
    })

    if (res.ok) {
      alert("Fichiers embeddés avec succès !")
      setShowModal(false)
    } else {
      const err = await res.json()
      alert(`Erreur pendant l'embedding : ${err.error}`)
    }
  }
  
  // 2️⃣ Chat / RAG submit
  const onSubmit = useCallback(
    async (event: FormEvent) => {
        event.preventDefault();
        const text = prompt.trim();
    
        // Early validations
        if (!text || !user || isLoading) {
          if (!text) return;
          if (!user) toast.error("Please login to send a message");
          if (isLoading) toast.error("Please wait...");
          return;
        }
        
      setPrompt("");
      setIsLoading(true);

      // New conversation?
      if (!selectedConversation) {
        await createNewConversation(text);
        setIsLoading(false);
        return;
      }

      // Build USER message
      const userMsg: Message = {
        role: "USER",
        content: text,
        timestamp: Date.now(),
      };

      // Optimistically add USER to UI
      setSelectedConversation((prev) => {
        if (!prev) return prev!;
        return {
          ...prev,
          messages: [...prev.messages, userMsg],
        };
      });
      setConversations((list) =>
        list.map((c) =>
          c.id === selectedConversation!.id
            ? { ...c, messages: [...c.messages, userMsg] }
            : c
        )
      );

      try {
        // Call SSE endpoint
        const res = await fetch("/api/chat/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: selectedConversation.id,
            mode, // pass your mode: "deepseek" or "search"
            messages: [
              ...selectedConversation.messages,
              userMsg,
            ],
          }),
        });
        if (!res.ok) throw new Error("Chat failed");

        // Add placeholder assistant
        const assistantMsg: Message = {
          role: "ASSISTANT",
          content: "",
          timestamp: Date.now(),
        };
        setSelectedConversation((prev) => ({
          ...prev!,
          messages: [...prev!.messages, assistantMsg],
        }));

        // Stream and append tokens
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value);
            assistantMsg.content += chunk;
            // update UI
            setSelectedConversation((prev) => ({
              ...prev!,
              messages: [
                ...prev!.messages.slice(0, -1),
                { ...assistantMsg },
              ],
            }));
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to get response");
      } finally {
        setIsLoading(false);
      }
    },
    [
        prompt,
        user,
        isLoading,
        selectedConversation,
        createNewConversation,
        setConversations,
        setSelectedConversation,
        mode,
        setIsLoading,
    ]
  );

  return (
    <form
      onSubmit={onSubmit}
      className={`w-full ${
        selectedConversation?.messages.length > 0
          ? "max-w-3xl"
          : "max-w-2xl"
      } bg-[#404045] p-4 rounded-3xl mt-4 transition-all`}
    >
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        className="outline-none w-full resize-none overflow-hidden break-words bg-transparent"
        rows={2}
        placeholder="Message DeepSeek"
      />

      <div className="flex items-center justify-between text-sm mt-2">
        <div className="flex items-center gap-2">
          <p
            onClick={() => setMode("deepseek")}
            className={`flex items-center gap-2 text-xs border px-2 py-1 rounded-full cursor-pointer transition ${
              mode === "deepseek"
                ? "bg-blue-600 text-white"
                : "border-gray-300/40 hover:bg-gray-500/20"
            }`}
          >
            <Image
              src={assets.deepseek}
              alt="DeepThink"
              width={16}
              height={16}
            />
            DeepThink (R1)
          </p>
          <p
            onClick={() => setMode("search")}
            className={`flex items-center gap-2 text-xs border px-2 py-1 rounded-full cursor-pointer transition ${
              mode === "search"
                ? "bg-blue-600 text-white"
                : "border-gray-300/40 hover:bg-gray-500/20"
            }`}
          >
            <Image
              src={assets.web_search}
              alt="Search"
              width={16}
              height={16}
            />
            Search
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* PDF/XLSX upload */}

            <div
              className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer"
              onClick={() => setShowModal(true)}
            >
                <Image
                    className="w-5 h-5 cursor-pointer"
                    src={assets.pin_doc}
                    alt="Upload"
                />
            </div>

            <UploadModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onUpload={handleFilesUpload}
            />


          <button
            type="submit"
            disabled={!prompt || isLoading}
            className={`rounded-full p-2 ${
              prompt ? "bg-blue-500" : "bg-[#71717a]"
            } transition`}
          >
            <Image
              className="w-3.5 aspect-square"
              src={assets.up_arrow}
              alt="Send"
              width={14}
              height={14}
            />
          </button>
        </div>
      </div>
    </form>
  );
};

export default PromptBox;
