import React, { useState } from 'react'
import { Form, Button, Toast, Card, Typography } from '@douyinfe/semi-ui'
import { login } from '../../api/client'
import { useNavigate } from 'react-router-dom'

const { Title } = Typography

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async ({ username, password }) => {
    setLoading(true)
    try {
      const res = await login(username, password)
      if (res.success) {
        navigate('/')
      } else {
        Toast.error(res.message || '登录失败')
      }
    } catch {
      Toast.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f5' }}>
      <Card style={{ width: 360 }}>
        <Title heading={3} style={{ marginBottom: 24, textAlign: 'center' }}>团队看板登录</Title>
        <Form onSubmit={handleSubmit} layout="vertical">
          <Form.Input
            field="username"
            label="用户名"
            placeholder="请输入用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          />
          <Form.Input
            field="password"
            label="密码"
            type="password"
            placeholder="请输入密码"
            rules={[{ required: true, message: '请输入密码' }]}
          />
          <Button htmlType="submit" type="primary" block loading={loading} style={{ marginTop: 8 }}>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  )
}
