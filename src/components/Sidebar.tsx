// components/Sidebar.tsx
'use client'

import React, { useState } from 'react'
import Image from 'next/image'

import assets from '@/app/assets/assets'                  // <-- make sure this matches where images live
import ChatLabel from './ChatLabel'

import { useAuth } from '@/contexts/AuthContext'
import { useAppContext } from '@/contexts/AppContext'

// ---------------- types -----------------
interface MenuState {
  id: string | number
  open: boolean
}

interface SidebarProps {
  expand: boolean
  setExpand: (value: boolean) => void
}

// ---------------- component --------------
const Sidebar: React.FC<SidebarProps> = ({ expand, setExpand }) => {
  const { user } = useAuth()                         // global user
  const { conversations, createNewConversation } = useAppContext()

  const [openMenu, setOpenMenu] = useState<MenuState>({ id: 0, open: false })

  return (
    <div
      className={`flex flex-col justify-between bg-[#212327] pt-7 transition-all z-50 max-md:absolute max-md:h-screen ${
        expand ? 'p-4 w-64' : 'md:w-20 w-0 max-md:overflow-hidden'
      }`}
    >
      {/* ---------- top ---------- */}
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

          {/* tooltip (mobile) */}
          <div className="absolute w-max -top-12 -right-12 opacity-0 group-hover:opacity-100 transition bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none">
            New chat
            <div className="w-3 h-3 bg-black rotate-45 absolute left-4 -top-1.5 -translate-x-1/2" />
          </div>

          {expand && <p className="text-white font-medium">New chat</p>}
        </button>

        {/* recents list */}
        <div
          className={`mt-8 text-white/25 text-sm ${
            expand ? 'block' : 'hidden'
          }`}
        >
          <p className="my-1">Recents</p>
          {conversations.map((c) => (
            <ChatLabel
              key={`chat-${c.id}`}
              title={c.title || 'New Chat'}
              id={c.id}
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
            />
          ))}
        </div>
      </div>

      {/* ---------- bottom ---------- */}
      <div>
        {/* Get-app item */}
        <div
          className={`flex items-center cursor-pointer group relative ${
            expand
              ? 'gap-3 text-white/80 text-sm p-2.5 border border-gray-700 rounded-lg hover:bg-white/10'
              : 'h-10 w-10 mx-auto hover:bg-gray-500/30 rounded-lg'
          }`}
        >
          <Image
            className={expand ? 'w-5' : 'w-6.5 mx-auto'}
            src={assets.setting}
            alt="settings"
          />
          <div
            className={`absolute -top-60 pb-8 ${
              !expand && '-right-40'
            } opacity-0 group-hover:opacity-100 hidden group-hover:block transition`}
          >
            <div className="relative w-max bg-black text-white text-sm p-3 rounded-lg shadow-lg">
              <Image src={assets.qrcode} alt="qrcode" className="w-44" />
              <p>Scan to get YMS_BIM APP</p>
              <div
                className={`w-3 h-3 absolute bg-black rotate-45 ${
                  expand ? 'right-1/2' : 'left-4'
                } -bottom-1.5`}
              />
            </div>
          </div>
          {expand && (
            <>
              <span>Get APP</span>
              <Image alt="new" src={assets.new_icone} className="w-5" />
            </>
          )}
        </div>

        {/* profile */}
        <div
          className={`flex items-center ${
            expand ? 'hover:bg-white/10 rounded-lg' : 'justify-center w-full'
          } gap-3 text-white/60 text-sm p-2 mt-2 cursor-pointer`}
        >
          <Image src={assets.user_icone} alt="profile" className="w-7" />
          {expand && <span>{user?.name || 'My Profile'}</span>}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
