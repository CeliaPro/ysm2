'use client'

import React, { Dispatch, SetStateAction } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LayoutDashboard, FileText, FolderClosed, Settings, LogOut, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ModeToggle } from '@/components/ui/mode-toggle'
import Link from 'next/link'

interface NavbarProps {
  expand: boolean
  setExpand: Dispatch<SetStateAction<boolean>>
}

const Navbar: React.FC<NavbarProps> = ({ expand, setExpand }) => {
  const { user, logout, isAdmin } = useAuth()
  const [navMenuOpen, setNavMenuOpen] = React.useState(false)

  const isActive = (path: string) => {
    // TODO: implement active detection based on router
    return false
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-4 w-4 mr-2" />, showAlways: true },
    { name: 'Documents', path: '/documents', icon: <FileText className="h-4 w-4 mr-2" />, showAlways: true },
    { name: 'AI Assistant', path: '/ai', icon: <LayoutDashboard className="h-4 w-4 mr-2" />, showAlways: true },
    { name: 'Settings', path: '/users', icon: <FolderClosed className="h-4 w-4 mr-2" />, showIf: isAdmin() },
  ]
  const filteredNavItems = navItems.filter(item => item.showAlways || item.showIf)

  return (
    <header className="flex justify-center sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile toggles */}
          <div className="md:hidden flex items-center gap-2">
            {/* AI sidebar toggle */}
            <Button variant="ghost" size="icon" onClick={() => setExpand(!expand)}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle AI sidebar</span>
            </Button>
            {/* Nav links menu toggle */}
            <Sheet open={navMenuOpen} onOpenChange={setNavMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle nav menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="p-4">
                <nav className="flex flex-col space-y-2">
                  {filteredNavItems.map(item => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${isActive(item.path) ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
                      onClick={() => setNavMenuOpen(false)}
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <Link href="/dashboard/page" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-10 w-40">
              <img src="/lovable-uploads/2dd5ee76-c8a8-4cc5-b8a7-19152b99d669.png" alt="Logo" className="w-full h-auto" />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="font-bold text-sm leading-none">YSM_CegeleC</span>
              <span className="text-xs text-muted-foreground leading-none mt-0.5">Document Management</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1 md:gap-2">
            {filteredNavItems.map(item => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${isActive(item.path) ? 'bg-accent text-accent-foreground' : 'hover:bg-accent hover:text-accent-foreground'}`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Profile & Settings */}
        <div className="flex items-center gap-2">
          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.name}`} alt={user?.name} />
                  <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings"><Settings className="h-4 w-4 mr-2" />Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}><LogOut className="h-4 w-4 mr-2" />Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )

}

export default Navbar
