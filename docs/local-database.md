# 本地实验目录数据库

实验目录仍可使用独立 PostgreSQL 容器进行快速开发。教师登录需要完整 Supabase Auth，本地端到端登录验证改用 `supabase start` 启动 Auth、Postgres、Mailpit 和 Studio；两种方式端口独立，不要把普通 PostgreSQL 当作 Auth 服务。具体见 [authentication.md](authentication.md)。

```bash
pnpm db:up
pnpm db:init
```

- Postgres: `127.0.0.1:55432`
- Database: `science_studio`
- User / password: `postgres` / `postgres`
- Next.js: `apps/web/.env.local` 中的 `DATABASE_URL`

`pnpm db:init` 会执行首个目录迁移，然后执行 `supabase/seed.sql` 写入四个免费实验和三个付费实验包目录记录。它只用于新建的空数据库；迁移已执行后不要重复运行。已有数据库需先应用后续迁移，再重放幂等的 `supabase/seed.sql`，即可补齐或更新 `middle-ohms-law`、`middle-dc-circuits`、`middle-traveling-wave` 与 `middle-density-buoyancy` 目录记录。启用 `LOCAL_PAID_EXPERIMENT_PREVIEW=true` 时，本地目录直接读取代码内的预览数据，因此开发中的新付费实验不需要先同步远程 Supabase。

生产环境不使用 `DATABASE_URL`。删除或不设置它后，应用读取 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，通过 Supabase Data API 查询同一张 `public.experiments` 表。
