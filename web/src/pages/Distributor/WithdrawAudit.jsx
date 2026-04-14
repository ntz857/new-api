import React, { useEffect, useState } from 'react';
import { Card, Typography, Table, Button, Form, Modal, Tag, Space, Tabs, TabPane, InputNumber } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess, timestamp2string, getCurrencyConfig } from '../../helpers';

const { Text, Title } = Typography;

const DistributorAdmin = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('withdraw');
  const [page, setPage] = useState(1);
  const currencySymbol = getCurrencyConfig().symbol;
  const [minWithdraw, setMinWithdraw] = useState(1);

  useEffect(() => {
    API.get('/api/option/').then(res => {
      if (res.data.success) {
        const opt = res.data.data.find(o => o.key === 'MinWithdraw');
        if (opt) setMinWithdraw(parseFloat(opt.value) || 1);
      }
    });
  }, []);

  const saveMinWithdraw = async () => {
    const res = await API.put('/api/option/', { key: 'MinWithdraw', value: String(minWithdraw) });
    if (res.data.success) showSuccess(t('保存成功'));
    else showError(res.data.message);
  };

  // 提现审核
  const [withdraws, setWithdraws] = useState([]);
  const [withdrawTotal, setWithdrawTotal] = useState(0);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [currentWithdraw, setCurrentWithdraw] = useState(null);

  // 分销员管理
  const [distributors, setDistributors] = useState([]);
  const [distributorTotal, setDistributorTotal] = useState(0);
  const [distributorLoading, setDistributorLoading] = useState(false);
  const [setModalVisible, setSetModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 佣金记录
  const [commissions, setCommissions] = useState([]);
  const [commissionTotal, setCommissionTotal] = useState(0);
  const [commissionLoading, setCommissionLoading] = useState(false);

  // 申请审核
  const [applications, setApplications] = useState([]);
  const [applicationTotal, setApplicationTotal] = useState(0);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [auditAppModalVisible, setAuditAppModalVisible] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);

  const fetchWithdraws = async () => {
    setWithdrawLoading(true);
    try {
      const res = await API.get(`/api/user/withdraw/logs/all?p=${page - 1}`);
      if (res.data.success) {
        setWithdraws(res.data.data.items || []);
        setWithdrawTotal(res.data.data.total || 0);
      } else showError(res.data.message);
    } catch (e) { showError(e.message); }
    setWithdrawLoading(false);
  };

  const fetchDistributors = async () => {
    setDistributorLoading(true);
    try {
      const res = await API.get(`/api/user/distributor/list?p=${page - 1}`);
      if (res.data.success) {
        setDistributors(res.data.data.items || []);
        setDistributorTotal(res.data.data.total || 0);
      } else showError(res.data.message);
    } catch (e) { showError(e.message); }
    setDistributorLoading(false);
  };

  const fetchCommissions = async () => {
    setCommissionLoading(true);
    try {
      const res = await API.get(`/api/user/commission/logs/all?p=${page - 1}`);
      if (res.data.success) {
        setCommissions(res.data.data.items || []);
        setCommissionTotal(res.data.data.total || 0);
      } else showError(res.data.message);
    } catch (e) { showError(e.message); }
    setCommissionLoading(false);
  };

  const fetchApplications = async () => {
    setApplicationLoading(true);
    try {
      const res = await API.get(`/api/user/distributor/applications?p=${page - 1}`);
      if (res.data.success) {
        setApplications(res.data.data.items || []);
        setApplicationTotal(res.data.data.total || 0);
      } else showError(res.data.message);
    } catch (e) { showError(e.message); }
    setApplicationLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'withdraw') fetchWithdraws();
    if (activeTab === 'distributor') fetchDistributors();
    if (activeTab === 'commission') fetchCommissions();
    if (activeTab === 'application') fetchApplications();
  }, [activeTab, page]);

  const handleAudit = async (values) => {
    try {
      const res = await API.put('/api/user/withdraw/audit', {
        id: currentWithdraw.id,
        status: values.status,
        remark: values.remark || '',
      });
      if (res.data.success) {
        showSuccess(t('审核处理成功'));
        setAuditModalVisible(false);
        fetchWithdraws();
      } else showError(res.data.message);
    } catch (e) { showError(e.message); }
  };

  const handleSetDistributor = async (values) => {
    try {
      const res = await API.post('/api/user/distributor/set', {
        user_id: currentUser.id,
        is_distributor: values.is_distributor,
        ratio: parseFloat(values.ratio_pct) / 100 || 0,
      });
      if (res.data.success) {
        showSuccess(t('设置成功'));
        setSetModalVisible(false);
        fetchDistributors();
      } else showError(res.data.message);
    } catch (e) { showError(e.message); }
  };

  const withdrawColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: t('用户ID'), dataIndex: 'user_id', width: 80 },
    { title: t('申请时间'), dataIndex: 'created_at', render: (val) => timestamp2string(val) },
    { title: t('提现金额'), dataIndex: 'amount', render: (val) => <Text type="danger" strong>{currencySymbol}{val.toFixed(2)}</Text> },
    { title: t('收款账号'), dataIndex: 'account_info' },
    { title: t('状态'), dataIndex: 'status', render: (val) => {
      const map = { 0: ['orange', t('待审核')], 1: ['green', t('已打款')], 2: ['red', t('已驳回')] };
      const [color, label] = map[val] || ['grey', t('未知')];
      return <Tag color={color}>{label}</Tag>;
    }},
    { title: t('备注'), dataIndex: 'remark' },
    { title: t('审核人ID'), dataIndex: 'audit_by' },
    { title: t('操作'), render: (_, record) => record.status === 0 ? (
      <Button size="small" type="primary" onClick={() => { setCurrentWithdraw(record); setAuditModalVisible(true); }}>
        {t('处理')}
      </Button>
    ) : null },
  ];

  const distributorColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: t('用户名'), dataIndex: 'username' },
    { title: t('显示名'), dataIndex: 'display_name' },
    { title: t('邮箱'), dataIndex: 'email' },
    { title: t('分佣比例'), dataIndex: 'distributor_ratio', render: (val) => `${(val * 100).toFixed(1)}%` },
    { title: t('可提现余额'), dataIndex: 'cash_balance', render: (val) => `${currencySymbol}${(val || 0).toFixed(2)}` },
    { title: t('邀请人数'), dataIndex: 'aff_count' },
    { title: t('操作'), render: (_, record) => (
      <Space>
        <Button size="small" type="primary" theme="light" onClick={() => { setCurrentUser(record); setSetModalVisible(true); }}>
          {t('编辑')}
        </Button>
        <Button size="small" type="danger" theme="light" onClick={() => {
          Modal.confirm({
            title: t('确认关闭分销权限'),
            content: t('关闭后该用户将不再获得分销佣金'),
            onOk: () => API.post('/api/user/distributor/set', { user_id: record.id, is_distributor: false, ratio: 0 })
              .then(res => { if (res.data.success) { showSuccess(t('已关闭')); fetchDistributors(); } else showError(res.data.message); }),
          });
        }}>
          {t('关闭')}
        </Button>
      </Space>
    )},
  ];

  const commissionColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: t('分销员ID'), dataIndex: 'user_id' },
    { title: t('充值用户'), dataIndex: 'invitee_display_name', render: (val, row) => val || `ID:${row.invitee_id}` },
    { title: t('充值金额'), dataIndex: 'topUp_amount', render: (val) => `${currencySymbol}${val}` },
    { title: t('分佣比例'), dataIndex: 'ratio', render: (val) => `${(val * 100).toFixed(2)}%` },
    { title: t('佣金'), dataIndex: 'amount', render: (val) => <Text type="success">+{currencySymbol}{val.toFixed(2)}</Text> },
    { title: t('时间'), dataIndex: 'created_at', render: (val) => timestamp2string(val) },
  ];

  const applicationColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: t('用户ID'), dataIndex: 'user_id' },
    { title: t('申请理由'), dataIndex: 'reason' },
    { title: t('状态'), dataIndex: 'status', render: (val) => {
      const map = { 0: ['orange', t('待审核')], 1: ['green', t('已通过')], 2: ['red', t('已拒绝')] };
      const [color, label] = map[val] || ['grey', t('未知')];
      return <Tag color={color}>{label}</Tag>;
    }},
    { title: t('备注'), dataIndex: 'remark' },
    { title: t('申请时间'), dataIndex: 'created_at', render: (val) => timestamp2string(val) },
    { title: t('操作'), render: (_, record) => record.status === 0 ? (
      <Button size="small" type="primary" onClick={() => { setCurrentApp(record); setAuditAppModalVisible(true); }}>
        {t('审核')}
      </Button>
    ) : null },
  ];

  return (
    <div className='mt-[60px] px-2'>
      <Title heading={3} style={{ margin: '20px 0' }}>{t('分销管理')}</Title>
      <Card style={{ marginBottom: 16 }}>
        <Space align="center">
          <Text>{t('最低提现金额')}</Text>
          <InputNumber
            min={0}
            value={minWithdraw}
            onChange={v => setMinWithdraw(v || 0)}
            style={{ width: 100 }}
          />
          <Button type="primary" theme="solid" onClick={saveMinWithdraw}>{t('保存')}</Button>
        </Space>
      </Card>
      <Card>
        <Tabs type="line" activeKey={activeTab} onChange={v => { setActiveTab(v); setPage(1); }}>
          <TabPane tab={t('提现审核')} itemKey="withdraw">
            <Table columns={withdrawColumns} dataSource={withdraws} loading={withdrawLoading}
              pagination={{ currentPage: page, pageSize: 10, total: withdrawTotal, onPageChange: setPage }} />
          </TabPane>
          <TabPane tab={t('分销员管理')} itemKey="distributor">
            <Table columns={distributorColumns} dataSource={distributors} loading={distributorLoading}
              pagination={{ currentPage: page, pageSize: 10, total: distributorTotal, onPageChange: setPage }} />
          </TabPane>
          <TabPane tab={t('佣金记录')} itemKey="commission">
            <Table columns={commissionColumns} dataSource={commissions} loading={commissionLoading}
              pagination={{ currentPage: page, pageSize: 10, total: commissionTotal, onPageChange: setPage }} />
          </TabPane>
          <TabPane tab={t('申请审核')} itemKey="application">
            <Table columns={applicationColumns} dataSource={applications} loading={applicationLoading}
              pagination={{ currentPage: page, pageSize: 10, total: applicationTotal, onPageChange: setPage }} />
          </TabPane>
        </Tabs>
      </Card>

      {/* 申请审核 Modal */}
      <Modal title={t('审核分销员申请')} visible={auditAppModalVisible} onCancel={() => setAuditAppModalVisible(false)} footer={null}>
        <Form onSubmit={async (values) => {
          try {
            const res = await API.put('/api/user/distributor/applications/audit', {
              id: currentApp.id,
              status: values.status,
              remark: values.remark || '',
              ratio: parseFloat(values.ratio_pct) / 100 || 0,
            });
            if (res.data.success) { showSuccess(t('审核完成')); setAuditAppModalVisible(false); fetchApplications(); }
            else showError(res.data.message);
          } catch (e) { showError(e.message); }
        }}>
          <div style={{ marginBottom: 16 }}>
            <p><strong>{t('用户ID')}：</strong>{currentApp?.user_id}</p>
            <p><strong>{t('申请理由')}：</strong>{currentApp?.reason || t('无')}</p>
          </div>
          <Form.RadioGroup field="status" label={t('审核结果')} rules={[{ required: true }]}>
            <Form.Radio value={1}>{t('通过')}</Form.Radio>
            <Form.Radio value={2}>{t('拒绝')}</Form.Radio>
          </Form.RadioGroup>
          <Form.Input
            field="ratio_pct"
            label={t('分佣比例（通过时必填）')}
            suffix="%"
            rules={[{
              validator: (_, v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) > 0 && parseFloat(v) <= 100),
              message: t('请输入 0~100 之间的数字'),
            }]}
            onKeyPress={e => { if (!/[\d.]/.test(e.key)) e.preventDefault(); }}
            style={{ width: '100%' }}
          />
          <Form.TextArea field="remark" label={t('备注')} />
          <Button type="primary" htmlType="submit" theme="solid" style={{ width: '100%', marginTop: 16 }}>{t('提交')}</Button>
        </Form>
      </Modal>

      {/* 提现审核 Modal */}
      <Modal title={t('处理提现申请')} visible={auditModalVisible} onCancel={() => setAuditModalVisible(false)} footer={null}>
        <Form onSubmit={handleAudit}>
          <div style={{ marginBottom: 16 }}>
            <p><strong>{t('申请金额')}：</strong>{currencySymbol}{currentWithdraw?.amount?.toFixed(2)}</p>
            <p><strong>{t('收款账户')}：</strong>{currentWithdraw?.account_info}</p>
          </div>
          <Form.RadioGroup field="status" label={t('处理结果')} rules={[{ required: true }]}>
            <Form.Radio value={1}>{t('同意并已打款')}</Form.Radio>
            <Form.Radio value={2}>{t('驳回请求')}</Form.Radio>
          </Form.RadioGroup>
          <Form.TextArea field="remark" label={t('打款凭证 / 驳回理由')} />
          <Button type="primary" htmlType="submit" theme="solid" style={{ width: '100%', marginTop: 16 }}>{t('提交')}</Button>
        </Form>
      </Modal>

      {/* 设置分销员 Modal */}
      <Modal title={t('设置分销员')} visible={setModalVisible} onCancel={() => setSetModalVisible(false)} footer={null}>
        <Form onSubmit={handleSetDistributor} initValues={{
          is_distributor: currentUser?.is_distributor ?? true,
          ratio_pct: currentUser?.distributor_ratio ? (currentUser.distributor_ratio * 100).toFixed(1) : '10',
        }}>
          <p style={{ marginBottom: 12 }}><strong>{t('用户')}：</strong>{currentUser?.username}（ID: {currentUser?.id}）</p>
          <Form.RadioGroup field="is_distributor" label={t('分销权限')} rules={[{ required: true }]}>
            <Form.Radio value={true}>{t('开启')}</Form.Radio>
            <Form.Radio value={false}>{t('关闭')}</Form.Radio>
          </Form.RadioGroup>
          <Form.Input
            field="ratio_pct"
            label={t('分佣比例')}
            suffix="%"
            rules={[{
              validator: (_, v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0 && parseFloat(v) <= 100,
              message: t('请输入 0~100 之间的数字'),
            }]}
            onKeyPress={e => { if (!/[\d.]/.test(e.key)) e.preventDefault(); }}
            style={{ width: '100%' }}
          />
          <Button type="primary" htmlType="submit" theme="solid" style={{ width: '100%', marginTop: 16 }}>{t('保存')}</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default DistributorAdmin;
