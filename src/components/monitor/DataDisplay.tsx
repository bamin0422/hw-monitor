import { useEffect, useRef } from 'react'
import { formatTimestamp, bufferToHex, bufferToAscii } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n'
import type { DataEntry, DataEncoding } from '@/types'

interface Props {
  data: DataEntry[]
  encoding: DataEncoding
  autoScroll: boolean
}

function DataLine({ entry, encoding }: { entry: DataEntry; encoding: DataEncoding }) {
  const ts = formatTimestamp(entry.timestamp)
  const hex = bufferToHex(entry.raw)
  const ascii = bufferToAscii(entry.raw)
  const bytes = entry.raw.length

  const dirClass =
    entry.direction === 'rx' ? 'rx-data' : entry.direction === 'tx' ? 'tx-data' : 'sys-msg'
  const dirLabel = entry.direction === 'rx' ? 'RX' : entry.direction === 'tx' ? 'TX' : 'SYS'

  if (entry.direction === 'system') {
    return (
      <div className="flex items-center gap-2 py-0.5 text-xs sys-msg">
        <span className="text-[10px] opacity-50">{ts}</span>
        <span className="opacity-70">{ascii}</span>
      </div>
    )
  }

  return (
    <div className="py-0.5 border-b border-border/30">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-0.5">
        <span className="opacity-60">{ts}</span>
        <span className={`font-bold ${dirClass}`}>{dirLabel}</span>
        <span className="opacity-50">{bytes}B</span>
        {entry.from && <span className="opacity-50">from {entry.from}</span>}
      </div>
      {(encoding === 'hex' || encoding === 'both') && (
        <div className={`text-xs font-mono ${dirClass} leading-relaxed break-all`}>{hex}</div>
      )}
      {(encoding === 'ascii' || encoding === 'both') && (
        <div className="text-xs font-mono text-muted-foreground leading-relaxed break-all">
          {ascii}
        </div>
      )}
    </div>
  )
}

export function DataDisplay({ data, encoding, autoScroll }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [data, autoScroll])

  const { t } = useTranslation()

  if (data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs">
        {t('data.noData')}
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0">
      {data.map((entry) => (
        <DataLine key={entry.id} entry={entry} encoding={encoding} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
