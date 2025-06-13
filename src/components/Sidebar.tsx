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
    selectedConversation,
  } = useAppContext()

  const [openMenu, setOpenMenu] = useState<MenuState>({ id: 0, open: false })
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Robust delete: only parent deletes, disables button during API call, and handles out-of-sync state
  const handleDelete = async (conversationId: string) => {
    if (!user) {
      toast.error('Vous devez être connecté pour supprimer une conversation.')
      return
    }
    if (deletingId === conversationId) return // Prevent double-click
    if (!conversations.find(c => c.id === conversationId)) {
      toast.error("Conversation déjà supprimée.")
      return
    }

    setDeletingId(conversationId)
    try {
      const res = await fetch('/api/chat/delete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })
      const data = await res.json()
      if (!res.ok && res.status !== 404) {
        throw new Error(data.message || 'La suppression a échoué')
      }
      removeConversation(conversationId)
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null)
      }
      toast.success('Conversation supprimée')
    } catch (err: any) {
      console.error('Delete error:', err)
      toast.error(err.message || 'Impossible de supprimer la conversation')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div
      className={`
        flex flex-col justify-between bg-[#212327] pt-7 transition-all z-50
        max-md:absolute max-md:h-screen
        ${expand ? 'p-4 w-64' : 'md:w-20 w-0 max-md:overflow-hidden'}
      `}
    >
      {/* --- Top: logo, toggle, new chat --- */}
      <div>
        <div className={`flex ${expand ? 'flex-row gap-10' : 'flex-col items-center gap-8'}`}>
          <Image
            className={expand ? 'w-35' : 'w-10'}
            src={expand ? assets.logo_text : assets.logo}
            alt='logo'
          />
          <div
            onClick={() => setExpand(!expand)}
            className='group relative flex items-center justify-center hover:bg-gray-500/20 transition-all duration-300 h-9 w-12 px-2 rounded-lg cursor-pointer'
          >
            <Image className="md:hidden" src={assets.sidebar} alt='menu' />
            <Image
              className="hidden md:block w-12"
              src={expand ? assets.colse_sidebar : assets.sidebar}
              alt='sidebar'
            />
            <div
              className={`absolute w-max ${expand ? 'left-1/2 -translate-x-1/2 top-12' : '-top-12 left-0'} 
                opacity-0 group-hover:opacity-100 transition bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none`}
            >
              {expand ? 'Fermer la barre latérale' : 'Ouvrir la barre latérale'}
              <div
                className={`w-3 h-3 absolute bg-black rotate-45 ${expand
                  ? 'left-1/2 -top-1.5 -translate-x-1/2'
                  : 'left-4 -bottom-1.5'
                  }`}
              ></div>
            </div>
          </div>
        </div>

        {/* New chat button */}
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
          {expand && <p className="text-white text font-medium">Nouveau chat</p>}
        </button>

        {/* Recent conversations */}
        <div className={`mt-8 text-white/25 text-sm ${expand ? 'block' : 'hidden'}`}>
          <p className="my-1">Récents</p>
          {conversations.map((conversation) => (
            <div key={conversation.id} className="relative">
              <ChatLabel
                title={conversation.title || 'Nouveau chat'}
                id={conversation.id}
                openMenu={openMenu}
                setOpenMenu={setOpenMenu}
                isSelected={selectedConversation?.id === conversation.id}
                onDelete={() => handleDelete(conversation.id)}
                
              />
              {selectedConversation?.id === conversation.id && (
                <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r"></span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* --- Bottom: settings, QR code, profile --- */}
      <div>
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
            alt='settings'
          />
          <div className={`absolute -top-60 pb-8 ${!expand && '-right-40'} opacity-0 group-hover:opacity-100 hidden group-hover:block transition`}>
            <div className="relative w-max bg-black text-white text-sm p-3 rounded-lg shadow-lg">
              <Image src={assets.qrcode} alt='qrcode' className='w-44' />
              <p> Scanner YMS_BIM APP</p>
              <div className={`w-3 h-3 absolute bg-black rotate-45 ${expand ? "right-1/2" : "left-4"} -bottom-1.5`}></div>
            </div>
          </div>
          {expand && (
            <>
              <span>Téléchargez l&apos;APP</span>
              <Image alt='icone' src={assets.new_icone} className="w-5" />
            </>
          )}
        </div>
        <div
          onClick={() => {
            if (!user) {
              toast('Veuillez vous connecter.')
            }
          }}
          className={`flex items-center ${expand ? "hover:bg-white/10 rounded-lg" : "justify-center w-full"
            } gap-3 text-white/60 text-sm p-2 mt-2 cursor-pointer`}
        >
          {user
            ? <Image src={assets.user_icone} alt="user" className="w-7 rounded-full" />
            : <Image src={assets.user_icone} alt="login" className='w-7' />
          }
          {expand && <span>Mon Profil</span>}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
