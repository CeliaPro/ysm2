// components/PromptBox.tsx
"use client";

import assets from "../app/assets/assets";
import Image from "next/image";
import UploadModal from './UploadModal'; // importe ton modal
import React, {
  useState,
  useCallback,
  FormEvent,
  useRef,
  useEffect
} from "react";
import { useAppContext } from "../contexts/AppContext"; // Assurez-vous que le contexte est importé correctement
import toast from "react-hot-toast";
import { conversationHasDocuments } from "@/lib/utils/files";


interface PromptBoxProps {
  setIsLoading: (loading: boolean) => void;
  isLoading: boolean;
}

interface Message {
  role: "USER" | "ASSISTANT";
  content: string;
  timestamp: number;
}

type Mode = "rag" | "search" | "planning";

const PromptBox: React.FC<PromptBoxProps> = ({
  setIsLoading,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Mode>("search"); // default mode
  const [showModal, setShowModal] = useState(false);
  const [hasFiles, setHasFiles] = useState(false);

  const {
    userId,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    createNewConversation,
  } = useAppContext();
  
  
  useEffect(() => {
    const checkDocs = async () => {
      if (selectedConversation) {
        const hasDocs = await conversationHasDocuments(selectedConversation.id);
        setHasFiles(hasDocs);
      }
    };
    checkDocs();
  }, [selectedConversation]);

  const handleKeyDown = (event:React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit(event);
    }
  };


  // 1️⃣ File upload & vectorization
  const handleFilesUpload = async (files: File[]): Promise<void> => {
    if (!userId || !selectedConversation) {
      toast.error("Veuillez sélectionner une conversation et vous connecter d'abord.");
      return;
    }

    const formData = new FormData()
    files.forEach((file) => formData.append("file", file))
    formData.append("conversationId", selectedConversation.id)
    formData.append("userId", userId)

    try {
      const res = await fetch("/api/chat/vectorize", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        // Analyse la réponse pour détecter si le document existe déjà
        const data = await res.json();
        
        if (data.alreadyExists) {
          toast.error("Document déjà présent");
        } else {
          toast.success("Fichiers embeddés avec succès !");
        }
        
        setShowModal(false);
        setHasFiles(true);          // ← Indique qu'on a des fichiers
        setMode("rag");             // ← Active automatiquement le mode RAG
      } else {
        const err = await res.json();
        toast.error(`Erreur pendant l'embedding : ${err.error}`);
      }
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      toast.error("Une erreur est survenue lors de l'upload");
    }
  }
  
  // 2️⃣ Chat / RAG submit
  interface PlanningTask {
    task: string;
    description: string;
    duration?: number;
  }

  const assistantMsgRef = useRef<Message | null>(null);
  const lastUpdateTime = useRef<number>(Date.now());

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const text = prompt.trim();

      if (!text || !userId || isLoading) {
        if (!text) return;
        if (!userId) toast.error("Veuillez vous connecter pour envoyer un message");
        if (isLoading) toast.error("Veuillez patienter...");
        return;
      }

      setPrompt("");
      setIsLoading(true);

      if (!selectedConversation) {
        // 💡 Correction ICI : appel correct avec object
        await createNewConversation({ title: text });
        setIsLoading(false);
        return;
      }

      const userMsg: Message = {
        role: "USER",
        content: text,
        timestamp: Date.now(),
      };

      // Optimistic update
      setSelectedConversation((prev) => ({
        ...prev!,
        messages: [...prev!.messages, userMsg],
      }));

      setConversations((list) =>
        list.map((c) =>
          c.id === selectedConversation.id
            ? { ...c, messages: [...c.messages, userMsg] }
            : c
        )
      );

      try {
        // ✅ PLANNING MODE
        if (mode === "planning") {
          const planningRes = await fetch("/api/planning/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sectionText: text,
              projectId: selectedConversation.id,
              createdBy: userId,
            }),
          });

          if (!planningRes.ok) throw new Error("Échec de génération du planning");

          const planningData = await planningRes.json();

          const assistantResponse = `🛠️ **Assistant IA de planification**

  ### 🧱 Structure de répartition du travail :
  ${planningData.partialWBS
    .map(
      (task: PlanningTask) =>
        `**${task.task}** (${task.description}) _${task.duration ?? "???"} jours_`
    )
    .join("\n")}

  ${
    planningData.missingFields.length > 0
      ? `\n### ❓ Informations manquantes :\n` +
      planningData.missingFields.map((f: { question: string }) => `• ${f.question}`).join("\n")
        : "\n✅ Aucune information manquante !"
  }
  `;

          const assistantMsg: Message = {
            role: "ASSISTANT",
            content: assistantResponse,
            timestamp: Date.now(),
          };

          setSelectedConversation((prev) => ({
            ...prev!,
            messages: [...prev!.messages, assistantMsg],
          }));

          setConversations((list) =>
            list.map((c) =>
              c.id === selectedConversation.id
                ? { ...c, messages: [...c.messages, assistantMsg] }
                : c
            )
          );

          return; // ✅ Done with planning
        }

        // ✅ RAG or SEARCH (streaming)
        const res = await fetch("/api/chat/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: selectedConversation.id,
            mode,
            messages: [...selectedConversation.messages, userMsg],
          }),
        });

        if (!res.ok) throw new Error("Échec de la recherche IA");

        const assistantMsg: Message = {
          role: "ASSISTANT",
          content: "",
          timestamp: Date.now(),
        };

        setSelectedConversation((prev) => ({
          ...prev!,
          messages: [...prev!.messages, assistantMsg],
        }));

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let done = false;
        assistantMsgRef.current = {
          role: "ASSISTANT",
          content: "",
          timestamp: Date.now(),
        };

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value);
            assistantMsgRef.current!.content += chunk;

            // Évite les updates trop fréquents (ex. : toutes les 300ms)
            if (Date.now() - lastUpdateTime.current > 300) {
              lastUpdateTime.current = Date.now();

              setSelectedConversation((prev) => ({
                ...prev!,
                messages: [
                  ...prev!.messages.slice(0, -1),
                  { ...assistantMsgRef.current! },
                ],
              }));
            }
          }
        }

        // Final flush après streaming
        setSelectedConversation((prev) => ({
          ...prev!,
          messages: [
            ...prev!.messages.slice(0, -1),
            { ...assistantMsgRef.current! },
          ],
        }));

      } catch (err) {
        console.error(err);
        toast.error("Échec de la réponse !");
      } finally {
        setIsLoading(false);
      }
    },
    [
      prompt,
      userId,
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
        selectedConversation?.messages?.length && selectedConversation.messages.length > 0
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
        placeholder="Message IA..."
      />

      <div className="flex items-center justify-between text-sm mt-2">
        <div className="flex items-center gap-2">
          <p
            onClick={() => {
              if (!hasFiles) {
                toast.error("Ajoutez un document avant d'activer le mode RAG.");
                return;
              }
              setMode("rag");
            }}
            className={`flex items-center gap-2 text-xs border px-2 py-1 rounded-full cursor-pointer transition ${
              mode === "rag"
                ? "bg-blue-600 text-white"
                : hasFiles
                  ? "border-gray-300/40 hover:bg-gray-500/20"
                  : "opacity-50 cursor-not-allowed"
            }`}
          >
            <Image
              src={assets.deepseek}
              alt="DeepThink"
              width={16}
              height={16}
            />
            DeepThink (RAG)
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
            Recherche
          </p>
          <p
            onClick={() => setMode("planning")}
            className={`flex items-center gap-2 text-xs border px-2 py-1 rounded-full cursor-pointer transition ${
              mode === "planning"
                ? "bg-blue-600 text-white"
                : "border-gray-300/40 hover:bg-gray-500/20"
            }`}
          >
            <Image
              src={assets.calendar} // or use a new icon
              alt="Planning"
              width={16}
              height={16}
            />
            Planning
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

            {hasFiles && (
                <span className="text-green-400 text-xs ml-2">
                  📎 Document attaché
                </span>
              )}

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
              alt="Envoyer"
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
