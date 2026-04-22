# 团队看板 (Team Dashboard) — 设计文档

**日期：** 2026-04-22
**状态：** 已审批

---

## 背景

new-api 是一个面向 C 端的 AI API 网关。需要新增一个**团队看板**，让团队 Leader 能够查看团队内每个成员每天的 token 消耗情况。

---

## 目标

- Leader 可以创建子账号分配给团队成员使用
- Leader 可以在看板上查看每个成员的 token 消耗汇总（今日、本月）和每日趋势图
- 看板只读，不涉及额度管理
- 与主项目完全解耦，独立部署

---

## 架构

完全独立的前后端项目，与主 new-api 项目不在同一仓库/进程，仅共享同一数据库（只读）。

```
team-dashboard/
├── backend/    # Go + Gin，只读连接主数据库
└── frontend/   # React 18 + Vite，Semi Design UI
```

### 数据库访问

- 只读连接现有数据库（MySQL / PostgreSQL / SQLite）
- 建议为团队看板服务创建一个只读数据库账号
- 不新增、不修改任何表结构
- 使用的表：`users`（成员列表）、`logs`（消耗记录）

### 成员关系

利用现有 `users.inviter_id` 字段：`inviter_id = leader.id` 的用户即为该 Leader 的团队成员。

---

## 鉴权

与 new-api 主项目保持**完全一致的鉴权机制**：

- 库：`gin-contrib/sessions`，Cookie-based Session
- Leader 在团队看板登录页输入 username + password
- 后端查 `users` 表验证密码，验证通过后写 Session Cookie
- `SessionSecret` 通过环境变量 `SESSION_SECRET` 独立配置，与主项目 Session 互不干扰
- Session 有效期：30 天（与主项目一致）

---

## 后端接口

### `POST /api/auth/login`

Leader 登录。

**Request body:**
```json
{ "username": "alice", "password": "..." }
```

**Response:**
```json
{ "success": true, "message": "ok", "data": { "id": 1, "display_name": "Alice", "username": "alice" } }
```

验证逻辑：查 `users` 表，比对密码 hash；验证通过后将 `id`、`username`、`role`、`status` 写入 Session。

---

### `POST /api/auth/logout`

登出，清除 Session。

---

### `GET /api/team/members`

获取当前 Leader 的所有团队成员。

**鉴权：** 需要有效 Session

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 2, "username": "bob", "display_name": "Bob", "quota": 500000, "used_quota": 120000 }
  ]
}
```

查询逻辑：`SELECT * FROM users WHERE inviter_id = ? AND deleted_at IS NULL`

---

### `GET /api/team/stats`

获取指定日期范围内，各成员每日 token 消耗。

**鉴权：** 需要有效 Session

**Query params:**
- `start` — 开始日期，格式 `YYYY-MM-DD`
- `end` — 结束日期，格式 `YYYY-MM-DD`

**Response:**
```json
{
  "success": true,
  "data": [
    { "user_id": 2, "date": "2026-04-20", "prompt_tokens": 10000, "completion_tokens": 5000, "total_tokens": 15000, "quota": 300 }
  ]
}
```

查询逻辑：
1. 先查出该 Leader 下的所有成员 ID（防止越权）
2. 按 `user_id` + 日期聚合 `logs` 表：`SUM(prompt_tokens)`, `SUM(completion_tokens)`, `SUM(quota)`
3. 只返回属于该 Leader 成员的数据

---

## 前端页面

技术栈：React 18 + Vite + Semi Design UI（`@douyinfe/semi-ui`）

### 路由

| 路径 | 页面 | 鉴权 |
|------|------|------|
| `/login` | 登录页 | 无 |
| `/` | 看板主页 | 需登录，未登录跳转 `/login` |

### 登录页 (`/login`)

- 用户名 + 密码输入框
- 登录按钮，调用 `POST /api/auth/login`
- 登录成功跳转 `/`

### 看板主页 (`/`)

布局：

```
┌─────────────────────────────────────────────────────┐
│  🏠 团队看板        [日期范围选择器]      [退出登录] │
├─────────────────────────────────────────────────────┤
│  成员汇总卡片（横向排列，超出可滚动）                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ 成员A    │ │ 成员B    │ │ 成员C    │             │
│  │ 今日 120k│ │ 今日 80k │ │ 今日 45k │             │
│  │ 本月 2M  │ │ 本月 1M  │ │ 本月 600k│             │
│  └──────────┘ └──────────┘ └──────────┘             │
├─────────────────────────────────────────────────────┤
│  每日 Token 消耗趋势                                 │
│  ┌───────────────────────────────────────────────┐  │
│  │  折线图（每个成员一条线，颜色区分）            │  │
│  │  X 轴：日期，Y 轴：token 数量                 │  │
│  │  tooltip 悬停显示 prompt / completion 分项     │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**交互：**
- 顶部成员卡片点击可高亮/隐藏折线图对应成员的线
- 日期范围默认最近 7 天，可选 30 天 / 自定义
- 图表使用 `prompt_tokens + completion_tokens` 合计作为主线，tooltip 展示分项
- 图表库：Recharts 或 ECharts（推荐 ECharts，功能更丰富）

---

## 目录结构

```
team-dashboard/
├── backend/
│   ├── main.go
│   ├── config/        # 环境变量读取
│   ├── middleware/    # session auth
│   ├── controller/    # auth, team
│   ├── model/         # 只读查询 users, logs
│   └── router/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login/
│   │   │   └── Dashboard/
│   │   ├── components/
│   │   │   ├── MemberCard/
│   │   │   └── StatsChart/
│   │   ├── api/       # axios 封装
│   │   └── App.jsx
│   ├── index.html
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

---

## 环境变量（后端）

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DB_TYPE` | 数据库类型 | `mysql` / `postgres` / `sqlite` |
| `DB_DSN` | 数据库连接串（只读账号）| `user:pass@tcp(host:3306)/dbname` |
| `SESSION_SECRET` | Session 加密密钥 | 任意随机字符串 |
| `PORT` | 服务端口 | `8080` |

---

## 不在范围内

- 额度管理（充值、扣减、分配）
- 成员权限管理
- SSO / 跨站 Session 共享（后续迭代）
- 邮件通知、预警
