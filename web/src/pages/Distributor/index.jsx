import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Button, Form, Modal, Tabs, TabPane, Tag, Input } from '@douyinfe/semi-ui';
import { Row, Col } from '@douyinfe/semi-ui';
import { IconHistory } from '@douyinfe/semi-icons';
import { CreditCard, Tag as PriceTag, Copy, Users } from 'lucide-react';
import { copy } from '../../helpers/utils';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess, timestamp2string, getCurrencyConfig } from '../../helpers';

const { Text, Title } = Typography;

const DistributorCenter = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('commission');
  const [commissions, setCommissions] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [totalWithdraws, setTotalWithdraws] = useState(0);
  const [totalLedger, setTotalLedger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  
  const [page, setPage] = useState(1);
  const [user, setUser] = useState({});
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const [affLink, setAffLink] = useState('');
  
  const currencySymbol = getCurrencyConfig().symbol;

  const fetchUser = async () => {
    setUserLoading(true);
    try {
      const res = await API.get('/api/user/self');
      const { success, message, data } = res.data;
      if (success) {
        setUser(data);
      } else {
        showError(message);
      }
    } catch (e) {
      showError(e.message);
    }
    setUserLoading(false);
  };

  const getAffLink = async () => {
    const res = await API.get('/api/user/aff');
    const { success, message, data } = res.data;
    if (success) {
      setAffLink(`${window.location.origin}/register?aff=${data}`);
    } else {
      showError(message);
    }
  };

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/user/commission/logs?p=${page - 1}`);
      if (res.data.success) {
        setCommissions(res.data.data.items || []);
        setTotalCommissions(res.data.data.total || 0);
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    }
    setLoading(false);
  };

  const fetchWithdraws = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/user/withdraw/logs?p=${page - 1}`);
      if (res.data.success) {
        setWithdraws(res.data.data.items || []);
        setTotalWithdraws(res.data.data.total || 0);
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    }
    setLoading(false);
  };

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/api/user/cash/ledger?p=${page - 1}`);
      if (res.data.success) {
        setLedger(res.data.data.items || []);
        setTotalLedger(res.data.data.total || 0);
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
    getAffLink();
  }, []);

  useEffect(() => {
    if (activeTab === 'commission') fetchCommissions();
    if (activeTab === 'withdraw') fetchWithdraws();
    if (activeTab === 'ledger') fetchLedger();
  }, [activeTab, page]);

  const handleApplyWithdraw = async (values) => {
    try {
      const res = await API.post('/api/user/withdraw', values);
      if (res.data.success) {
        showSuccess(res.data.message);
        setIsApplyModalVisible(false);
        fetchUser();
        setActiveTab('withdraw');
        fetchWithdraws();
      } else {
        showError(res.data.message);
      }
    } catch (e) {
      showError(e.message);
    }
  };

  const handleAffLinkClick = async () => {
    await copy(affLink);
    showSuccess(t('邀请链接已复制到剪切板'));
  };

  const commissionColumns = [
    { title: t('时间'), dataIndex: 'created_at', render: (val) => timestamp2string(val) },
    { title: t('充值用户'), dataIndex: 'invitee_display_name', render: (val, row) => val || `ID:${row.invitee_id}` },
    { title: t('产生的充值总金额'), dataIndex: 'topUp_amount', render: (val) => `${currencySymbol}${val}` },
    { title: t('分佣比例'), dataIndex: 'ratio', render: (val) => `${(val * 100).toFixed(2)}%` },
    { title: t('获得提成'), dataIndex: 'amount', render: (val) => <Text type="success">+{currencySymbol}{val.toFixed(2)}</Text> },
  ];

  const withdrawColumns = [
    { title: t('申请时间'), dataIndex: 'created_at', render: (val) => timestamp2string(val) },
    { title: t('提现金额'), dataIndex: 'amount', render: (val) => `${currencySymbol}${val.toFixed(2)}` },
    { title: t('收款账号'), dataIndex: 'account_info' },
    { title: t('打款状态'), dataIndex: 'status', render: (val) => {
      switch(val) {
        case 0: return <Tag color="orange">{t('待审核')}</Tag>;
        case 1: return <Tag color="green">{t('已打款')}</Tag>;
        case 2: return <Tag color="red">{t('已驳回')}</Tag>;
        default: return <Tag>{t('未知')}</Tag>;
      }
    }},
    { title: t('备注/流水号'), dataIndex: 'remark' },
  ];

  const ledgerColumns = [
    { title: t('时间'), dataIndex: 'created_at', render: (val) => timestamp2string(val) },
    { title: t('变动金额'), dataIndex: 'amount', render: (val) => (
      <Text type={val > 0 ? 'success' : 'danger'}>{val > 0 ? '+' : ''}{currencySymbol}{val.toFixed(2)}</Text>
    )},
    { title: t('余额快照'), dataIndex: 'balance', render: (val) => `${currencySymbol}${val.toFixed(2)}` },
    { title: t('类型'), dataIndex: 'type', render: (val) => {
      switch(val) {
        case 1: return <Tag color="green">{t('佣金收入')}</Tag>;
        case 2: return <Tag color="orange">{t('提现扣款')}</Tag>;
        case 3: return <Tag color="blue">{t('提现退款')}</Tag>;
        default: return <Tag>{t('未知')}</Tag>;
      }
    }},
    { title: t('备注'), dataIndex: 'remark' },
  ];

  return (
    <div className='mt-[60px] px-2'>
      <Title heading={3} style={{ margin: '0 0 20px 0' }}>{t('联盟营销中心')}</Title>

      {!user.is_distributor && !userLoading && (
        <Card style={{ marginBottom: 20 }}>
          <Text type="secondary">{t('您当前尚未开通分销员权限，请联系管理员开通。')}</Text>
        </Card>
      )}

      {user.is_distributor && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={8}>
              <Card style={{ borderRadius: '16px', height: '100%' }} loading={userLoading}>
                <Text type="tertiary" size="small">{t('可提现余额')}</Text>
                <Title heading={2} style={{ margin: '8px 0' }}>{currencySymbol}{(user.cash_balance || 0).toFixed(2)}</Title>
                <Button type="primary" theme="solid" onClick={() => setIsApplyModalVisible(true)}>{t('申请提现')}</Button>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={{ borderRadius: '16px', height: '100%' }} loading={userLoading}>
                <Text type="tertiary" size="small">{t('您的专属分红比例')}</Text>
                <Title heading={2} style={{ margin: '8px 0' }}>{((user.distributor_ratio || 0) * 100).toFixed(1)}%</Title>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card style={{ borderRadius: '16px', height: '100%' }} loading={userLoading}>
                <Text type="tertiary" size="small">{t('邀请人数')}</Text>
                <Title heading={2} style={{ margin: '8px 0', display: 'flex', alignItems: 'center' }}>
                  <Users size={24} style={{ marginRight: 8, color: 'var(--semi-color-text-2)' }} />
                  {user.aff_count || 0}
                </Title>
              </Card>
            </Col>
          </Row>

          <Card style={{ borderRadius: '16px', marginBottom: 20 }} title={<Text type="tertiary" size="small">{t('您的专属邀请链接')}</Text>}>
            <Input
              value={affLink}
              readonly
              autoFocus={false}
              suffix={
                <Button
                  type='primary'
                  theme='solid'
                  onClick={handleAffLinkClick}
                  icon={<Copy size={14} />}
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                >
                  {t('复制链接')}
                </Button>
              }
            />
          </Card>

          <Card style={{ borderRadius: '16px' }}>
            <Tabs type="line" activeKey={activeTab} onChange={v => { setActiveTab(v); setPage(1); }}>
              <TabPane tab={<span style={{display:'flex',alignItems:'center',gap:6}}><PriceTag size={14}/>{t('收益明细')}</span>} itemKey="commission">
                <Table
                  columns={commissionColumns}
                  dataSource={commissions}
                  loading={loading}
                  pagination={{
                    currentPage: page,
                    pageSize: 10,
                    total: totalCommissions,
                    onPageChange: setPage,
                  }}
                />
              </TabPane>
              <TabPane tab={<span style={{display:'flex',alignItems:'center',gap:6}}><IconHistory size={14}/>{t('提现记录')}</span>} itemKey="withdraw">
                <Table
                  columns={withdrawColumns}
                  dataSource={withdraws}
                  loading={loading}
                  pagination={{
                    currentPage: page,
                    pageSize: 10,
                    total: totalWithdraws,
                    onPageChange: setPage,
                  }}
                />
              </TabPane>
              <TabPane tab={<span style={{display:'flex',alignItems:'center',gap:6}}><CreditCard size={14}/>{t('账户流水')}</span>} itemKey="ledger">
                <Table
                  columns={ledgerColumns}
                  dataSource={ledger}
                  loading={loading}
                  pagination={{
                    currentPage: page,
                    pageSize: 10,
                    total: totalLedger,
                    onPageChange: setPage,
                  }}
                />
              </TabPane>
            </Tabs>
          </Card>
        </>
      )}

      <Modal
        title={t('发起提现请求')}
        visible={isApplyModalVisible}
        onCancel={() => setIsApplyModalVisible(false)}
        footer={null}
      >
        <Form onSubmit={handleApplyWithdraw}>
          <Form.InputNumber 
            field="amount" 
            label={t('提现金额')} 
            prefix={currencySymbol} 
            max={user.cash_balance} 
            min={0.01} 
            rules={[{ required: true, message: t('请输入金额') }]} 
            style={{ width: '100%' }}
          />
          <Form.TextArea 
            field="account_info" 
            label={t('打款账户信息')} 
            placeholder={t('例如：支付宝号 138xxxx / 姓名：张三 / 或 USDT-TRC20 地址')} 
            rules={[{ required: true, message: t('请输入账户信息') }]}
          />
          <Button type="primary" htmlType="submit" theme="solid" style={{ width: '100%', marginTop: 20 }}>
            {t('提交申请')}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default DistributorCenter;
