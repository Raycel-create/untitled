import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, SignIn } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { validateAdminCredentials, type AdminCredentials } from '@/lib/admin-auth'

interface AdminLoginProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthenticated: () => void
}

export function AdminLogin({ open, onOpenChange, onAuthenticated }: AdminLoginProps) {
  const [credentials, setCredentials] = useState<AdminCredentials>({
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 500))

    if (validateAdminCredentials(credentials)) {
      toast.success('Admin Access Granted', {
        description: 'Welcome to CEO Dashboard'
      })
      onAuthenticated()
      onOpenChange(false)
      setCredentials({ username: '', password: '' })
    } else {
      toast.error('Authentication Failed', {
        description: 'Invalid username or password'
      })
    }

    setIsLoading(false)
  }

  const handleCancel = () => {
    setCredentials({ username: '', password: '' })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock weight="fill" size={24} className="text-primary" />
            Admin Authentication
          </DialogTitle>
          <DialogDescription>
            Enter your admin credentials to access the CEO Dashboard
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                  Authenticating...
                </>
              ) : (
                <>
                  <SignIn weight="bold" />
                  Sign In
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            🔒 Secure admin access protected by authentication
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
