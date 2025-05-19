'use client'
import React, { useState } from 'react'
import { MessageCircleIcon, X, MinusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ChatAssistant from '@/components/ChatAssistant'
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const FloatingChat: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            className="rounded-full h-14 w-14 fixed bottom-6 right-6 shadow-lg"
            size="icon"
          >
            <MessageCircleIcon className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="sm:max-w-[320px] p-0">
          <div className="h-full flex flex-col">
            <div className="p-3 border-b flex justify-between items-center">
              <h3 className="font-medium text-sm">Assistant IA</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setMinimized(!minimized)}
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {!minimized && (
              <div className="flex-1 overflow-hidden">
                <ChatAssistant isFloating={true} />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          className="rounded-full h-14 w-14 fixed bottom-6 right-6 shadow-lg"
          size="icon"
        >
          <MessageCircleIcon className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[70vh]">
        <div className="h-full flex flex-col max-h-[70vh]">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-medium text-sm">Assistant IA</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setMinimized(!minimized)}
              >
                <MinusIcon className="h-4 w-4" />
              </Button>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </div>
          {!minimized && (
            <div className="flex-1 overflow-hidden px-3">
              <ChatAssistant isFloating={true} />
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default FloatingChat
