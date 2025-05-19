'use client'
import React, { useState } from 'react'
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
import {
  LayoutDashboard,
  FileText,
  FolderClosed,
  Users,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ModeToggle } from '@/components/ui/mode-toggle'
import Link from 'next/link'

const Navbar: React.FC = () => {
  const { user,logout, isAdmin, isProjectManager } = useAuth()  //I removed nothing
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
 
//   const handleLogout = async () => {
//   try {
//     const res = await fetch('/api/auth/logout', {
//       method: 'GET',
//       credentials: 'include',
//     })

//     // if (res.ok) {
//     //   // Optional: clear any client state or redirect
//     //   window.location.href = '/' // or router.push('/')
//     // } else {
//     //   console.error('Erreur de déconnexion')
//     // }
//   } catch (error) {
//     console.error('Erreur réseau lors de la déconnexion:', error)
//   }
// }

  const isActive = (path: string) => {
    return false
  }

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
      showAlways: true,
    },
    {
      name: 'Documents',
      path: '/documents',
      icon: <FileText className="h-4 w-4 mr-2" />,
      showAlways: true,
    },
    {
      name: 'Projects',
      path: '/projects',
      icon: <FolderClosed className="h-4 w-4 mr-2" />,
      showAlways: true,
    },
    {
      name: 'Users',
      path: '/users',
      icon: <Users className="h-4 w-4 mr-2" />,
      showIf: isAdmin() || isProjectManager(),
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="h-4 w-4 mr-2" />,
      showAlways: true,
    },
  ]

  const filteredNavItems = navItems.filter(
    (item) => item.showAlways || item.showIf
  )

  return (
    <header className="flex justify-center sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <div className="flex flex-col gap-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-32 h-10">
                    <img
                      src="/lovable-uploads/2dd5ee76-c8a8-4cc5-b8a7-19152b99d669.png"
                      alt="YSM_CegeleC Logo"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                  <span className="font-bold">YSM_CegeleC</span>
                </div>
                <nav className="flex flex-col gap-2">
                  {filteredNavItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
                        isActive(item.path)
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  ))}
                  <Button
                    variant="ghost"
                    className="flex items-center justify-start px-3 py-2 text-sm"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard/page" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-10 w-40">
              <img
                src="/lovable-uploads/2dd5ee76-c8a8-4cc5-b8a7-19152b99d669.png"
                alt="YSM_CegeleC Logo"
                className="h-auto w-full object-contain"
              />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="font-bold text-sm leading-none">
                YSM_CegeleC
              </span>
              <span className="text-xs text-muted-foreground leading-none mt-0.5">
                Document Management
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex gap-1 md:gap-2">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive(item.path)
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={`https://ui-avatars.com/api/?name=${user?.name}`}
                    alt={user?.name}
                  />
                  <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default Navbar
