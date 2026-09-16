import React from 'react'

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-line bg-white">
      <div>
        <h1 className="text-[19px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] text-ink/55">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const base = 'focus-ring inline-flex items-center gap-1.5 rounded-sm2 text-[13px] font-medium px-3.5 py-2 transition-colors disabled:opacity-40 disabled:pointer-events-none'
  const styles: Record<string, string> = {
    primary: 'bg-bottle-600 text-white hover:bg-bottle-700',
    secondary: 'bg-white text-ink border border-line hover:bg-paper',
    ghost: 'text-ink/60 hover:text-ink hover:bg-paper',
    danger: 'bg-white text-clay border border-clay/30 hover:bg-clay/5',
  }
  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />
}

export function StatusPill({ status }: { status: 'draft' | 'submitted' | 'published' | 'unpublished' | 'active' | 'inactive' }) {
  const map: Record<string, string> = {
    draft: 'bg-brass-400/15 text-brass-600',
    submitted: 'bg-bottle-100 text-bottle-700',
    published: 'bg-bottle-100 text-bottle-700',
    unpublished: 'bg-ink/8 text-ink/50',
    active: 'bg-bottle-100 text-bottle-700',
    inactive: 'bg-clay/10 text-clay',
  }
  const label: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    published: 'Published',
    unpublished: 'Unpublished',
    active: 'Active',
    inactive: 'Inactive',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-sm2 text-[11.5px] font-medium ${map[status]}`}>
      {label[status]}
    </span>
  )
}

export function LedgerTable({
  columns,
  children,
}: {
  columns: string[]
  children: React.ReactNode
}) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-line">
          {columns.map(c => (
            <th key={c} className="py-2.5 text-[11.5px] font-medium text-ink/45 tracking-wide first:pl-0">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}

export function Row({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-line2 ${onClick ? 'cursor-pointer hover:bg-paper' : ''} transition-colors`}
    >
      {children}
    </tr>
  )
}

export function Cell({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`py-3 text-[13.5px] first:pl-0 ${className}`}>{children}</td>
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-[13.5px] text-ink/50">{title}</p>
      {hint && <p className="mt-1 text-[12.5px] text-ink/35">{hint}</p>}
    </div>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <label className="block">
      <span className="block text-[12.5px] text-ink/60 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block mt-1 text-[11.5px] text-ink/40">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'focus-ring w-full border border-line rounded-sm2 px-3 py-2 text-[13.5px] bg-white'
