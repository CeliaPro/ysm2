'use client'

import Image from 'next/image'
import Markdown from 'react-markdown'
import { toast } from 'sonner'                        // same toast lib you use elsewhere
import assets from '@/app/assets/assets'            // absolute path


// ---------- types ----------
interface MessageProps {
  role: 'USER' | 'ASSISTANT'
  content: string
}

const Message: React.FC<MessageProps> = ({ role, content }) => {
  const copyMessage = () => {
    navigator.clipboard.writeText(content)
    toast.success('Message copied to clipboard')
  }

  return (
    <div className="flex flex-col items-center w-full max-w-3xl text-sm">
      <div
        className={`flex flex-col w-full mb-8 ${
          role === 'USER' ? 'items-end' : ''
        }`}
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
              role === 'USER'
                ? '-left-16 top-2.5'
                : 'left-9 -bottom-6'
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
                  <Image
                    src={assets.like_icone}
                    alt="like"
                    className="w-4 cursor-pointer"
                  />
                  <Image
                    src={assets.dislike_icone}
                    alt="dislike"
                    className="w-4 cursor-pointer"
                  />
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
