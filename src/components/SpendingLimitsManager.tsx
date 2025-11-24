import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  ChartBar,
  Bell,
  Warning,
  Trash,
  Plus,
  CheckCircle,
  Clock,
  TrendUp,
  CurrencyDollar,
  ShieldCheck,
  Receipt,
  ArrowRight,
  EnvelopeSimple
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  SpendingLimitsConfig,
  SpendingLimit,
  SpendingAlert,
  LimitPeriod,
  AlertFrequency,
  AlertChannel,
  initializeSpendingLimits,
  createSpendingLimit,
  createSpendingAlert,
  checkAndResetLimits,
  getSpendingPercentage,
  isLimitExceeded,
  isApproachingLimit,
  formatPeriod,
  getPeriodDaysRemaining,
  generateMockSpendingHistory
} from '@/lib/spending-limits'
import { EmailSettings } from '@/components/EmailSettings'

interface SpendingLimitsManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SpendingLimitsManager({ open, onOpenChange }: SpendingLimitsManagerProps) {
  const [config, setConfig] = useKV<SpendingLimitsConfig>('spending-limits-config', {
    ...initializeSpendingLimits(),
    history: generateMockSpendingHistory(),
    totalSpendThisMonth: 43.99,
    totalSpendThisYear: 143.99
  })
  
  const [activeTab, setActiveTab] = useState('limits')
  const [isAddingLimit, setIsAddingLimit] = useState(false)
  const [isAddingAlert, setIsAddingAlert] = useState(false)
  const [selectedLimitId, setSelectedLimitId] = useState<string | null>(null)
  const [emailSettingsOpen, setEmailSettingsOpen] = useState(false)
  
  const [newLimitAmount, setNewLimitAmount] = useState('')
  const [newLimitPeriod, setNewLimitPeriod] = useState<LimitPeriod>('monthly')
  const [newLimitBlock, setNewLimitBlock] = useState(true)
  
  const [newAlertName, setNewAlertName] = useState('')
  const [newAlertThreshold, setNewAlertThreshold] = useState('')
  const [newAlertPercentage, setNewAlertPercentage] = useState('')
  const [newAlertFrequency, setNewAlertFrequency] = useState<AlertFrequency>('once')
  const [newAlertChannels, setNewAlertChannels] = useState<AlertChannel[]>(['email'])

  const currentConfig = config ?? initializeSpendingLimits()

