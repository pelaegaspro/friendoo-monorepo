'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import SectionCard from '@/components/admin/SectionCard'
import LoadingBlock from '@/components/admin/LoadingBlock'
import DataState from '@/components/admin/DataState'
import Badge from '@/components/ui/Badge'
import { adminFetch } from '@/lib/admin/client'
import type { TransactionRow } from '@/lib/admin/types'
import { formatDateTime, formatInr } from '@/lib/admin/format'

type TransactionFilter = 'all' | 'topup' | 'calldebit' | 'bonus'

function downloadCsv(rows: TransactionRow[]) {
  const header = ['User', 'Type', 'Coins', 'Amount INR', 'Package', 'Date', 'Status']
  const lines = rows.map((row) =>
    [
      row.userName,
      row.type,
      row.amountCoins,
      row.amountInr,
      row.packageName,
      row.createdAt ?? '',
      row.status,
    ]
      .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
      .join(',')
  )

  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `friendoo-transactions-${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function TransactionsAdminPage() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<TransactionFilter>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const response = await adminFetch<{ transactions: TransactionRow[] }>('/api/admin/transactions/list')
      setTransactions(response.transactions)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesType = typeFilter === 'all' ? true : transaction.type === typeFilter
      const createdAt = transaction.createdAt ? new Date(transaction.createdAt) : null
      const matchesStart = startDate && createdAt ? createdAt >= new Date(`${startDate}T00:00:00`) : true
      const matchesEnd = endDate && createdAt ? createdAt <= new Date(`${endDate}T23:59:59`) : true
      return matchesType && matchesStart && matchesEnd
    })
  }, [endDate, startDate, transactions, typeFilter])

  return (
    <div className="space-y-6">
      <SectionCard
        title="Transactions"
        description="Review top-ups, call debits, and admin bonus credits."
        actions={
          <button
            type="button"
            onClick={() => downloadCsv(filteredTransactions)}
            className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-400"
          >
            Export CSV
          </button>
        }
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['all', 'topup', 'calldebit', 'bonus'] as TransactionFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(value)}
                className={`rounded-full px-3 py-2 text-sm transition ${
                  typeFilter === value
                    ? 'bg-purple-500/15 text-purple-200 ring-1 ring-purple-500/30'
                    : 'border border-[#343434] bg-[#111111] text-zinc-400'
                }`}
              >
                {value === 'all' ? 'All' : value === 'topup' ? 'Top-up' : value === 'calldebit' ? 'Call Debit' : 'Bonus'}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-xl border border-[#343434] bg-[#111111] px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-xl border border-[#343434] bg-[#111111] px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </SectionCard>

      {loading ? (
        <LoadingBlock rows={6} />
      ) : (
        <SectionCard>
          {filteredTransactions.length === 0 ? (
            <DataState title="No transactions found" body="Adjust the type or date filters to widen the result set." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#2b2b2b] text-zinc-400">
                    <th className="px-3 py-3 font-medium">User</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">Coins</th>
                    <th className="px-3 py-3 font-medium">Amount</th>
                    <th className="px-3 py-3 font-medium">Package</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-[#202020]">
                      <td className="px-3 py-4 font-medium text-white">{transaction.userName}</td>
                      <td className="px-3 py-4 text-zinc-300">{transaction.type}</td>
                      <td className="px-3 py-4 text-zinc-300">{transaction.amountCoins.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-4 text-zinc-300">{formatInr(transaction.amountInr)}</td>
                      <td className="px-3 py-4 text-zinc-300">{transaction.packageName || '--'}</td>
                      <td className="px-3 py-4 text-zinc-300">{formatDateTime(transaction.createdAt)}</td>
                      <td className="px-3 py-4">
                        <Badge label={transaction.status} variant={transaction.status === 'failed' ? 'failed' : transaction.status === 'captured' ? 'captured' : 'default'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  )
}
