# Science Studio 技术架构 v0.3

更新日期：2026-07-30

> 当前产品边界以 [product-spec.md](product-spec.md) 为准：教师直接在网页中匿名使用四个免费实验；Middle School Physics Foundations 已发布 DC Circuits、Waves、Density & Buoyancy、Momentum & Collisions、Refraction & Total Internal Reflection、Levers & Balance、Sound 和 Electrical Power & Energy 八个 Early Access 实验。Waffo Pancake 测试 Checkout、签名 Webhook、订单和线上权益校验已实现；视频导出、云渲染和生产支付发布仍未实现。

## 1. 架构目标

- 相同模板版本、参数和时间点得到可复现结果。
- 浏览器预览与服务端导出使用同一套场景和求解器代码。
- 验证版支撑斜面、能量轨道与力和运动三个模板，不提前建设通用物理编辑器。
- Web、渲染 Worker、支付和数据层可以独立扩展。
- 科学规则是确定性代码；AI 不能成为结果真源。
- 先验证本地内容生产闭环，再建设账户、云渲染和支付基础设施。

## 2. 系统结构

```text
Browser / Next.js + React
├── Product UI
├── Template Runtime
├── Deterministic Simulator
├── @motion-canvas/player
│     └── compiled Motion Canvas project bundle
└── Project Store
      ├── Validation: local project document
      └── Paid Beta: Supabase Auth / Postgres / Storage
                         │
                         ├── Next.js Server Routes
                         │     └── Waffo Pancake Checkout + Webhook
                         └── render_jobs
                                │
                                ▼
                         Docker Render Worker
                         ├── Headless Chromium
                         ├── Shared Motion Canvas bundle
                         ├── Fixed-frame renderer
                         └── System FFmpeg -> Supabase Storage
```

Motion Canvas 场景使用独立 Vite 构建入口编译为浏览器可加载的 project bundle，产品应用不加载 Motion Canvas 自带编辑器。验证阶段先在本机完成固定帧导出；付费 Beta 才把 Web 应用部署到 Vercel，并将带 Chromium 和 FFmpeg 的渲染 Worker 部署到支持长任务的容器平台。视频渲染不进入 Vercel 请求生命周期。

## 3. 推荐技术栈

| 层 | 选择 | 说明 |
|---|---|---|
| 应用 | Next.js + React + TypeScript | 页面、Server Route、认证边界 |
| 样式 | Tailwind CSS | Token 和稳定布局 |
| 基础 UI | Radix/shadcn 模式 + Lucide | 可访问控件与图标 |
| 局部动效 | ReactBits 精选源码 | 只用于状态连续性 |
| 动画与场景 | Motion Canvas `core` + `2d` | 场景、信号、时间编排和确定性逐帧输出 |
| 产品内预览 | `@motion-canvas/player` | 在 React 工作台加载已编译 project bundle |
| 状态 | Zustand + Immer | 编辑状态、撤销和重做 |
| Schema | Zod | 模板、项目和 API 数据验证 |
| 公式 | KaTeX | LaTeX 公式显示 |
| 图表 | uPlot | 高频时间序列 |
| 物理 | 模板专用 TypeScript 求解器 | 斜面优先使用解析解，科学结果不依赖动画引擎 |
| 数据 | Supabase Postgres + 本地项目文档 | 目录进入 Postgres；实验编辑状态验证期仍保存在本地 |
| 视频 | Chromium + 系统 FFmpeg | 固定帧渲染与 MP4 编码 |
| 支付 | Beta 接 Waffo Pancake Checkout + Webhook | 验证重复使用和付费意愿后接入 |
| 测试 | Vitest + Playwright | 求解器、流程和视觉回归 |

截至 2026-07-30 的许可证核对：Motion Canvas 的 `core`、`2d`、`player`、`ui` 和 `vite-plugin` 包为 MIT；ReactBits 为 MIT + Commons Clause。`@motion-canvas/ffmpeg` 的源码许可标记与 npm 元数据存在冲突，当前方案不采用该包，视频编码直接调用 Worker 镜像中的 FFmpeg。myPhysicsLab 仅作为后续复杂物理算法的 Apache-2.0 参考来源，不作为验证版依赖。发布前再次核对所有第三方许可证并生成 notice。

