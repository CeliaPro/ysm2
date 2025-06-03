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
  onDelete: () => void
}

const ChatLabel: React.FC<ChatLabelProps> = ({
  id,
  title,
  openMenu,
  setOpenMenu,
  onDelete,
}) => {
  const { conversations, setSelectedConversation, fetchUsersConversations } = useAppContext()

  // Select chat
  const selectConversation = () => {
    const conv = conversations.find((c) => c.id === id) || null
    setSelectedConversation(conv)
    setOpenMenu({ id: 0, open: false })
  }

  // Rename chat with API + refresh
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
        if (typeof fetchUsersConversations === 'function') {
          await fetchUsersConversations()
        }
        setOpenMenu({ id: 0, open: false })
        toast.success(data.message || 'Renamed')
      } else {
        toast.error(data.message || 'Rename failed')
      }
    } catch (err: any) {
      toast.error(err.message || 'Rename request failed')
    }
  }

  // Delete chat with API + refresh
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
        if (typeof fetchUsersConversations === 'function') {
          await fetchUsersConversations()
        }
        setOpenMenu({ id: 0, open: false })
        toast.success(data.message || 'Deleted')
        if (typeof onDelete === 'function') onDelete()
      } else {
        toast.error(data.message || 'Delete failed')
      }
    } catch (err: any) {
      toast.error(err.message || 'Delete request failed')
    }
  }

  return (
    <div className="relative group">
      <div
        onClick={selectConversation}
        className={`
          flex items-center justify-between p-2
          hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-sm cursor-pointer
        `}
      >
        {/* Title - main fix: text color for both modes */}
        <p className="truncate max-w-[80%] text-gray-800 dark:text-gray-100">
          {title}
        </p>
        <div
          onClick={(e) => {
            e.stopPropagation()
            setOpenMenu({ id, open: !openMenu.open })
          }}
          className={`
            group relative flex items-center justify-center h-6 w-6
            hover:bg-gray-400/30 dark:hover:bg-black/80 rounded-lg
          `}
        >
          <Image
            src={assets.three_dots}
            alt="menu"
            className="w-5"
            style={{ filter: 'invert(20%)', color: 'inherit' }}
          />
          {/* Dropdown */}
          {openMenu.id === id && openMenu.open && (
            <ul className="absolute right-0 top-6 bg-gray-50 dark:bg-gray-700 rounded-xl w-max p-2 z-50 text-gray-800 dark:text-gray-100 text-sm shadow-xl border dark:border-gray-600">
              <li
                className="flex items-center gap-3 hover:bg-gray-200 dark:hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer"
                onClick={renameHandler}
              >
                <Image className="w-5" src={assets.edite_icone} alt="Rename" />
                <p>Rename</p>
              </li>
              <li
                className="flex items-center gap-3 hover:bg-gray-200 dark:hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer"
                onClick={deleteHandler}
              >
                <Image className="w-5" src={assets.delete_icone} alt="Delete" />
                <p>Delete</p>
              </li>
              {/* Place for extra features such as Upload popup/modal */}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatLabel
