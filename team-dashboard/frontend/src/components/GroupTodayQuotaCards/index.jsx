import React, { useMemo } from 'react'
import { Typography, Tooltip } from '@douyinfe/semi-ui'
import { IconAlertTriangle } from '@douyinfe/semi-icons'

const { Text } = Typography
const QUOTA_TO_USD = 1 / 500000
const LIMIT_USD = 100
const LIMIT_QUOTA = LIMIT_USD / QUOTA_TO_USD   // 50_000_000
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
      .map(([group, quota]) => ({ group, quota, overLimit: quota >= LIMIT_QUOTA }))
      .sort((a, b) => b.quota - a.quota)
  }, [groupStats, today])

  if (groups.length === 0) {
    return <Text type="tertiary">今日暂无分组消耗数据</Text>
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: 10,
    }}>
      {groups.map(({ group, quota, overLimit }) => {
        const usd = quota * QUOTA_TO_USD
        const pct = Math.min(usd / LIMIT_USD, 1)

        return (
          <div key={group} style={{
            borderRadius: 10,
            padding: '12px 14px',
            boxShadow: overLimit
              ? '0 0 0 2px #ff4d4f, 0 2px 8px rgba(255,77,79,.15)'
              : '0 1px 3px rgba(0,0,0,.08)',
            background: overLimit ? '#fff2f0' : '#fafafa',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            position: 'relative',
            overflow: 'hidden',
          }}>

            {/* 标题行 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
              <Text strong ellipsis={{ showTooltip: true }} style={{ fontSize: 13, flex: 1 }}>
                {group}
              </Text>
              {overLimit && (
                <Tooltip content="今日消耗已达限额（$100）">
                  <IconAlertTriangle style={{ color: '#ff4d4f', fontSize: 15, flexShrink: 0 }} />
                </Tooltip>
              )}
            </div>

            {/* 金额 */}
            <Text style={{
              fontSize: 22,
              fontWeight: 700,
              color: overLimit ? '#ff4d4f' : 'var(--semi-color-warning)',
              lineHeight: 1.2,
            }}>
              ${usd.toFixed(2)}
            </Text>

            {/* 进度条 */}
            <div style={{ background: '#e8e8e8', borderRadius: 4, height: 5, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(pct * 100).toFixed(1)}%`,
                background: overLimit ? '#ff4d4f' : pct > 0.8 ? '#fa8c16' : '#52c41a',
                borderRadius: 4,
                transition: 'width .3s',
              }} />
            </div>

            {/* 限额提示 or 百分比 */}
            {overLimit ? (
              <Text style={{ fontSize: 11, color: '#ff4d4f', fontWeight: 600 }}>
                ⚠️ 今日额度已达限额
              </Text>
            ) : (
              <Text type="tertiary" style={{ fontSize: 11 }}>
                限额 ${LIMIT_USD}（已用 {(pct * 100).toFixed(1)}%）
              </Text>
            )}
          </div>
        )
      })}
    </div>
  )
}