## 4. 代码边界

建议使用单仓库：

```text
apps/
├── web/                 # Next.js 产品和只读渲染页面
└── render-worker/       # 任务领取、逐帧渲染、FFmpeg
packages/
├── experiment-schema/  # 项目、模板和步骤类型
├── simulation-core/    # 时间、单位、求解器接口和数值工具
├── motion-project/     # Motion Canvas 场景和独立 bundle 构建入口
├── templates/          # 版本化模板；当前包含 inclined-plane、energy-track 与 forces-and-motion
└── ui/                 # 基础 UI 与精选 ReactBits 组件
supabase/
├── migrations/
└── seed.sql
```

`simulation-core`、`motion-project` 和 `templates` 不依赖 Next.js。浏览器预览与 Worker 导出加载同一个 Motion Canvas project bundle，并调用同一套模板求解器。Motion Canvas 的 Vite 插件只存在于 `motion-project` 的构建入口，不能接管 `apps/web` 的页面入口。

## 5. 模板运行时

每个模板实现统一接口：

```ts
interface ExperimentTemplate<P, S, M> {
  id: string
  version: string
  parameterSchema: ZodSchema<P>
  defaults: P
  assumptions: Assumption[]
  solve(params: P, time: number): S
  measure(params: P, state: S): M
  validate(params: P, timeline: NarrationStep[]): ScienceIssue[]
  defaultNarration(params: P): NarrationStep[]
  compose(state: S, settings: AppearanceSettings): SceneDescription
}
```

P0 原则：

- 自由落体、抛体和斜面优先使用解析解。
- 需要积分时使用固定时间步和固定迭代次数。
- 一维碰撞使用守恒关系和恢复系数直接计算。
- 杠杆平衡先使用 `tau = F d_perpendicular` 解析水平释放状态，再以 `1/240 s` 固定步长积分 `I alpha = sum(tau)`；载荷重力保持竖直，力臂按 `d cos(theta)` 更新，并在 `±12°` 完全非弹性机械限位处停止。
- 验证版不接 Rapier 或 myPhysicsLab；只有解析解无法覆盖真实需求时才增加适配器。
- 项目记录 `templateVersion` 和 `engineVersion`。
- 时间使用整数帧或整数微秒，避免累积浮点时间漂移。
- 所有显示单位在边界转换，内部统一使用 SI 制。

### 科学基准测试

每个模板至少包含：

- 标准参数的理论结果断言
- 合法边界参数
- 非法和无意义参数
- 关键事件时间，例如最高点或碰撞时刻
- 守恒量或解析值误差阈值
- 30/60 FPS 采样结果一致性

## 6. 项目文档模型

```ts
interface ExperimentProject {
  schemaVersion: 1
  locale: "en" | "zh-CN"
  templateId: string
  templateVersion: string
  engineVersion: string
  parameters: Record<string, number | boolean | string>
  appearance: AppearanceSettings
  overlays: OverlaySettings
  narration: NarrationStep[]
  output: {
    aspectRatio: "9:16" | "16:9" | "1:1"
    resolution: "720p" | "1080p"
    fps: 30 | 60
  }
}
```

- P0 将经过 Zod 校验的文档保存到浏览器本地，并允许导入/导出 JSON。
- `locale` 默认是 `en`，决定模板文案、讲解步骤和导出画面的语言；物理求解器不读取本地化文案。
- 付费 Beta 的数据库保存 JSONB 文档和独立查询字段；每次导出冻结一份不可变 `project_snapshot`。
- 付费 Beta 的自动保存提交 `revision`，服务端只接受基于当前 revision 的更新。
- 模板迁移函数必须从旧版本生成新副本，不原地破坏项目。

## 7. 付费 Beta 的 Supabase 数据设计

公开实验目录先使用 `experiments` 表：服务端通过 publishable key 查询，RLS 只允许匿名和已认证角色读取 `published = true` 的行；筛选、全文搜索、排序和分页都在 Postgres/Data API 完成。应用未配置 Supabase 环境变量时降级到与 `seed.sql` 同结构的本地目录数据。

Beta 表：

