import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Crown, 
  Users, 
  Sparkle, 
  CurrencyDollar, 
  TrendUp, 
  ChartLine,
  SignOut,
  VideoCamera,
  Image as ImageIcon,
  Calendar,
  Lightning,
  ArrowUp,
  ArrowDown
} from '@phosphor-icons/react'
import { SubscriptionStatus, initializeSubscription } from '@/lib/subscription'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

interface CEODashboardProps {
  onSignOut: () => void
}

interface MediaItem {
  id: string
  type: 'image' | 'video'
  prompt: string
  url: string
  createdAt: number
}

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  totalGenerations: number
  proSubscribers: number
  revenue: number
  avgGenerationsPerUser: number
  conversionRate: number
  growthRate: number
  revenueGrowth: number
}

interface TimeSeriesData {
  date: string
  users: number
  generations: number
  revenue: number
}

export function CEODashboard({ onSignOut }: CEODashboardProps) {
  const [gallery] = useKV<MediaItem[]>('ai-creator-gallery', [])
  const [subscriptionStatus] = useKV<SubscriptionStatus>('subscription-status', initializeSubscription())
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalGenerations: 0,
    proSubscribers: 0,
    revenue: 0,
    avgGenerationsPerUser: 0,
    conversionRate: 0,
    growthRate: 0,
    revenueGrowth: 0
  })
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)

  const generateTimeSeriesData = () => {
    const days = 30
    const data: TimeSeriesData[] = []
    const today = new Date()
    const generationsPerDay = gallery?.length || 0
    const dailyAvg = generationsPerDay / days

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayGens = Math.floor(dailyAvg * (1 + Math.random() * 0.3 - 0.15))
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        users: Math.max(1, Math.floor((days - i) / 10 + Math.random() * 2)),
        generations: Math.max(0, dayGens),
        revenue: Math.max(0, (days - i) / days * (subscriptionStatus?.tier === 'pro' ? 29.99 : 0))
      })
    }

    return data
  }

  useEffect(() => {
    const updateAnalytics = () => {
      const totalGenerations = gallery?.length || 0
      const isPro = subscriptionStatus?.tier === 'pro'
      const proCount = isPro ? 1 : 0
      const totalUsers = 1
      const revenue = proCount * 29.99
      const prevRevenue = 0
      const prevUsers = Math.max(1, totalUsers - 1)

      setAnalytics({
        totalUsers,
        activeUsers: totalUsers,
        totalGenerations,
        proSubscribers: proCount,
        revenue,
        avgGenerationsPerUser: totalGenerations / totalUsers,
        conversionRate: (proCount / totalUsers) * 100,
        growthRate: ((totalUsers - prevUsers) / prevUsers) * 100,
        revenueGrowth: prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0
      })

      setTimeSeriesData(generateTimeSeriesData())
    }

    updateAnalytics()

    if (autoRefresh) {
      const interval = setInterval(updateAnalytics, 5000)
      return () => clearInterval(interval)
    }
  }, [gallery, subscriptionStatus, autoRefresh])

  const recentActivity = (gallery?.slice(-5).reverse() || []).map(item => ({
    ...item,
    user: 'Current User',
    date: new Date(item.createdAt).toLocaleString()
  }))

  const contentTypeData = [
    { name: 'Images', value: (gallery?.filter(i => i.type === 'image') || []).length, color: 'oklch(0.65 0.25 290)' },
    { name: 'Videos', value: (gallery?.filter(i => i.type === 'video') || []).length, color: 'oklch(0.70 0.25 350)' }
  ]

  const COLORS = ['oklch(0.65 0.25 290)', 'oklch(0.70 0.25 350)', 'oklch(0.75 0.15 210)']

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent p-3 rounded-xl">
                <Crown weight="fill" size={32} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">CEO Dashboard</h1>
                <p className="text-muted-foreground">Executive Overview & Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="gap-2"
                size="sm"
              >
                <Lightning weight={autoRefresh ? "fill" : "regular"} size={16} />
                {autoRefresh ? 'Live' : 'Paused'}
              </Button>
              <Button
                variant="outline"
                onClick={onSignOut}
                className="gap-2"
              >
                <SignOut weight="bold" size={20} />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users weight="fill" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs text-muted-foreground">
                  {analytics.activeUsers} active
                </p>
                {analytics.growthRate > 0 && (
                  <Badge variant="outline" className="text-xs gap-1 bg-primary/10">
                    <ArrowUp size={10} weight="bold" />
                    {analytics.growthRate.toFixed(0)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pro Subscribers</CardTitle>
              <Crown weight="fill" className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.proSubscribers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.conversionRate.toFixed(1)}% conversion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
              <Sparkle weight="fill" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalGenerations}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.avgGenerationsPerUser.toFixed(1)} avg per user
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <CurrencyDollar weight="fill" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.revenue.toFixed(2)}</div>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs text-muted-foreground">
                  Monthly recurring
                </p>
                {analytics.revenueGrowth > 0 && (
                  <Badge variant="outline" className="text-xs gap-1 bg-accent/10">
                    <ArrowUp size={10} weight="bold" />
                    {analytics.revenueGrowth.toFixed(0)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <ChartLine weight="bold" size={16} />
              Overview
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Lightning weight="fill" size={16} />
              Recent Activity
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users weight="bold" size={16} />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartLine weight="bold" />
                    User & Generation Growth
                  </CardTitle>
                  <CardDescription>30-day trend analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timeSeriesData}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.65 0.25 290)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="oklch(0.65 0.25 290)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorGenerations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.70 0.25 350)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="oklch(0.70 0.25 350)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.35 0.02 250)" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="oklch(0.60 0.02 250)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="oklch(0.60 0.02 250)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'oklch(0.25 0.02 250)',
                          border: '1px solid oklch(0.35 0.02 250)',
                          borderRadius: '8px',
                          color: 'oklch(0.98 0 0)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="users" 
                        stroke="oklch(0.65 0.25 290)" 
                        fillOpacity={1}
                        fill="url(#colorUsers)"
                        name="Users"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="generations" 
                        stroke="oklch(0.70 0.25 350)" 
                        fillOpacity={1}
                        fill="url(#colorGenerations)"
                        name="Generations"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CurrencyDollar weight="bold" />
                    Revenue Trend
                  </CardTitle>
                  <CardDescription>Monthly revenue projection</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.35 0.02 250)" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="oklch(0.60 0.02 250)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="oklch(0.60 0.02 250)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'oklch(0.25 0.02 250)',
                          border: '1px solid oklch(0.35 0.02 250)',
                          borderRadius: '8px',
                          color: 'oklch(0.98 0 0)'
                        }}
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="oklch(0.75 0.15 210)" 
                        strokeWidth={3}
                        dot={{ fill: 'oklch(0.75 0.15 210)', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkle weight="fill" />
                    Content Distribution
                  </CardTitle>
                  <CardDescription>Generated content breakdown</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={contentTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="oklch(0.65 0.25 290)"
                        dataKey="value"
                      >
                        {contentTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'oklch(0.25 0.02 250)',
                          border: '1px solid oklch(0.35 0.02 250)',
                          borderRadius: '8px',
                          color: 'oklch(0.98 0 0)'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendUp weight="bold" />
                    Daily Activity
                  </CardTitle>
                  <CardDescription>Generations per day (last 7 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={timeSeriesData.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.35 0.02 250)" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="oklch(0.60 0.02 250)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="oklch(0.60 0.02 250)"
                        fontSize={12}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'oklch(0.25 0.02 250)',
                          border: '1px solid oklch(0.35 0.02 250)',
                          borderRadius: '8px',
                          color: 'oklch(0.98 0 0)'
                        }}
                      />
                      <Bar 
                        dataKey="generations" 
                        fill="oklch(0.65 0.25 290)"
                        radius={[8, 8, 0, 0]}
                        name="Generations"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendUp weight="bold" />
                  Growth Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">User Growth</span>
                    <span className="text-sm font-medium">+{analytics.totalUsers}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '100%' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Pro Conversion</span>
                    <span className="text-sm font-medium">{analytics.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${analytics.conversionRate}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Platform Engagement</span>
                    <span className="text-sm font-medium">{analytics.totalGenerations} generations</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-secondary" style={{ width: `${Math.min((analytics.totalGenerations / 100) * 100, 100)}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No activity yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex-shrink-0">
                          {activity.type === 'image' ? (
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <ImageIcon weight="fill" size={20} className="text-primary" />
                            </div>
                          ) : (
                            <div className="p-2 bg-accent/10 rounded-lg">
                              <VideoCamera weight="fill" size={20} className="text-accent" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{activity.user}</span>
                            <Badge variant="outline" className="text-xs">
                              {activity.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {activity.prompt}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Calendar size={12} />
                            {activity.date}
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                          {activity.type === 'image' ? (
                            <img src={activity.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <video src={activity.url} className="w-full h-full object-cover" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users weight="fill" size={20} className="text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Current User</div>
                        <div className="text-xs text-muted-foreground">
                          {subscriptionStatus?.generationsUsed || 0} generations used
                        </div>
                      </div>
                    </div>
                    <Badge className={subscriptionStatus?.tier === 'pro' ? 'bg-gradient-to-r from-primary to-accent' : ''}>
                      {subscriptionStatus?.tier === 'pro' ? (
                        <>
                          <Crown weight="fill" size={12} className="mr-1" />
                          Pro
                        </>
                      ) : (
                        'Free'
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
