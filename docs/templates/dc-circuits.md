# DC Circuits: Series & Parallel 模板合同 v0.1

模板 ID：`electricity.dc-circuits`

- 目录 ID：`middle-dc-circuits`
- 主要学段：Middle school；可作为高中电路复习入口
- 权益：Middle School Physics Foundations
- 建议课堂时长：15 分钟
- 状态：首个付费实验 MVP 已实现

## 产品边界

该模板解决一个明确的课堂任务：在相同电源和电阻条件下，比较单电阻、两个电阻串联和两个电阻并联时的电流路径、电压分配、等效电阻与功率。

首版固定包含：

- `Single`、`Series`、`Parallel` 三种预定义拓扑；
- 一个理想 DC voltage source、一个 switch、两个 ohmic resistors；
- 总电流与两个支路/元件电流；
- 两个电阻的电压降、功率和网络等效电阻；
- 在 `Source`、`R1`、`R2` 三个受限位置间切换的测量点；
- 常规电流方向、拓扑对照表、Ohm's law、KCL/KVL 课堂说明；
- 双语 6 步讲解、`9:16` / `16:9`、缩放、移动、Fit 和全屏时间轴。

首版不包含自由拖线、混联、多于两个电阻、任意节点探针、真实仪表接线、短路求解、非欧姆元件、电容、电感或交流电。

## 实现入口

| 层 | 路径 | 责任 |
|---|---|---|
| 求解器 | `packages/templates/src/dc-circuits/index.ts` | 参数校验、三种拓扑、KCL/KVL、功率与科学检查 |
| 求解测试 | `packages/templates/src/dc-circuits/dc-circuits.test.ts` | 解析值、边界、开路、确定性和检查项 |
| 教师工作台 | `apps/web/components/dc-circuits-workbench.tsx` | 电路图、参数、测量点、讲解与视口控制 |
| 页面路由 | `apps/web/app/experiments/dc-circuits/page.tsx` | 页面 SEO 和工作台入口 |
| 目录数据 | `apps/web/lib/experiment-catalog.ts` | `pack` 权益、真实封面、时长、概念和排序 |
| 目录种子 | `supabase/seed.sql` | 幂等写入付费实验目录记录 |

数据库只保存目录信息，不保存电路计算结果、公式、测量状态或讲解编辑内容。

## 参数

| 参数 | 默认值 | 合法范围 | 单位 | 说明 |
|---|---:|---:|---|---|
| `topology` | `series` | `single` / `series` / `parallel` | - | 固定拓扑选择 |
| `sourceVoltageV` | 12 | 1-24 | V | 理想电源端电压 |
| `resistance1Ohm` | 30 | 1-100 | Ω | R1 阻值 |
| `resistance2Ohm` | 60 | 1-100 | Ω | R2 阻值；single 时不参与计算 |
| `switchClosed` | `true` | `true` / `false` | - | 电源是否接入电阻网络 |
| `showConventionalCurrent` | `true` | `true` / `false` | - | 只控制方向标记，不改变计算 |

所有数值必须有限且在合法范围内。`1 Ω` 下限用于避免将理想短路的无限电流带入课堂求解器。

## 确定性模型

### Single

```text
R_eq = R1
I_total = I1 = V_source / R1
I2 = 0
V1 = V_source
V2 = 0
```

### Series

```text
R_eq = R1 + R2
I_total = I1 = I2 = V_source / R_eq
V1 = I1 R1
V2 = I2 R2
V1 + V2 = V_source
```

### Parallel

```text
R_eq = R1 R2 / (R1 + R2)
V1 = V2 = V_source
I1 = V_source / R1
I2 = V_source / R2
I_total = I1 + I2
```

闭合时每个电阻满足 `P_i = V_i I_i = I_i² R_i`，且 `P_total = P1 + P2 = V_source I_total`。开关断开时所有电阻电流、电压降和功率为零，开关两端电压等于电源电压。

播放时间只驱动固定速率的常规电流标记。标记速度不表示电流大小或电子漂移速度，改变显示开关不得改变任何测量值。

## 画布合同

横版画布使用“电路 + 测量点 + 拓扑对照 + 网络公式”布局；竖版画布按相同顺序纵向堆叠。两种画幅必须来自同一求解状态。

画布必须同时显示：

1. 当前拓扑和电路开闭状态。
2. 电源、开关、R1 与 R2 的真实连接关系。
3. 当前阻值、总电流和支路电流。
4. `Source / R1 / R2` 当前测量点的电压与电流。
5. 三种拓扑的等效电阻公式，并突出当前拓扑。
6. `I_total = V_source / R_eq` 与当前计算结果。
7. 理想模型与常规电流方向说明。

## 输出测量

| 键 | 含义 | 单位 |
|---|---|---|
| `equivalentResistanceOhm` | 电阻网络等效电阻 | Ω |
| `totalCurrentA` | 电源输出总电流 | A |
| `branchCurrent1A` | R1 电流 | A |
| `branchCurrent2A` | R2 电流 | A |
| `resistorVoltage1V` | R1 电压降 | V |
| `resistorVoltage2V` | R2 电压降 | V |
| `switchVoltageV` | 开关两端电压 | V |
| `resistorPower1W` | R1 功率 | W |
| `resistorPower2W` | R2 功率 | W |
| `totalPowerW` | 电阻网络总功率 | W |

## 默认讲解步骤

1. **Identify the topology**：指出电源、开关、电阻和可用路径。
2. **Predict the current paths**：先追踪常规电流，不先看数值。
3. **Find equivalent resistance**：将当前电阻网络替换为一个等效电阻。
4. **Apply Ohm's law**：用 `V_source / R_eq` 预测总电流。
5. **Measure each component**：比较 Source、R1、R2 的电流和电压。
6. **Compare the topologies**：总结串联等流/分压、并联等压/分流。

## 科学检查

1. 三种拓扑的等效电阻与解析式一致。
2. 串联时 `I1 = I2 = I_total` 且 `V1 + V2 = V_source`。
3. 并联时 `V1 = V2 = V_source` 且 `I1 + I2 = I_total`。
4. 三种功率表达与总功率守恒一致。
5. 开路时所有电阻电流和功率为零，开关电压等于源电压。
6. 相同参数与绝对时间在不同帧率下产生相同状态。
7. 显示方向标记、画幅、缩放、移动和全屏不得改变计算。
8. 理想功率超过 `50 W` 时提示真实元件额定功率和散热风险。

## 权益状态

目录卡显示 `Included in Middle School Pack`。教师邮箱登录已实现，但 Waffo Pancake 和权益校验尚未接入，因此卡片保持锁定且不提供购买按钮；开发路由可直接打开用于内部验证，并使用 `noindex` 且不进入 sitemap。完成至少 5 个同包实验和教师重复使用验证后，才开放 Early Access 销售。
