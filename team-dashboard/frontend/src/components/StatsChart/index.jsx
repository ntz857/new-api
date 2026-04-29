import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

const QUOTA_TO_USD = 1 / 500000

export default function StatsChart({ members, stats, hiddenIds, mode }) {
  const option = useMemo(() => {
    const dateSet = new Set(stats.map(s => s.date))
    const dates = Array.from(dateSet).sort()

    const lookup = {}
    for (const s of stats) {
      if (!lookup[s.user_id]) lookup[s.user_id] = {}
      lookup[s.user_id][s.date] = s
    }

    const seriesNameToId = {}
    const visibleMembers = members.filter(m => !hiddenIds.has(m.id))

    const series = visibleMembers.map(m => {
      const dn = m.display_name?.trim()
      const name = dn && dn !== m.username ? `${m.username}(${dn})` : m.username
      seriesNameToId[name] = m.id
      return {
        name,
        type: 'line',
        smooth: true,
        data: dates.map(d => {
          const s = lookup[m.id]?.[d]
          if (!s) return 0
          return mode === 'tokens'
            ? s.total_tokens
            : parseFloat((s.quota * QUOTA_TO_USD).toFixed(6))
        }),
      }
    })

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const date = params[0]?.axisValue
          let html = `<b>${date}</b><br/>`
          for (const p of params) {
            const memberId = seriesNameToId[p.seriesName]
            const s = memberId != null ? lookup[memberId]?.[date] : null
            if (s) {
              if (mode === 'tokens') {
                html += `${p.marker}${p.seriesName}: ${s.total_tokens.toLocaleString()} tokens<br/>`
                html += `&nbsp;&nbsp;Prompt: ${s.prompt_tokens.toLocaleString()}<br/>`
                html += `&nbsp;&nbsp;Completion: ${s.completion_tokens.toLocaleString()}<br/>`
              } else {
                html += `${p.marker}${p.seriesName}: $${(s.quota * QUOTA_TO_USD).toFixed(4)}<br/>`
              }
            } else {
              html += `${p.marker}${p.seriesName}: ${mode === 'tokens' ? '0 tokens' : '$0.0000'}<br/>`
            }
          }
          return html
        },
      },
      legend: { type: 'scroll', bottom: 0, left: 'center' },
      xAxis: { type: 'category', data: dates },
      yAxis: {
        type: 'value',
        name: mode === 'tokens' ? 'Tokens' : 'USD ($)',
        axisLabel: {
          formatter: mode === 'tokens'
            ? v => v >= 1000 ? (v / 1000).toFixed(1) + 'K' : v
            : v => '$' + v.toFixed(4),
        },
      },
      series,
      grid: { top: 16, right: 20, bottom: 48, left: 70 },
    }
  }, [members, stats, hiddenIds, mode])

  return (
    <ReactECharts option={option} style={{ height: 300, width: '100%' }} notMerge />
  )
}
