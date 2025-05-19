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

  // Register form state
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    login(loginEmail, loginPassword).finally(()=> {
      setIsLoading(false)
    })
  }

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="login">Connexion</TabsTrigger>
          <TabsTrigger value="register">Inscription</TabsTrigger>
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

        <TabsContent value="register">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Entrez votre nom"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-email"
                  type="email"
                  placeholder="Entrez votre email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">Mot de passe</Label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Créez un mot de passe"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Création du compte...' : 'Créer un compte'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AuthForm
