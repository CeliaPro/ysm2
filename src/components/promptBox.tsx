// components/PromptBox.tsx
'use client'

import Image from 'next/image'
import assets from '@/app/assets/assets'
import UploadModal from './UploadModal'
import React, { useState, useCallback, FormEvent } from 'react'
import { useAppContext } from '@/contexts/AppContext'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'                       // ✅ switch to sonner

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

type Mode = 'rag' | 'search'

const PromptBox: React.FC<PromptBoxProps> = ({
  setIsLoading,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<Mode>('search')
  const [showModal, setShowModal] = useState(false)
  const [hasFiles, setHasFiles] = useState(false)

  /* user from AuthContext */
  const { user } = useAuth()

  const {
    setConversations,
    selectedConversation,
    setSelectedConversation,
    createNewConversation,
  } = useAppContext()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e)
    }
  }

  /* -------- File upload -------- */
  const handleFilesUpload = async (files: File[]) => {
    if (!user || !selectedConversation) {
      toast.error('Please select a conversation and log in first.')
      return
    }

    const formData = new FormData()
    files.forEach((file) => formData.append('file', file))
    formData.append('conversationId', selectedConversation.id)
    formData.append('userId', user.id)

    const res = await fetch('/api/chat/vectorize', {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      toast.success('Files embedded successfully!')
      setShowModal(false)
      setHasFiles(true)
      setMode('rag')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Embedding error')
    }
  }

  /* -------- Chat / RAG submit -------- */
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

      // new conversation if needed
      let convId = selectedConversation?.id
      if (!selectedConversation) {
        const newConv = await createNewConversation()
        if (!newConv) {
          setIsLoading(false)
          return
        }
        convId = newConv.id
      }

      // USER message
      const userMsg: Message = {
        role: 'USER',
        content: text,
        timestamp: Date.now(),
      }

      // optimistic UI update
      setSelectedConversation((prev) =>
        prev ? { ...prev, messages: [...prev.messages, userMsg] } : prev
      )
      setConversations((list) =>
        list.map((c) =>
          c.id === convId
            ? { ...c, messages: [...c.messages, userMsg] }
            : c
        )
      )

      try {
        const res = await fetch('/api/chat/search', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: convId,
            mode,
            messages: [
              ...(selectedConversation?.messages ?? []),
              userMsg,
            ],
          }),
        })

        if (!res.ok) throw new Error('Chat failed')

        const assistantMsg: Message = {
          role: 'ASSISTANT',
          content: '',
          timestamp: Date.now(),
        }

        setSelectedConversation((prev) =>
          prev ? { ...prev, messages: [...prev.messages, assistantMsg] } : prev
        )

        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let done = false
        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) {
            assistantMsg.content += decoder.decode(value)
            setSelectedConversation((prev) =>
              prev
                ? {
                    ...prev,
                    messages: [
                      ...prev.messages.slice(0, -1),
                      { ...assistantMsg },
                    ],
                  }
                : prev
            )
          }
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to get response')
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
      setConversations,
      setSelectedConversation,
      mode,
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
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        className="outline-none w-full resize-none overflow-hidden break-words bg-transparent"
        rows={2}
        placeholder="Message AI..."
      />

      <div className="flex items-center justify-between text-sm mt-2">
        {/* mode buttons */}
        <div className="flex items-center gap-2">
          <p
            onClick={() => hasFiles && setMode('rag')}
            className={`flex items-center gap-2 text-xs border px-2 py-1 rounded-full cursor-pointer transition ${
              mode === 'rag'
                ? 'bg-blue-600 text-white'
                : 'border-gray-300/40 hover:bg-gray-500/20'
            }`}
          >
            <Image src={assets.deepseek} alt="DeepThink" width={16} height={16} />
            DeepThink (RAG)
          </p>
          <p
            onClick={() => setMode('search')}
            className={`flex items-center gap-2 text-xs border px-2 py-1 rounded-full cursor-pointer transition ${
              mode === 'search'
                ? 'bg-blue-600 text-white'
                : 'border-gray-300/40 hover:bg-gray-500/20'
            }`}
          >
            <Image src={assets.web_search} alt="Search" width={16} height={16} />
            Search
          </p>
        </div>

        {/* upload + send */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-3 hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer"
            onClick={() => setShowModal(true)}
          >
            <Image className="w-5 h-5" src={assets.pin_doc} alt="Upload" />
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
