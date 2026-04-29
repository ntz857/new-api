import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

export default function ModelTokenChart({ members, modelStats, hiddenIds }) {
  const option = useMemo(() => {
    const dateSet = new Set(modelStats.map(s => s.date))
    const dates = Array.from(dateSet).sort()

    const visibleIds = new Set(members.filter(m => !hiddenIds.has(m.id)).map(m => m.id))

    // Aggregate by date + model across all visible members
    const modelSet = new Set()
    // agg[model][date] = total_tokens
    const agg = {}
    for (const s of modelStats) {
      if (!visibleIds.has(s.user_id)) continue
      modelSet.add(s.model_name)
      if (!agg[s.model_name]) agg[s.model_name] = {}
      agg[s.model_name][s.date] = (agg[s.model_name][s.date] || 0) + s.total_tokens
    }

    const models = Array.from(modelSet).sort()

    const series = models.map(model => ({
      name: model,
      type: 'bar',
      stack: 'total',
      emphasis: { focus: 'series' },
      data: dates.map(d => agg[model]?.[d] ?? 0),
    }))

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const date = params[0]?.axisValue
          const total = params.reduce((s, p) => s + (p.value || 0), 0)
          let html = `<b>${date}</b>　合计: ${total.toLocaleString()} tokens<br/>`
          for (const p of params) {
            if (p.value > 0) {
              const pct = ((p.value / total) * 100).toFixed(1)
              html += `${p.marker}${p.seriesName}: ${p.value.toLocaleString()} (${pct}%)<br/>`
            }
          }
          return html
        },
      },
      legend: { type: 'scroll', bottom: 0, left: 'center' },
      xAxis: { type: 'category', data: dates },
      yAxis: {
        type: 'value',
        name: 'Tokens',
        axisLabel: {
          formatter: v => v >= 1000 ? (v / 1000).toFixed(1) + 'K' : v,
        },
      },
      series,
      grid: { top: 16, right: 20, bottom: 48, left: 70 },
    }
  }, [members, modelStats, hiddenIds])

  return (
    <ReactECharts option={option} style={{ height: 320, width: '100%' }} notMerge />
  )
}
