/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React from 'react';
import {
  Avatar,
  Typography,
  Card,
  Button,
  Input,
  Badge,
  Space,
} from '@douyinfe/semi-ui';
import { Copy, Users, BarChart2, TrendingUp, Gift, Zap } from 'lucide-react';

const { Text } = Typography;

const InvitationCard = ({
  t,
  userState,
  renderQuota,
  setOpenTransfer,
  affLink,
  handleAffLinkClick,
  onApplyDistributor,
}) => {
  return (
    <Card className='!rounded-2xl shadow-sm border-0'>
      {/* 卡片头部 */}
      <div className='flex items-center mb-4'>
        <Avatar size='small' color='green' className='mr-3 shadow-md'>
          <Gift size={16} />
        </Avatar>
        <div>
          <Typography.Text className='text-lg font-medium'>
            {t('邀请奖励')}
          </Typography.Text>
          <div className='text-xs'>{t('邀请好友获得额外奖励')}</div>
        </div>
      </div>

      {/* 收益展示区域 */}
      <Space vertical style={{ width: '100%' }}>
        {/* 统计数据统一卡片 */}
        <Card
          className='!rounded-xl w-full'
          cover={
            <div
              className='relative h-30'
              style={{
                '--palette-primary-darkerChannel': '0 75 80',
                backgroundImage: `linear-gradient(0deg, rgba(var(--palette-primary-darkerChannel) / 80%), rgba(var(--palette-primary-darkerChannel) / 80%)), url('/cover-4.webp')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {/* 标题和按钮 */}
              <div className='relative z-10 h-full flex flex-col justify-between p-4'>
                <div className='flex justify-between items-center'>
                  <Text strong style={{ color: 'white', fontSize: '16px' }}>
                    {t('收益统计')}
                  </Text>
                  <Button
                    type='primary'
                    theme='solid'
                    size='small'
                    disabled={
                      !userState?.user?.aff_quota ||
                      userState?.user?.aff_quota <= 0
                    }
                    onClick={() => setOpenTransfer(true)}
                    className='!rounded-lg'
                  >
                    <Zap size={12} className='mr-1' />
                    {t('划转到余额')}
                  </Button>
                </div>

                {/* 统计数据 */}
                <div className='grid grid-cols-3 gap-6 mt-4'>
                  {/* 待使用收益 */}
                  <div className='text-center'>
                    <div
                      className='text-base sm:text-2xl font-bold mb-2'
                      style={{ color: 'white' }}
                    >
                      {renderQuota(userState?.user?.aff_quota || 0)}
                    </div>
                    <div className='flex items-center justify-center text-sm'>
                      <TrendingUp
                        size={14}
                        className='mr-1'
                        style={{ color: 'rgba(255,255,255,0.8)' }}
                      />
                      <Text
                        style={{
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '12px',
                        }}
                      >
                        {t('待使用收益')}
                      </Text>
                    </div>
                  </div>

                  {/* 总收益 */}
                  <div className='text-center'>
                    <div
                      className='text-base sm:text-2xl font-bold mb-2'
                      style={{ color: 'white' }}
                    >
                      {renderQuota(userState?.user?.aff_history_quota || 0)}
                    </div>
                    <div className='flex items-center justify-center text-sm'>
                      <BarChart2
                        size={14}
                        className='mr-1'
                        style={{ color: 'rgba(255,255,255,0.8)' }}
                      />
                      <Text
                        style={{
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '12px',
                        }}
                      >
                        {t('总收益')}
                      </Text>
                    </div>
                  </div>

                  {/* 邀请人数 */}
                  <div className='text-center'>
                    <div
                      className='text-base sm:text-2xl font-bold mb-2'
                      style={{ color: 'white' }}
                    >
                      {userState?.user?.aff_count || 0}
                    </div>
                    <div className='flex items-center justify-center text-sm'>
                      <Users
                        size={14}
                        className='mr-1'
                        style={{ color: 'rgba(255,255,255,0.8)' }}
                      />
                      <Text
                        style={{
                          color: 'rgba(255,255,255,0.8)',
                          fontSize: '12px',
                        }}
                      >
                        {t('邀请人数')}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          {/* 邀请链接部分 */}
          <Input
            value={affLink}
            readonly
            className='!rounded-lg'
            prefix={t('邀请链接')}
            suffix={
              <Button
                type='primary'
                theme='solid'
                onClick={handleAffLinkClick}
                icon={<Copy size={14} />}
                className='!rounded-lg'
              >
                {t('复制')}
              </Button>
            }
          />
        </Card>

        {/* 奖励说明 */}
        {!userState?.user?.is_distributor ? (
          <Card className='!rounded-xl w-full' title={<Text type='tertiary'>{t('奖励模式对比')}</Text>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* 普通模式 */}
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--semi-color-fill-0)' }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('普通邀请')}</Text>
                {[
                  { ok: true,  text: t('好友注册得额度奖励') },
                  { ok: true,  text: t('额度可划转到余额使用') },
                  { ok: false, text: t('无现金佣金') },
                  { ok: false, text: t('无法提现') },
                ].map((item, i) => (
                  <div key={i} className='flex items-center gap-2' style={{ marginBottom: 6 }}>
                    <Text type={item.ok ? 'success' : 'tertiary'} style={{ fontSize: 14 }}>{item.ok ? '✓' : '✗'}</Text>
                    <Text type='tertiary' style={{ fontSize: 13 }}>{item.text}</Text>
                  </div>
                ))}
              </div>
              {/* 分销员模式 */}
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--semi-color-primary-light-default)' }}>
                <Text strong style={{ display: 'block', marginBottom: 8, color: 'var(--semi-color-primary)' }}>{t('分销员专属')}</Text>
                {[
                  { ok: false, text: t('好友注册不得额度') },
                  { ok: true,  text: t('好友充值得现金佣金') },
                  { ok: true,  text: t('可申请提现到账') },
                ].map((item, i) => (
                  <div key={i} className='flex items-center gap-2' style={{ marginBottom: 6 }}>
                    <Text type={item.ok ? 'success' : 'tertiary'} style={{ fontSize: 14 }}>{item.ok ? '✓' : '✗'}</Text>
                    <Text type='tertiary' style={{ fontSize: 13 }}>{item.text}</Text>
                  </div>
                ))}
              </div>
            </div>
            <div className='pt-3'>
              <Button type='primary' theme='light' onClick={onApplyDistributor} style={{ width: '100%' }}>
                {t('申请成为分销员')}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className='!rounded-xl w-full' title={<Text type='tertiary'>{t('奖励说明')}</Text>}>
            <div className='space-y-3'>
              <div className='flex items-start gap-2'>
                <Badge dot type='success' />
                <Text type='tertiary' className='text-sm'>{t('好友充值后您可获得相应现金佣金')}</Text>
              </div>
              <div className='flex items-start gap-2'>
                <Badge dot type='success' />
                <Text type='tertiary' className='text-sm'>{t('佣金累积后可申请提现')}</Text>
              </div>
              <div className='flex items-start gap-2'>
                <Badge dot type='success' />
                <Text type='tertiary' className='text-sm'>{t('邀请的好友越多，获得的佣金越多')}</Text>
              </div>
            </div>
          </Card>
        )}
      </Space>
    </Card>
  );
};

export default InvitationCard;
