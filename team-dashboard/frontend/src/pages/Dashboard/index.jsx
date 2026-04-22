import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Button, DatePicker, Spin, Toast, Typography } from '@douyinfe/semi-ui'
import { getMembers, getStats, logout } from '../../api/client'
import { useNavigate } from 'react-router-dom'
import MemberCard from '../../components/MemberCard'
import StatsChart from '../../components/StatsChart'

const { Title } = Typography

const fmt = d => d.toISOString().slice(0, 10)
export default function DashboardPage() {
  const navigate = useNavigate()

  const { today, sevenDaysAgo } = useMemo(() => {
    const t = new Date()
    const s = new Date(t)
    s.setDate(t.getDate() - 6)
    return { today: t, sevenDaysAgo: s }
  }, [])
  const [members, setMembers] = useState([])
  const [stats, setStats] = useState([])
  const [hiddenIds, setHiddenIds] = useState(new Set())
  const [dateRange, setDateRange] = useState([sevenDaysAgo, today])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async (start, end) => {
    setLoading(true)
    try {
      const [mRes, sRes] = await Promise.all([
        getMembers(),
        getStats(fmt(start), fmt(end)),
      ])
      if (!mRes.success) { Toast.error(mRes.message); return }
      if (!sRes.success) { Toast.error(sRes.message); return }
      setMembers(mRes.data || [])
      setStats(sRes.data || [])
    } catch {
      Toast.error('加载失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(dateRange[0], dateRange[1]) }, [fetchData])

  const handleDateChange = (val) => {
    if (!val || val.length !== 2) return
    setDateRange(val)
    fetchData(val[0], val[1])
  }

  const toggleMember = (id) => {
    setHiddenIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const tokenSummary = useMemo(() => {
    const todayStr = fmt(today)
    const thisMonthPrefix = todayStr.slice(0, 7)
    const summary = {}
    for (const s of stats) {
      if (!summary[s.user_id]) summary[s.user_id] = { today: 0, thisMonth: 0 }
      if (s.date === todayStr) summary[s.user_id].today += s.total_tokens
      if (s.date.startsWith(thisMonthPrefix)) summary[s.user_id].thisMonth += s.total_tokens
    }
    return summary
  }, [stats, today])

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title heading={3} style={{ margin: 0 }}>🏠 团队看板</Title>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <DatePicker
            type="dateRange"
            value={dateRange}
            onChange={handleDateChange}
            style={{ width: 260 }}
          />
          <Button onClick={handleLogout}>退出登录</Button>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* Member cards */}
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, marginBottom: 24 }}>
          {members.map(m => (
            <MemberCard
              key={m.id}
              member={m}
              tokens={tokenSummary[m.id] || { today: 0, thisMonth: 0 }}
              active={!hiddenIds.has(m.id)}
              onClick={() => toggleMember(m.id)}
            />
          ))}
          {members.length === 0 && !loading && (
            <Typography.Text type="tertiary">暂无团队成员（通过邀请链接注册的用户会出现在此处）</Typography.Text>
          )}
        </div>

        {/* Chart */}
        <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
          <Title heading={5} style={{ marginBottom: 16 }}>每日 Token 消耗趋势</Title>
          <StatsChart members={members} stats={stats} hiddenIds={hiddenIds} />
        </div>
      </Spin>
    </div>
  )
}
