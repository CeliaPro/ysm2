'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import assets from '@/app/assets/assets'
import ChatLabel from './ChatLabel'

import { useAuth } from '@/contexts/AuthContext'
import { useAppContext } from '@/contexts/AppContext'
import { toast } from 'sonner'

interface MenuState {
  id: string | number
  open: boolean
}

interface SidebarProps {
  expand: boolean
  setExpand: (value: boolean) => void
}

const Sidebar: React.FC<SidebarProps> = ({ expand, setExpand }) => {
  const { user } = useAuth()
  const {
    conversations,
    createNewConversation,
    removeConversation,
    setSelectedConversation,
  } = useAppContext()

  const [openMenu, setOpenMenu] = useState<MenuState>({ id: 0, open: false })

  // Delete on the server, then remove it from context/UI
  const handleDelete = async (conversationId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete a conversation')
      return
    }
    try {
      const res = await fetch('/api/chat/delete', {
        method: 'DELETE',             // make sure your route exports DELETE
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Deletion failed')
      }
      // remove from context
      removeConversation(conversationId)
      // clear selection if it was the one deleted
      setSelectedConversation((prev) =>
        prev?.id === conversationId ? null : prev
      )
      toast.success('Conversation deleted')
    } catch (err: any) {
      console.error('Delete error:', err)
      toast.error(err.message || 'Could not delete conversation')
    }
  }

  return (
    <div
      className={`flex flex-col justify-between bg-[#212327] pt-7 transition-all z-50 max-md:absolute max-md:h-screen ${
        expand ? 'p-4 w-64' : 'md:w-20 w-0 max-md:overflow-hidden'
      }`}
    >
      {/* ---------- top (logo, toggle, new chat) ---------- */}
      <div>
        {/* logo & toggle */}
        <div
          className={`flex ${
            expand ? 'flex-row gap-10' : 'flex-col items-center gap-8'
          }`}
        >
          <Image
            className={expand ? 'w-35' : 'w-10'}
            src={expand ? assets.logo_text : assets.logo}
            alt="logo"
          />
          <div
            onClick={() => setExpand(!expand)}
            className="group relative flex items-center justify-center hover:bg-gray-500/20 transition-all duration-300 h-9 w-12 px-2 rounded-lg cursor-pointer"
          >
            <Image className="md:hidden" src={assets.sidebar} alt="menu" />
            <Image
              className="hidden md:block w-12"
              src={expand ? assets.colse_sidebar : assets.sidebar}
              alt="sidebar"
            />
            {/* tooltip */}
            <div
              className={`absolute w-max ${
                expand
                  ? 'left-1/2 -translate-x-1/2 top-12'
                  : '-top-12 left-0'
              } opacity-0 group-hover:opacity-100 transition bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none`}
            >
              {expand ? 'Close sidebar' : 'Open sidebar'}
              <div
                className={`w-3 h-3 absolute bg-black rotate-45 ${
                  expand
                    ? 'left-1/2 -top-1.5 -translate-x-1/2'
                    : 'left-4 -bottom-1.5'
                }`}
              />
            </div>
          </div>
        </div>

        {/* new chat */}
        <button
          onClick={() => createNewConversation()}
          className={`mt-8 flex items-center justify-center cursor-pointer ${
            expand
              ? 'bg-blue-500 hover:opacity-90 rounded-2xl gap-2 p-2.5 w-max'
              : 'group relative h-9 w-9 mx-auto hover:bg-gray-500/30 rounded-lg'
          }`}
        >
          <Image
            className={expand ? 'w-6' : 'w-7'}
            src={assets.chat}
            alt="chat"
          />
          {expand && <p className="text-white font-medium">New chat</p>}
        </button>

        {/* recents list */}
        <div className={`mt-8 text-white/25 text-sm ${expand ? 'block' : 'hidden'}`}>
          <p className="my-1">Recents</p>
          {conversations.map((c) => (
            <ChatLabel
              key={c.id}
              title={c.title || 'New Chat'}
              id={c.id}
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              onDelete={() => handleDelete(c.id)}
            />
          ))}
        </div>
      </div>

      {/* ---------- bottom (settings & profile) ---------- */}
      <div>
        {/* …existing Get-App + Profile UI… */}
      </div>
    </div>
  )
}

export default Sidebar