| 表 | 用途 |
|---|---|
| `profiles` | 已实现；用户显示信息与受保护的 `teacher/admin` 角色 |
| `projects` | 项目元数据、JSONB 文档、revision |
| `project_exports` | 冻结快照、格式、状态、进度和输出路径 |
| `orders` | 已实现；一次性实验包订单和 Waffo session/order ID |
| `entitlements` | 已实现；用户拥有的实验包访问权 |
| `billing_events` | 已实现；Waffo delivery ID 幂等记录 |
| `usage_ledger` | 渲染额度预留、消耗和返还 |

安全边界：

- `public` 中所有表默认开启 RLS。
- 用户只能读写自己的项目和导出任务。
- `orders`、`entitlements`、`billing_events` 和额度最终写入只允许服务端角色。
- 前端只使用 publishable key，不暴露 `service_role` 或 secret key。
- Storage 中项目缩略图和导出文件默认私有，通过短期签名 URL 访问。
- Worker 使用独立服务凭据，只处理已领取的任务。
- RLS 策略显式检查已认证用户；UPDATE 同时配置 SELECT 策略。
- 特权函数放在不暴露的 private schema，不把 `security definer` 函数放在公开 schema。

## 8. 自动保存

P0：

- 编辑器本地立即应用操作，并写入撤销栈。
- 空闲 `800ms` 后校验文档并保存到 IndexedDB；刷新后恢复最近的合法版本。
- 保存失败时保留当前内存状态，并提供 JSON 下载，不能静默丢失项目。

付费 Beta：

1. 本地状态更新后提交 `{document, expectedRevision}`。
2. 服务端校验 Schema 和当前 revision。
3. 成功后返回新 revision。
4. 冲突时不覆盖；提示用户保留当前副本或载入云端版本。
5. 离线操作留在 IndexedDB，恢复连接后按 revision 同步。

## 9. 固定帧视频渲染

### P0 本地导出

1. 冻结当前项目文档，并运行科学检查和构图检查。
2. 打开只包含共享 Motion Canvas bundle 的本地渲染页面。
3. Chromium 按 `time = frame / fps` 逐帧输出 PNG。
4. 系统 FFmpeg 编码 720p H.264 MP4；失败时保留项目并允许重试。

### 付费 Beta 提交

1. 服务端验证用户权益和科学检查结果。
2. 在事务中冻结项目快照、预留额度并创建 `queued` 任务。
3. 返回任务 ID，前端轮询状态。

### 付费 Beta Worker

1. 原子领取一个 `queued` 任务并设置租约。
2. 打开内部渲染路由，只加载共享模板运行时和场景渲染器。
3. 对第 `n` 帧计算 `time = n / fps`，等待 Motion Canvas 完成一帧。
4. 将 Motion Canvas 生成的帧写入系统 FFmpeg 管道，编码 H.264 MP4。
5. 上传私有 Storage，记录尺寸、时长和校验和。
6. 成功后确认额度；失败时释放额度并保存可重试错误。

要求：

- Worker 崩溃后租约过期可重新领取。
- `(user_id, idempotency_key)` 防止重复提交扣费。
- 同一快照重复渲染的关键帧必须一致。
- 渲染页面不加载产品导航、ReactBits 动效或非必要字体。
- 不使用实时屏幕录制；实时录制会受设备帧率和掉帧影响。

## 10. 付费 Beta 的 Waffo Pancake 与权益

- Checkout Session 只能由服务端创建。
- Webhook 使用原始请求体验证签名，并在 `billing_events` 以事件 ID 去重。
- Webhook 写入 `orders`，再由服务端授予或撤销 entitlement。
- 前端支付成功跳转只负责反馈，不直接授予权益。
- 取消、过期、续费失败和退款必须有明确状态映射。
- 渲染额度使用 ledger，而不是直接递减单个数字，确保失败可返还和事件可审计。

当前接入使用 `@waffo/pancake-ts` 的 authenticated Checkout：Supabase `user_id` 作为 Waffo `buyerIdentity`，而邮箱仅用于预填。服务器创建本地订单并把其 UUID 传为 `orderMerchantExternalId`；仅 RSA-SHA256 验签成功的 `order.completed` 会通过受限的数据库函数授予权益，`refund.succeeded` 会撤销权益。登录与角色细节见 [authentication.md](authentication.md)。

