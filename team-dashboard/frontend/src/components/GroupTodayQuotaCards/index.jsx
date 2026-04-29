import React, { useMemo } from 'react'
import { Typography } from '@douyinfe/semi-ui'

const { Text } = Typography
const QUOTA_TO_USD = 1 / 500000
const fmt = d => d.toISOString().slice(0, 10)

export default function GroupTodayQuotaCards({ groupStats }) {
  const today = fmt(new Date())

  const groups = useMemo(() => {
    const map = {}
    for (const s of groupStats) {
      if (s.date !== today) continue
      map[s.group] = (map[s.group] || 0) + s.quota
    }
    return Object.entries(map)
      .map(([group, quota]) => ({ group, quota }))
      .sort((a, b) => b.quota - a.quota)
  }, [groupStats, today])

  if (groups.length === 0) {
    return <Text type="tertiary">今日暂无分组消耗数据</Text>
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: 10,
    }}>
      {groups.map(({ group, quota }) => (
        <div key={group} style={{
          background: '#f9f9f9',
          borderRadius: 8,
          padding: '10px 14px',
          boxShadow: '0 1px 3px rgba(0,0,0,.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <Text strong ellipsis={{ showTooltip: true }} style={{ fontSize: 13 }}>{group}</Text>
          <Text style={{ fontSize: 20, fontWeight: 600, color: 'var(--semi-color-warning)' }}>
            ${(quota * QUOTA_TO_USD).toFixed(4)}
          </Text>
          <Text type="tertiary" style={{ fontSize: 11 }}>今日消耗</Text>
        </div>
      ))}
    </div>
  )
}
