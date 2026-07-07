# MarketPulse Next.js 全栈版部署指南

## 架构

- **前端**：Next.js 14 App Router（`web/` 目录）
- **后端**：Next.js API Routes
- **数据库**：PostgreSQL（推荐 Neon）
- **数据采集**：Python 爬虫（`backend/` 目录）
- **定时更新**：GitHub Actions 每天运行爬虫并写入数据库

## 目录结构

```
marketpulse/
├── backend/              # Python 爬虫 + AI 分析
│   ├── run.py            # 主运行脚本，生成 data/daily_data.json
│   ├── sync_to_api.py    # 把 daily_data.json 同步到 Next.js 数据库
│   └── ...
├── data/                 # 爬虫生成的 JSON（可被同步脚本消费）
├── web/                  # Next.js 前后端
│   ├── prisma/schema.prisma
│   ├── src/app/          # 页面 + API Routes
│   └── package.json
└── .github/workflows/    # 定时更新工作流
```

## 1. 环境准备

### 1.1 注册 Neon 数据库

1. 访问 https://neon.tech 注册
2. 创建项目，复制连接字符串（`postgresql://...`）
3. 把连接字符串记好，下一步用

### 1.2 配置 Next.js 环境变量

```bash
cd web
cp .env.example .env
```

编辑 `web/.env`：

```env
DATABASE_URL="postgresql://用户名:密码@主机名.neon.tech/数据库名?sslmode=require"
CRON_SECRET="一个随机字符串，用来保护 /api/import"
```

> `web/.env` 同时供 Prisma CLI 和 Next.js 读取。本地开发如果你没有本地 PostgreSQL，可以临时把 `prisma/schema.prisma` 的 `provider` 改成 `sqlite`，`DATABASE_URL` 改成 `file:./prisma/dev.db`，但不建议用于生产。

## 2. 初始化数据库

```bash
cd web
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed      # 把现有 data/daily_data.json 导入数据库
```

## 3. 本地运行

```bash
cd web
npm run dev
```

打开 http://localhost:3000

## 4. 手动导入真实数据

跑完 Python 爬虫后，把结果同步到数据库：

```bash
cd /path/to/marketpulse
export NEXTJS_URL="http://localhost:3000"
export CRON_SECRET="你.env.local里的值"
python backend/run.py
python backend/sync_to_api.py
```

## 5. 部署到 Vercel

### 5.1 创建 Vercel 项目

```bash
cd web
npx vercel --prod
```

### 5.2 在 Vercel Dashboard 配置环境变量

进入 Project → Settings → Environment Variables，添加：

- `DATABASE_URL`：Neon 连接字符串
- `CRON_SECRET`：随机字符串

### 5.3 重新部署

修改环境变量后需要重新部署才能生效。

## 6. 配置自动更新（GitHub Actions）

把代码 push 到 GitHub 后，在仓库 Settings → Secrets and variables → Actions 中添加：

- `DEEPSEEK_API_KEY`
- `NEXTJS_URL`（例如 `https://marketpulse-xxxx.vercel.app`）
- `CRON_SECRET`（与 Vercel 里的一致）

然后 GitHub Actions 会每天 UTC 10:00（北京时间 18:00）自动：

1. 运行 `backend/run.py` 抓取新闻并分析
2. 运行 `backend/sync_to_api.py` 把结果写入你的 Vercel 数据库
3. 提交 `data/` 目录的变更

## 7. API 端点

| 端点 | 说明 |
|---|---|
| `GET /api/latest` | 最新日报 |
| `GET /api/daily?date=YYYY-MM-DD` | 指定日期日报 |
| `GET /api/history` | 历史日期列表 |
| `GET /api/trends` | 趋势数据（用于历史页图表） |
| `POST /api/import` | 受保护的写入接口 |
| `POST /api/run` | 触发爬虫（仅在有 Python 的环境有效） |

## 8. 注意事项

- Vercel 的 Serverless 环境**不能跑 Python 爬虫**，所以爬虫必须放在 GitHub Actions / 你自己的服务器 / 本地电脑。
- `data/` 里的 JSON 只是中间产物，真正的数据源是 PostgreSQL。
- 首次部署后请记得执行 `npx prisma migrate deploy`（Vercel Build Command 可改成 `prisma migrate deploy && next build`，但通常本地 migrate 后 push 到 Neon 即可）。
