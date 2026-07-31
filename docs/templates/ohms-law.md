# Ohm's Law Lab 模板合同 v0.1

模板 ID：`electricity.ohms-law`

- 目录 ID：`middle-ohms-law`
- 主要学段：Middle school；可作为高中电学复习入口
- 权益：Free Starter
- 建议课堂时长：10 分钟
- 状态：已实现首版

## 产品边界

这是 Free Starter 的第四个也是最后一个免费实验。它只回答一个课堂问题：在一个闭合的理想直流回路中，改变电压或电阻时，电流如何变化。

免费实验固定包含：

- 一个理想 DC voltage source；
- 一个固定位置的 resistor；
- 一个 switch；
- 一组理想 wires；
- 一个 conventional-current direction；
- 一个同步的 current、voltage、resistance 和 power 读数。

以下能力明确不属于本模板：topology editor、series、parallel、mixed circuits、multiple resistors、arbitrary wiring、节点选择、可移动探针式电压表/电流表、真实电池内阻、瞬态启动过程、短路电流和非欧姆元件。`DC Circuits: Series and Parallel` 是后续付费旗舰，不得通过免费模板的隐藏控件提前开放。

## 实现入口

| 层 | 路径 | 责任 |
|---|---|---|
| 目录数据 | `apps/web/lib/experiment-catalog.ts` | `middle-ohms-law`、电学主题、Free Starter 状态和 `circuit` 封面类型 |
| 页面路由 | `apps/web/app/experiments/ohms-law/page.tsx` | 页面 SEO 和工作台入口 |
| 教师工作台 | `apps/web/components/ohms-law-workbench.tsx` | 电路画布、参数、测量、图表和讲解 |
| 目录种子 | `supabase/seed.sql` | 幂等写入已发布目录记录 |

数据库只保存目录信息，不保存电路求解结果或公式。求解器版本和模板科学合同必须随应用代码发布并由测试覆盖。

## 参数

| 参数 | 默认值 | 合法范围 | 单位 | 说明 |
|---|---:|---:|---|---|
| `sourceVoltageV` | 9 | 1-24 | V | 理想电压源的端电压 |
| `resistanceOhm` | 30 | 1-100 | Ω | 单个欧姆电阻 |
| `switchClosed` | `true` | `true` / `false` | - | 回路是否闭合 |

参数输入必须拒绝非有限值、零以下值和超出范围值。首版不提供修改元件数量、位置、连接关系或元件类型的控件。

## 理想单回路模型

闭合开关时，电阻两端电压等于理想电源电压，回路各处电流相同：

```text
V_R = V_source
I = V_source / R
P_R = V_R I = V_source^2 / R
```

断开开关时，回路没有完整导电路径：

```text
I = 0
P_R = 0
V_R = 0  (首版显示为回路未闭合，不把开路电压误当作电阻压降)
```

电流方向使用 conventional current，从电源正端经开关和电阻回到负端。画面可以用粒子或流线表达“有电流/无电流”，但动画不得暗示电子漂移速度或把动画速率当作电流的定量比例。

## 画布合同

画布必须同时提供：

1. 清晰的单回路电路图，元件之间的连接关系不可歧义。
2. 电源、电阻和开关的文字标签及当前参数。
3. 闭合时的 conventional-current 箭头或流线，断开时的断路状态标识。
4. 一个实时读数区：`V`、`R`、`I`、`P` 和 `Circuit status`。
5. 一张关系图，至少能比较改变 `V` 或 `R` 对 `I` 的影响；图表游标与当前参数同步。
6. 科学说明，明确“ideal source / ideal wires / single resistor”假设。

箭头和装饰电流线只表示方向与状态，不是严格比例尺；定量结论以读数和公式为准。任何标签不得遮挡开关、端子或电阻符号。画面支持项目统一的 `9:16` 与 `16:9` 视口、缩放、移动、Fit 和浏览器全屏；视口操作不得改变电路参数或求解状态。

## 输出测量

| 键 | 含义 | 单位 |
|---|---|---|
| `sourceVoltageV` | 理想电源端电压 | V |
| `resistanceOhm` | 电阻值 | Ω |
| `resistorVoltageV` | 电阻两端电压；闭合时等于源电压 | V |
| `currentA` | 回路常规电流；断开时为零 | A |
| `powerW` | 电阻消耗功率；断开时为零 | W |
| `switchClosed` | 开关状态 | - |

统一显示规则：电流至少显示三位有效数字，小于 `0.01 A` 时使用 `mA` 辅助标识；公式和单位使用 SI 符号，不能把 `Ω` 写成无单位的数字。

## 默认讲解步骤

1. **Identify the loop**：指出 source、switch、resistor 和 wire，确认只有一条路径。
2. **Close the switch**：闭合开关，追踪 conventional current 从正端回到负端。
3. **Predict with Ohm's law**：使用 `I = V / R` 预测读数。
4. **Change one variable**：只改变电压或电阻，比较电流变化并保持另一变量不变。
5. **Check power**：用 `P = V I` 解释电阻消耗功率，复述模型假设。

讲解时间和物理状态分离；教师暂停说明时，读数保持不变。切换讲解步骤不得隐式修改参数、开关状态或图表基线。

## 模型边界与教学声明

- 这是确定性的理想电路教学模型，不是实验室仪器校准或工程设计工具。
- 不模拟电源内阻、导线电阻、开关电弧、电容/电感瞬态、温度变化、发热反馈或测量误差。
- 常规电流方向与电子漂移方向相反；首版只展示常规电流，避免把两个概念混在一张图里。
- 断开状态只说明“无闭合回路、无电流”，不延伸到电场建立和开路端电势分布。
- 付费串并联实验负责等效电阻、分支电流、节点守恒和多点测量；这些不应通过本模板的参数组合模拟。

## 科学测试

1. 默认闭合参数满足 `I = V / R`、`V_R = V` 和 `P = V I`。
2. 开关断开时 `I = 0`、`P = 0`，状态明确为 `Open circuit`。
3. 电压加倍且电阻不变时，电流和功率分别加倍和变为四倍。
4. 电阻加倍且电压不变时，电流减半，功率减半。
5. 所有合法参数产生有限、非负且带正确 SI 单位的读数。
6. 相同参数在不同播放帧率、画幅、缩放和全屏状态下测量值完全一致。
7. 任意视口变换都不改变电路拓扑、开关状态、参数或当前讲解步骤。
8. 画布电流方向、状态标签、公式和读数来自同一求解状态，不允许单独写死。
