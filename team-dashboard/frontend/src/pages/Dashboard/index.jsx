import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Button, DatePicker, Select, Spin, Toast, Typography } from '@douyinfe/semi-ui'
import { getMembers, getStats, getModelStats, getGroupStats, logout } from '../../api/client'
import { useNavigate } from 'react-router-dom'
import MemberCard from '../../components/MemberCard'
import ModelTokenChart from '../../components/ModelTokenChart'
import StatsChart from '../../components/StatsChart'
import TokenManager from '../../components/TokenManager'
import KumaStatus from '../../components/KumaStatus'
import RankingChart from '../../components/RankingChart'
import GroupDailyQuotaChart from '../../components/GroupDailyQuotaChart'

const { Title, Text } = Typography

const fmt = d => d.toISOString().slice(0, 10)

const memberLabel = m => {
  const dn = m.display_name?.trim()
  return dn && dn !== m.username ? `${m.username}(${dn})` : m.username
}

const getPreset = (key) => {
  const now = new Date()
  switch (key) {
    case '7d': {
      const s = new Date(now); s.setDate(now.getDate() - 6)
      return [s, now]
    }
    case '30d': {
      const s = new Date(now); s.setDate(now.getDate() - 29)
      return [s, now]
    }
    case 'this_week': {
      const day = now.getDay() || 7 // Mon=1 ... Sun=7
      const s = new Date(now); s.setDate(now.getDate() - day + 1)
      return [s, now]
    }
    case 'this_month': {
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      return [s, now]
    }
    default: return null
  }
}

const PRESETS = [
  { key: '7d',         label: '近7天' },
  { key: '30d',        label: '近30天' },
  { key: 'this_week',  label: '本周' },
  { key: 'this_month', label: '本月' },
]

