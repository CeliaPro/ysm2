'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SendIcon, BotIcon, TrashIcon, Loader2Icon } from 'lucide-react'

interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: Date
  thinking?: boolean
}

interface ChatAssistantProps {
  isFloating?: boolean
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({
  isFloating = false,
}) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content:
        'Bonjour ! Je suis votre assistant de documents. Posez-moi des questions sur vos projets et documents.',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI thinking message
    const thinkingMessage: Message = {
      id: `thinking-${Date.now()}`,
      content: '',
      sender: 'assistant',
      timestamp: new Date(),
      thinking: true,
    }

    setMessages((prev) => [...prev, thinkingMessage])

    // Simulate API delay for demo purposes
    setTimeout(() => {
      // Remove thinking message and add actual response
      setMessages((prev) => prev.filter((m) => m.id !== thinkingMessage.id))

      const assistantMessage: Message = {
        id: `response-${Date.now()}`,
        content: getAIResponse(input),
        sender: 'assistant',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getAIResponse = (question: string): string => {
    // Mock AI responses for demo
    const responses = [
      "J'ai trouvé des informations pertinentes dans les documents du projet. Selon le dernier rapport, le projet est dans les délais.",
      "D'après les documents auxquels vous avez accès, le rapport trimestriel montre une augmentation de 15% de la productivité.",
      "Le document 'Exigences.pdf' du Projet Alpha mentionne cette fonctionnalité dans la section 3.2.",
      'Je ne vois pas de documents liés à ce sujet spécifique dans vos projets accessibles.',
      'Il y a 3 documents dans le Projet Bêta qui mentionnent ces mots-clés. Souhaitez-vous que je les résume pour vous ?',
      "La dernière version de ce document a été téléchargée il y a 3 jours par Sarah de l'équipe de conception.",
      'Selon vos documents de projet, la date limite pour ce livrable est vendredi prochain.',
    ]

    // For demo purposes, return a random response
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        content:
          'Bonjour ! Je suis votre assistant de documents. Posez-moi des questions sur vos projets et documents.',
        sender: 'assistant',
        timestamp: new Date(),
      },
    ])
  }

  // Adjust container height for more compact appearance
  const containerClasses = isFloating
    ? 'flex flex-col h-[100%]'
    : 'flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]'

  // Small header when floating
  const headerClasses = isFloating ? 'mb-2' : 'mb-4'

  return (
    <div className={containerClasses}>
      {!isFloating && (
        <div className={`flex justify-between items-center ${headerClasses}`}>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-primary/10">
              <AvatarFallback>
                <BotIcon className="h-4 w-4 text-primary" />
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">Assistant IA de Documents</h2>
          </div>

          <Button variant="outline" size="sm" onClick={clearChat}>
            <TrashIcon className="h-4 w-4 mr-2" />
            Effacer
          </Button>
        </div>
      )}

      <div
        className={
          isFloating ? 'flex-1 overflow-hidden' : 'flex-1 mb-4 overflow-hidden'
        }
      >
        <div
          className={`${isFloating ? 'h-[calc(100%-40px)]' : 'h-full bg-card rounded-lg border shadow-sm'} overflow-y-auto p-3`}
        >
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[85%] ${
                    message.sender === 'user' ? 'ml-auto' : 'mr-auto'
                  }`}
                >
                  {message.sender === 'assistant' && (
                    <Avatar className="h-6 w-6 mr-1 mt-1">
                      <AvatarFallback>
                        <BotIcon className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div>
                    <div
                      className={`rounded-xl px-3 py-2 text-sm ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.thinking ? (
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse delay-0" />
                          <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse delay-150" />
                          <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse delay-300" />
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {message.sender === 'user' && (
                    <Avatar className="h-6 w-6 ml-1 mt-1">
                      <AvatarImage
                        src={`https://ui-avatars.com/api/?name=${user?.name}`}
                        alt={user?.name}
                      />
                      <AvatarFallback>
                        {user?.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {isFloating && (
        <Button
          variant="ghost"
          size="sm"
          className="self-end mb-1 h-7 px-2 text-xs"
          onClick={clearChat}
        >
          <TrashIcon className="h-3 w-3 mr-1" />
          Effacer
        </Button>
      )}

      <form
        onSubmit={handleSendMessage}
        className={`flex gap-2 ${isFloating ? 'px-3 pb-3' : ''}`}
      >
        <Input
          placeholder="Posez des questions sur vos documents..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 h-9 text-sm"
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          size="sm"
          className="h-9 px-3"
        >
          {isLoading ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <SendIcon className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  )
}

export default ChatAssistant
