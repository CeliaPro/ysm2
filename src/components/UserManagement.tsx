'use client'

import { useEffect, useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type User = {
  id: string
  name: string
  email: string
  role: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState('Test')
  const [email, setEmail] = useState('test@gmail.com')
  const [role, setRole] = useState<'EMPLOYEE' | 'MANAGER'>('EMPLOYEE')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/users', { credentials: 'include' })
      .then((res) => res.json())
      .then((jsn) => setUsers(jsn))
  }, [])

  const handleSendInvite = async () => {
    if (!email || !name) {
      toast.warning('Veuillez saisir un nom et un email.')
      return
    }

    // <-- NEW: Prevent duplicate invites -->
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      toast.error('Utilisateur existe déjà.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role }),
        credentials: 'include',
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Erreur lors de l’envoi de l’invitation')
      }

      toast.success('Invitation envoyée avec succès !')
      setEmail('')
      setRole('EMPLOYEE')

      // Optionally refetch or append the newly invited user
      const newUser: User = await response.json()
      setUsers((prev) => [...prev, newUser])
    } catch (error: any) {
      toast.error(`Erreur : ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>

      <Card>
        <CardContent className="p-4 grid gap-4 md:grid-cols-4">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value as 'EMPLOYEE' | 'MANAGER')
            }
            className="border rounded-md px-3 py-2"
          >
            <option value="EMPLOYEE">Employé</option>
            <option value="MANAGER">Manager</option>
          </select>
          <Button
            onClick={handleSendInvite}
            disabled={loading}
            style={{ cursor: 'pointer' }}
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
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4 space-y-2">
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-blue-500 uppercase">{user.role}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
