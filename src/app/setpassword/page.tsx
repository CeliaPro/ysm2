'use client'

import React, { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock as LockIcon, CheckCircle as CheckCircleIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Validation schema
const formSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password is too long')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof formSchema>

const SetPassword: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [isLoading, setIsLoading] = useState(false)
  const { redeemInviteToken } = useAuth()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error('Invalid or missing invitation token')
      return
    }
    setIsLoading(true)

    redeemInviteToken(token, data.password)
      .then(() => {
        router.push('/')
      })
      .catch(() => {
        setIsLoading(false)
      })
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/50">
        <div className="w-full max-w-md p-8 space-y-6 bg-card shadow-lg rounded-xl">
          <div className="text-center">
            <LockIcon className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-2xl font-bold">Invalid Invitation</h2>
            <p className="mt-2 text-muted-foreground">
              This password reset link is invalid or has expired.
            </p>
          </div>
          <Button className="w-full" onClick={() => router.push('/')}>
            Return to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="w-full max-w-md p-8 space-y-6 bg-card shadow-lg rounded-xl">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <LockIcon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-4 text-2xl font-bold">Set Your Password</h2>
          <p className="mt-2 text-muted-foreground">
            Create a secure password to complete your account setup
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 text-sm">
              <p className="flex items-center text-muted-foreground">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-primary" /> At
                least 8 characters
              </p>
              <p className="flex items-center text-muted-foreground">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-primary" /> One
                uppercase letter
              </p>
              <p className="flex items-center text-muted-foreground">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-primary" /> One
                lowercase letter
              </p>
              <p className="flex items-center text-muted-foreground">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-primary" /> One
                number
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Setting Password...' : 'Set Password'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default SetPassword
