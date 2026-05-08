# MemberCard Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在每个 MemberCard 中新增「首字响应」（最近10分钟 avg frt）和「所选时间段消耗」两行数据展示。

**Architecture:** 后端新增 `GET /api/team/frt` 接口，批量返回所有成员的 avg frt；前端 Dashboard 将 frt 数据和时间段聚合数据作为 props 传给 MemberCard；MemberCard 新增两行展示。

**Tech Stack:** Go 1.22 / Gin / GORM / SQLite+MySQL+PostgreSQL；React 18 / Semi Design UI

---

## File Map

| 文件 | 操作 | 职责 |
|------|------|------|
| `team-dashboard/backend/model/log.go` | Modify | 新增 `GetMemberAvgFrt` 查询函数 |
| `team-dashboard/backend/controller/team.go` | Modify | 新增 `Frt` handler |
| `team-dashboard/backend/router/router.go` | Modify | 注册 `/frt` 路由 |
| `team-dashboard/frontend/src/api/client.js` | Modify | 新增 `getFrt` 请求函数 |
| `team-dashboard/frontend/src/pages/Dashboard/index.jsx` | Modify | 加入 frt 请求、聚合时间段数据、传 props |
| `team-dashboard/frontend/src/components/MemberCard/index.jsx` | Modify | 新增首字响应行和所选时间段行 |

---

## Task 1: 后端 — 新增 GetMemberAvgFrt 查询函数

**Files:**
- Modify: `team-dashboard/backend/model/log.go`

- [ ] **Step 1: 在 `model/log.go` 末尾追加 `GetMemberAvgFrt` 函数**

打开 `team-dashboard/backend/model/log.go`，在文件末尾（`GetDailyGroupStats` 函数之后）添加：

```go
// GetMemberAvgFrt returns the average first-response-token time (in ms) for each
// member over the last 10 minutes. Only records with a non-null, non-zero frt
// value in the `other` JSON field are included.
// Returns map[userID]avgFrtMs. Members with no data are absent from the map.
func GetMemberAvgFrt(memberIDs []int) (map[int]float64, error) {
	if len(memberIDs) == 0 {
		return map[int]float64{}, nil
	}

	since := time.Now().Unix() - 600

	type rawRow struct {
		UserID int
		AvgFrt float64
	}

	var frtExpr string
	switch DBType {
	case "postgres":
		frtExpr = "CAST(other::json->>'frt' AS FLOAT)"
	case "mysql":
		frtExpr = "CAST(JSON_EXTRACT(other, '$.frt') AS DECIMAL(20,4))"
	default: // sqlite
		frtExpr = "CAST(json_extract(other, '$.frt') AS REAL)"
	}

	var rows []rawRow
	err := DB.Model(&Log{}).
		Select("user_id, AVG("+frtExpr+") as avg_frt").
		Where("user_id IN ? AND created_at >= ? AND "+frtExpr+" > 0", memberIDs, since).
		Group("user_id").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	result := make(map[int]float64, len(rows))
	for _, r := range rows {
		result[r.UserID] = r.AvgFrt
	}
	return result, nil
}
```

- [ ] **Step 2: 确认编译通过**

```bash
cd team-dashboard/backend && go build ./...
```

期望输出：无错误，无输出。

- [ ] **Step 3: Commit**

```bash
cd team-dashboard/backend
git add model/log.go
git commit -m "feat(team-dashboard): add GetMemberAvgFrt query function"
```

---

## Task 2: 后端 — 新增 Frt controller 和路由

**Files:**
- Modify: `team-dashboard/backend/controller/team.go`
- Modify: `team-dashboard/backend/router/router.go`

- [ ] **Step 1: 在 `controller/team.go` 末尾添加 `Frt` handler**

打开 `team-dashboard/backend/controller/team.go`，在文件末尾添加：

```go
func Frt(c *gin.Context) {
	leaderID := c.GetInt("user_id")

	members, err := model.GetMembersByLeaderID(leaderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "查询失败"})
		return
	}
	memberIDs := make([]int, 0, len(members))
	for _, m := range members {
		memberIDs = append(memberIDs, m.Id)
	}

	frtMap, err := model.GetMemberAvgFrt(memberIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "frt 查询失败"})
		return
	}

	// Convert map[int]float64 to map[string]float64 for JSON output
	out := make(map[string]float64, len(frtMap))
	for uid, v := range frtMap {
		out[strconv.Itoa(uid)] = v
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": out})
}
```

注意：需要在文件顶部 import 中加入 `"strconv"`（如果尚未导入）。检查现有 import 块，如已有则跳过。

- [ ] **Step 2: 在 `router/router.go` 注册路由**

