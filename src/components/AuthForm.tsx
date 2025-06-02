'use client'
import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText as DocumentIcon,
  MessageSquare as MessageSquareIcon,
  Lock as LockIcon,
  User as UserIcon,
  Mail as MailIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import ResetPasswordForm from '@/components/ResetPasswordForm'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const AuthForm: React.FC = () => {
  const { login, user } = useAuth()

  const [activeTab, setActiveTab] = useState<string>('login')

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // === 2FA code ===
  const [show2fa, setShow2fa] = useState(false)
  const [twofaUserId, setTwofaUserId] = useState<string | null>(null)
  const [twofaCode, setTwofaCode] = useState('')
  // === end 2FA code ===

  // Register form state (untouched)
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Refactored login handler to support 2FA
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setShow2fa(false)
    setTwofaUserId(null)
    try {
      // Custom: Call the login API directly instead of useAuth()
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      // Handle redirect (success, no 2fa)
      if (res.redirected) {
        window.location.href = res.url
        return
      }
      const data = await res.json()
      if (data.twoFaRequired && data.userId) {
        setShow2fa(true)
        setTwofaUserId(data.userId)
        toast.info('2FA code required. Please enter your authentication code.')
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch (err: any) {
      toast.error('Erreur lors de la connexion')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // === 2FA code ===
  const handle2faSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!twofaUserId) {
      toast.error('Erreur interne: utilisateur manquant.')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: twofaUserId, code: twofaCode }),
      })
      if (res.redirected) {
        window.location.href = res.url
        return
      }
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      }
    } catch (err: any) {
      toast.error('Erreur lors de la vérification 2FA')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }
  // === end 2FA code ===

  // Register flow (untouched)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerPassword !== registerConfirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      if (response.ok) {
        toast.success('Inscription réussie ! Vérifiez votre email.');
        setActiveTab('login'); // switch to login tab
      } else {
        const { message } = await response.json();
        toast.error(message || "Échec d'inscription");
      }
    } catch (error) {
      toast.error("Erreur réseau");
      console.error("Inscription échouée :", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  return (
    <div className="w-full max-w-md mx-auto glass-card p-8 rounded-xl shadow-subtle animate-scale-in">
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <DocumentIcon className="w-8 h-8 text-white" />
            <div className="absolute -right-2 -top-2 w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
              <MessageSquareIcon className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-6">DocuMind</h2>

      {/* If show2fa is true, show 2FA form, else login/register */}
      {show2fa ? (
        <form onSubmit={handle2faSubmit} className="space-y-6">
          <Label htmlFor="twofa">Code 2FA</Label>
          <Input
            id="twofa"
            type="text"
            placeholder="Entrez votre code à 6 chiffres"
            value={twofaCode}
            onChange={e => setTwofaCode(e.target.value)}
            maxLength={6}
            pattern="\d{6}"
            inputMode="numeric"
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading || !twofaCode}>
            {isLoading ? 'Vérification...' : 'Vérifier le code'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setShow2fa(false)
              setTwofaCode('')
              setTwofaUserId(null)
            }}
          >
            Retour
          </Button>
        </form>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-center mb-6">
            <TabsTrigger value="login" className="w-full justify-center">Connexion utilisateur</TabsTrigger>
            {/* <TabsTrigger value="register">Inscription</TabsTrigger> */}
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-2">
                  <MailIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Entrez votre email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                    Mot de passe oublié?
                  </Link>
                </div>
                <div className="relative mt-2">
                  <LockIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Entrez votre mot de passe"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default AuthForm
