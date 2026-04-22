import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

// members: [{ id, username, display_name }]
// stats: [{ user_id, date, prompt_tokens, completion_tokens, total_tokens }]
// hiddenIds: Set of member ids to hide
export default function StatsChart({ members, stats, hiddenIds }) {
  const option = useMemo(() => {
    // Collect all unique dates, sorted
    const dateSet = new Set(stats.map(s => s.date))
    const dates = Array.from(dateSet).sort()

    // Build a lookup: user_id -> date -> stat object
    const lookup = {}
    for (const s of stats) {
      if (!lookup[s.user_id]) lookup[s.user_id] = {}
      lookup[s.user_id][s.date] = s
    }

    const series = members
      .filter(m => !hiddenIds.has(m.id))
      .map(m => ({
        name: m.display_name || m.username,
        type: 'line',
        smooth: true,
        data: dates.map(d => lookup[m.id]?.[d]?.total_tokens ?? 0),
      }))

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const date = params[0]?.axisValue
          let html = `<b>${date}</b><br/>`
          for (const p of params) {
            const memberId = members.find(m => (m.display_name || m.username) === p.seriesName)?.id
            const s = memberId != null ? lookup[memberId]?.[date] : null
            if (s) {
              html += `${p.marker}${p.seriesName}: ${s.total_tokens.toLocaleString()}<br/>`
              html += `&nbsp;&nbsp;Prompt: ${s.prompt_tokens.toLocaleString()}<br/>`
              html += `&nbsp;&nbsp;Completion: ${s.completion_tokens.toLocaleString()}<br/>`
            } else {
              html += `${p.marker}${p.seriesName}: 0<br/>`
            }
          }
          return html
        },
      },
      legend: { top: 0 },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', name: 'Tokens' },
      series,
      grid: { top: 40, right: 20, bottom: 30, left: 60 },
    }
  }, [members, stats, hiddenIds])

  return (
    <ReactECharts
      option={option}
      style={{ height: 380, width: '100%' }}
      notMerge
    />
  )
}
