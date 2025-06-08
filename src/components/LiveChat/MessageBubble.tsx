"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Download, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string | Date;
  type: "text" | "file" | "image";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isOwn: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const formatTime = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const renderFileContent = () => {
    if (message.type === "image" && message.fileUrl) {
      return (
        <div className="mt-2">
          <img
            src={message.fileUrl}
            alt={message.fileName || ""}
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.fileUrl, "_blank")}
          />
        </div>
      );
    }
    if (message.type === "file" && message.fileUrl) {
      return (
        <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
              <File className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {message.fileName}
              </p>
              {message.fileSize ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(message.fileSize)}
                </p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(message.fileUrl, "_blank")}
              className="p-1"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }
    return null;
  };

  // Defensive: make sure name always defined for initials
  const senderName = message.sender?.name || "Unknown";
  const initials = senderName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2);

  return (
    <div className={`flex ${message.isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`flex max-w-xs lg:max-w-md xl:max-w-lg ${
          message.isOwn ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {!message.isOwn && (
          <Avatar className="h-8 w-8 mr-2 mt-1">
            {message.sender.avatar && <AvatarImage src={message.sender.avatar} />}
            <AvatarFallback className="bg-gray-500 text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`${message.isOwn ? "mr-2" : ""}`}>
          {!message.isOwn && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 ml-1">
              {senderName}
            </p>
          )}

          <div
            className={`rounded-lg px-4 py-2 ${
              message.isOwn
                ? "bg-blue-500 text-white"
                : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
            }`}
          >
            {message.type === "text" && (
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            )}

            {renderFileContent()}

            <p
              className={`text-xs mt-1 ${
                message.isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {formatTime(message.timestamp)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
