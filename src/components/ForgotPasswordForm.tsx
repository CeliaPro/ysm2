'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MailIcon } from 'lucide-react'

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Email de réinitialisation envoyé')
      } else {
        toast.error(data.error || 'Échec de l’envoi de l’email')
      }
    } catch (error) {
      toast.error('Erreur inattendue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <MailIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="Votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Envoi en cours...' : 'Envoyer un lien de réinitialisation'}
      </Button>
    </form>
  )
}

export default ForgotPasswordForm
