'use client'

import React, { useState } from 'react'
import Image from 'next/image'

import assets from '@/app/assets/assets'          // absolute import
import { useAppContext } from '@/contexts/AppContext'
import { toast } from 'sonner'                        // your toast lib (same as other components)

interface MenuState {
  id: string | number
  open: boolean
}

interface ChatLabelProps {
  openMenu: MenuState
  setOpenMenu: React.Dispatch<React.SetStateAction<MenuState>>
  id: string
  title: string
}

const ChatLabel: React.FC<ChatLabelProps> = ({
  openMenu,
  setOpenMenu,
  id,
  title,
}) => {
  const {
    conversations,
    setSelectedConversation,
    fetchUsersConversations,
  } = useAppContext()

  /* select chat */
  const selectConversation = () => {
    const conv = conversations.find((c) => c.id === id) || null
    setSelectedConversation(conv)
  }

  /* rename chat */
  const renameHandler = async () => {
    const newName = prompt('Enter new name')
    if (!newName) return

    try {
      const res = await fetch('/api/chat/rename', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id, title: newName }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        await fetchUsersConversations()
        setOpenMenu({ id: 0, open: false })
        toast.success(data.message || 'Renamed')
      } else {
        toast.error(data.message || 'Rename failed')
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Rename request failed'
      )
    }
  }

  /* delete chat */
  const deleteHandler = async () => {
    if (!confirm('Are you sure you want to delete this conversation?')) return

    try {
      const res = await fetch('/api/chat/delete', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        await fetchUsersConversations()
        setOpenMenu({ id: 0, open: false })
        toast.success(data.message || 'Deleted')
      } else {
        toast.error(data.message || 'Delete failed')
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Delete request failed'
      )
    }
  }

  return (
    <>
      <div
        onClick={selectConversation}
        className="flex items-center justify-between p-2 text-white/80 hover:bg-white/10 rounded-lg text-sm group cursor-pointer"
      >
        <p className="truncate max-w-[80%]">{title}</p>

        {/* three-dot menu */}
        <div
          onClick={(e) => {
            e.stopPropagation()
            setOpenMenu({ id, open: !openMenu.open })
          }}
          className="group relative flex items-center justify-center h-6 w-6 hover:bg-black/80 rounded-lg"
        >
          <Image
            src={assets.three_dots}
            alt="menu"
            className={`w-5 ${
              openMenu.id === id && openMenu.open ? '' : 'hidden'
            } group-hover:block`}
          />

          {/* dropdown */}
          <div
            className={`absolute ${
              openMenu.id === id && openMenu.open ? 'block' : 'hidden'
            } -right-36 top-6 bg-gray-700 rounded-xl w-max p-2 z-50`}
          >
            <div
              onClick={renameHandler}
              className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg"
            >
              <Image className="w-5" src={assets.edite_icone} alt="" />
              <p>Rename</p>
            </div>
            <div
              onClick={deleteHandler}
              className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg"
            >
              <Image className="w-5" src={assets.delete_icone} alt="" />
              <p>Delete</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ChatLabel
