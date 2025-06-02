'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/aiUi/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Monitor, Smartphone, Tablet, MapPin, Clock, Shield, AlertTriangle, RefreshCw, LogOut, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export interface Session {
  id: string
  device: string | null
  ipAddress: string | null
  geoCountry: string | null
  geoCity: string | null
  lastUsedAt: string | null
  createdAt: string | null
  userAgent: string | null
  isCurrent: boolean
}

const getDeviceIcon = (device: string | null) => {
  const str = (device || '').toLowerCase()
  if (str.includes('iphone') || str.includes('android')) return <Smartphone className="h-4 w-4" />
  if (str.includes('ipad') || str.includes('tablet')) return <Tablet className="h-4 w-4" />
  return <Monitor className="h-4 w-4" />
}

const getStatusBadge = (isCurrent: boolean, lastUsedAt: string | null) => {
  if (isCurrent) return <Badge variant="default" className="bg-green-100 text-green-800">Current Session</Badge>
  if (!lastUsedAt) return <Badge variant="outline" className="text-gray-600">Inactive</Badge>
  // Add more logic if you want
  return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Active</Badge>
}

export const SessionManagement = () => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const fetchSessions = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/sessions')
      const data = await res.json()
      // Adapt to your API response!
      const sessions: Session[] = (data.sessions || []).map((s: any) => ({
        id: s.id,
        device: s.device || s.deviceInfo || '',
        ipAddress: s.ipAddress || '',
        geoCountry: s.geoCountry || '',
        geoCity: s.geoCity || '',
        lastUsedAt: s.lastUsedAt || s.updatedAt || s.createdAt || '',
        createdAt: s.createdAt || '',
        userAgent: s.userAgent || '',
        isCurrent: data.currentSessionId === s.id,
      }))
      setSessions(sessions)
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger les sessions.",
        variant: "destructive"
      })
    }
    setIsLoading(false)
  }

  useEffect(() => { fetchSessions()
     const interval = setInterval(fetchSessions, 30000) // 30 seconds
    return () => clearInterval(interval)
   }, [])

  const handleLogoutSession = async (sessionId: string) => {
    setIsLoading(true)
    try {
      await fetch('/api/sessions/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      toast({ title: "Session terminated", description: "The session has been logged out." })
    } catch {
      toast({ title: "Error", description: "Failed to logout session", variant: "destructive" })
    }
    setIsLoading(false)
  }

  const handleLogoutAllSessions = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/sessions/logout-all', { method: 'POST' })
      setSessions(prev => prev.filter(s => s.isCurrent))
      toast({ title: "All sessions terminated", description: "All other sessions logged out." })
    } catch {
      toast({ title: "Error", description: "Failed to logout all sessions", variant: "destructive" })
    }
    setIsLoading(false)
  }

  const handleRefreshSessions = () => fetchSessions()

  // Mark as suspicious: Not current session and either no geo or last used long ago
  const suspiciousSessions = sessions.filter(s =>
    !s.isCurrent &&
    (!s.geoCountry || (s.lastUsedAt && Date.now() - new Date(s.lastUsedAt).getTime() > 5 * 24 * 60 * 60 * 1000))
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Session Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage your active sessions across devices
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefreshSessions} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="destructive" onClick={handleLogoutAllSessions} disabled={isLoading || sessions.length <= 1}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout All Others
          </Button>
        </div>
      </div>

      {/* Security Notices */}
      {suspiciousSessions.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>Security Notice:</strong> {suspiciousSessions.length} potentially suspicious session(s).
          </AlertDescription>
        </Alert>
      )}

      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <strong>Security Tip:</strong> Regularly review your active sessions and log out of devices you no longer use.
        </AlertDescription>
      </Alert>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No sessions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device / Browser</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow
                    key={session.id}
                    className={session.isCurrent ? 'bg-green-50 dark:bg-green-950' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {getDeviceIcon(session.device)}
                        <span className="font-medium">{session.device || 'Unknown Device'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>
                          {session.geoCity || '—'}, {session.geoCountry || '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{session.ipAddress || '—'}</TableCell>
                    <TableCell>
                      {session.lastUsedAt
                        ? new Date(session.lastUsedAt).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(session.isCurrent, session.lastUsedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSession(session)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-[400px] sm:w-[540px]">
                            <SheetHeader>
                              <SheetTitle>Session Details</SheetTitle>
                              <SheetDescription>
                                Detailed information about this session
                              </SheetDescription>
                            </SheetHeader>
                            {selectedSession && (
                              <div className="space-y-6 mt-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-500">Device</h4>
                                    <p className="mt-1">{selectedSession.device}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-500">Status</h4>
                                    <div className="mt-1">
                                      {getStatusBadge(selectedSession.isCurrent, selectedSession.lastUsedAt)}
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-500">IP Address</h4>
                                    <p className="mt-1 font-mono text-sm">{selectedSession.ipAddress}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-500">Location</h4>
                                    <p className="mt-1">{selectedSession.geoCity || '—'}, {selectedSession.geoCountry || '—'}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-500">Session Created</h4>
                                    <p className="mt-1 text-sm">{selectedSession.createdAt ? new Date(selectedSession.createdAt).toLocaleString() : '—'}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-500">Last Activity</h4>
                                    <p className="mt-1 text-sm">{selectedSession.lastUsedAt ? new Date(selectedSession.lastUsedAt).toLocaleString() : '—'}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm text-gray-500">User Agent</h4>
                                  <p className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                                    {selectedSession.userAgent || '—'}
                                  </p>
                                </div>
                                {!selectedSession.isCurrent && (
                                  <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => handleLogoutSession(selectedSession.id)}
                                    disabled={isLoading}
                                  >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout This Session
                                  </Button>
                                )}
                              </div>
                            )}
                          </SheetContent>
                        </Sheet>
                        {!session.isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLogoutSession(session.id)}
                            disabled={isLoading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
