import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/contexts/AuthContext'
import { AIMessage } from '@/types/ai'
import { mockAIConfigurations } from '@/data/mockAiConfigurations'
import { format } from 'date-fns'
import { BrainIcon, SendIcon } from 'lucide-react'

interface AIChatProps {
  documentId?: string
  projectId?: string
}

const AIChat: React.FC<AIChatProps> = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedAIConfig, setSelectedAIConfig] = useState<string>('1')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return

    // Create a new user message
    const userMessage: AIMessage = {
      id: `temp-${Date.now()}`,
      conversationId: '1', // This would be set by backend
      role: 'user',
      content: newMessage,
      timestamp: new Date(),
      tokensUsed: 0, // This would be set by backend
    }

    // Add to messages
    setMessages([...messages, userMessage])

    // Clear input
    setNewMessage('')

    // Simulate AI processing
    setIsProcessing(true)

    setTimeout(() => {
      // Get the selected AI config
      const aiConfig = mockAIConfigurations.find(
        (config) => config.id === selectedAIConfig
      )

      // Create a mock AI response
      const aiResponse: AIMessage = {
        id: `temp-response-${Date.now()}`,
        conversationId: '1', // This would be set by backend
        role: 'assistant',
        content: `Voici une réponse simulée de l'IA utilisant le modèle ${aiConfig?.name || 'par défaut'}. Dans une implémentation réelle, cela serait généré par l'API OpenAI en utilisant le modèle sélectionné avec une température de ${aiConfig?.temperature || 0.7} et un maximum de jetons de ${aiConfig?.maxTokens || 500}.`,
        timestamp: new Date(),
        tokensUsed: 25, // This would be set by backend
      }

      // Add to messages
      setMessages((prevMessages) => [...prevMessages, aiResponse])
      setIsProcessing(false)
    }, 1500)
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <BrainIcon className="h-5 w-5" />
            Assistant IA
          </CardTitle>
          <div className="flex items-center">
            <Select
              value={selectedAIConfig}
              onValueChange={setSelectedAIConfig}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sélectionner un modèle IA" />
              </SelectTrigger>
              <SelectContent>
                {mockAIConfigurations.map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    {config.name} ({config.model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-[400px] pr-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <BrainIcon className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-medium text-lg">Assistant IA</h3>
              <p className="text-muted-foreground text-sm mt-2 max-w-md">
                Posez-moi des questions sur vos documents ou projets. Je peux
                résumer le contenu, répondre à des questions spécifiques ou
                aider à l&#39;analyse.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        IA
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                    <div className="text-xs mt-1 opacity-70">
                      {format(message.timestamp, 'h:mm a')}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={`https://ui-avatars.com/api/?name=${user?.name || 'Utilisateur'}`}
                      />
                      <AvatarFallback>
                        {(user?.name || 'U').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      IA
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-lg px-4 py-2 bg-muted">
                    <div className="flex space-x-2 items-center">
                      <div className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce delay-75"></div>
                      <div className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex w-full items-center space-x-2">
          <Textarea
            placeholder="Tapez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 min-h-12 max-h-32"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isProcessing}
            size="icon"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default AIChat
