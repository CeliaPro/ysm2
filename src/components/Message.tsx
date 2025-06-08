'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Markdown from 'react-markdown'
import { toast } from 'sonner'
import assets from '@/app/assets/assets'

// ---------- types ----------
interface MessageProps {
  role: 'USER' | 'ASSISTANT'
  content: string
}

const Message: React.FC<MessageProps> = ({ role, content }) => {
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null)

  const copyMessage = () => {
    navigator.clipboard.writeText(content)
    toast.success('Message copied to clipboard')
  }

  const handleLike = () => setFeedback(feedback === 'like' ? null : 'like')
  const handleDislike = () => setFeedback(feedback === 'dislike' ? null : 'dislike')

  return (
    <div className="flex flex-col items-center w-full max-w-3xl text-sm">
      <div
        className={`flex flex-col w-full mb-8 ${role === 'USER' ? 'items-end' : ''}`}
      >
        <div
          className={`group relative flex max-w-2xl py-3 ${
            role === 'USER'
              ? 'bg-[#414158] px-5 rounded-bl-xl rounded-t-xl'
              : 'gap-3'
          }`}
        >
          {/* Hover Action Icons */}
          <div
            className={`opacity-0 group-hover:opacity-100 absolute ${
              role === 'USER' ? '-left-16 top-2.5' : 'left-9 -bottom-6'
            } transition-all`}
          >
            <div className="flex items-center gap-2 opacity-70">
              {role === 'USER' ? (
                <>
                  <Image
                    onClick={copyMessage}
                    src={assets.copy_icone}
                    alt="copy"
                    className="w-4 cursor-pointer"
                  />
                  <Image
                    src={assets.edit_text}
                    alt="edit"
                    className="w-4 cursor-pointer"
                  />
                </>
              ) : (
                <>
                  <Image
                    onClick={copyMessage}
                    src={assets.copy_icone}
                    alt="copy"
                    className="w-4.5 cursor-pointer"
                  />
                  {/* Like Button */}
                  <button
                    onClick={handleLike}
                    className={`p-1 rounded transition-colors ${feedback === 'like' ? 'text-green-400' : ''}`}
                    aria-label="Like message"
                  >
                    {/* SVG Like Icon (filled if active) */}
                    <svg
                      className={`w-4 h-4 ${feedback === 'like' ? 'fill-green-400' : 'fill-white/70'}`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
                    </svg>
                  </button>
                  {/* Dislike Button */}
                  <button
                    onClick={handleDislike}
                    className={`p-1 rounded transition-colors ${feedback === 'dislike' ? 'text-red-400' : ''}`}
                    aria-label="Dislike message"
                  >
                    {/* SVG Dislike Icon (filled if active, rotated) */}
                    <svg
                      className={`w-4 h-4 ${feedback === 'dislike' ? 'fill-red-400' : 'fill-white/70'} transform rotate-180`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 016 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558-.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23h-.777zM2.331 10.977a11.969 11.969 0 00-.831 4.398 12 12 0 00.52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 01-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227z"/>
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Message Bubble */}
          {role === 'USER' ? (
            <span className="text-white/90">{content}</span>
          ) : (
            <>
              <Image
                src={assets.logo}
                alt="bot"
                className="h-9 w-9 p-1 border border-white/15 rounded-full"
              />
              <div className="space-y-4 w-full overflow-auto">
                <Markdown>{content}</Markdown>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Message
