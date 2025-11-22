import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Eye, EyeSlash, ShieldCheck, Warning, Check } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { initializeAdminCredentials, updateAdminCredentials, type StoredAdminCredentials } from '@/lib/admin-auth'

interface AdminSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminSettings({ open, onOpenChange }: AdminSettingsProps) {
  const [storedCredentials, setStoredCredentials] = useKV<StoredAdminCredentials>(
    'admin-credentials',
    initializeAdminCredentials()
  )

  const [currentPassword, setCurrentPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const currentCredentials = storedCredentials || initializeAdminCredentials()

  const resetForm = () => {
    setCurrentPassword('')
    setNewUsername('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const validateInputs = (): { valid: boolean; error?: string } => {
    if (!currentPassword) {
      return { valid: false, error: 'Current password is required' }
    }

    if (currentPassword !== currentCredentials.password) {
      return { valid: false, error: 'Current password is incorrect' }
    }

    if (!newUsername || !newPassword) {
      return { valid: false, error: 'New username and password are required' }
    }

    if (newUsername.length < 3) {
      return { valid: false, error: 'Username must be at least 3 characters' }
    }

    if (newPassword.length < 8) {
      return { valid: false, error: 'Password must be at least 8 characters' }
    }

    if (newPassword !== confirmPassword) {
      return { valid: false, error: 'Passwords do not match' }
    }

    if (newUsername === currentCredentials.username && newPassword === currentCredentials.password) {
      return { valid: false, error: 'New credentials must be different from current credentials' }
    }

    return { valid: true }
  }

  const handleUpdateCredentials = async () => {
    const validation = validateInputs()
    
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    setIsVerifying(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const updated = updateAdminCredentials(newUsername, newPassword)
      setStoredCredentials(updated)

      toast.success('Admin credentials updated successfully', {
        description: 'Please use the new credentials for future CEO Dashboard access'
      })

      resetForm()
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to update credentials')
      console.error(error)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResetToDefault = () => {
    if (!currentPassword) {
      toast.error('Enter current password to reset')
      return
    }

    if (currentPassword !== currentCredentials.password) {
      toast.error('Current password is incorrect')
      return
    }

    const defaultCredentials = initializeAdminCredentials()
    setStoredCredentials(defaultCredentials)
    
    toast.success('Credentials reset to default', {
      description: 'Username: adminadmin'
    })

    resetForm()
  }

  const isUsingDefaultCredentials = 
    currentCredentials.username === 'adminadmin' && 
    currentCredentials.password === '19780111'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck weight="fill" className="text-primary" />
            Admin Credentials Settings
          </DialogTitle>
          <DialogDescription>
            Configure CEO Dashboard login credentials with multi-factor authentication
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isUsingDefaultCredentials && (
            <Alert className="border-accent bg-accent/10">
              <Warning weight="fill" className="h-4 w-4 text-accent" />
              <AlertDescription className="text-sm">
                You are using default credentials. For security, please update to custom credentials.
              </AlertDescription>
            </Alert>
          )}

          <Card className="p-4 bg-muted/50">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Current Username</Label>
                <Badge variant="outline" className="font-mono text-xs">
                  {currentCredentials.username}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Last Updated</Label>
                <span className="text-xs text-muted-foreground">
                  {currentCredentials.updatedAt 
                    ? new Date(currentCredentials.updatedAt).toLocaleDateString()
                    : 'Never'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Security Status</Label>
                <Badge 
                  variant={isUsingDefaultCredentials ? "destructive" : "default"}
                  className="gap-1"
                >
                  {isUsingDefaultCredentials ? (
                    <>
                      <Warning weight="fill" size={12} />
                      Default
                    </>
                  ) : (
                    <>
                      <Check weight="bold" size={12} />
                      Custom
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">
                Current Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="pr-10"
                  disabled={isVerifying}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-2">
              <Label htmlFor="new-username">
                New Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-username"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username (min 3 characters)"
                disabled={isVerifying}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">
                New Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  className="pr-10"
                  disabled={isVerifying}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                Confirm New Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="pr-10"
                  disabled={isVerifying}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <Alert>
            <Lock weight="fill" className="h-4 w-4" />
            <AlertDescription className="text-sm">
              MFA will remain enabled. You'll need to verify with a 6-digit code after login.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleResetToDefault}
              disabled={isVerifying || !currentPassword || isUsingDefaultCredentials}
              className="flex-1"
            >
              Reset to Default
            </Button>
            <Button
              onClick={handleUpdateCredentials}
              disabled={isVerifying}
              className="flex-1 gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin">⟳</div>
                  Updating...
                </>
              ) : (
                <>
                  <Check weight="bold" />
                  Update Credentials
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
