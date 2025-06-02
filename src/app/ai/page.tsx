'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import PromptBox from '@/components/promptBox'
import Message from '@/components/Message'
import CompareModal from '@/components/CompareModal'

import assets from '@/app/assets/assets'
import { useAuth } from '@/contexts/AuthContext'
import { useAppContext } from '@/contexts/AppContext'
import { useRouter } from 'next/router' 

const AiPage: React.FC = () => {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
    }
  }, [isLoading, user, router])

  if (isLoading || !user) {
    return null // Or <Spinner />
  }


  const { selectedConversation, createNewConversation } = useAppContext()

  const [isAiLoading, setIsLoading] = useState(false)
  const [expand, setExpand] = useState(false)
  const [openCompare, setOpenCompare] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [selectedConversation?.messages])

  const noMessages = !selectedConversation || selectedConversation.messages.length === 0

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navbar */}
      <Navbar expand={expand} setExpand={setExpand} />

      <div className="flex flex-1">
        {/* AI Sidebar */}
        <Sidebar expand={expand} setExpand={setExpand} />

        {/* AI Chat Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 bg-[#292a2d] text-white relative">
          {/* Mobile toggle moved inside AI area */}
          <div className="md:hidden absolute px-4 top-6 flex items-center justify-between w-full">
            <Image
              onClick={() => setExpand(!expand)}
              className="rotate-180"
              src={assets.sidebar}
              alt="toggle sidebar"
              width={30}
              height={30}
              priority
            />
            <Image
              className="opacity-50"
              src={assets.chat}
              alt="chat icon"
              width={30}
              height={30}
            />
          </div>

          {/* CompareModal (PORTAL STYLE, overlays everything when open) */}
          <CompareModal
            open={openCompare}
            onClose={() => setOpenCompare(false)}
            conversationId={selectedConversation?.id || ''}
            //modalOffset={80} // Change to your preferred offset
          />

          {/* Welcome or messages */}
          {noMessages ? (
            <>
              <div className="flex items-center gap-3">
                <Image src={assets.logo} alt="logo" className="h-8" width={35} />
                <p className="text-2xl font-medium">Hi, I&apos;m VINCI Chatbot</p>
              </div>
              <p className="text-sm mt-2">How can I help you today?</p>
            </>
          ) : (
            <div
              ref={containerRef}
              className="relative flex flex-col items-center justify-start w-full mt-20 max-h-screen overflow-y-auto"
            >
              {/* Conversation header */}
              <div className="flex items-center gap-3 mb-6 bg-[#292a2d] px-4 py-2 rounded-lg shadow-md sticky top-0 z-10">
                <p className="border border-transparent hover:border-gray-500/50 py-1 px-2 rounded-lg font-semibold">
                  {selectedConversation?.title}
                </p>
                <button
                  onClick={() => setOpenCompare(true)}
                  className="ml-2 bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90 transition-colors text-xs font-semibold"
                  style={{ border: '1px solid #555', background: '#232427' }}
                >
                  📎 Compare Documents
                </button>
              </div>

              {/* Messages list */}
              {selectedConversation!.messages.map((msg, idx) => (
                <Message key={idx} role={msg.role} content={msg.content} />
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-4 max-w-3xl w-full py-3">
                  <Image
                    src={assets.logo}
                    alt="logo"
                    className="h-9 w-9 p-1 border border-white/15 rounded-full"
                    width={40}
                    height={40}
                    priority
                  />
                  <div className="loader flex justify-center items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prompt input */}
          <PromptBox isLoading={isLoading} setIsLoading={setIsLoading} />

          <p className="text-xs absolute bottom-1 text-gray-500">
            Vinci-AI-generated, ©2025 YMS_BIM. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AiPage
