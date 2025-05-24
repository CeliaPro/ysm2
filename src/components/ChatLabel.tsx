'use client'

import React, { Dispatch, SetStateAction } from 'react'
import Image from 'next/image'
import assets from '@/app/assets/assets'
import { useAppContext } from '@/contexts/AppContext'
import { toast } from 'sonner'

interface MenuState {
  id: string | number
  open: boolean
}

export interface ChatLabelProps {
  id: string
  title: string
  openMenu: MenuState
  setOpenMenu: Dispatch<SetStateAction<MenuState>>
  onDelete: () => void           // ← new prop
}

const ChatLabel: React.FC<ChatLabelProps> = ({
  id,
  title,
  openMenu,
  setOpenMenu,
  onDelete,
}) => {
  const { conversations, setSelectedConversation } = useAppContext()

  /* select chat */
  const selectConversation = () => {
    const conv = conversations.find((c) => c.id === id) || null
    setSelectedConversation(conv)
    // close the menu if open
    setOpenMenu({ id: 0, open: false })
  }

  /* rename chat (unchanged) */
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
        setOpenMenu({ id: 0, open: false })
        toast.success(data.message || 'Renamed')
      } else {
        toast.error(data.message || 'Rename failed')
      }
    } catch (err: any) {
      toast.error(err.message || 'Rename request failed')
    }
  }

  /* delete chat — now simply invokes onDelete() passed from Sidebar */
  const deleteHandler = () => {
    if (!confirm('Are you sure you want to delete this conversation?'))
      return
    onDelete()
    setOpenMenu({ id: 0, open: false })
  }

  return (
    <div className="relative group">
      <div
        onClick={selectConversation}
        className="flex items-center justify-between p-2 text-white/80 hover:bg-white/10 rounded-lg text-sm cursor-pointer"
      >
        <p className="truncate max-w-[80%]">{title}</p>

        {/* three-dot menu toggle */}
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
              openMenu.id === id && openMenu.open ? 'block' : 'hidden'
            } group-hover:block`}
          />

          {/* dropdown */}
          {openMenu.id === id && openMenu.open && (
            <ul className="absolute right-0 top-6 bg-gray-700 rounded-xl w-max p-2 z-50 text-white text-sm">
              <li
                className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer"
                onClick={renameHandler}
              >
                <Image className="w-5" src={assets.edite_icone} alt="" />
                <p>Rename</p>
              </li>
              <li
                className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer"
                onClick={deleteHandler}
              >
                <Image className="w-5" src={assets.delete_icone} alt="" />
                <p>Delete</p>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatLabel
