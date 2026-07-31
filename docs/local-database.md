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

`pnpm db:init` 会执行 `supabase/migrations/20260730074758_create_experiments_catalog.sql`，然后执行 `supabase/seed.sql` 写入四个免费实验和一个付费实验包目录记录。它只用于新建的空数据库；迁移已执行后不要重复运行。已初始化的数据库只需单独重放幂等的 `supabase/seed.sql`，即可补齐或更新 `middle-ohms-law` 与 `middle-dc-circuits` 目录记录。

生产环境不使用 `DATABASE_URL`。删除或不设置它后，应用读取 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，通过 Supabase Data API 查询同一张 `public.experiments` 表。
