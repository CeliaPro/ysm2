'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function TwoFactorSetup() {
  const [step, setStep] = useState<'init' | 'qr' | 'verifying' | 'done'>('init')
  const [qr, setQr] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  // Start 2FA setup: request QR code
  const handleEnable2fa = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST' })
      const data = await res.json()
      if (data.qr && data.secret) {
        setQr(data.qr)
        setSecret(data.secret)
        setStep('qr')
      } else {
        toast.error('Erreur lors de la génération du QR code')
      }
    } catch (err) {
      toast.error('Erreur réseau')
    }
    setLoading(false)
  }

  // Verify the 2FA code
  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (data.success) {
        setStep('done')
        toast.success('2FA enabled! 🎉')
      } else {
        toast.error(data.error || 'Invalid code')
      }
    } catch (err) {
      toast.error('Erreur réseau')
    }
    setLoading(false)
  }

  return (
    <div className="p-6 rounded-xl shadow bg-white w-full max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Two-Factor Authentication (2FA)</h2>
      {step === 'init' && (
        <Button onClick={handleEnable2fa} disabled={loading}>
          {loading ? 'Loading...' : 'Enable 2FA'}
        </Button>
      )}

      {step === 'qr' && qr && (
        <div>
          <p className="mb-2">Scan this QR code with your Authenticator app:</p>
          <img src={qr} alt="2FA QR code" className="mx-auto my-4" style={{ width: 180, height: 180 }} />
          <form onSubmit={handleVerify2fa} className="flex flex-col gap-3">
            <Label htmlFor="2fa-code">Enter the 6-digit code</Label>
            <Input
              id="2fa-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              pattern="\d{6}"
              value={code}
              onChange={e => setCode(e.target.value)}
              autoFocus
              required
            />
            <Button type="submit" disabled={loading || code.length !== 6}>
              {loading ? 'Verifying...' : 'Verify & Activate'}
            </Button>
          </form>
        </div>
      )}

      {step === 'done' && (
        <div className="text-green-600 font-semibold">
          2FA is now enabled for your account!
        </div>
      )}
    </div>
  )
}
