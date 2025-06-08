"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageBubble } from "@/components/LiveChat/MessageBubble";
import { io, Socket } from "socket.io-client";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

type User = { id: string; name: string; avatar?: string };
type Message = {
  id: string;
  content: string;
  sender: User;
  timestamp: string;
  type: "text";
  isOwn: boolean;
};

interface ChatRoomProps {
  projectId: string;
  currentUser: User;
}

const SOCKET_SERVER_URL = 'https://live-chat-server.onrender.com';

export const ChatRoom: React.FC<ChatRoomProps> = ({
  projectId,
  currentUser,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const [project, setProject] = useState<{
    name: string;
    members: User[];
  }>({ name: "", members: [] });

  // Fetch messages and project info
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/messages`);
        if (!res.ok) {
          setMessages([]);
          setLoading(false);
          return;
        }
        const text = await res.text();
        if (!text) {
          setMessages([]);
          setLoading(false);
          return;
        }
        const data = JSON.parse(text);
        const safeMessages = Array.isArray(data.messages)
          ? data.messages
          : [];
        if (!cancelled) {
          setMessages(
            safeMessages.map((msg: any) => ({
              ...msg,
              isOwn: msg.sender?.id === currentUser.id,
              sender: msg.sender || { id: "unknown", name: "Unknown" },
              timestamp: msg.timestamp || msg.createdAt,
            }))
          );
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setMessages([]);
          setLoading(false);
        }
      }
    })();

    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) return;
        const text = await res.text();
        if (!text) return;
        const data = JSON.parse(text);
        setProject({
          name: data.project?.name || "Project",
          members: data.project?.members || [],
        });
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, currentUser.id]);

  // Real-time: Socket.IO for new messages & online users
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);
    socketRef.current = socket;
    socket.emit("join-room", projectId, currentUser.id);

    socket.on("chat-message", (msg: any) => {
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          isOwn: msg.sender?.id === currentUser.id,
          sender: msg.sender || { id: "unknown", name: "Unknown" },
          timestamp: msg.timestamp || msg.createdAt,
        },
      ]);
    });

    socket.on("online-users", (users: string[]) => {
      setOnlineUsers(users.length);
    });

    return () => {
      socket.disconnect();
    };
  }, [projectId, currentUser.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending text message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await fetch(`/api/projects/${projectId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    });
    setNewMessage("");
    setShowEmoji(false);
  };

  const handleSelectEmoji = (emoji: any) => {
    setNewMessage((msg) => msg + (emoji.native || emoji.shortcodes || ""));
    setShowEmoji(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-blue-500 text-white font-extrabold uppercase">
              {project.name
                ? project.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .substring(0, 2)
                : ""}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight">
              {project.name}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {onlineUsers} member{onlineUsers !== 1 ? "s" : ""} online
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            No messages yet
          </div>
        ) : (
          <>
            {messages.map((message, idx) => (
              <MessageBubble
                key={message.id || `msg-${idx}`}
                message={{
                  ...message,
                  sender: message.sender || { id: "unknown", name: "Unknown" },
                }}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input + Emoji Picker */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative">
        {showEmoji && (
          <div className="absolute bottom-16 left-2 z-50">
            <Picker
              data={data}
              onEmojiSelect={handleSelectEmoji}
              theme={
                typeof window !== "undefined" &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
                  ? "dark"
                  : "light"
              }
              navPosition="top"
              previewPosition="none"
              searchPosition="none"
              perLine={9}
              maxFrequentRows={1}
            />
          </div>
        )}
        <div className="flex items-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmoji((val) => !val)}
            className="p-2"
            aria-label="Open emoji picker"
            type="button"
          >
            <Smile className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <Input
              placeholder="Type a message…"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[40px] resize-none border-gray-300 dark:border-gray-600"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
