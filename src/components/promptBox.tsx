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

type Mode = 'rag' | 'search' | 'planning'

const PromptBox: React.FC<PromptBoxProps> = ({ setIsLoading, isLoading }) => {
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<Mode>('search')
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

  // ...file upload & onSubmit functions unchanged

  // (Same functions as you provided)

  // File upload & vectorization
  const handleFilesUpload = async (files: File[]) => {
    if (!user || !selectedConversation) {
      toast.error('Veuillez sélectionner une conversation et vous connecter.')
      return
    }

    const formData = new FormData()
    files.forEach((file) => formData.append('file', file))
    formData.append('conversationId', selectedConversation.id)
    formData.append('userId', user.id)

    try {
      const res = await fetch('/api/chat/vectorize', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (res.ok) {
        if (data.alreadyExists) {
          toast.error('Document déjà présent')
        } else {
          toast.success('Fichiers embeddés avec succès !')
        }
        setShowModal(false)
        setHasFiles(true)
        setMode('rag')
      } else {
        toast.error(`Erreur pendant l'embedding : ${data.error || res.status}`)
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error)
      toast.error('Une erreur est survenue lors de l\'upload')
    }
  }

  // PLANNING API response structure
  interface PlanningTask {
    task: string
    description: string
    duration?: number
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

      // Ensure conversation exists
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

      // Optimistic add of user message
      const userMsg: Message = {
        role: 'USER',
        content: text,
        timestamp: Date.now(),
      }
      appendMessage(convId, userMsg)

      try {
        // --- PLANNING MODE ---
        if (mode === 'planning') {
          const planningRes = await fetch('/api/planning/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sectionText: text,
              projectId: convId,
              createdBy: user.id,
            }),
          })

          if (!planningRes.ok) throw new Error('Planning failed')

          const planningData = await planningRes.json()

          const assistantResponse = `🛠️ **AI Planning Assistant**

### 🧱 Work Breakdown Structure:
${planningData.partialWBS
  .map(
    (task: PlanningTask) =>
      `- **${task.task}** (${task.description}) – _${task.duration ?? '???'} days_`
  )
  .join('\n')}

${
  planningData.missingFields.length > 0
    ? `\n### ❓ Missing Information:\n` +
      planningData.missingFields.map((f: { question: string }) => `• ${f.question}`).join('\n')
    : '\n✅ No missing information!'
}
`
          const assistantMsg: Message = {
            role: 'ASSISTANT',
            content: assistantResponse,
            timestamp: Date.now(),
          }
          appendMessage(convId, assistantMsg)
          setIsLoading(false)
          return
        }

        // --- RAG or SEARCH mode (streaming) ---
        const res = await fetch('/api/chat/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: convId,
            mode,
            messages: [...conv.messages, userMsg],
          }),
        })

        if (!res.ok || !res.body) throw new Error('Chat failed')

        const assistantMsg: Message = {
          role: 'ASSISTANT',
          content: '',
          timestamp: Date.now(),
        }
        appendMessage(convId, assistantMsg)

        // Streaming: update as tokens come
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let done = false

        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) {
            const chunk = decoder.decode(value)
            assistantMsg.content += chunk
            // Replace last assistant message with updated content
            appendMessage(convId, { ...assistantMsg })
          }
        }
      } catch (err: any) {
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
      appendMessage,
      setIsLoading,
      mode,
    ]
  )

  return (
    <form
      onSubmit={onSubmit}
      className={`
        w-full 
        ${selectedConversation?.messages.length ? 'max-w-3xl' : 'max-w-2xl'}
        bg-gray-100 dark:bg-[#404045] p-4 rounded-3xl mt-4 transition-all
        border border-gray-200 dark:border-[#2d2f33]
      `}
    >
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        className="
          outline-none w-full resize-none overflow-hidden break-words 
          bg-transparent text-gray-900 dark:text-white
          placeholder:text-gray-500 dark:placeholder:text-gray-400
        "
        rows={2}
        placeholder="Message AI..."
        disabled={isLoading}
      />

      <div className="flex items-center justify-between text-sm mt-2">
        {/* Mode selection */}
        <div className="flex items-center gap-2">
          <p
            onClick={() => hasFiles && setMode('rag')}
            className={`flex items-center gap-2 text-xs border px-2 py-1 rounded-full cursor-pointer transition 
              ${mode === 'rag'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300/40 hover:bg-gray-300/30 dark:hover:bg-gray-500/20 dark:border-gray-600/40 text-gray-700 dark:text-gray-200'
              } ${!hasFiles && 'opacity-50 cursor-not-allowed'}`}
            title={!hasFiles ? 'Upload a document to enable RAG mode' : ''}
          >
            <Image
              src={assets.deepseek}
              alt="DeepThink"
              width={16}
              height={16}
            />
            DeepThink (RAG)
          </p>
          <p
            onClick={() => setMode('search')}
            className={`flex items-center gap-2 text-xs border px-2 py-1 rounded-full cursor-pointer transition 
              ${mode === 'search'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300/40 hover:bg-gray-300/30 dark:hover:bg-gray-500/20 dark:border-gray-600/40 text-gray-700 dark:text-gray-200'
              }`}
          >
            <Image
              src={assets.web_search}
              alt="Search"
              width={16}
              height={16}
            />
            Search
          </p>
          <p
            onClick={() => setMode('planning')}
            className={`flex items-center gap-2 text-xs border px-2 py-1 rounded-full cursor-pointer transition 
              ${mode === 'planning'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300/40 hover:bg-gray-300/30 dark:hover:bg-gray-500/20 dark:border-gray-600/40 text-gray-700 dark:text-gray-200'
              }`}
          >
            <Image
              src={assets.calendar}
              alt="Planning"
              width={16}
              height={16}
            />
            Planning
          </p>
        </div>

        {/* File upload and send */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-3 hover:bg-gray-200 dark:hover:bg-white/10 px-3 py-2 rounded-lg cursor-pointer"
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
            className={`
              rounded-full p-2 transition
              ${prompt 
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-400 dark:bg-[#71717a] text-white cursor-not-allowed'
              }
            `}
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