打开 `team-dashboard/backend/router/router.go`，在 `team` 路由组里新增一行（紧跟 `team.GET("/group-stats", controller.GroupStats)` 之后）：

```go
team.GET("/frt", controller.Frt)
```

修改后 `team` 路由组应为：

```go
team := api.Group("/team")
team.Use(middleware.RequireLogin())
{
    team.GET("/members", controller.Members)
    team.GET("/stats", controller.Stats)
    team.GET("/model-stats", controller.ModelStats)
    team.GET("/group-stats", controller.GroupStats)
    team.GET("/frt", controller.Frt)
    team.GET("/tokens", controller.ListTokens)
    team.GET("/kuma", controller.GetKumaStatus)
}
```

- [ ] **Step 3: 确认编译通过**

```bash
cd team-dashboard/backend && go build ./...
```

期望输出：无错误，无输出。

- [ ] **Step 4: Commit**

```bash
cd team-dashboard/backend
git add controller/team.go router/router.go
git commit -m "feat(team-dashboard): add GET /api/team/frt endpoint"
```

---

## Task 3: 前端 — 新增 getFrt API 函数

**Files:**
- Modify: `team-dashboard/frontend/src/api/client.js`

- [ ] **Step 1: 在 `client.js` 末尾追加 `getFrt`**

打开 `team-dashboard/frontend/src/api/client.js`，在 `getKumaStatus` 之后添加：

```js
export const getFrt = () =>
  client.get('/team/frt').then(r => r.data)
```

- [ ] **Step 2: Commit**

```bash
cd team-dashboard/frontend
git add src/api/client.js
git commit -m "feat(team-dashboard): add getFrt API client function"
```

---

## Task 4: 前端 — Dashboard 接入 frt 数据并聚合时间段消耗

**Files:**
- Modify: `team-dashboard/frontend/src/pages/Dashboard/index.jsx`

- [ ] **Step 1: 在 import 行加入 `getFrt`**

找到第 3 行：
```js
import { getMembers, getStats, getModelStats, getGroupStats, logout } from '../../api/client'
```
改为：
```js
import { getMembers, getStats, getModelStats, getGroupStats, getFrt, logout } from '../../api/client'
```

- [ ] **Step 2: 新增 `frtMap` state**

在现有 state 声明块（约第 59-66 行）中，在 `const [loading, setLoading] = useState(false)` 之后添加：

```js
const [frtMap, setFrtMap] = useState({})
```

- [ ] **Step 3: 在 `fetchData` 的 `Promise.all` 中加入 `getFrt`**

找到现有的 `Promise.all`：
```js
const [mRes, sRes, msRes, gsRes] = await Promise.all([
  getMembers(),
  getStats(fmt(start), fmt(end)),
  getModelStats(fmt(start), fmt(end)),
  getGroupStats(fmt(start), fmt(end)),
])
```
改为：
```js
const [mRes, sRes, msRes, gsRes, frtRes] = await Promise.all([
  getMembers(),
  getStats(fmt(start), fmt(end)),
  getModelStats(fmt(start), fmt(end)),
  getGroupStats(fmt(start), fmt(end)),
  getFrt(),
])
```

在 error check 块中补充 frt 的检查（在 `if (!gsRes.success)` 之后）：
```js
if (!frtRes.success) { Toast.error(frtRes.message); return }
```

在 setState 块中补充（在 `setGroupStats(gsRes.data || [])` 之后）：
```js
setFrtMap(frtRes.data || {})
```

- [ ] **Step 4: 新增 `periodSummary` 聚合计算**

找到现有的 `tokenSummary / quotaSummary` useMemo（约第 138-156 行），在其**之后**新增：

```js
const periodSummary = useMemo(() => {
  const result = {}
  for (const s of stats) {
    if (!result[s.user_id]) result[s.user_id] = { tokens: 0, quota: 0 }
    result[s.user_id].tokens += s.total_tokens
    result[s.user_id].quota  += s.quota
  }
  return result
}, [stats])
```

- [ ] **Step 5: 将新 props 传给 MemberCard**

找到现有的 `MemberCard` 渲染（约第 195-200 行）：
```jsx
<MemberCard
  key={m.id}
  member={m}
  tokens={tokenSummary[m.id] || { today: 0, thisMonth: 0 }}
  quota={quotaSummary[m.id]  || { today: 0, thisMonth: 0 }}
/>
```
改为：
```jsx
<MemberCard
  key={m.id}
  member={m}
  tokens={tokenSummary[m.id] || { today: 0, thisMonth: 0 }}
  quota={quotaSummary[m.id]  || { today: 0, thisMonth: 0 }}
  periodTokens={periodSummary[m.id]?.tokens ?? 0}
  periodQuota={periodSummary[m.id]?.quota   ?? 0}
  frt={frtMap[String(m.id)]}
/>
```

