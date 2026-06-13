import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { api } from '../../api/client'
import { getTranslations } from '../../i18n'
import type { Currency, Locale } from '../../types'

export function CurrencyRow({ item, locale }: { item: Currency; locale: Locale }) {
  const copy = getTranslations(locale)
  const queryClient = useQueryClient()
  const [rate, setRate] = useState(item.rate_from_usd)
  const update = useMutation({
    mutationFn: (enabled: boolean) => api.admin.updateCurrency(item.code, {
      rate_from_usd: Number(rate),
      is_enabled: enabled,
      name: item.name,
      symbol: item.symbol,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-currencies'] })
      queryClient.invalidateQueries({ queryKey: ['currencies'] })
    },
  })

  return (
    <tr>
      <td data-label={copy.admin.currencies.code}><strong>{item.code}</strong></td>
      <td data-label={copy.admin.currencies.name}>{item.name}</td>
      <td data-label={copy.admin.currencies.symbol}>{item.symbol}</td>
      <td data-label={copy.admin.currencies.rate}>
        <input className="table-input" inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} />
      </td>
      <td data-label={copy.admin.currencies.enabled}>
        <label className="switch">
          <input type="checkbox" checked={item.is_enabled} onChange={(event) => update.mutate(event.target.checked)} />
          <span />
        </label>
      </td>
      <td>
        <button className="small-button" onClick={() => update.mutate(item.is_enabled)} disabled={update.isPending}>
          {copy.common.save}
        </button>
      </td>
    </tr>
  )
}
