# Science Studio 登录与角色

更新日期：2026-07-31

## 1. 产品边界

登录服务于教师账户、购买和已购实验包恢复，不作为免费实验的访问门槛。

| 身份 | 当前权限 |
|---|---|
| Anonymous | 浏览目录并使用四个免费实验 |
| Teacher | Anonymous 权限，加上账户页和后续购买/已购内容 |
| Admin | 预留给后续内部目录、订单和权益管理；不允许公开注册获得 |
| Student | 当前不创建账户 |

`role` 表示用户身份，未来的 `entitlement` 表示用户购买了哪个实验包，两者不得混用。所有新账号默认 `teacher`。用户只能读取自己的 profile，并只能更新 `display_name`；`role` 不授予客户端更新权限。

首版没有公开的管理员升级入口。需要管理员账号时，只能由项目所有者在受信任的服务端环境或 Supabase SQL Editor 中更新 `profiles.role`；不得从浏览器使用 publishable key 修改角色。

## 2. 登录流程

1. 用户在 `/login` 输入邮箱。
2. 服务端调用 Supabase `signInWithOtp` 发送 Magic Link。
3. 免费层默认邮件模板把 PKCE `code` 带回 `/auth/confirm`；配置自有 SMTP 后，也可启用仓库中的 `TokenHash` 模板。
4. Route Handler 分别调用 `exchangeCodeForSession` 或 `verifyOtp`，把认证会话写入 HTTP-only 相关 Cookie。
5. Next.js `proxy.ts` 在请求期间调用 `getClaims()` 验证并刷新会话。
6. `/account` 再调用 `getUser()` 获取当前用户，并通过 RLS 读取其 profile。

服务端授权不使用 `getSession()` 中未经重新验证的 user，也不使用用户可编辑的 `user_metadata` 判断管理员权限。

## 3. 本地验证

完整登录需要 Supabase Auth，原有 `docker-compose.local.yml` 中的普通 PostgreSQL 只负责实验目录，不能发送或验证 Magic Link。

```bash
supabase start
supabase status
```

把 `supabase status` 输出的 API URL 和 publishable/anon key 写入未提交的 `.env.local`：

```bash
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:5173
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local publishable or anon key>
```

重启 Web 开发服务器后打开 `/login`。本地邮件不会发到真实邮箱，在 `http://127.0.0.1:54324` 的 Mailpit 中打开登录邮件。

## 4. 托管 Supabase 手动配置

1. 在 Supabase Dashboard 创建项目。
2. 从 Connect 面板复制 Project URL 与 Publishable key；不要把 secret/service role key 放入 `NEXT_PUBLIC_*`。
3. Auth URL Configuration 中把正式站点设为 Site URL，并加入本地和正式 `/auth/confirm` Redirect URL。
4. 免费层先保留 Supabase 默认 Magic Link 模板；应用回调已支持其 PKCE `code` 流程。
5. 执行 `supabase/migrations/20260731045101_create_auth_profiles.sql`，或通过正式 migration 流程推送。
6. 正式发送邮件前配置自有 SMTP，再启用 `supabase/templates/magic-link.html` 品牌模板；Supabase 默认邮件服务只适合低频测试。

## 5. 已实现的支付边界

`Middle School Physics Foundations` 是一次性 Early Access 实验包。支付路径已实现为：

1. 已登录教师向服务端请求 Checkout；浏览器永不接触 Waffo 私钥或 Supabase 服务端密钥。
2. 服务端创建 `orders` 行，并用 Supabase `user_id` 作为 Waffo `buyerIdentity`。
3. Waffo Checkout 创建时接收内部订单 UUID 作为 `orderMerchantExternalId`。
4. `/api/billing/webhook` 读取原始 body，以 SDK 验证 RSA-SHA256 签名，并按 Waffo delivery ID 去重。
5. 验签的 `order.completed` 原子写入订单和 entitlement；`refund.succeeded` 撤销 entitlement。
6. `/experiments/dc-circuits` 只根据已认证 `user_id` 的 active entitlement 打开工作台；支付成功跳转只显示状态，绝不直接授予权限。

本机测试环境的 Waffo 私钥保存在 Keychain。部署环境必须使用 `SUPABASE_SECRET_KEY`、`WAFFO_MERCHANT_ID`、`WAFFO_STORE_ID`、`WAFFO_MIDDLE_SCHOOL_PACK_PRODUCT_ID`、`WAFFO_PRIVATE_KEY_BASE64` 和 `WAFFO_ENVIRONMENT`，均不得使用 `NEXT_PUBLIC_` 前缀。
