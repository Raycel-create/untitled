import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Receipt, 
  DownloadSimple, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ArrowCounterClockwise,
  MagnifyingGlass,
  FileText
} from '@phosphor-icons/react'
import { PaymentHistory, formatAmount } from '@/lib/payment-methods'
import { toast } from 'sonner'

interface PaymentHistoryViewProps {
  history: PaymentHistory[]
  currency: string
}

export function PaymentHistoryView({ history, currency }: PaymentHistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: PaymentHistory['status']) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle weight="fill" size={20} className="text-green-500" />
      case 'pending':
        return <Clock weight="fill" size={20} className="text-yellow-500" />
      case 'failed':
        return <XCircle weight="fill" size={20} className="text-red-500" />
      case 'refunded':
        return <ArrowCounterClockwise weight="fill" size={20} className="text-blue-500" />
    }
  }

  const getStatusBadge = (status: PaymentHistory['status']) => {
    const variants = {
      succeeded: { variant: 'default' as const, className: 'bg-green-500 hover:bg-green-600' },
      pending: { variant: 'outline' as const, className: 'border-yellow-500 text-yellow-600' },
      failed: { variant: 'destructive' as const, className: '' },
      refunded: { variant: 'outline' as const, className: 'border-blue-500 text-blue-600' }
    }
    
    return variants[status]
  }

  const handleDownloadInvoice = (payment: PaymentHistory) => {
    if (payment.invoiceUrl) {
      window.open(payment.invoiceUrl, '_blank')
      toast.success('Opening invoice...')
    } else {
      toast.error('Invoice not available')
    }
  }

  const handleDownloadReceipt = (payment: PaymentHistory) => {
    if (payment.receiptUrl) {
      window.open(payment.receiptUrl, '_blank')
      toast.success('Opening receipt...')
    } else {
      toast.error('Receipt not available')
    }
  }

  const totalAmount = filteredHistory
    .filter(h => h.status === 'succeeded')
    .reduce((sum, h) => sum + h.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
            size={18}
          />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transactions</SelectItem>
            <SelectItem value="succeeded">Succeeded</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredHistory.length > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold">
                {formatAmount(totalAmount, currency)}
              </p>
            </div>
            <Receipt weight="fill" size={32} className="text-primary/50" />
          </div>
        </Card>
      )}

      {filteredHistory.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <Receipt size={48} weight="thin" className="text-muted-foreground" />
            <div>
              <p className="text-lg font-medium mb-1">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No matching transactions' 
                  : 'No payment history'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Your payment history will appear here'
                }
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((payment) => {
            const statusBadge = getStatusBadge(payment.status)
            
            return (
              <Card key={payment.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(payment.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{payment.description}</h4>
                        <Badge {...statusBadge}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {new Date(payment.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        ID: {payment.id}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatAmount(payment.amount, payment.currency)}
                      </p>
                      {payment.currency !== currency && (
                        <p className="text-xs text-muted-foreground">
                          {payment.currency}
                        </p>
                      )}
                    </div>
                    
                    {payment.status === 'succeeded' && (
                      <div className="flex gap-1">
                        {payment.invoiceUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadInvoice(payment)}
                            title="View Invoice"
                            className="h-8 w-8"
                          >
                            <FileText size={16} />
                          </Button>
                        )}
                        {payment.receiptUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadReceipt(payment)}
                            title="Download Receipt"
                            className="h-8 w-8"
                          >
                            <DownloadSimple size={16} />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {filteredHistory.length > 0 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
          <p>
            Showing {filteredHistory.length} of {history.length} transaction{history.length !== 1 ? 's' : ''}
          </p>
          {filteredHistory.length < history.length && (
            <Button 
              variant="link" 
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
