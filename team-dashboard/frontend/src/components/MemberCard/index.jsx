import React from 'react'
import { Card, Typography } from '@douyinfe/semi-ui'

const { Title, Text } = Typography

// tokens: { today: number, thisMonth: number } (total = prompt + completion)
export default function MemberCard({ member, tokens, active, onClick }) {
  const fmt = n => n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
    ? `${(n / 1000).toFixed(1)}k`
    : String(n)

  return (
    <Card
      onClick={onClick}
      style={{
        width: 160,
        cursor: 'pointer',
        border: active ? '2px solid var(--semi-color-primary)' : '2px solid transparent',
        flexShrink: 0,
      }}
    >
      <Title heading={6} ellipsis={{ showTooltip: true }}>
        {member.display_name || member.username}
      </Title>
      <Text type="secondary" size="small">今日：{fmt(tokens.today)}</Text>
      <br />
      <Text type="secondary" size="small">本月：{fmt(tokens.thisMonth)}</Text>
    </Card>
  )
}