  const handleAddLimit = () => {
    const amount = parseFloat(newLimitAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    const newLimit = createSpendingLimit(amount, newLimitPeriod, newLimitBlock)
    
    const alert80 = createSpendingAlert(
      '80% Budget Alert',
      amount * 0.8,
      80
    )
    alert80.frequency = 'once'
    alert80.channels = ['email']
    
    const limitWith80Alert = {
      ...newLimit,
      alerts: [alert80]
    }
    
    setConfig(current => ({
      ...(current ?? initializeSpendingLimits()),
      limits: [...(current?.limits ?? []), limitWith80Alert]
    }))
    
    setNewLimitAmount('')
    setNewLimitPeriod('monthly')
    setNewLimitBlock(true)
    setIsAddingLimit(false)
    
    toast.success('Spending limit added', {
      description: `${formatPeriod(newLimitPeriod)} limit with 80% email alert created`
    })
  }

  const handleDeleteLimit = (limitId: string) => {
    setConfig(current => ({
      ...(current ?? initializeSpendingLimits()),
      limits: (current?.limits ?? []).filter(l => l.id !== limitId)
    }))
    
    toast.success('Spending limit deleted')
  }

  const handleToggleLimit = (limitId: string) => {
    setConfig(current => ({
      ...(current ?? initializeSpendingLimits()),
      limits: (current?.limits ?? []).map(limit =>
        limit.id === limitId ? { ...limit, enabled: !limit.enabled } : limit
      )
    }))
  }

  const handleAddAlert = () => {
    const threshold = parseFloat(newAlertThreshold)
    const percentage = newAlertPercentage ? parseFloat(newAlertPercentage) : undefined
    
    if ((isNaN(threshold) || threshold <= 0) && (percentage === undefined || isNaN(percentage))) {
      toast.error('Please enter a valid threshold or percentage')
      return
    }

    if (!newAlertName.trim()) {
      toast.error('Please enter an alert name')
      return
    }

    const newAlert: SpendingAlert = {
      ...createSpendingAlert(newAlertName, threshold, percentage),
      frequency: newAlertFrequency,
      channels: newAlertChannels
    }

    if (selectedLimitId) {
      setConfig(current => ({
        ...(current ?? initializeSpendingLimits()),
        limits: (current?.limits ?? []).map(limit =>
          limit.id === selectedLimitId
            ? { ...limit, alerts: [...limit.alerts, newAlert] }
            : limit
        )
      }))
    } else {
      setConfig(current => ({
        ...(current ?? initializeSpendingLimits()),
        globalAlerts: [...(current?.globalAlerts ?? []), newAlert]
      }))
    }
    
    setNewAlertName('')
    setNewAlertThreshold('')
    setNewAlertPercentage('')
    setNewAlertFrequency('once')
    setNewAlertChannels(['email'])
    setIsAddingAlert(false)
    setSelectedLimitId(null)
    
    toast.success('Alert created', {
      description: 'You will be notified when this threshold is reached'
    })
  }

  const handleDeleteAlert = (alertId: string, limitId?: string) => {
    if (limitId) {
      setConfig(current => ({
        ...(current ?? initializeSpendingLimits()),
        limits: (current?.limits ?? []).map(limit =>
          limit.id === limitId
            ? { ...limit, alerts: limit.alerts.filter(a => a.id !== alertId) }
            : limit
        )
      }))
    } else {
      setConfig(current => ({
        ...(current ?? initializeSpendingLimits()),
        globalAlerts: (current?.globalAlerts ?? []).filter(a => a.id !== alertId)
      }))
    }
    
    toast.success('Alert deleted')
  }

  const handleToggleAlert = (alertId: string, limitId?: string) => {
    if (limitId) {
      setConfig(current => ({
        ...(current ?? initializeSpendingLimits()),
        limits: (current?.limits ?? []).map(limit =>
          limit.id === limitId
            ? {
                ...limit,
                alerts: limit.alerts.map(alert =>
                  alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert
                )
              }
            : limit
        )
      }))
    } else {
      setConfig(current => ({
        ...(current ?? initializeSpendingLimits()),
        globalAlerts: (current?.globalAlerts ?? []).map(alert =>
          alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert
        )
      }))
    }
  }

  const handleToggleChannel = (channel: AlertChannel) => {
    setNewAlertChannels(current => {
      if (current.includes(channel)) {
        const updated = current.filter(c => c !== channel)
        return updated.length > 0 ? updated : current
      }
      return [...current, channel]
    })
  }

  useEffect(() => {
    const updatedLimits = checkAndResetLimits(currentConfig.limits)
    const needsUpdate = updatedLimits.some((limit, index) => {
      const originalLimit = currentConfig.limits[index]
      return originalLimit && (
        limit.currentSpend !== originalLimit.currentSpend ||
        limit.startDate !== originalLimit.startDate ||
        limit.resetDate !== originalLimit.resetDate
      )
    })
    
    if (needsUpdate) {
      setConfig(current => ({
        ...(current ?? initializeSpendingLimits()),
        limits: updatedLimits
      }))
    }
  }, [currentConfig.limits, setConfig])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <ShieldCheck weight="fill" size={28} />
                Spending Limits & Alerts
              </DialogTitle>
              <DialogDescription>
                Set spending limits and configure alerts to stay on top of your budget
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setEmailSettingsOpen(true)}
              className="gap-2"
            >
              <EnvelopeSimple weight="fill" size={16} />
              Email Settings
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="limits" className="gap-2">
              <ShieldCheck size={16} />
              Spending Limits
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell size={16} />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="overview" className="gap-2">
              <ChartBar size={16} />
              Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="limits" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Your Spending Limits</h3>
                <p className="text-sm text-muted-foreground">
                  Control your spending by setting limits for different time periods
                </p>
              </div>
              <Button onClick={() => setIsAddingLimit(true)} className="gap-2">
                <Plus weight="bold" size={16} />
                Add Limit
              </Button>
            </div>

