# Design: 用户每日消耗金额堆叠柱状图

**Date:** 2026-04-28
**Status:** Approved

## Overview

在 Dashboard 的 `ChartsPanel` 中新增一个 Tab，展示每个用户（分组）每日消耗金额的堆叠柱状图。管理员可见所有用户（Top 10），普通用户只看自己的每日消耗。

## Feature Description

- **卡片位置**：`ChartsPanel` 中新增 Tab，与现有"模型消耗分布"、"用户消耗趋势"等 Tab 并列
- **图表类型**：堆叠柱状图（`type: 'bar'`, `stack: true`）
- **X 轴**：日期（time bucket，与现有图表一致）
- **Y 轴**：消耗金额（quota，用 `renderQuota` 格式化显示）
- **Series**：用户名（User 字段）
- **颜色**：复用现有 `USER_COLORS` 数组

### 管理员视图
- 数据来源：`/api/data/users`（已有接口 `loadUserQuotaData()`）
- 展示 Top 10 消耗用户
- 每用户一种颜色，堆叠展示每日总消耗

### 普通用户视图
- 数据来源：`/api/data/self/`（已有接口 `loadQuotaData()`）
- 将多 model_name 的数据按日期聚合（合并同一天的 quota）
- 退化为单色单用户柱状图

## Architecture

### Files to Change

| 文件 | 改动内容 |
|------|----------|
| `web/src/hooks/dashboard/useDashboardCharts.jsx` | 新增 `spec_user_daily_stack` 状态；新增 `updateUserDailyStackChart()` 函数；在 `updateUserChartData` 中同步调用；在 return 中暴露新状态 |
| `web/src/components/dashboard/ChartsPanel.jsx` | 新增 Tab 项"用户每日消耗"；传入 `spec_user_daily_stack` 和 `isAdminUser`；普通用户也可见（用自身聚合数据） |
| `web/src/components/dashboard/index.jsx` | 将 `spec_user_daily_stack` 和 `updateUserDailyStackChart` 从 `dashboardCharts` 传给 `ChartsPanel` |
| `web/src/hooks/dashboard/useDashboardData.js` | 普通用户在 `loadQuotaData` 后聚合自身每日数据，通过回调传给图表更新函数 |
| `web/src/i18n/locales/*.json` | 新增 `用户每日消耗` 翻译 key |

### Data Flow

```
管理员:
  loadUserQuotaData() → /api/data/users
    → updateUserChartData() [已有]
      → processUserData() [已有, 复用]
        → updateUserDailyStackChart() [新增]

普通用户:
  loadQuotaData() → /api/data/self/
    → updateChartData() [已有]
      → aggregateSelfDailyData() [新增辅助函数]
        → updateUserDailyStackChart() [新增]
```

### New Chart Spec: `spec_user_daily_stack`

```js
{
  type: 'bar',
  data: [{ id: 'userDailyStackData', values: [] }],
  xField: 'Time',
  yField: 'rawQuota',
  seriesField: 'User',
  stack: true,
  legends: { visible: true, selectMode: 'single' },
  title: { visible: true, text: t('用户每日消耗'), subtext: '' },
  bar: { state: { hover: { stroke: '#000', lineWidth: 1 } } },
  axes: [{
    orient: 'left',
    label: { formatMethod: (value) => renderQuota(value, 2) },
  }],
  tooltip: {
    // dimension tooltip: 按日期汇总，展示各用户+总计
    // mark tooltip: 单条 bar 展示用户名+金额
  },
  color: { type: 'ordinal', range: USER_COLORS },
}
```

## Error Handling

- 数据为空时图表显示空状态（VChart 默认行为，无需额外处理）
- 普通用户聚合失败时静默降级（不更新图表，保持空状态）

## i18n

新增翻译 key：`用户每日消耗`，需在所有语言文件（zh/en/fr/ru/ja/vi）中添加对应翻译。

## Out of Scope

- 不新增后端 API（复用现有接口）
- 不改变数据刷新逻辑（跟随现有 refresh 流程）
- 不改变时间范围选择逻辑（复用 `dataExportDefaultTime`）
