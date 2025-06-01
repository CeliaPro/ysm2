'use client'

import { useEffect, useState } from 'react'
import { Plus, Loader2, Pencil, Trash2, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter as DialogFooterBase,
} from '@/components/ui/dialog'

import { User, UserRole } from '@/types/user'
import { Project, ProjectMember } from '@/types/project'

// --- MultiSelectCombobox (NO selection background highlight) ---
function MultiSelectCombobox({
  options,
  selected,
  setSelected,
  placeholder = 'Assign to projects...',
}: {
  options: { id: string; name: string }[]
  selected: string[]
  setSelected: (ids: string[]) => void
  placeholder?: string
}) {
  const [search, setSearch] = useState('')
  return (
    <div className="w-full">
      <div className="mb-1 text-xs text-muted-foreground">{placeholder}</div>
      <div className="border rounded">
        {options
          .filter((opt) =>
            opt.name.toLowerCase().includes(search.toLowerCase())
          )
          .map((opt) => (
            <div
              key={opt.id}
              className={`flex items-center px-3 py-1 cursor-pointer`}
              onClick={() =>
                selected.includes(opt.id)
                  ? setSelected(selected.filter((id) => id !== opt.id))
                  : setSelected([...selected, opt.id])
              }
            >
              <span>{opt.name}</span>
              {selected.includes(opt.id) && <X className="ml-auto w-4 h-4" />}
            </div>
          ))}
      </div>
      <div className="flex flex-wrap mt-2 gap-1">
        {options
          .filter((opt) => selected.includes(opt.id))
          .map((opt) => (
            <span
              key={opt.id}
              className="px-2 py-1 rounded bg-blue-500 text-white text-xs flex items-center gap-1"
            >
              {opt.name}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() =>
                  setSelected(selected.filter((id) => id !== opt.id))
                }
              />
            </span>
          ))}
      </div>
      <input
        type="text"
        placeholder="Rechercher…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-2 w-full border px-2 py-1 rounded text-xs"
      />
    </div>
  )
}

