import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

const QUOTA_TO_USD = 1 / 500000

export default function GroupDailyQuotaChart({ members, stats, hiddenIds }) {
  const option = useMemo(() => {
    const dateSet = new Set(stats.map(s => s.date))
    const dates = Array.from(dateSet).sort()

    const lookup = {}
    for (const s of stats) {
      if (!lookup[s.user_id]) lookup[s.user_id] = {}
      lookup[s.user_id][s.date] = s
    }

    const visibleMembers = members.filter(m => !hiddenIds.has(m.id))

    const series = visibleMembers.map(m => {
      const dn = m.display_name?.trim()
      const name = dn && dn !== m.username ? `${m.username}(${dn})` : m.username
      return {
        name,
        type: 'bar',
        stack: 'quota',
        emphasis: { focus: 'series' },
        data: dates.map(d => {
          const s = lookup[m.id]?.[d]
          if (!s) return 0
          return parseFloat((s.quota * QUOTA_TO_USD).toFixed(6))
        }),
      }
    })

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const date = params[0]?.axisValue
          let html = `<b>${date}</b><br/>`
          let total = 0
          const lines = []
          for (const p of params) {
            if (p.value === 0) continue
            lines.push(`${p.marker}${p.seriesName}: $${p.value.toFixed(4)}`)
            total += p.value
          }
          if (lines.length === 0) return `<b>${date}</b><br/>无消耗`
          html += lines.join('<br/>') + `<br/><b>合计: $${total.toFixed(4)}</b>`
          return html
        },
      },
      legend: { type: 'scroll', bottom: 0, left: 'center' },
      xAxis: { type: 'category', data: dates },
      yAxis: {
        type: 'value',
        name: 'USD ($)',
        axisLabel: {
          formatter: v => '$' + v.toFixed(4),
        },
      },
      series,
      grid: { top: 16, right: 20, bottom: 48, left: 80 },
    }
  }, [members, stats, hiddenIds])

  return (
    <ReactECharts option={option} style={{ height: 300, width: '100%' }} notMerge />
  )
}
