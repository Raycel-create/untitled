import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, SignIn, ShieldCheck, ArrowLeft, Timer } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { validateAdminCredentials, initializeAdminCredentials, type AdminCredentials, type StoredAdminCredentials, createMFACode, validateMFACode, type MFACode } from '@/lib/admin-auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

interface AdminLoginProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthenticated: () => void
}

type AuthStep = 'credentials' | 'mfa'

export function AdminLogin({ open, onOpenChange, onAuthenticated }: AdminLoginProps) {
  const [storedCredentials] = useKV<StoredAdminCredentials>(
    'admin-credentials',
    initializeAdminCredentials()
  )
  const [step, setStep] = useState<AuthStep>('credentials')
  const [credentials, setCredentials] = useState<AdminCredentials>({
    username: '',
    password: ''
  })
  const [mfaCode, setMFACode] = useState<MFACode | null>(null)
  const [userMFAInput, setUserMFAInput] = useState('')
  const [mfaAttempts, setMfaAttempts] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (step === 'mfa' && mfaCode) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((mfaCode.expiresAt - Date.now()) / 1000))
        setTimeRemaining(remaining)
        
        if (remaining === 0) {
          toast.error('MFA Code Expired', {
            description: 'Please restart the authentication process'
          })
          handleReset()
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [step, mfaCode])

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 500))

    if (validateAdminCredentials(credentials, storedCredentials || null)) {
      const newMFACode = createMFACode()
      setMFACode(newMFACode)
      setStep('mfa')
      
      toast.success('Credentials Verified', {
        description: `MFA code sent. Code: ${newMFACode.code}`
      })
      
      console.log('🔐 MFA Code:', newMFACode.code)
    } else {
      toast.error('Authentication Failed', {
        description: 'Invalid username or password'
      })
    }

    setIsLoading(false)
  }

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (userMFAInput.length !== 6) {
      toast.error('Invalid Code', {
        description: 'Please enter the complete 6-digit code'
      })
      return
    }

    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 500))

    if (!mfaCode) {
      toast.error('No MFA Code', {
        description: 'Please restart the authentication process'
      })
      handleReset()
      setIsLoading(false)
      return
    }

    const updatedMFACode = { ...mfaCode, attempts: mfaCode.attempts + 1 }
    setMFACode(updatedMFACode)
    setMfaAttempts(updatedMFACode.attempts)

    const validation = validateMFACode(userMFAInput, updatedMFACode)

    if (validation.valid) {
      toast.success('MFA Verified', {
        description: 'Welcome to CEO Dashboard'
      })
      onAuthenticated()
      onOpenChange(false)
      handleReset()
    } else {
      if (updatedMFACode.attempts >= 3) {
        toast.error('Too Many Attempts', {
          description: 'Please restart the authentication process'
        })
        handleReset()
      } else {
        toast.error('Invalid Code', {
          description: `${validation.reason}. ${3 - updatedMFACode.attempts} attempt(s) remaining`
        })
        setUserMFAInput('')
      }
    }

    setIsLoading(false)
  }

  const handleResendCode = () => {
    const newMFACode = createMFACode()
    setMFACode(newMFACode)
    setMfaAttempts(0)
    setUserMFAInput('')
    
    toast.success('New Code Sent', {
      description: `Code: ${newMFACode.code}`
    })
    
    console.log('🔐 New MFA Code:', newMFACode.code)
  }

  const handleReset = () => {
    setStep('credentials')
    setCredentials({ username: '', password: '' })
    setMFACode(null)
    setUserMFAInput('')
    setMfaAttempts(0)
    setTimeRemaining(0)
  }

  const handleCancel = () => {
    handleReset()
    onOpenChange(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'credentials' ? (
              <>
                <Lock weight="fill" size={24} className="text-primary" />
                Admin Authentication
              </>
            ) : (
              <>
                <ShieldCheck weight="fill" size={24} className="text-primary" />
                Two-Factor Authentication
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'credentials' 
              ? 'Enter your admin credentials to continue'
              : 'Enter the 6-digit verification code'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="admin-username">Username</Label>
              <Input
                id="admin-username"
                type="text"
                placeholder="Enter admin username"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                disabled={isLoading}
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter admin password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !credentials.username || !credentials.password}
                className="flex-1 gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin">⟳</div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <SignIn weight="bold" />
                    Continue
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleMFASubmit} className="space-y-4 mt-4">
            <Alert className="border-primary/50 bg-primary/5">
              <Timer className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-sm">Code expires in:</span>
                <span className="font-mono font-bold text-primary">{formatTime(timeRemaining)}</span>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="mfa-code" className="text-center block">Enter 6-digit code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={userMFAInput}
                  onChange={setUserMFAInput}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {mfaAttempts > 0 && (
                <p className="text-xs text-destructive text-center">
                  {3 - mfaAttempts} attempt(s) remaining
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('credentials')}
                disabled={isLoading}
                className="gap-2"
              >
                <ArrowLeft weight="bold" />
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResendCode}
                disabled={isLoading}
                className="flex-1"
              >
                Resend Code
              </Button>
              <Button
                type="submit"
                disabled={isLoading || userMFAInput.length !== 6}
                className="flex-1 gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin">⟳</div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck weight="bold" />
                    Verify
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            {step === 'credentials' 
              ? '🔒 Multi-factor authentication required for CEO access'
              : '🔐 Check console for MFA code in this demo'
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
