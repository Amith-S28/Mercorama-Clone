'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export interface ColumnDef<T> {
  key: keyof T
  header: string
  numeric?: boolean
  mono?: boolean
  className?: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  className?: string
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('rounded-2xl border border-gray-200 overflow-hidden dark:border-slate-700/60', className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-50 dark:hover:bg-slate-800/60">
            {columns.map((col) => (
              <TableHead
                key={String(col.key)}
                className={cn(col.numeric && 'text-right', col.className)}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell
                  key={String(col.key)}
                  className={cn(
                    col.numeric && 'font-mono tabular-nums text-right',
                    col.mono && 'font-mono tabular-nums',
                    col.className,
                  )}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : String(row[col.key] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export { DataTable }