            {isAddingLimit && (
              <Card className="p-4 border-primary">
                <h4 className="font-semibold mb-4">Create New Spending Limit</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="limit-amount">Limit Amount ($)</Label>
                      <Input
                        id="limit-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newLimitAmount}
                        onChange={(e) => setNewLimitAmount(e.target.value)}
                        placeholder="100.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="limit-period">Time Period</Label>
                      <Select value={newLimitPeriod} onValueChange={(v) => setNewLimitPeriod(v as LimitPeriod)}>
                        <SelectTrigger id="limit-period">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="block-exceed" className="text-base font-medium">
                        Block transactions when exceeded
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Prevent any spending beyond this limit
                      </p>
                    </div>
                    <Switch
                      id="block-exceed"
                      checked={newLimitBlock}
                      onCheckedChange={setNewLimitBlock}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsAddingLimit(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddLimit}>
                      Create Limit
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {currentConfig.limits.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <ShieldCheck size={48} weight="thin" className="text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium mb-1">No spending limits set</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create limits to control and monitor your spending
                    </p>
                    <Button onClick={() => setIsAddingLimit(true)} className="gap-2">
                      <Plus weight="bold" size={16} />
                      Create Your First Limit
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {currentConfig.limits.map((limit) => {
                  const percentage = getSpendingPercentage(limit.currentSpend, limit.amount)
                  const exceeded = isLimitExceeded(limit)
                  const approaching = isApproachingLimit(limit)
                  const daysRemaining = getPeriodDaysRemaining(limit.resetDate)

                  return (
                    <Card 
                      key={limit.id} 
                      className={`p-4 transition-all ${
                        exceeded 
                          ? 'border-destructive bg-destructive/5' 
                          : approaching 
                          ? 'border-yellow-500 bg-yellow-500/5'
                          : ''
                      } ${!limit.enabled ? 'opacity-50' : ''}`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-lg">
                                ${limit.amount.toFixed(2)} {formatPeriod(limit.period)}
                              </h4>
                              {exceeded && (
                                <Badge variant="destructive" className="gap-1">
                                  <Warning weight="fill" size={12} />
                                  Exceeded
                                </Badge>
                              )}
                              {approaching && !exceeded && (
                                <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600">
                                  <Warning weight="fill" size={12} />
                                  {percentage}%
                                </Badge>
                              )}
                              {limit.blockOnExceed && (
                                <Badge variant="outline" className="gap-1">
                                  <ShieldCheck size={12} />
                                  Blocks
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              ${limit.currentSpend.toFixed(2)} of ${limit.amount.toFixed(2)} spent
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Resets in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedLimitId(limit.id)
                                setIsAddingAlert(true)
                              }}
                              className="gap-1"
                            >
                              <Bell size={14} />
                              Alert
                            </Button>
                            <Switch
                              checked={limit.enabled}
                              onCheckedChange={() => handleToggleLimit(limit.id)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteLimit(limit.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash weight="bold" size={18} />
                            </Button>
                          </div>
                        </div>

                        <Progress value={percentage} className="h-2" />

                        {limit.alerts.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                ALERTS ({limit.alerts.length})
                              </p>
                              <div className="space-y-2">
                                {limit.alerts.map(alert => (
                                  <div
                                    key={alert.id}
                                    className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Bell size={14} weight={alert.enabled ? 'fill' : 'regular'} />
                                      <span className={!alert.enabled ? 'text-muted-foreground' : ''}>
                                        {alert.name}
                                      </span>
                                      {alert.percentage !== undefined ? (
                                        <Badge variant="outline" className="text-xs">
                                          {alert.percentage}%
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-xs">
                                          ${alert.threshold}
                                        </Badge>
                                      )}
                                      {alert.triggerCount > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          {alert.triggerCount}x
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={alert.enabled}
                                        onCheckedChange={() => handleToggleAlert(alert.id, limit.id)}
                                      />
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => handleDeleteAlert(alert.id, limit.id)}
                                      >
                                        <Trash size={14} />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Global Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  Get notified about spending across all limits
                </p>
              </div>
              <Button onClick={() => setIsAddingAlert(true)} className="gap-2">
                <Plus weight="bold" size={16} />
                Add Alert
              </Button>
            </div>

            {isAddingAlert && (
              <Card className="p-4 border-primary">
                <h4 className="font-semibold mb-4">
                  {selectedLimitId ? 'Create Limit-Specific Alert' : 'Create Global Alert'}
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="alert-name">Alert Name</Label>
                    <Input
                      id="alert-name"
                      value={newAlertName}
                      onChange={(e) => setNewAlertName(e.target.value)}
                      placeholder="e.g., High spending warning"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="alert-amount">Amount Threshold ($)</Label>
                      <Input
                        id="alert-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newAlertThreshold}
                        onChange={(e) => setNewAlertThreshold(e.target.value)}
                        placeholder="50.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alert-percentage">Or Percentage (%)</Label>
                      <Input
                        id="alert-percentage"
                        type="number"
                        min="0"
                        max="100"
                        value={newAlertPercentage}
                        onChange={(e) => setNewAlertPercentage(e.target.value)}
                        placeholder="80"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alert-frequency">Alert Frequency</Label>
                    <Select value={newAlertFrequency} onValueChange={(v) => setNewAlertFrequency(v as AlertFrequency)}>
                      <SelectTrigger id="alert-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">Once (first time only)</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="always">Every transaction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notification Channels</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={newAlertChannels.includes('email') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleChannel('email')}
                        className="gap-1"
                      >
                        Email
                      </Button>
                      <Button
                        type="button"
                        variant={newAlertChannels.includes('push') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleChannel('push')}
                        className="gap-1"
                      >
                        Push
                      </Button>
                      <Button
                        type="button"
                        variant={newAlertChannels.includes('both') ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleChannel('both')}
                        className="gap-1"
                      >
                        Both
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => {
                      setIsAddingAlert(false)
                      setSelectedLimitId(null)
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddAlert}>
                      Create Alert
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {currentConfig.globalAlerts.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Bell size={48} weight="thin" className="text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium mb-1">No global alerts configured</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Set up alerts to stay informed about your spending
                    </p>
                    <Button onClick={() => setIsAddingAlert(true)} className="gap-2">
                      <Plus weight="bold" size={16} />
                      Create Your First Alert
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {currentConfig.globalAlerts.map((alert) => (
                  <Card key={alert.id} className={`p-4 ${!alert.enabled ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Bell size={20} weight={alert.enabled ? 'fill' : 'regular'} />
                          <h4 className="font-semibold">{alert.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.percentage !== undefined 
                            ? `Triggers at ${alert.percentage}% of limit`
                            : `Triggers at $${alert.threshold.toFixed(2)}`
                          }
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {alert.frequency.charAt(0).toUpperCase() + alert.frequency.slice(1)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.channels.join(', ')}
                          </Badge>
                          {alert.triggerCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Triggered {alert.triggerCount}x
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={alert.enabled}
                          onCheckedChange={() => handleToggleAlert(alert.id)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash weight="bold" size={18} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <CurrencyDollar size={20} className="text-primary" weight="fill" />
                </div>
                <p className="text-2xl font-bold">${currentConfig.totalSpendThisMonth.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <TrendUp size={12} className="inline" /> vs last month
                </p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">This Year</p>
                  <ChartBar size={20} className="text-accent" weight="fill" />
                </div>
                <p className="text-2xl font-bold">${currentConfig.totalSpendThisYear.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <Clock size={12} className="inline" /> Jan - Dec
                </p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Active Limits</p>
                  <ShieldCheck size={20} className="text-secondary" weight="fill" />
                </div>
                <p className="text-2xl font-bold">{currentConfig.limits.filter(l => l.enabled).length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentConfig.limits.length - currentConfig.limits.filter(l => l.enabled).length} inactive
                </p>
              </Card>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Recent Spending Activity</h3>
              <Card className="divide-y">
                {currentConfig.history.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        transaction.category === 'subscription' ? 'bg-primary/10' :
                        transaction.category === 'generation' ? 'bg-accent/10' :
                        transaction.category === 'addon' ? 'bg-secondary/10' :
                        'bg-muted'
                      }`}>
                        {transaction.category === 'subscription' ? (
                          <CheckCircle size={20} weight="fill" />
                        ) : transaction.category === 'generation' ? (
                          <Receipt size={20} weight="fill" />
                        ) : (
                          <Plus size={20} weight="bold" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${transaction.amount.toFixed(2)}</p>
                      <Badge 
                        variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'pending' ? 'outline' :
                          'destructive'
                        }
                        className="text-xs"
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
      <EmailSettings open={emailSettingsOpen} onOpenChange={setEmailSettingsOpen} />
    </Dialog>
  )
}
