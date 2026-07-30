# Forces & Motion 模板合同 v0.1

模板 ID：`mechanics.forces-and-motion`

- 主要学段：Middle school
- 权益：Free Starter
- 建议课堂时长：10 分钟

## 实现入口

| 层 | 路径 | 责任 |
|---|---|---|
| 模板合同 | `packages/templates/src/forces-and-motion/index.ts` | 参数、解析运动、测量值、科学检查和讲解蓝图 |
| 科学测试 | `packages/templates/src/forces-and-motion/forces-and-motion.test.ts` | 阈值、分段边界、镜像运动、功-能关系和帧率一致性 |
| 教师工作台 | `apps/web/components/forces-and-motion-workbench.tsx` | 双语参数、受力图、阈值尺、图表和讲解编辑 |
| 页面路由 | `apps/web/app/experiments/forces-and-motion/page.tsx` | 页面 SEO 和工作台入口 |

## 参数

| 参数 | 默认值 | 范围 | 单位 |
|---|---:|---:|---|
| `massKg` | 5 | 0.5-20 | kg |
| `appliedForceN` | 25 | -100-100 | N |
| `staticFrictionCoefficient` | 0.35 | 0-1 | 无量纲 |
| `kineticFrictionCoefficient` | 0.25 | 0-1 | 无量纲 |
| `gravityMs2` | 9.81 | 1-20 | m/s² |
| `forceDurationSeconds` | 2 | 0-5 | s |

正方向固定向右，负外力产生完全镜像的水平运动。必须满足 `mu_k <= mu_s`；外力持续时间为零时不产生冲量。

## 静摩擦判据

```text
N = mg
f_s,max = mu_s N

|F_applied| <= f_s,max  -> static equilibrium
|F_applied| >  f_s,max  -> kinetic motion
```

恰好等于最大静摩擦力时仍保持静止。静止时显示的摩擦力是平衡外力所需的实际值，不得把 `f_s,max` 误画成当前摩擦力。

## 分段解析运动

设 `s = sign(F_applied)`、`T = forceDurationSeconds`、`f_k = mu_k N`。

施力阶段 `0 <= t < T`：

```text
a_1 = s (|F_applied| - f_k) / m
v(t) = a_1 t
x(t) = 1/2 a_1 t^2
```

在 `t = T` 外力立即归零，但位置和速度连续。若 `mu_k > 0`，物体进入制动阶段：

```text
tau = t - T
a_2 = -s mu_k g
v(t) = v(T) + a_2 tau
x(t) = x(T) + v(T) tau + 1/2 a_2 tau^2
```

到达解析停止时刻后，速度、加速度、摩擦力和合力都精确归零，位移保持不变，不能让公式越过零速后反向。若 `mu_k = 0`，撤力后保持匀速，`stopTimeSeconds = null`。

事件采用右连续定义：

```text
[0, T)             applied force active
[T, t_stop)        friction braking
[t_stop, infinity) stopped
```

## 画布合同

画布必须同时提供三层解释：

1. 静摩擦阈值尺：对比 `|F_applied|` 与 `f_s,max`，明确显示 `BALANCED` 或 `THRESHOLD CROSSED`。
2. 自由体受力图：`mg` 向下、`N` 向上、外力按符号向左或向右、摩擦力始终与当前运动趋势相反。
3. 同步图表：`force-time` 显示外力、摩擦力和合力；`velocity-time` 显示施力、撤力和停止事件。

箭头设置最小可视长度，不作为严格比例尺；实时数值才是定量依据。物体的屏幕位置可以压缩映射，但位移读数必须来自求解器原始 SI 值。

### 画幅与视口控制

- 默认使用 `9:16` 竖屏画幅（`720 x 1280`），并提供 `16:9` 课堂宽屏画幅（`1280 x 720`）；宽屏使用独立重排，不拉伸竖屏画面。
- 画布支持 `50%-250%` 缩放，每次调整 `25%`；超过 `100%` 后可以开启移动模式，通过鼠标拖动或方向键平移视图。
- `Fit` 将画布恢复到 `100%` 并居中，同时关闭移动模式；浏览器全屏保留画幅切换、视口控制工具栏和完整播放时间轴。
- 切换画幅时视口恢复为 `Fit`，但不得重置实验参数、当前模拟时间、实验/讲解模式或讲解内容。
- 缩放、移动、`Fit` 和全屏只改变画布的查看方式，不进入物理求解器，也不改变任何 SI 测量值。

## 输出测量

| 键 | 含义 | 单位 |
|---|---|---|
| `appliedForceN` | 当前外力，有符号 | N |
| `frictionForceN` | 当前静摩擦或动摩擦力，有符号 | N |
| `netForceN` | 水平合力 | N |
| `weightForceN` | 重力大小 | N |
| `normalForceN` | 支持力大小 | N |
| `maximumStaticFrictionN` | 最大静摩擦力 | N |
| `accelerationMs2` | 水平加速度 | m/s² |
| `velocityMs` | 水平速度 | m/s |
| `displacementM` | 水平位移 | m |

## 默认讲解

1. 建立水平面场景。
2. 标注四个力。
3. 对比外力与静摩擦阈值。
4. 使用 `Sigma F = ma` 计算合力和加速度。
5. 播放施力、撤力和制动过程。
6. 对照力-时间与速度-时间图。

只允许一个讲解步骤播放完整模拟，图表步骤保持关键帧，避免在讲解中重复从头播放。

## 模型边界

- 单个刚体在固定水平面上做一维平动。
- 静摩擦系数和动摩擦系数恒定。
- 不模拟空气阻力、滚动、形变、碰撞或场景边界。
- 不包含绳索、滑轮、旋转或任意添加物体。

## 科学测试

1. 默认参数的支持力、摩擦力、合力、加速度、撤力速度和停止位置与解析值一致。
2. 小于或恰好等于静摩擦阈值时保持静止。
3. 略高于阈值时切换为动摩擦并沿外力方向加速。
4. 负外力与正外力的水平结果严格镜像。
5. 撤力时位置和速度连续，力与加速度按右连续定义切换。
6. 停止前后速度不穿过零，停止后位移不再变化。
7. `mu_k = 0` 时撤力后匀速，停止时刻为空。
8. 推力段和制动段分别满足功-动能关系。
9. 等价绝对时间的 30 FPS 与 60 FPS 采样完全一致。
10. 非法参数和非有限时间必须被拒绝。