- [ ] **Step 6: Commit**

```bash
cd team-dashboard/frontend
git add src/pages/Dashboard/index.jsx
git commit -m "feat(team-dashboard): wire frt and period summary into Dashboard"
```

---

## Task 5: 前端 — MemberCard 新增展示行

**Files:**
- Modify: `team-dashboard/frontend/src/components/MemberCard/index.jsx`

- [ ] **Step 1: 更新函数签名，加入新 props**

找到：
```js
export default function MemberCard({ member, tokens, quota }) {
```
改为：
```js
export default function MemberCard({ member, tokens, quota, periodTokens = 0, periodQuota = 0, frt }) {
```

- [ ] **Step 2: 新增 frt 格式化函数和颜色函数**

在 `fmtTokens` 函数定义之后，添加：

```js
const fmtFrt = ms => {
  if (ms === undefined || ms === null) return '--'
  const s = (ms / 1000).toFixed(1)
  return `${s}s`
}

const frtColor = ms => {
  if (ms === undefined || ms === null) return 'inherit'
  const s = ms / 1000
  if (s < 7)  return 'var(--semi-color-success)'
  if (s < 30) return 'var(--semi-color-warning)'
  return 'var(--semi-color-danger)'
}
```

- [ ] **Step 3: 新增「首字响应」行和「所选时间段」行**

找到现有的「本月」行：
```jsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <Text type="tertiary" style={{ fontSize: 11 }}>本月</Text>
  <div style={{ textAlign: 'right' }}>
    <Text style={{ fontSize: 12 }}>{fmtTokens(tokens?.thisMonth ?? 0)}</Text>
    <Text style={{ fontSize: 11, color: 'var(--semi-color-warning)', marginLeft: 6 }}>{fmtUSD(quota?.thisMonth ?? 0)}</Text>
  </div>
</div>
```

在其**之后**紧接着添加首字响应行和所选时间段行：

```jsx
{/* 首字响应 */}
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <Text type="tertiary" style={{ fontSize: 11 }}>首字响应</Text>
  <Text style={{ fontSize: 12, color: frtColor(frt) }}>{fmtFrt(frt)}</Text>
</div>
{/* 所选时间段 */}
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <Text type="tertiary" style={{ fontSize: 11 }}>所选时段</Text>
  <div style={{ textAlign: 'right' }}>
    <Text style={{ fontSize: 12 }}>{fmtTokens(periodTokens)}</Text>
    <Text style={{ fontSize: 11, color: 'var(--semi-color-warning)', marginLeft: 6 }}>{fmtUSD(periodQuota)}</Text>
  </div>
</div>
```

- [ ] **Step 4: 启动前端开发服务器，目视验证卡片展示**

```bash
cd team-dashboard/frontend && bun run dev
```

打开浏览器，检查成员卡片是否出现「首字响应」和「所选时段」两行：
- 有 frt 数据时显示颜色正确的秒数（< 7s 绿，7-30s 橙，> 30s 红）
- 无 frt 数据时显示 `--`
- 所选时段显示 token 数和金额

- [ ] **Step 5: Commit**

```bash
cd team-dashboard/frontend
git add src/components/MemberCard/index.jsx
git commit -m "feat(team-dashboard): add frt and period stats rows to MemberCard"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - 所选时间段行 → Task 4 (periodSummary) + Task 5 (MemberCard 渲染) ✓
  - 首字响应行 → Task 1 (model) + Task 2 (controller/router) + Task 3 (client) + Task 4 (Dashboard) + Task 5 (MemberCard) ✓
  - frt 无数据显示 `--` → Task 5 `fmtFrt` 函数 ✓
  - 颜色规则 < 7s / 7-30s / > 30s → Task 5 `frtColor` 函数 ✓
  - frt 接口请求失败 Toast.error → Task 4 Step 3 ✓
  - 路由注册在 `/api/team/frt` → Task 2 ✓

- [x] **Placeholder scan:** 无 TBD / TODO / 模糊描述，所有代码步骤均含完整代码块。

- [x] **Type consistency:**
  - `GetMemberAvgFrt` 在 Task 1 定义，Task 2 调用，签名一致 ✓
  - `frtMap` key 为 string（`strconv.Itoa`），前端用 `String(m.id)` 访问，一致 ✓
  - `periodTokens / periodQuota` 在 Task 4 传入，Task 5 接收，名称一致 ✓
