# 本地实验目录数据库

本地开发使用独立 PostgreSQL 容器，表结构、全文搜索、RLS 和种子数据与未来 Supabase 保持一致；当前不启动 Auth、Storage、Realtime 或 Studio。

```bash
pnpm db:up
pnpm db:init
```

- Postgres: `127.0.0.1:55432`
- Database: `science_studio`
- User / password: `postgres` / `postgres`
- Next.js: `apps/web/.env.local` 中的 `DATABASE_URL`

`pnpm db:init` 会执行 `supabase/migrations/20260730074758_create_experiments_catalog.sql`，然后执行 `supabase/seed.sql` 写入四个免费实验目录记录。它只用于新建的空数据库；迁移已执行后不要重复运行。已初始化的数据库只需单独重放幂等的 `supabase/seed.sql`，即可补齐或更新 `middle-ohms-law` 目录记录。

生产环境不使用 `DATABASE_URL`。删除或不设置它后，应用读取 `NEXT_PUBLIC_SUPABASE_URL` 与 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，通过 Supabase Data API 查询同一张 `public.experiments` 表。
