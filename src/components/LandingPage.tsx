import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkle, Lightning, Crown, Check, Image as ImageIcon, VideoCamera, Shield } from '@phosphor-icons/react'
import { toast, Toaster } from 'sonner'
import { validateEmail, validatePassword, createUser } from '@/lib/auth'
import type { User } from '@/lib/auth'

interface LandingPageProps {
  onAuthenticate: (user: User) => void
}

export function LandingPage({ onAuthenticate }: LandingPageProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (authMode === 'signup') {
      if (!name.trim()) {
        toast.error('Please enter your name')
        return
      }

      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        toast.error(passwordValidation.message)
        return
      }
    }

    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1500))

    const user = createUser(email, password, name || email.split('@')[0])
    
    toast.success(authMode === 'signin' ? 'Welcome back!' : 'Account created successfully!')
    onAuthenticate(user)
    
    setIsLoading(false)
  }

  const handleDemoSignIn = () => {
    const demoUser = createUser(
      'demo@example.com',
      'Demo123!',
      'Demo User'
    )
    toast.success('Signed in as Demo User')
    onAuthenticate(demoUser)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-right" richColors />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20 -z-10" />
      
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center mb-16">
          <div className="flex items-center gap-3 mb-4">
            <Sparkle weight="fill" size={48} className="text-primary" />
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI Creator Studio
            </h1>
          </div>
          <p className="text-xl text-muted-foreground text-center max-w-2xl">
            Generate stunning images and videos with AI. Professional creative tools powered by cutting-edge technology.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto items-start">
          <div className="space-y-8">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Sign in to your account or create a new one</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'signin' | 'signup')}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <div className="animate-spin">⟳</div>
                            Signing in...
                          </>
                        ) : (
                          <>
                            <Shield weight="fill" />
                            Sign In
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Must be 8+ characters with uppercase, lowercase, and number
                        </p>
                      </div>
                      <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <div className="animate-spin">⟳</div>
                            Creating account...
                          </>
                        ) : (
                          <>
                            <Sparkle weight="fill" />
                            Create Account
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or try demo</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleDemoSignIn}
                  className="w-full gap-2"
                >
                  <Sparkle weight="fill" size={16} />
                  Try Demo
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Lightning weight="fill" className="text-primary" size={24} />
                  <CardTitle>Powerful Features</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Check weight="bold" className="text-primary mt-1 shrink-0" size={20} />
                  <div>
                    <p className="font-medium">AI Image Generation</p>
                    <p className="text-sm text-muted-foreground">Create stunning images from text descriptions</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Check weight="bold" className="text-primary mt-1 shrink-0" size={20} />
                  <div>
                    <p className="font-medium">Video Creation</p>
                    <p className="text-sm text-muted-foreground">Generate dynamic video content with AI</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Check weight="bold" className="text-primary mt-1 shrink-0" size={20} />
                  <div>
                    <p className="font-medium">Photo Editor</p>
                    <p className="text-sm text-muted-foreground">Professional editing tools built-in</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Check weight="bold" className="text-primary mt-1 shrink-0" size={20} />
                  <div>
                    <p className="font-medium">24/7 AI Assistant</p>
                    <p className="text-sm text-muted-foreground">Get help crafting perfect prompts</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Check weight="bold" className="text-primary mt-1 shrink-0" size={20} />
                  <div>
                    <p className="font-medium">Style Presets</p>
                    <p className="text-sm text-muted-foreground">Quick-apply artistic styles</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown weight="fill" className="text-accent" size={24} />
                  <CardTitle>Pro Features</CardTitle>
                </div>
                <CardDescription>Unlock unlimited creative potential</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <Check weight="bold" className="text-accent mt-1 shrink-0" size={20} />
                  <div>
                    <p className="font-medium">Unlimited Generations</p>
                    <p className="text-sm text-muted-foreground">Create as many images and videos as you need</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Check weight="bold" className="text-accent mt-1 shrink-0" size={20} />
                  <div>
                    <p className="font-medium">Video Generation</p>
                    <p className="text-sm text-muted-foreground">Access advanced video creation features</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Check weight="bold" className="text-accent mt-1 shrink-0" size={20} />
                  <div>
                    <p className="font-medium">Priority Support</p>
                    <p className="text-sm text-muted-foreground">Get help faster with priority assistance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
