import React, { useEffect, useState, useCallback } from 'react'
import { Button, Tooltip, Typography } from '@douyinfe/semi-ui'
import { IconRefresh } from '@douyinfe/semi-icons'
import { getKumaStatus } from '../../api/client'

const { Text } = Typography

const StatusDot = ({ status }) => (
  <span style={{
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: status === 1 ? '#00c853' : '#ff1744',
    flexShrink: 0,
  }} />
)

const HeartbeatBar = ({ heartbeats }) => (
  <div style={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
    {heartbeats.map((hb, i) => (
      <Tooltip
        key={i}
        content={
          <div style={{ fontSize: 12 }}>
            <div>{hb.time}</div>
            <div>{hb.status === 1 ? '✅ 在线' : '❌ 离线'}{hb.ping > 0 ? `  ${hb.ping}ms` : ''}</div>
          </div>
        }
      >
        <div style={{
          width: 10,
          height: 24,
          borderRadius: 3,
          background: hb.status === 1 ? '#00c853' : '#ff1744',
          cursor: 'default',
          flexShrink: 0,
        }} />
      </Tooltip>
    ))}
  </div>
)

export default function KumaStatus() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getKumaStatus()
      if (res.success) {
        setGroups(res.data || [])
        setLastUpdated(new Date())
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const timer = setInterval(fetchStatus, 60000)
    return () => clearInterval(timer)
  }, [fetchStatus])

  const allMonitors = groups.flatMap(g => g.monitors || [])
  const upCount = allMonitors.filter(m => m.status === 1).length
  const total = allMonitors.length
  const allUp = upCount === total && total > 0

  return (
    <div>
      {/* 总览行 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status={allUp ? 1 : 0} />
          <Text strong style={{ fontSize: 13 }}>
            {allUp ? '所有服务运行正常' : `${total - upCount} 个服务异常`}
          </Text>
          <Text type="tertiary" style={{ fontSize: 12 }}>{upCount}/{total} 在线</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastUpdated && (
            <Text type="tertiary" style={{ fontSize: 11 }}>
              {lastUpdated.toLocaleTimeString('zh-CN')} 更新
            </Text>
          )}
          <Button size="small" icon={<IconRefresh />} theme="borderless" loading={loading} onClick={fetchStatus} />
        </div>
      </div>

      {/* 服务列表 */}
      {groups.map(group => (
        <div key={group.name}>
          {groups.length > 1 && (
            <Text type="tertiary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>{group.name}</Text>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(group.monitors || []).map(m => (
              <div key={m.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                background: '#fafafa',
                borderRadius: 6,
                border: '1px solid #f0f0f0',
              }}>
                {/* 状态点 + 名称 */}
                <StatusDot status={m.status} />
                <Text style={{ fontSize: 13, width: 80, flexShrink: 0 }}>{m.name}</Text>

                {/* 心跳方块 */}
                <HeartbeatBar heartbeats={m.heartbeats || []} />

                {/* 右侧信息 */}
                <div style={{ display: 'flex', gap: 16, flexShrink: 0, alignItems: 'center' }}>
                  {m.ping > 0 && (
                    <Tooltip content="最新延迟">
                      <Text type="tertiary" style={{ fontSize: 12 }}>{m.ping}ms</Text>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