## 11. ReactBits 集成

- 采用 copy-in 模式，只拷入 `AnimatedContent`、`FadeContent`、`AnimatedList`、`Stepper` 中实际使用的 TypeScript + Tailwind 版本。
- 目录建议为 `packages/ui/src/react-bits/`，每个文件保留来源、许可证和访问日期。
- 外层封装统一 motion token、减少动态效果和测试选择器。
- ReactBits 不出现在场景渲染包和视频渲染页面中。
- 不允许组件改变工具栏、参数行、画布或测量值的稳定尺寸。
- 组件升级按需人工比较，不自动同步整个上游仓库。

## 12. 付费 Beta 的 API 边界

Beta Server Routes：

```text
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id          # 带 expectedRevision
POST   /api/projects/:id/exports  # 冻结快照并预留额度
GET    /api/exports/:id
POST   /api/billing/checkout
POST   /api/billing/webhook
GET    /api/entitlements
```

所有写接口执行身份、所有权、Schema 和幂等校验。Worker 入口不暴露给浏览器。

## 13. 测试策略

- **求解器单测**：解析值、边界、事件时间、守恒误差。
- **模板契约测试**：Schema、默认步骤、构图和检查规则。
- **属性测试**：合法参数范围内不产生 NaN/Infinity，时间序列连续。
- **快照测试**：固定项目在指定帧的场景描述和关键画面。
- **流程测试**：创建、修改、自动保存、导出、下载。
- **付费 Beta 支付测试**：重复 Webhook、乱序事件、失败续费、取消和退款。
- **付费 Beta 安全测试**：跨用户项目读取、Storage URL、RLS 与 Worker 权限。

## 14. 实施阶段

### 阶段 A：5 个工作日本地闭环

- 单仓库和共享包结构
- 斜面求解器、科学规则和测试
- Motion Canvas 竖屏场景和 React 参数面板
- 四至五个结构化讲解步骤
- 本地固定帧导出 720p MP4

退出条件：不用代码即可修改斜面参数和讲解步骤；同一项目两次导出的关键帧与测量值一致；20-30 秒样片可以完整生成。

### 阶段 B：1 周用户验证

- 用斜面闭环完成 5-8 次目标用户可用性测试
- 记录首次导出耗时、卡点、实际成片和第二次使用意愿
- 根据观察结果调整参数、讲解步骤和构图，不扩展模板数量
- 实测本地 720p/1080p 渲染时间和成本基线

退出条件：多数参与者能在 10 分钟内完成首个导出，至少 3 人明确提出真实复用场景，并有人愿意为无水印高清导出付费。未达到时返回阶段 A，不建设 SaaS 基础设施。

### 阶段 C：2-3 周付费 Beta

- Supabase Auth 与 profile RLS 已实现；私有 Storage 后续实现
- 项目保存、版本快照和最近项目
- 斜面模板 1080p 云端导出、失败重试和成本记录
- Waffo Pancake 一次性实验包、权益和账单记录
- 基础监控与错误追踪

退出条件：真实用户完成支付、导出和第二次复用。

### 阶段 D：验证后扩展

模板扩展遵循 [实验模板路线](experiment-roadmap.md)：Free Starter 固定为四个实验；付费内容已完成 DC Circuits、Waves、Density/Buoyancy、Momentum/Collisions、Refraction/Total Internal Reflection、Levers/Balance、Sound 与 Electrical Power/Energy 八个模板。后续根据重复课堂使用、模板请求和付费数据决定第九个主题，不预先建设通用编辑器。

## 15. 主要风险

| 风险 | 控制方式 |
|---|---|
| 浏览器与 Worker 画面不一致 | 共享代码、固定字体、固定帧快照测试 |
| 数值结果看似合理但错误 | 解析解对照、模板基准和科学审阅 |
| 1080p 渲染成本过高 | 样片基准、队列并发限制、按分钟额度 |
| 功能膨胀成通用编辑器 | P0 禁止空白场景和自由轨道 |
| 动效影响精确操作 | ReactBits 白名单、减少动态效果和稳定尺寸 |
| 支付状态错乱 | Webhook 真源、事件幂等、额度 ledger |
| 第三方许可证变化 | 锁定来源、保留 notice、发布前复核 |
