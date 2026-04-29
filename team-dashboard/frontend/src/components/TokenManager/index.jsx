import React, { useEffect, useState, useCallback } from 'react'
import { Table, Button, Tag, Typography } from '@douyinfe/semi-ui'
import { IconRefresh } from '@douyinfe/semi-icons'
import { getTokens } from '../../api/client'

const { Text } = Typography


export default function TokenManager({ members }) {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(false)

  const memberMap = Object.fromEntries(members.map(m => {
    const dn = m.display_name?.trim()
    const label = dn && dn !== m.username ? `${m.username}(${dn})` : m.username
    return [m.id, label]
  }))

  const fetchTokens = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getTokens()
      if (res.success) setTokens(res.data || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTokens() }, [fetchTokens])

  const columns = [
    {
      title: '成员',
      dataIndex: 'user_id',
      render: id => memberMap[id] || `用户 ${id}`,
      width: 100,
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: status => (
        <Tag color={status === 1 ? 'green' : 'grey'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_time',
      width: 120,
      render: ts => new Date(ts * 1000).toLocaleDateString('zh-CN'),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button icon={<IconRefresh />} onClick={fetchTokens} loading={loading}>刷新</Button>
      </div>

      <Table
        columns={columns}
        dataSource={tokens}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        size="small"
        empty={<Text type="tertiary">暂无令牌</Text>}
      />
    </div>
  )
}
