import Seal from './Seal'
import { APP_NAME, APP_NAME_SHORT, APP_TAGLINE } from '../lib/branding'

type AppBrandProps = {
  size?: 'sm' | 'lg'
  /** When true, show the full product name on one line (login). */
  stacked?: boolean
}

export default function AppBrand({ size = 'sm', stacked = false }: AppBrandProps) {
  const sealSize = size === 'lg' ? 56 : 30

  if (stacked) {
    return (
      <div className="flex flex-col items-center">
        <Seal size={sealSize} />
        <h1 className="mt-4 text-[19px] font-semibold text-center leading-snug">{APP_NAME}</h1>
        <p className="mt-1.5 text-[13px] text-ink/55">{APP_TAGLINE}</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Seal size={sealSize} />
      <div className="leading-tight">
        <div className="text-[13px] font-semibold tracking-tight">{APP_NAME_SHORT}</div>
        <div className="text-[11px] text-ink/50">Document Manager</div>
      </div>
    </div>
  )
}
