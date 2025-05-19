'use client'
import AuthForm from '@/components/AuthForm'
import { useAuth } from '@/contexts/AuthContext'


export default function Home() {
  const { isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
        <div className="loader"></div>
      </div>
    )
  }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center justify-center w-72 h-28 mb-3">
            <img
              src="/lovable-uploads/2dd5ee76-c8a8-4cc5-b8a7-19152b99d669.png"
              alt="YSM_CegeleC Logo"
              className="w-full h-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold">YSM_CegeleC</h1>
          <p className="text-sm text-muted-foreground">
            Gestion de Documents + Assistant IA
          </p>
        </div>

        <AuthForm />

        <div className="mt-10 text-center text-sm text-muted-foreground">
          {/* <p className="mb-2">
            YSM_CegeleC - Gestion de Documents + Assistant IA
          </p> */}
          <p>
            © {new Date().getFullYear()} YSM_CegeleC. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  )
}
