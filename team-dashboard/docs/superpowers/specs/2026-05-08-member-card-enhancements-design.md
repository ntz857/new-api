# MemberCard 增强设计文档

**日期：** 2026-05-08
**范围：** `team-dashboard/` 子项目（不影响 new-api 主项目）

---

## 目标

在 Dashboard 第一个板块（成员网格）的每个 MemberCard 中，新增两类数据展示：

1. **所选时间段内的消耗**（Token 数 + 金额）
2. **最近 10 分钟的首字响应时长均值**（avg frt）

---

## 卡片最终布局

```
┌─────────────────────────────┐
│ 姓名 (username)              │
├─────────────────────────────┤
│ 今日       X.Xk    $X.XX    │
│ 本月       X.Xk    $X.XX    │
│ 所选时间段  X.Xk    $X.XX    │  ← 新增
│ 首字响应   X.Xs             │  ← 新增
└─────────────────────────────┘
```

---

## 后端改动

### 1. `model/log.go` — 新增查询函数

```go
// GetMemberAvgFrt 返回各成员最近 10 分钟内的平均首字响应时长（毫秒）。
// key 为 user_id，value 为 avg frt（ms）。无数据的成员不出现在 map 中。
func GetMemberAvgFrt(memberIDs []int) (map[int]float64, error)
```

- 时间窗口：`created_at >= UNIX_NOW - 600`
- 聚合字段：`other` JSON 中的 `frt` 字段（毫秒整数）
- 数据库兼容：
  - SQLite：`CAST(json_extract(other, '$.frt') AS REAL)`
  - MySQL：`CAST(JSON_EXTRACT(other, '$.frt') AS DECIMAL(20,4))`
  - PostgreSQL：`CAST(other::json->>'frt' AS FLOAT)`
- 只统计 `frt` 不为 NULL / 不为 0 的记录
- 返回 `map[int]float64`

### 2. `controller/team.go` — 新增 Frt 接口

```
GET /api/frt
Auth: Bearer JWT（leader）
```

响应：
```json
{
  "success": true,
  "data": {
    "1": 1240.5,
    "2": 890.0
  }
}
```

- key 为 user_id（JSON number）
- value 为 avg frt（毫秒，float64）
- 无最近10分钟数据的成员不出现在 data 中

### 3. `router/router.go` — 注册路由

在 auth 路由组中添加：
```go
auth.GET("/frt", controller.Frt)
```

---

## 前端改动

### 1. `api/client.js` — 新增请求函数

```js
export const getFrt = () => get('/api/frt')
```

### 2. `pages/Dashboard/index.jsx`

- 新增 state：`frtMap`（`{ [userId]: avgFrtMs }`）
- `fetchData` 的 `Promise.all` 中加入 `getFrt()`，结果存入 `frtMap`
- Dashboard 层预聚合「所选时间段」数据（遍历 `stats` 对每个用户求和），以 `periodTokens` / `periodQuota` props 传给 MemberCard
- 将 `frtMap[m.id]` 作为 `frt` prop 传给 MemberCard

### 3. `components/MemberCard/index.jsx`

新增 props：
- `periodTokens: number` — 所选时间段内总 token 数
- `periodQuota: number` — 所选时间段内总 quota
- `frt: number | undefined` — 平均首字响应时长（毫秒），无数据为 undefined

新增展示行：

**所选时间段行：**
- 格式与今日/本月行一致：`fmtTokens(periodTokens)` + `fmtUSD(periodQuota)`

**首字响应行：**
- 值：`frt` 毫秒 ÷ 1000，保留 1 位小数，如 `2.3s`
- 无数据（undefined）显示 `--`
- 颜色规则：
  - `< 7s` → 绿色（`var(--semi-color-success)`）
  - `7s ~ 30s` → 橙色（`var(--semi-color-warning)`）
  - `> 30s` → 红色（`var(--semi-color-danger)`）

---

## 不变的部分

- 今日、本月两行保持不变
- 其余所有组件、接口、数据库表均不改动
- new-api 主项目完全不受影响

---

## 边界情况

| 情况 | 处理 |
|------|------|
| 成员最近 10 分钟无请求 | `frt` 为 undefined，显示 `--` |
| 所选时间段无数据 | `periodTokens=0, periodQuota=0`，正常显示 `0` / `$0.00` |
| frt 接口请求失败 | Toast.error 提示，`frtMap` 保持空对象，卡片显示 `--` |