export default function DashboardPage() {
  const navigate = useNavigate()

  const today = useMemo(() => new Date(), [])

  const [members, setMembers] = useState([])
  const [stats, setStats] = useState([])
  const [modelStats, setModelStats] = useState([])
  const [groupStats, setGroupStats] = useState([])
  const [selectedIds, setSelectedIds] = useState(null)
  const [activePreset, setActivePreset] = useState('7d')
  const [dateRange, setDateRange] = useState(getPreset('7d'))
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async (start, end) => {
    setLoading(true)
    try {
      const [mRes, sRes, msRes, gsRes] = await Promise.all([
        getMembers(),
        getStats(fmt(start), fmt(end)),
        getModelStats(fmt(start), fmt(end)),
        getGroupStats(fmt(start), fmt(end)),
      ])
      if (!mRes.success)  { Toast.error(mRes.message);  return }
      if (!sRes.success)  { Toast.error(sRes.message);  return }
      if (!msRes.success) { Toast.error(msRes.message); return }
      if (!gsRes.success) { Toast.error(gsRes.message); return }
      setMembers(mRes.data   || [])
      setStats(sRes.data     || [])
      setModelStats(msRes.data || [])
      setGroupStats(gsRes.data || [])
      setSelectedIds(null) // reset to all on reload
    } catch {
      Toast.error('加载失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(dateRange[0], dateRange[1]) }, [fetchData])

  const handlePreset = (key) => {
    const range = getPreset(key)
    setActivePreset(key)
    setDateRange(range)
    fetchData(range[0], range[1])
  }

  const handleDateChange = (val) => {
    if (!val || val.length !== 2) return
    setActivePreset(null)
    setDateRange(val)
    fetchData(val[0], val[1])
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  // selectedIds=null means all visible; otherwise only listed ids are visible
  const hiddenIds = useMemo(() => {
    if (selectedIds === null) return new Set()
    const allIds = new Set(members.map(m => m.id))
    const hidden = new Set()
    for (const id of allIds) {
      if (!selectedIds.includes(id)) hidden.add(id)
    }
    return hidden
  }, [selectedIds, members])

  const allIds = useMemo(() => members.map(m => m.id), [members])

  const handleSelectChange = (vals) => {
    if (!vals || vals.length === members.length) {
      setSelectedIds(null)
    } else {
      setSelectedIds(vals)
    }
  }

  const handleSelectAll = () => setSelectedIds(null)
  const handleClearAll = () => setSelectedIds([])

  const { tokenSummary, quotaSummary } = useMemo(() => {
    const todayStr = fmt(today)
    const thisMonthPrefix = todayStr.slice(0, 7)
    const tokens = {}
    const quota = {}
    for (const s of stats) {
      if (!tokens[s.user_id]) tokens[s.user_id] = { today: 0, thisMonth: 0 }
      if (!quota[s.user_id])  quota[s.user_id]  = { today: 0, thisMonth: 0 }
      if (s.date === todayStr) {
        tokens[s.user_id].today += s.total_tokens
        quota[s.user_id].today  += s.quota
      }
      if (s.date.startsWith(thisMonthPrefix)) {
        tokens[s.user_id].thisMonth += s.total_tokens
        quota[s.user_id].thisMonth  += s.quota
      }
    }
    return { tokenSummary: tokens, quotaSummary: quota }
  }, [stats, today])

  const currentSelected = selectedIds === null ? allIds : selectedIds

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title heading={3} style={{ margin: 0 }}>🏠 团队看板</Title>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {PRESETS.map(p => (
            <Button
              key={p.key}
              size="small"
              theme={activePreset === p.key ? 'solid' : 'borderless'}
              type={activePreset === p.key ? 'primary' : 'tertiary'}
              onClick={() => handlePreset(p.key)}
            >
              {p.label}
            </Button>
          ))}
          <DatePicker
            type="dateRange"
            value={dateRange}
            onChange={handleDateChange}
            style={{ width: 240 }}
          />
          <Button onClick={handleLogout}>退出登录</Button>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* Member grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}>
          {members.map(m => (
            <MemberCard
              key={m.id}
              member={m}
              tokens={tokenSummary[m.id] || { today: 0, thisMonth: 0 }}
              quota={quotaSummary[m.id]  || { today: 0, thisMonth: 0 }}
            />
          ))}
          {members.length === 0 && !loading && (
            <Text type="tertiary">暂无团队成员（通过邀请链接注册的用户会出现在此处）</Text>
          )}
        </div>

        {/* Member filter */}
        {members.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 8, padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text strong style={{ whiteSpace: 'nowrap' }}>图表筛选</Text>
            <Select
              multiple
              value={currentSelected}
              onChange={handleSelectChange}
              style={{ flex: 1, minWidth: 0 }}
              maxTagCount={5}
              placeholder="选择要展示的成员"
              optionList={members.map(m => ({ value: m.id, label: memberLabel(m) }))}
            />
            <Button size="small" onClick={handleSelectAll}>全选</Button>
            <Button size="small" onClick={handleClearAll}>全不选</Button>
          </div>
        )}

        {/* Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <Title heading={5} style={{ marginBottom: 8 }}>每日消耗金额</Title>
            <StatsChart members={members} stats={stats} hiddenIds={hiddenIds} mode="cost" />
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <Title heading={5} style={{ marginBottom: 8 }}>每日消耗金额（分组堆叠）</Title>
            <GroupDailyQuotaChart groupStats={groupStats} />
          </div>
          <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
            <Title heading={5} style={{ marginBottom: 8 }}>每日 Token 消耗（按模型）</Title>
            <ModelTokenChart members={members} modelStats={modelStats} hiddenIds={hiddenIds} />
          </div>
        </div>

        {/* Token Manager - last */}
        <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginTop: 16 }}>
          <Title heading={5} style={{ marginBottom: 12 }}>订阅可用性</Title>
          <KumaStatus />
        </div>

        {/* Ranking */}
        <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginTop: 16 }}>
          <Title heading={5} style={{ marginBottom: 8 }}>消耗排行榜</Title>
          <RankingChart members={members} stats={stats} />
        </div>

        {/* Token Manager */}
        <div style={{ background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,.08)', marginTop: 16 }}>
          <Title heading={5} style={{ marginBottom: 12 }}>令牌管理</Title>
          <TokenManager members={members} />
        </div>
      </Spin>
    </div>
  )
}
