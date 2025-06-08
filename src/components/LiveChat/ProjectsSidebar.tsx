"use client";
import React, { useState, useEffect } from "react";
import { Search, Users, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/aiUi/badge";

interface Project {
  id: string;
  name: string;
  description?: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    sender: string;
  };
  unreadCount?: number;
  members: number;
  // onlineCount?: number; // optional: for live online users in the future
}

interface ProjectsSidebarProps {
  onProjectSelect: (projectId: string) => void;
  selectedProjectId: string | null;
}

export const ProjectsSidebar = ({
  onProjectSelect,
  selectedProjectId,
}: ProjectsSidebarProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      const res = await fetch("/api/me/projects");
      const data = await res.json();
      const formatted = (data.projects || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        members: Array.isArray(p.members) ? p.members.length : p.members ?? 0,
        lastMessage: p.lastMessage
          ? {
              content: p.lastMessage.content,
              timestamp: p.lastMessage.createdAt,
              sender: p.lastMessage.user?.name || "",
            }
          : undefined,
        unreadCount: p.unreadCount ?? 0,
        // onlineCount: p.onlineCount ?? 0, // in future: live online count
      }));
      setProjects(formatted);
      setLoading(false);
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <aside
      className="flex flex-col h-full w-full bg-white dark:bg-gray-900 font-sans"
      style={{
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            Projects
          </h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 text-sm"
            style={{ fontWeight: 500 }}
          />
        </div>
      </div>

      {/* Project List */}
      <nav className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-11 h-11 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-6 text-center text-gray-400 dark:text-gray-500">
            No projects found
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredProjects.map((project) => (
              <li
                key={project.id}
                onClick={() => onProjectSelect(project.id)}
                tabIndex={0}
                className={`flex items-center cursor-pointer transition-colors px-5 py-4 gap-3 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  hover:bg-blue-50 dark:hover:bg-blue-900/20
                  ${selectedProjectId === project.id
                    ? "bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-600"
                    : ""
                  }`}
                style={{
                  fontWeight: selectedProjectId === project.id ? 700 : 500,
                  fontSize: "1rem",
                  letterSpacing: "-0.01em"
                }}
              >
                <Avatar className="h-11 w-11 shrink-0 text-base font-extrabold">
                  <AvatarImage src={`/avatars/project-${project.id}.png`} />
                  <AvatarFallback className="bg-blue-500 text-white font-extrabold text-lg uppercase">
                    {project.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className="truncate text-lg font-extrabold text-gray-900 dark:text-gray-100"
                      style={{
                        fontWeight: selectedProjectId === project.id ? 800 : 600,
                        letterSpacing: "-0.01em",
                        lineHeight: 1.1,
                      }}
                    >
                      {project.name}
                    </span>
                    <Badge
                      variant={project.unreadCount && project.unreadCount > 0 ? "default" : "secondary"}
                      className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        project.unreadCount && project.unreadCount > 0
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {project.unreadCount || 0}
                    </Badge>
                  </div>
                  {project.lastMessage && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-0 font-medium w-[70%]">
                        <span className="font-semibold">{project.lastMessage.sender}:</span>{" "}
                        {project.lastMessage.content}
                      </p>
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 font-normal w-[30%] text-right">
                        {formatTime(project.lastMessage.timestamp)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{project.members}</span>
                    </span>
                    {/* 
                    <span className="flex items-center gap-1">
                      <UserPlus className="h-3 w-3" />
                      <span>{project.onlineCount ?? 0} online</span>
                    </span>
                    */}
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>Active</span>
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  );
};
