'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

const ResetPasswordPage = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') // move this to a variable
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast.error("Token invalide ou manquant")
      return
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }), //  FIXED
      })

      if (response.ok) {
        toast.success('Mot de passe réinitialisé avec succès')
        setTimeout(() => {
          router.push('/') //  redirect to login page (you can change path)
        }, 2500)
      } else {
        const { error } = await response.json()
        toast.error(error || 'Erreur lors de la réinitialisation')
      }
    } catch (error) {
      toast.error('Erreur réseau')
      console.error('Reset password failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 glass-card p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-center">Réinitialiser le mot de passe</h2>
      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="Entrez un nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Confirmez le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Réinitialisation...' : 'Réinitialiser'}
        </Button>
      </form>

      <div className="text-center mt-6">
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Retour à la connexion
        </Link>
      </div>
    </div>
  )
}

export default ResetPasswordPage
