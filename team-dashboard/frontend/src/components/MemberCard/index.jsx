import React from 'react'
import { Typography } from '@douyinfe/semi-ui'

const { Text } = Typography

const QUOTA_TO_USD = 1 / 500000

export default function MemberCard({ member, tokens, quota, periodTokens = 0, periodQuota = 0, frt }) {
  const fmtUSD = q => `$${(q * QUOTA_TO_USD).toFixed(2)}`
  const fmtTokens = n => n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
    ? `${(n / 1000).toFixed(1)}k`
    : String(n)

  const fmtFrt = ms => {
    if (ms === undefined || ms === null) return '--'
    const s = (ms / 1000).toFixed(1)
    return `${s}s`
  }

  const frtColor = ms => {
    if (ms === undefined || ms === null) return 'inherit'
    const s = ms / 1000
    if (s < 7)  return 'var(--semi-color-success)'
    if (s < 30) return 'var(--semi-color-warning)'
    return 'var(--semi-color-danger)'
  }

  const dn = member.display_name?.trim()
  const name = dn && dn !== member.username ? dn : member.username
  const sub = dn && dn !== member.username ? member.username : null

  return (
    <div style={{
      background: '#fff',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 1px 3px rgba(0,0,0,.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      {/* 姓名 */}
      <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>
        <Text strong ellipsis={{ showTooltip: true }} style={{ fontSize: 13, display: 'block' }}>{name}</Text>
        {sub && <Text type="tertiary" style={{ fontSize: 11 }}>{sub}</Text>}
      </div>
      {/* 数据 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="tertiary" style={{ fontSize: 11 }}>今日</Text>
        <div style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 12 }}>{fmtTokens(tokens?.today ?? 0)}</Text>
          <Text style={{ fontSize: 11, color: 'var(--semi-color-warning)', marginLeft: 6 }}>{fmtUSD(quota?.today ?? 0)}</Text>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="tertiary" style={{ fontSize: 11 }}>本月</Text>
        <div style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 12 }}>{fmtTokens(tokens?.thisMonth ?? 0)}</Text>
          <Text style={{ fontSize: 11, color: 'var(--semi-color-warning)', marginLeft: 6 }}>{fmtUSD(quota?.thisMonth ?? 0)}</Text>
        </div>
      </div>
      {/* 首字响应 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="tertiary" style={{ fontSize: 11 }}>首字响应</Text>
        <Text style={{ fontSize: 12, color: frtColor(frt) }}>{fmtFrt(frt)}</Text>
      </div>
      {/* 所选时间段 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text type="tertiary" style={{ fontSize: 11 }}>所选时段</Text>
        <div style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 12 }}>{fmtTokens(periodTokens)}</Text>
          <Text style={{ fontSize: 11, color: 'var(--semi-color-warning)', marginLeft: 6 }}>{fmtUSD(periodQuota)}</Text>
        </div>
      </div>
    </div>
  )
}

