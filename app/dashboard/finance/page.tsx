'use client'

import { useEffect, useRef, useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Transaction, ExpenseGroup, Unit } from '@/lib/types'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Pencil,
  Trash2,
  IndianRupee,
  Calendar,
  Building2,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
} from 'lucide-react'

export default function FinancePage() {
  const { user } = useAuth()
  const [ transactions, setTransactions ] = useState<Transaction[]>([])
  const [ expenseGroups, setExpenseGroups ] = useState<ExpenseGroup[]>([])
  const [ units, setUnits ] = useState<Unit[]>([])
  const [ isLoading, setIsLoading ] = useState(true)
  const [ isSheetOpen, setIsSheetOpen ] = useState(false)
  const [ editingTransaction, setEditingTransaction ] = useState<Transaction | null>(null)
  const [ isSubmitting, setIsSubmitting ] = useState(false)
  const [ searchQuery, setSearchQuery ] = useState('')
  const [ typeFilter, setTypeFilter ] = useState<string>('all')
  const [ page, setPage ] = useState(1)
  const itemsPerPage = 10
  const { toast } = useToast()

  const [ formData, setFormData ] = useState({
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    title: '',
    amount: '',
    group_id: '',
    unit_id: '',
    payment_mode: '',
    transaction_date: new Date().toISOString().split('T')[ 0 ],
  })

  // ── All hooks before any early return ──────────────────────────────────────
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isAdminOrCommittee = user?.role === 'ADMIN' || user?.role === 'COMMITTEE'

  const filteredTransactions = transactions
    .filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (!searchQuery) return true
      return t.title.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .sort(
      (a, b) =>
        new Date(b.transaction_date).getTime() -
        new Date(a.transaction_date).getTime()
    )

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice(0, page * itemsPerPage)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([ entry ]) => {
        if (entry.isIntersecting && page < totalPages) setPage((p) => p + 1)
      },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [ page, totalPages ])

  // ── Data fetching ──────────────────────────────────────────────────────────
  async function fetchData() {
    try {
      const [ transRes, groupsRes, unitsRes ] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/expense-groups'),
        fetch('/api/units'),
      ])
      const [ transData, groupsData, unitsData ] = await Promise.all([
        transRes.json(),
        groupsRes.json(),
        unitsRes.json(),
      ])
      if (transData.success) setTransactions(transData.data || [])
      if (groupsData.success) setExpenseGroups(groupsData.data || [])
      if (unitsData.success) setUnits(unitsData.data || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function getGroupName(groupId?: string) {
    if (!groupId) return null
    return expenseGroups.find((g) => g.id === groupId)?.name
  }

  function getUnitNumber(unitId?: string) {
    if (!unitId) return null
    return units.find((u) => u.id === unitId)?.unit_number
  }

  function openAddTransaction() {
    setEditingTransaction(null)
    setFormData({
      type: 'EXPENSE',
      title: '',
      amount: '',
      group_id: '',
      unit_id: '',
      payment_mode: '',
      transaction_date: new Date().toISOString().split('T')[ 0 ],
    })
    setIsSheetOpen(true)
  }

  function openEditTransaction(transaction: Transaction) {
    setEditingTransaction(transaction)
    setFormData({
      type: transaction.type,
      title: transaction.title,
      amount: transaction.amount.toString(),
      group_id: transaction.group_id || '',
      unit_id: transaction.unit_id || '',
      payment_mode: transaction.payment_mode || '',
      transaction_date: transaction.transaction_date.split('T')[ 0 ],
    })
    setIsSheetOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const url = editingTransaction
        ? `/api/transactions/${editingTransaction.id}`
        : '/api/transactions'
      const method = editingTransaction ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          group_id: formData.group_id || null,
          unit_id: formData.unit_id || null,
          payment_mode: formData.payment_mode || null,
        }),
      })
      const data = await response.json()
      if (!data.success) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      toast({
        title: 'Success',
        description: editingTransaction ? 'Transaction updated' : 'Transaction created',
      })
      setIsSheetOpen(false)
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to save transaction', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return
    try {
      const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (!data.success) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Success', description: 'Transaction deleted' })
      fetchData()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete transaction', variant: 'destructive' })
    }
  }

  // ── Early return AFTER all hooks ───────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const income = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((s, t) => s + t.amount, 0)
  const expense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((s, t) => s + t.amount, 0)
  const balance = income - expense




  // ── Shared form fields ─────────────────────────────────────────────────────
  const FormFields = () => (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Type
        </Label>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted rounded-lg">
          { ([ 'INCOME', 'EXPENSE' ] as const).map((t) => (
            <button
              key={ t }
              type="button"
              onClick={ () => setFormData({ ...formData, type: t }) }
              className={ cn(
                'py-2 rounded-md text-sm font-medium transition-all',
                formData.type === t
                  ? t === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-red-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              ) }
            >
              { t === 'INCOME' ? 'Income' : 'Expense' }
            </button>
          )) }
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Title
        </Label>
        <Input
          value={ formData.title }
          onChange={ (e) => setFormData({ ...formData, title: e.target.value }) }
          placeholder="e.g. Maintenance Fee"
          required
          className="h-10 bg-muted/40 border-0 focus-visible:ring-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Amount (₹)
          </Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={ formData.amount }
            onChange={ (e) => setFormData({ ...formData, amount: e.target.value }) }
            placeholder="0.00"
            required
            className="h-10 bg-muted/40 border-0 focus-visible:ring-1"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Date
          </Label>
          <Input
            type="date"
            value={ formData.transaction_date }
            onChange={ (e) =>
              setFormData({ ...formData, transaction_date: e.target.value })
            }
            required
            className="h-10 bg-muted/40 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Category
        </Label>
        <Select
          value={ formData.group_id }
          onValueChange={ (v) => setFormData({ ...formData, group_id: v }) }
        >
          <SelectTrigger className="h-10 bg-muted/40 border-0 focus:ring-1">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            { expenseGroups.map((g) => (
              <SelectItem key={ g.id } value={ g.id }>{ g.name }</SelectItem>
            )) }
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Unit
          </Label>
          <Select
            value={ formData.unit_id }
            onValueChange={ (v) => setFormData({ ...formData, unit_id: v }) }
          >
            <SelectTrigger className="h-10 bg-muted/40 border-0 focus:ring-1">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              { units.map((u) => (
                <SelectItem key={ u.id } value={ u.id }>{ u.unit_number }</SelectItem>
              )) }
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Payment
          </Label>
          <Select
            value={ formData.payment_mode }
            onValueChange={ (v) => setFormData({ ...formData, payment_mode: v }) }
          >
            <SelectTrigger className="h-10 bg-muted/40 border-0 focus:ring-1">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="BANK">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-background">

      {/* ── Header ──────────────────────────────────────────────────────────── */ }
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Finance</h1>
            <p className="text-xs text-muted-foreground mt-0.5 hidden md:block">
              { transactions.length } transactions
            </p>
          </div>
          <Button
            size="sm"
            onClick={ openAddTransaction }
            className="gap-1.5 rounded-full px-4 h-9"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </Button>
        </div>

        <div className="px-4 md:px-6 pb-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search…"
              value={ searchQuery }
              onChange={ (e) => { setSearchQuery(e.target.value); setPage(1) } }
              className="pl-9 h-9 bg-muted/50 border-0 rounded-full text-sm focus-visible:ring-1"
            />
          </div>
          <Select value={ typeFilter } onValueChange={ (v) => { setTypeFilter(v); setPage(1) } }>
            <SelectTrigger className="w-auto gap-1.5 h-9 px-3 rounded-full bg-muted/50 border-0 text-sm focus:ring-1">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* ── Stats ───────────────────────────────────────────────────────────── */ }
      <section className="px-4 md:px-6 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Income</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-lg md:text-xl font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
              ₹{ income.toLocaleString('en-IN') }
            </p>
          </div>

          <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-red-600 dark:text-red-400">Expense</span>
              <ArrowDownRight className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
            </div>
            <p className="text-lg md:text-xl font-semibold text-red-600 dark:text-red-400 tabular-nums">
              ₹{ expense.toLocaleString('en-IN') }
            </p>
          </div>

          <div
            className={ cn(
              'rounded-2xl p-4 space-y-1',
              balance >= 0
                ? 'bg-sky-50 dark:bg-sky-950/30'
                : 'bg-orange-50 dark:bg-orange-950/30'
            ) }
          >
            <div className="flex items-center justify-between">
              <span
                className={ cn(
                  'text-xs font-medium',
                  balance >= 0
                    ? 'text-sky-700 dark:text-sky-400'
                    : 'text-orange-600 dark:text-orange-400'
                ) }
              >
                Balance
              </span>
              <IndianRupee
                className={ cn(
                  'h-3.5 w-3.5',
                  balance >= 0
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-orange-500 dark:text-orange-400'
                ) }
              />
            </div>
            <p
              className={ cn(
                'text-lg md:text-xl font-semibold tabular-nums',
                balance >= 0
                  ? 'text-sky-700 dark:text-sky-400'
                  : 'text-orange-600 dark:text-orange-400'
              ) }
            >
              ₹{ Math.abs(balance).toLocaleString('en-IN') }
            </p>
          </div>
        </div>
      </section>

      {/* ── Transaction List ─────────────────────────────────────────────────── */ }
      <div className="flex-1 overflow-y-auto pb-24 md:pb-8">
        { paginatedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-1">
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No transactions</p>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              { searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Start by adding your first transaction.' }
            </p>
            { isAdminOrCommittee && !searchQuery && typeFilter === 'all' && (
              <Button size="sm" onClick={ openAddTransaction } className="mt-2 rounded-full gap-1.5 h-8 px-4 text-xs">
                <Plus className="h-3 w-3" /> Add transaction
              </Button>
            ) }
          </div>
        ) : (
          <div className="px-4 md:px-6 mt-4">
            { (() => {
              const monthGroups = paginatedTransactions.reduce((acc, t) => {
                const monthKey = new Date(t.transaction_date).toLocaleDateString('en-IN', {
                  month: 'long', year: 'numeric',
                })
                if (!acc[ monthKey ]) acc[ monthKey ] = []
                acc[ monthKey ].push(t)
                return acc
              }, {} as Record<string, Transaction[]>)

              return Object.entries(monthGroups).map(([ month, monthTxns ]) => {
                const monthIncome = monthTxns.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
                const monthExpense = monthTxns.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
                const monthNet = monthIncome - monthExpense

                const dayGroups = monthTxns.reduce((acc, t) => {
                  const d = new Date(t.transaction_date)
                  const today = new Date()
                  const yesterday = new Date()
                  yesterday.setDate(today.getDate() - 1)
                  let label: string
                  if (d.toDateString() === today.toDateString()) label = 'Today'
                  else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
                  else label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
                  if (!acc[ label ]) acc[ label ] = []
                  acc[ label ].push(t)
                  return acc
                }, {} as Record<string, Transaction[]>)

                return (
                  <div key={ month } className="mb-6">

                    {/* ── Month header ───────────────────────────────────────── */ }
                    <div className="flex items-center justify-between py-2 mb-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        { month }
                      </span>
                      <div className="flex items-center gap-3 text-xs tabular-nums">
                        { monthIncome > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            +₹{ monthIncome.toLocaleString('en-IN') }
                          </span>
                        ) }
                        { monthExpense > 0 && (
                          <span className="text-red-500 dark:text-red-400">
                            −₹{ monthExpense.toLocaleString('en-IN') }
                          </span>
                        ) }
                        { monthIncome > 0 && monthExpense > 0 && (
                          <span className={ cn(
                            'font-semibold',
                            monthNet >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-500 dark:text-red-400'
                          ) }>
                            { monthNet >= 0 ? '+' : '−' }₹{ Math.abs(monthNet).toLocaleString('en-IN') }
                          </span>
                        ) }
                      </div>
                    </div>

                    {/* ── Bordered table block ───────────────────────────────── */ }
                    <div className="rounded-xl border border-border overflow-hidden">
                      { Object.entries(dayGroups).map(([ day, dayTxns ], dayIdx) => (
                        <div key={ day }>

                          {/* Day header row */ }
                          <div className={ cn(
                            'flex items-center px-4 py-2 bg-muted/40',
                            dayIdx > 0 && 'border-t border-border'
                          ) }>
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                              { day }
                            </span>
                          </div>

                          {/* Transaction rows */ }
                          { dayTxns.map((t) => {
                            const groupName = getGroupName(t.group_id ?? undefined)
                            const unitNumber = getUnitNumber(t.unit_id ?? undefined)
                            const isIncome = t.type === 'INCOME'

                            return (
                              <div
                                key={ t.id }
                                className="group flex items-center gap-3 px-4 py-3 border-t border-border/50 hover:bg-muted/30 transition-colors"
                              >
                                {/* Type indicator */ }
                                <div className={ cn(
                                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                                  isIncome
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30'
                                    : 'bg-red-50 dark:bg-red-900/30'
                                ) }>
                                  { isIncome
                                    ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    : <ArrowDownRight className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                                  }
                                </div>

                                {/* Title + meta */ }
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium leading-tight truncate block">
                                    { t.title }
                                  </span>
                                  { (groupName || unitNumber || t.payment_mode) && (
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      { groupName && (
                                        <span className="text-[11px] text-muted-foreground">
                                          { groupName }
                                        </span>
                                      ) }
                                      { unitNumber && (
                                        <>
                                          { groupName && <span className="text-muted-foreground/30 text-[11px]">·</span> }
                                          <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                                            <Building2 className="h-2.5 w-2.5" />{ unitNumber }
                                          </span>
                                        </>
                                      ) }
                                      { t.payment_mode && (
                                        <>
                                          { (groupName || unitNumber) && <span className="text-muted-foreground/30 text-[11px]">·</span> }
                                          <span className="text-[11px] text-muted-foreground">
                                            { t.payment_mode }
                                          </span>
                                        </>
                                      ) }
                                    </div>
                                  ) }
                                </div>

                                {/* Amount */ }
                                <span className={ cn(
                                  'text-sm font-semibold tabular-nums flex-shrink-0 min-w-[72px] text-right',
                                  isIncome
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-foreground'
                                ) }>
                                  { isIncome ? '+' : '−' }₹{ t.amount.toLocaleString('en-IN') }
                                </span>

                                {/* Actions */ }
                                { isAdminOrCommittee && (
                                  <div className="flex gap-0.5 transition-opacity flex-shrink-0">
                                    <Button
                                      variant="ghost" size="icon"
                                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                                      onClick={ () => openEditTransaction(t) }
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost" size="icon"
                                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                      onClick={ () => handleDelete(t.id) }
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ) }
                              </div>
                            )
                          }) }
                        </div>
                      )) }
                    </div>

                  </div>
                )
              })
            })() }

            {/* Infinite scroll sentinel */ }
            <div ref={ sentinelRef } className="h-10 flex items-center justify-center">
              { page < totalPages && (
                <div className="flex gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/25 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/25 animate-bounce [animation-delay:120ms]" />
                  <span className="w-1 h-1 rounded-full bg-muted-foreighter/25 animate-bounce [animation-delay:240ms]" />
                </div>
              ) }
            </div>

            { page >= totalPages && filteredTransactions.length > itemsPerPage && (
              <p className="text-center text-[11px] text-muted-foreground/50 pb-6">
                { filteredTransactions.length } transactions
              </p>
            ) }
          </div>
        ) }
      </div>

      {/* ── Desktop Dialog ───────────────────────────────────────────────────── */ }
      <div className="hidden md:block">
        <Dialog open={ isSheetOpen } onOpenChange={ setIsSheetOpen }>
          <DialogContent className="sm:max-w-[440px] rounded-2xl p-6">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg font-semibold">
                { editingTransaction ? 'Edit Transaction' : 'New Transaction' }
              </DialogTitle>
              <DialogDescription className="text-sm">
                { editingTransaction
                  ? 'Update the details below.'
                  : 'Record an income or expense.' }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={ handleSubmit } className="space-y-5">
              <FormFields />
              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={ () => setIsSheetOpen(false) }
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={ isSubmitting }
                  className="rounded-full px-6"
                >
                  { isSubmitting ? (
                    <Spinner className="h-4 w-4" />
                  ) : editingTransaction ? (
                    'Update'
                  ) : (
                    'Add'
                  ) }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Mobile Sheet ─────────────────────────────────────────────────────── */ }
      <div className="md:hidden">
        <Sheet open={ isSheetOpen } onOpenChange={ setIsSheetOpen }>
          <SheetContent
            side="bottom"
            className="rounded-t-3xl px-4 pb-8 pt-0 max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex justify-center pt-3 pb-4">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>
            <SheetHeader className="pb-5 text-left">
              <SheetTitle className="text-xl font-semibold">
                { editingTransaction ? 'Edit Transaction' : 'New Transaction' }
              </SheetTitle>
              <SheetDescription className="text-sm">
                { editingTransaction
                  ? 'Update the details below.'
                  : 'Record an income or expense.' }
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={ handleSubmit }>
              <FormFields />
              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={ () => setIsSheetOpen(false) }
                  className="flex-1 h-12 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={ isSubmitting }
                  className="flex-1 h-12 rounded-xl"
                >
                  { isSubmitting ? (
                    <Spinner className="h-5 w-5" />
                  ) : editingTransaction ? (
                    'Update'
                  ) : (
                    'Add Transaction'
                  ) }
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}