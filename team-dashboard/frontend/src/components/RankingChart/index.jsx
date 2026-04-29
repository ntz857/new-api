import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'

const QUOTA_TO_USD = 1 / 500000

export default function RankingChart({ members, stats }) {
  const option = useMemo(() => {
    // 聚合每人总 quota
    const totals = {}
    for (const s of stats) {
      totals[s.user_id] = (totals[s.user_id] || 0) + s.quota
    }

    // 构建排行，过滤掉消耗为 0 的，只取前10
    const ranked = members
      .map(m => {
        const dn = m.display_name?.trim()
        const name = dn && dn !== m.username ? dn : m.username
        return { name, usd: (totals[m.id] || 0) * QUOTA_TO_USD }
      })
      .filter(r => r.usd > 0)
      .sort((a, b) => a.usd - b.usd) // 升序，ECharts 从下往上渲染
      .slice(-10) // 取消耗最高的10名

    const names = ranked.map(r => r.name)
    const values = ranked.map(r => parseFloat(r.usd.toFixed(4)))

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: params => {
          const p = params[0]
          return `${p.name}<br/>${p.marker} $${p.value.toFixed(4)}`
        },
      },
      grid: { top: 8, right: 80, bottom: 8, left: 8, containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { formatter: v => `$${v.toFixed(2)}` },
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: { fontSize: 12 },
      },
      series: [{
        type: 'bar',
        data: values,
        label: {
          show: true,
          position: 'right',
          formatter: p => `$${p.value.toFixed(4)}`,
          fontSize: 11,
        },
        itemStyle: {
          color: params => {
            // 前3名用不同颜色
            const idx = values.length - 1 - params.dataIndex
            if (idx === 0) return '#f5a623'
            if (idx === 1) return '#7b68ee'
            if (idx === 2) return '#50c878'
            return '#4d9de0'
          },
        },
      }],
    }
  }, [members, stats])

  const count = Math.min(10, members.filter(m => {
    const totals = {}
    for (const s of stats) totals[s.user_id] = (totals[s.user_id] || 0) + s.quota
    return (totals[m.id] || 0) > 0
  }).length)

  const height = Math.max(200, count * 32 + 40)

  return (
    <ReactECharts option={option} style={{ height, width: '100%' }} notMerge />
  )
}
