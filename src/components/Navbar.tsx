'use client'

import React, {
  useState,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
  ReactNode,
} from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet'
import { ModeToggle } from '@/components/ui/mode-toggle'
import {
  LayoutDashboard,
  FileText,
  FolderClosed,
  Settings,
  LogOut,
  Menu,
  TrendingUp,
} from 'lucide-react'

export interface NavbarProps {
  expand?: boolean
  setExpand?: Dispatch<SetStateAction<boolean>>
}

const Navbar: React.FC<NavbarProps> = ({
  expand: propExpand,
  setExpand: propSetExpand,
}) => {
  const { user, logout, isAdmin } = useAuth()

  // Local fallback if no props passed
  const [localExpand, setLocalExpand] = useState<boolean>(false)
  const expand = propExpand ?? localExpand
  const setExpand = propSetExpand ?? setLocalExpand

  // Sheet state for nav links on mobile
  const [isNavSheetOpen, setIsNavSheetOpen] = useState<boolean>(false)

  // Scroll-to-hide state
  const [hidden, setHidden] = useState(false)
  const lastScroll = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY
      if (currentScroll > lastScroll.current && currentScroll > 30) {
        setHidden(true)
      } else {
        setHidden(false)
      }
      lastScroll.current = currentScroll
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Active link highlighting
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  // Define your nav items
  const navItems: {
    name: string
    path: string
    icon: ReactNode
    showAlways?: boolean
    showIf?: boolean
  }[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
      showAlways: true,
    },
    {
      name: 'Analyses',
      path: '/dashboard/analytics',
      icon: <TrendingUp className="h-4 w-4 mr-2" />,
      showAlways: true,
    },
    {
      name: 'Documents',
      path: '/documents',
      icon: <FileText className="h-4 w-4 mr-2" />,
      showAlways: true,
    },
    {
      name: 'AI Assistant',
      path: '/ai',
      icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
      showAlways: true,
    },
    {
      name: 'Collaborateurs',
      path: '/users',
      icon: <FolderClosed className="h-4 w-4 mr-2" />,
      showIf: isAdmin(),
    },
  ]

  const filteredNavItems = navItems.filter(
    (item) => item.showAlways || item.showIf
  )

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
        transition-transform duration-300
        ${hidden ? '-translate-y-full' : 'translate-y-0'}
      `}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          {/* AI‐sidebar toggle (mobile only) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setExpand(!expand)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">
              Toggle AI sidebar
            </span>
          </Button>

          {/* Nav‐links sheet toggle (mobile only) */}
          <Sheet
            open={isNavSheetOpen}
            onOpenChange={setIsNavSheetOpen}
          >
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
              >
                <Menu className="h-5 w-5 rotate-90" />
                <span className="sr-only">
                  Toggle main nav
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="top"
              className="w-full p-4"
            >
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
                    onClick={() => setIsNavSheetOpen(false)}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  className="flex items-center px-3 py-2 text-sm"
                  onClick={() => {
                    logout()
                    setIsNavSheetOpen(false)
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link
            href="/dashboard/page"
            className="flex items-center gap-2"
          >
            <div className="h-10 w-40">
              <img
                src="/lovable-uploads/2dd5ee76-c8a8-4cc5-b8a7-19152b99d669.png"
                alt="YSM_CegeleC Logo"
                className="h-full w-full object-contain"
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

          {/* Desktop links */}
          <nav className="hidden md:flex gap-2">
            {filteredNavItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive(item.path)
                       ? 'bg-blue-600 text-white shadow'
                      : 'hover:bg-blue-100 hover:text-blue-900'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Profile & Mode Toggle */}
        <div className="flex items-center gap-2">
          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={`https://ui-avatars.com/api/?name=${user?.name}`}
                    alt={user?.name}
                  />
                  <AvatarFallback>
                    {user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              align="end"
              forceMount
            >
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
