// components/PromptBox.tsx
'use client'

import Image from 'next/image'
import assets from '@/app/assets/assets'
import UploadModal from './UploadModal'
import React, { useState, useCallback, FormEvent } from 'react'
import { useAppContext } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface PromptBoxProps {
  setIsLoading: (loading: boolean) => void
  isLoading: boolean
}

interface Message {
  role: 'USER' | 'ASSISTANT'
  content: string
  timestamp: number
  createdAt?: string
}

const PromptBox: React.FC<PromptBoxProps> = ({ setIsLoading, isLoading }) => {
  const [prompt, setPrompt] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [hasFiles, setHasFiles] = useState(false)

  const { user } = useAuth()
  const {
    selectedConversation,
    createNewConversation,
    appendMessage,
  } = useAppContext()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e)
    }
  }

  const handleFilesUpload = async (files: File[]) => {
    // ... your existing upload logic
  }

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      const text = prompt.trim()
      if (!text) return
      if (!user) {
        toast.error('Please login to send a message')
        return
      }
      if (isLoading) return

      setPrompt('')
      setIsLoading(true)

      // ensure we have a conversation
      let conv = selectedConversation
      if (!conv) {
        const newConv = await createNewConversation()
        if (!newConv) {
          setIsLoading(false)
          return
        }
        conv = newConv
      }
      const convId = conv.id

      // optimistic add of user message
      const userMsg: Message = {
        role: 'USER',
        content: text,
        timestamp: Date.now(),
      }
      appendMessage(convId, userMsg)

      try {
        // call your JSON‐based endpoint
        const res = await fetch('/api/chat/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: convId,
            messages: [...conv.messages, userMsg],
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Chat failed')
        }

        // append assistant reply
        const assistantMsg: Message = {
          role: 'ASSISTANT',
          content: data.assistant,
          timestamp: Date.now(),
        }
        appendMessage(convId, assistantMsg)
      } catch (err: any) {
        console.error(err)
        toast.error(err.message || 'Failed to get response')
      } finally {
        setIsLoading(false)
      }
    },
    [
      prompt,
      user,
      isLoading,
      selectedConversation,
      createNewConversation,
      appendMessage,
      setIsLoading,
    ]
  )

  return (
    <form
      onSubmit={onSubmit}
      className={`w-full ${
        selectedConversation?.messages.length ? 'max-w-3xl' : 'max-w-2xl'
      } bg-[#404045] p-4 rounded-3xl mt-4 transition-all`}
    >
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        className="outline-none w-full resize-none overflow-hidden break-words bg-transparent"
        rows={2}
        placeholder="Message AI..."
      />

      <div className="flex items-center justify-between text-sm mt-2">
        {/* File upload + send button */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer"
            onClick={() => setShowModal(true)}
          >
            <Image
              className="w-5 h-5"
              src={assets.pin_doc}
              alt="Upload"
            />
          </div>

          <UploadModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onUpload={handleFilesUpload}
          />

          <button
            type="submit"
            disabled={!prompt || isLoading}
            className={`rounded-full p-2 ${
              prompt ? 'bg-blue-500' : 'bg-[#71717a]'
            } transition`}
          >
            <Image
              className="w-3.5 aspect-square"
              src={assets.up_arrow}
              alt="Send"
              width={14}
              height={14}
            />
          </button>
        </div>
      </div>
    </form>
  )
}

export default PromptBox
