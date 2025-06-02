'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  Search, RefreshCw, Download, LogIn, LogOut, Shield, Upload, Edit3, Trash2, Key, UserPlus, UserX,
  Activity, User, TrendingUp, Globe, Monitor, Clock, Calendar, CheckCircle, AlertTriangle, Info, Database
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/aiUi/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import Navbar from '@/components/Navbar'


interface ActivityLog {
  id: string;
  userId?: string;
  user?: {
    id: string;
    name?: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  };
  action: string;
  status: 'SUCCESS' | 'FAILURE';
  description?: string;
  ipAddress?: string;
  device?: string;
  userAgent?: string;
  createdAt: string;
}

interface ApiResponse {
  logs: ActivityLog[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

 const AdminLogs = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
   useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/') // Or push to a 403 page
    }
  }, [isLoading, user, router])

  if (isLoading || !user || user.role !== 'ADMIN') {
    return null // Or show a spinner or a "forbidden" message
  }
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLogsLoading, setIsLoading] = useState(false);

  const itemsPerPage = 10;

  // Fetch logs from the API
  useEffect(() => {
    setIsLoading(true);

    // Build query params
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('pageSize', itemsPerPage.toString());
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (actionFilter !== 'all') params.set('action', actionFilter);
    if (roleFilter !== 'all') params.set('role', roleFilter);
    if (searchTerm) params.set('search', searchTerm);

    fetch(`/api/admin/activity-logs?${params.toString()}`)
      .then(res => res.json())
      .then((data: ApiResponse) => {
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
      })
      .finally(() => setIsLoading(false));
  }, [searchTerm, statusFilter, actionFilter, roleFilter, currentPage]);

  // Helper functions remain as in your original code (getActionIcon, getStatusIcon, getRoleBadge, etc.)
  // ...[keep all your helper functions as is]...

  const getActionIcon = (action: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'LOGIN': LogIn,
      'LOGOUT': LogOut,
      'FAILED_LOGIN': Shield,
      'UPLOAD': Upload,
      'DOWNLOAD': Download,
      'EDIT': Edit3,
      'DELETE': Trash2,
      'PASSWORD_CHANGE': Key,
      'USER_INVITE': UserPlus,
      'USER_DISABLE': UserX
    };
    const IconComponent = iconMap[action] || Activity;
    return <IconComponent className="w-4 h-4" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILURE':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      SUCCESS: 'default',
      FAILURE: 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      ADMIN: 'destructive',
      MANAGER: 'default',
      EMPLOYEE: 'secondary'
    };
    return <Badge variant={variants[role] || 'outline'}>{role}</Badge>;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <Navbar />
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">System Monitoring</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Advanced admin panel for user activities and system logs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Live Refresh
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-1">
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Activity Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                System Activity Logs
              </CardTitle>
              <CardDescription>Monitoring of all user actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by user, action, IP, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="FAILURE">Failure</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="UPLOAD">Upload</SelectItem>
                    <SelectItem value="DOWNLOAD">Download</SelectItem>
                    <SelectItem value="FAILED_LOGIN">Failed Login</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Logs Table */}
              <div className="rounded-md border bg-white dark:bg-gray-800 min-h-[340px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-700">
                      <TableHead className="w-[100px]">Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <TableCell className="font-mono text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {formatTimeAgo(log.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                  {log.user?.name?.[0] || '?'}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{log.user?.name || 'Unknown'}</p>
                                  <p className="text-xs text-gray-500">{log.user?.email || 'N/A'}</p>
                                </div>
                              </div>
                              {log.user?.role && (
                                <div className="mt-1">
                                  {getRoleBadge(log.user.role)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <span className="font-medium">{log.action.replace('_', ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(log.status)}
                              {getStatusBadge(log.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-gray-400" />
                              <span className="font-mono text-sm">{log.ipAddress}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Monitor className="w-3 h-3 text-gray-400" />
                              <span className="text-sm">{log.device}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="text-sm truncate" title={log.description}>
                              {log.description}
                            </p>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      />
                    </PaginationItem>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    {totalPages > 5 && <PaginationEllipsis />}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLogs;