// --- EditUserDialog with per-project role assignments ---
function EditUserDialog({
  open,
  onOpenChange,
  user,
  projects,
  onUpdate,
  onResetPassword,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  user: User | null
  projects: Project[]
  onUpdate: (
    userId: string,
    update: {
      fullName: string
      role: UserRole
      projectAssignments: { projectId: string; role: string }[]
    }
  ) => void
  onResetPassword: (userId: string) => void
}) {
  const [fullName, setFullName] = useState(user?.name ?? '')
  const [role, setRole] = useState<UserRole>(user?.role ?? 'employee')
  const [projectAssignments, setProjectAssignments] = useState<
    { projectId: string; role: string }[]
  >(
    user?.projectMembers?.map((pm) => ({
      projectId: pm.projectId,
      role: pm.role?.toUpperCase() ?? 'VIEWER',
    })) ?? []
  )

  useEffect(() => {
    if (user) {
      setFullName(user.name ?? '')
      setRole(user.role)
      setProjectAssignments(
        user.projectMembers?.map((pm) => ({
          projectId: pm.projectId,
          role: pm.role?.toUpperCase() ?? 'VIEWER',
        })) ?? []
      )
    }
  }, [user, open])

  const projectRoleOptions = [
    { value: 'OWNER', label: 'Owner' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'EDITOR', label: 'Editor' },
    { value: 'VIEWER', label: 'Viewer' },
  ]

  const handleProjectRoleChange = (projectId: string, newRole: string) => {
    setProjectAssignments((prev) =>
      prev.map((pa) =>
        pa.projectId === projectId ? { ...pa, role: newRole } : pa
      )
    )
  }

  const handleToggleProject = (projectId: string) => {
    if (projectAssignments.some((pa) => pa.projectId === projectId)) {
      setProjectAssignments((prev) =>
        prev.filter((pa) => pa.projectId !== projectId)
      )
    } else {
      setProjectAssignments((prev) => [...prev, { projectId, role: 'VIEWER' }])
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input
            placeholder="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="border rounded-md px-3 py-2 w-full"
          >
            <option value="employee">Employé</option>
            <option value="project_manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <div>
            <label className="block font-semibold mb-1">
              Affecter à des projets et rôles :
            </label>
            {projects.map((p) => {
              const pa = projectAssignments.find((a) => a.projectId === p.id)
              return (
                <div key={p.id} className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    checked={!!pa}
                    onChange={() => handleToggleProject(p.id)}
                  />
                  <span>{p.name}</span>
                  {pa && (
                    <select
                      value={pa.role}
                      onChange={(e) =>
                        handleProjectRoleChange(p.id, e.target.value)
                      }
                      className="border rounded-md px-2 py-1"
                    >
                      {projectRoleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <DialogFooterBase>
          <Button
            onClick={() => {
              onUpdate(user.id, { fullName, role, projectAssignments })
              onOpenChange(false)
            }}
          >
            Enregistrer
          </Button>
          <Button
            variant="outline"
            onClick={() => onResetPassword(user.id)}
            className="ml-2"
          >
            <RefreshCw className="w-4 h-4" />
            Envoyer un reset mot de passe
          </Button>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="ml-2"
          >
            Annuler
          </Button>
        </DialogFooterBase>
      </DialogContent>
    </Dialog>
  )
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('employee')
  const [loading, setLoading] = useState(false)

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])

  const [editUser, setEditUser] = useState<User | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    fetch('/api/users', { credentials: 'include' })
      .then((res) => res.json())
      .then((jsn: User[]) => setUsers(jsn))
  }, [])

  useEffect(() => {
    fetch('/api/projects', { credentials: 'include' })
      .then((res) => res.json())
      .then((data: Project[]) => setProjects(data))
  }, [])

  const handleSendInvite = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.warning('Veuillez saisir un nom et un email.')
      return
    }

    const normalizedEmail = email.trim().toLowerCase()
    const exists = users.some(
      (u) => u.email.trim().toLowerCase() === normalizedEmail
    )
    if (exists) {
      toast.error('Utilisateur existe déjà.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: fullName.trim(),
          email: normalizedEmail,
          role,
          type: 'INVITE',
          projectIds: selectedProjects,
        }),
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error ?? 'Erreur lors de l’envoi de l’invitation')
      }

      const newUser: User = await response.json()
      setUsers((prev) => [...prev, newUser])

      toast.success('Invitation envoyée avec succès !')
      setFullName('')
      setEmail('')
      setRole('employee')
      setSelectedProjects([])
    } catch (err: any) {
      toast.error(`Erreur : ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // --- Update user info including per-project assignments ---
  const handleUpdateUser = async (
    userId: string,
    update: {
      fullName: string
      role: UserRole
      projectAssignments: { projectId: string; role: string }[]
    }
  ) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(update),
      })
      if (!res.ok) throw new Error('Failed to update user')
      const updated = await res.json()
      setUsers((users) =>
        users.map((u) => (u.id === userId ? { ...u, ...updated } : u))
      )
      toast.success('Utilisateur mis à jour !')
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour')
    }
  }

const handleResetPassword = async (userId: string) => {
  const user = users.find((u) => u.id === userId)
  if (!user) {
    toast.error('Utilisateur introuvable.')
    return
  }
  try {
    const response = await fetch('/api/auth/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        name: user.name,
        role: user.role,
        type: 'RESET', // Tell the backend this is a reset password request
      }),
    })

    if (response.ok) {
      toast.success('Reset password email sent!')
    } else {
      const { error } = await response.json()
      toast.error(error || 'Could not send reset password email.')
    }
  } catch (error) {
    toast.error('Network error.')
  }
}


  const handleEditUser = (user: User) => {
    setEditUser(user)
    setEditOpen(true)
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete user')
      setUsers(users.filter((u) => u.id !== user.id))
      toast.success('User deleted successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Error deleting user')
    }
  }

  const roleLabel = (role: UserRole) => {
    if (role === 'admin') return 'Admin'
    if (role === 'project_manager') return 'Project Manager'
    return 'Employee'
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>

      <Card>
        <CardContent className="p-4 grid gap-4 md:grid-cols-4">
          <Input
            placeholder="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="border rounded-md px-3 py-2"
          >
            <option value="employee">Employé</option>
            <option value="project_manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <Button
            onClick={handleSendInvite}
            disabled={loading}
            className="flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Envoyer une invitation
              </>
            )}
          </Button>
          <div className="col-span-4">
            <MultiSelectCombobox
              options={projects}
              selected={selectedProjects}
              setSelected={setSelectedProjects}
              placeholder="Affecter à des projets…"
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={editUser}
        projects={projects}
        onUpdate={handleUpdateUser}
        onResetPassword={handleResetPassword}
      />

      {/* Users grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <Card key={u.id} className="relative">
            {u.status && (
              <span
                className={`
                  absolute top-3 right-3 px-2 py-1 rounded text-xs font-semibold capitalize
                    ${
                      u.status === 'active'
                        ? 'bg-green-100 text-green-700 border-green-400'
                        : u.status === 'invited'
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-400'
                          : 'bg-gray-200 text-gray-500 border-gray-400'
                    }
                `}
              >
                {u.status}
              </span>
            )}
            <CardContent className="p-4 space-y-2">
              <h3 className="text-xl font-bold mb-1">{u.name}</h3>
              <p className="text-sm text-muted-foreground">{u.email}</p>
              <p className="text-xs text-blue-500 uppercase">
                {roleLabel(u.role)}
              </p>
              <p className="text-xs text-gray-500">
                Created:{' '}
                {u.createdAt
                  ? format(new Date(u.createdAt), 'dd MMM yyyy, HH:mm')
                  : 'Unknown'}
              </p>
              <p className="text-xs text-gray-500">
                Last login:{' '}
                {u.lastLogin
                  ? format(new Date(u.lastLogin), 'dd MMM yyyy, HH:mm')
                  : 'Never'}
              </p>
              {u.projectMembers && u.projectMembers.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-bold">Projets assignés :</p>
                  <ul className="text-xs ml-2">
                    {u.projectMembers.map((pm) => (
                      <li key={pm.projectId}>
                        {projects.find((p) => p.id === pm.projectId)?.name ||
                          pm.projectId}
                        {' — '}
                        <span className="font-semibold">
                          {pm.role.toUpperCase()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="mr-2"
                onClick={() => handleEditUser(u)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Modify
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteUser(u)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
