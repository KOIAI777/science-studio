# Science Studio 实验模板路线 v0.1

更新日期：2026-07-30

## 1. 文档目的

本文档把实验市场调研转换为可开发的模板路线，用于回答三个问题：

1. 哪些物理实验被英语市场教师反复使用。
2. 哪些实验适合免费获客，哪些实验更适合进入付费实验包。
3. 每个候选模板具体需要哪些参数、测量值、画面和讲解步骤。

这不是公开使用量排行榜。PhET、Gizmos 等平台没有公开可验证的逐实验使用量，因此优先级采用课程覆盖、教师资源供给、课堂替代价值、付费价值和工程成本的综合判断。

## 2. 调研结论

### 2.1 需求最集中的课题

| 优先级 | 课题 | 课程需求 | 付费潜力 | 产品角色 |
|---:|---|---|---|---|
| 1 | Forces & Motion / Free-body Diagram | 极高 | 中 | 免费获客核心 |
| 2 | Energy Track / Roller Coaster | 极高 | 高 | 第二个免费实验 |
| 3 | DC Circuit Lab | 极高 | 极高 | 首批付费旗舰 |
| 4 | Projectile Motion | 高 | 高 | 高中实验包核心 |
| 5 | Collision & Momentum | 高 | 高 | 高中实验包核心 |
| 6 | Waves: Frequency, Wavelength & Speed | 高 | 高 | 初高中通用 |
| 7 | Density & Buoyancy | 中高 | 中高 | 初中实验包核心 |
| 8 | Rotation & Torque | 中高 | 高 | 高中进阶付费 |
| 9 | Mass-Spring Oscillator | 中 | 中高 | 高中进阶补充 |
| 10 | Gravity & Orbits | 中 | 中 | 展示和传播内容 |

### 2.2 证据

- NGSS 初中物理主干包含 `MS-PS2 Forces and Interactions`、`MS-PS3 Energy` 和 `MS-PS4 Waves`。
- AP Physics 1 的 Force and Translational Dynamics 占选择题 `18%-23%`，Work, Energy and Power 同样占 `18%-23%`；Kinematics、Linear Momentum、Torque and Rotation、Fluids 分别占 `10%-15%`。
- PhET 当前物理目录包含 66 个 HTML5 模拟，高频核心课题覆盖 Forces and Motion、Energy Skate Park、Circuit Construction Kit、Projectile Motion、Collision Lab 和 Waves。
- Teachers Pay Teachers 上持续存在围绕免费模拟销售的 worksheet、mini lab 和 guided activity。可购买的内容主要解决课堂组织和讲解问题，而不是重复提供物理公式。
- PhET Studio 将保存预设、隐藏无关控件、分享课堂版本和差异化教学作为付费功能。公开标准价为 Classroom License 每编辑席位每年 `$100`，Curriculum License 每年 `$5,000` 起；页面中的 2025 折扣信息已过期，不作为当前价格依据。

参考资料：

- [PhET Physics simulations](https://phet.colorado.edu/en/simulations/filter?subjects=physics&type=html)
- [PhET Studio features](https://phet.colorado.edu/en/studio/overview/features)
- [PhET Studio pricing](https://phet.colorado.edu/en/studio/overview/pricing)
- [AP Physics 1 course and exam weighting](https://apcentral.collegeboard.org/courses/ap-physics-1/course)
- [NGSS MS-PS2 Forces and Interactions](https://www.nextgenscience.org/dci-arrangement/ms-ps2-motion-and-stability-forces-and-interactions)
- [NGSS MS-PS3 Energy](https://www.nextgenscience.org/dci-arrangement/ms-ps3-energy)
- [NGSS MS-PS4 Waves](https://www.nextgenscience.org/dci-arrangement/ms-ps4-waves-and-their-applications-technologies-information-transfer)

## 3. 内容与付费结构

### 3.1 Free Starter

免费层需要证明完整课堂工作流，同时覆盖力学和电学中最常见的教师入口。Free Starter 最终固定为四个实验；电学只开放 Ohm's Law Lab 的受控单回路，完整串并联电路仍属于付费内容。

| 顺序 | 模板 | 状态 | 获客目的 |
|---:|---|---|---|
| 1 | Inclined Plane & Friction | 已实现首版 | 展示受力、分解和确定性计算 |
| 2 | Energy Track | 已实现首版 | 覆盖多学段并展示动态守恒图 |
| 3 | Forces & Motion | 已实现首版 | 承接 Newton's laws、net force 和 free-body diagram 搜索需求 |
| 4 | Ohm's Law Lab | 已实现首版 | 用单回路验证 voltage、current、resistance 的关系，并建立电路模板基础 |

只有四个实验都完成科学检查、讲解流程和课堂展示后，Free Starter 才算成立。前三个实验覆盖力学；第四个实验把免费入口扩展到基础电学，但不提前开放付费 DC Circuits 的拓扑编辑能力。

Forces & Motion 的总体课程需求最高，但当前斜面实验已经覆盖一部分受力、摩擦和分量讲解。第二个模板先选择 Energy Track，是为了尽快验证能量图、守恒量和跨学段讲解能力；第三个模板再把水平受力和 Newton's laws 补全；第四个模板使用最小的理想直流回路验证电学入口，同时保护付费 DC Circuits 的差异化空间。

### 3.2 Middle School Physics Foundations

现有 `Middle School Mechanics` 名称不能准确容纳电路和波。开始销售前应评估改名为 `Middle School Physics Foundations`。

计划约 15 个付费实验，按课堂需求分批发布。当前优先候选：

1. DC Circuits: Series and Parallel。
2. Waves: Frequency, Wavelength and Speed。
3. Density and Buoyancy。
4. Levers and Balance。
5. Momentum and Collisions: Basics。
6. Electrical Power and Energy。
7. Electromagnets。
8. Magnetic Fields and Current。
9. Sound: Pitch, Loudness and Speed。
10. Reflection and Refraction。
11. Lenses and Image Formation。
12. Springs and Hooke's Law。
13. Heat Transfer。
14. Particle Model of Matter。
15. Gas Pressure and Temperature。

Early Access 已开放，当前已发布 DC Circuits、Waves、Density & Buoyancy、Momentum & Collisions、Refraction & Total Internal Reflection 和 Levers & Balance 六个实验；后续仍按教师重复使用和付费反馈决定开发顺序与价格。实验包权益是内容访问权，不包含学生账户、成绩或班级管理。

### 3.3 High School Mechanics

首批候选：

1. Projectile Motion。
2. One-dimensional Collision Lab。
3. Rotation and Torque。
4. Mass-Spring Oscillator。
5. Gravity and Orbits。

高中的付费价值来自矢量分解、守恒量比较、图表、关键事件和多场景对照，不只是增加参数数量。

## 4. 模板优先级规则

每次选择新模板时按以下规则评分：

| 维度 | 权重 | 判断方式 |
|---|---:|---|
| 课程覆盖 | 30% | 是否覆盖 NGSS、AP 或多个学段的重复教学任务 |
| 课堂解释难度 | 25% | 是否需要动态图、矢量、守恒量或肉眼难以观察的过程 |
| 付费价值 | 20% | 是否能明显节省备课、设备搭建和课堂切换时间 |
| 模板复用 | 15% | 是否能沉淀通用图表、矢量、时间轴或求解组件 |
| 实现成本 | 10% | 能否使用解析解或受控数值模型完成确定性实现 |

热门但完全被免费平台满足的实验仍可用于获客；付费模板必须额外提供结构化讲解、课堂预设、比较模式和科学检查。

## 5. 具体模板定义

### 5.1 Inclined Plane & Friction

- 模板 ID：`mechanics.inclined-plane`
- 主要学段：Middle school
- 权益：Free Starter
- 状态：已实现首版
- 教学目标：理解重力分量、支持力、静摩擦判据和滑动加速度。
- 详细合同：[inclined-plane.md](templates/inclined-plane.md)

该模板只模拟物体在斜面上的静止或下滑。到达底端后停止，不延伸到抛体、落地或碰撞场景。

### 5.2 Energy Track

- 模板 ID：`mechanics.energy-track`
- 主要学段：Elementary / Middle school；高中可切换定量模式
- 权益：Free Starter
- 建议时长：15 分钟
- 状态：第三个付费实验 MVP 已实现
- 详细合同：[density-buoyancy.md](templates/density-buoyancy.md)
- 状态：已实现首版
- 详细合同：[energy-track.md](templates/energy-track.md)

教学目标：

- 区分 gravitational potential energy、kinetic energy 和 thermal energy。
- 观察高度、速度、质量和摩擦对能量转换的影响。
- 验证封闭系统中的总能量守恒。

参数：

| 参数 | 建议范围 | 单位 | 说明 |
|---|---:|---|---|
| `massKg` | 0.5-10 | kg | 影响各能量绝对值，不影响无摩擦速度 |
| `startHeightM` | 1-12 | m | 初始重力势能来源 |
| `frictionCoefficient` | 0-0.4 | - | 首版使用受控摩擦模型 |
| `gravityMs2` | 1-20 | m/s² | 默认 9.81 |

测量值：当前位置、速度、动能、重力势能、热能和总能量。画面同时显示圆弧轨道、小车轨迹、起始/返回高度和同步能量预算。

默认讲解：设置起始高度 -> 识别三种能量 -> 检查总能量守恒 -> 预测返回高度 -> 观察完整运动。

模型边界：物体被约束在预定义轨道上；首版不模拟环形轨道、脱轨、翻滚或空气阻力。

科学测试：无摩擦时机械能守恒；最低点速度与解析值一致；有摩擦时机械能损失等于热能增加；任何采样不得出现负动能或总能量漂移。

### 5.3 Forces & Motion

- 模板 ID：`mechanics.forces-and-motion`
- 主要学段：Middle school
- 权益：Free Starter
- 建议时长：10 分钟
- 状态：已实现首版
- 详细合同：[forces-and-motion.md](templates/forces-and-motion.md)

教学目标：理解 net force、Newton's first and second laws、static/kinetic friction 和 free-body diagram。

参数：物体质量、水平外力、静摩擦系数、动摩擦系数、重力加速度和作用时间。场景固定为水平面上的单个物体，不开放任意添加物体。

测量值：重力、支持力、摩擦力、合力、加速度、速度和位移。画面显示受力图、运动轨迹以及可选的 `force-time`、`velocity-time` 图表。

默认讲解：建立场景 -> 标注所有力 -> 判断是否克服静摩擦 -> 计算合力 -> 观察运动 -> 对照图表。

模型边界：只处理一维平动；首版不包含绳索系统、滑轮、旋转或碰撞。

### 5.4 Ohm's Law Lab

- 模板 ID：`electricity.ohms-law`
- 目录 ID：`middle-ohms-law`
- 主要学段：Middle school；可作为高中电学复习入口
- 权益：Free Starter（第四个也是最后一个免费 Starter 实验）
- 建议时长：10 分钟
- 状态：已实现首版
- 详细合同：[ohms-law.md](templates/ohms-law.md)

教学目标：识别电压源、电阻、开关和常规电流方向；使用 `I = V / R` 预测电流；通过改变一个参数观察电流的比例关系；用 `P = V I` 解释单个电阻的功率。

免费合同严格限定为一个理想 DC 回路：一个理想电压源、一个电阻、一个开关和理想导线。开关闭合后回路中电流处处相同，开关断开时电流为零。参数只允许修改源电压 `V`、电阻 `R` 和开关状态；建议范围为 `1-24 V`、`1-100 Ω`。

测量值：源电压、电阻、电流、电阻两端电压、功率和回路状态。画面必须同步显示电路图、常规电流方向、导线上的电流动画或明确的静态方向标识，以及 `V-I` 或参数关系图。

默认讲解：识别元件 -> 闭合开关并追踪电流路径 -> 预测 `I = V / R` -> 改变电压或电阻并比较读数 -> 检查功率与结论。

模型边界：不提供拓扑编辑器、串联/并联/混联、多电阻、任意布线、节点或回路选择，也不提供可移动探针式电压表/电流表。电源、电阻和导线使用理想模型；不模拟电池内阻、导线电阻、瞬态响应、温度依赖、非欧姆元件、短路电流或真实电子漂移速度。电流采用常规电流方向，不把电子漂移方向混入首版画面。

科学测试：闭合时 `I = V / R` 且 `P = V I = V² / R`；断开时 `I = 0`、`P = 0`；电压加倍时电流加倍；电阻加倍时电流减半；电阻两端电压等于源电压；所有显示单位和符号与求解状态一致。

### 5.5 DC Circuits: Series and Parallel

- 模板 ID：`electricity.dc-circuits`
- 主要学段：Middle school / High school
- 权益：Middle School Physics Foundations
- 建议时长：12-15 分钟
- 商业角色：首批付费旗舰
- 状态：首个付费实验 MVP 已实现
- 详细合同：[dc-circuits.md](templates/dc-circuits.md)

教学目标：理解 voltage、current、resistance、series/parallel connections、Ohm's law 和基础 Kirchhoff rules。

参数：

| 参数 | 建议范围 | 单位 |
|---|---:|---|
| `topology` | `single` / `series` / `parallel` | - |
| `sourceVoltageV` | 1-24 | V |
| `resistance1Ohm` | 1-100 | ohm |
| `resistance2Ohm` | 1-100 | ohm |
| `switchClosed` | true / false | - |
| `showConventionalCurrent` | true / false | - |

测量值：等效电阻、总电流、支路电流、各元件电压和功率。画面显示电路图、电流方向、可移动但受限的电压表/电流表测点以及串并联对照表。

默认讲解：识别拓扑 -> 预测电流路径 -> 计算等效电阻 -> 应用 Ohm's law -> 测量各支路 -> 比较串联与并联。

模型边界：首版只提供三个预定义拓扑，不做自由电路编辑器；使用理想导线和理想电源；短路场景只用于警告，不允许无限电流进入求解器。

科学测试：满足 Ohm's law；节点电流守恒；回路电压和为零；串并联等效电阻与解析值一致；开关断开时所有支路电流为零。

### 5.6 Projectile Motion

- 模板 ID：`mechanics.projectile-motion`
- 主要学段：High school
- 权益：High School Mechanics
- 建议时长：12-15 分钟

教学目标：分解初速度、比较水平与竖直运动、识别最高点并预测飞行时间和射程。

参数：初速度、发射角、初始高度、重力加速度。首版固定 `airDrag = false`；空气阻力必须作为后续独立数值模型，不得只画一个阻力箭头却继续使用真空解析结果。

测量值：`vx`、`vy`、速度大小、位置、飞行时间、最高点时间、最大高度、射程和落地速度。

默认讲解：设置发射条件 -> 分解初速度 -> 独立跟踪 x/y 方向 -> 找到最高点 -> 预测落地点 -> 观察完整轨迹。

模型边界：平坦地面、恒定重力、质点和无空气阻力；首次落地即结束，不反弹、不滚动。

科学测试：轨迹满足解析抛物线；最高点 `vy = 0`；相同高度发射与落地时速度大小相同；事件时间与解析解一致。

### 5.7 One-dimensional Collision Lab

- 模板 ID：`mechanics.momentum-collision`
- 主要学段：Middle school
- 权益：Middle School Physics Foundations
- 建议时长：15 分钟
- 状态：第四个付费实验 MVP 已实现
- 详细合同：[momentum-collisions.md](templates/momentum-collisions.md)

教学目标：理解 momentum conservation、impulse、elastic/inelastic collision 和 kinetic-energy change。

参数：两个物体质量、两个初速度、恢复系数或碰撞类型。场景只允许两个物体沿同一直线运动。

测量值：碰撞前后速度、单体和总动量、动能、冲量和能量损失。画面提供碰撞前/后的并排状态和动量条形图。

默认讲解：记录初态 -> 计算总动量 -> 选择碰撞类型 -> 预测末速度 -> 播放碰撞 -> 比较守恒量。

模型边界：瞬时一维碰撞；不模拟形变、旋转、摩擦地面或三体连续碰撞。

### 5.8 Waves: Frequency, Wavelength & Speed

- 模板 ID：`waves.traveling-wave`
- 主要学段：Middle school / High school
- 权益：Middle School Physics Foundations
- 建议时长：10-12 分钟
- 状态：第二个付费实验 MVP 已实现
- 详细合同：[traveling-wave.md](templates/traveling-wave.md)

教学目标：建立 amplitude、frequency、period、wavelength 和 wave speed 的关系，并区分介质运动与波的传播。

参数：振幅、频率、波速、相位和阻尼开关。首版使用受控行波，不把声音传播和弦上波动混成一个模型。

测量值：周期、波长、波速、指定点位移和相位。画面显示传播方向、介质粒子局部运动和 `v = f lambda` 关系。

默认讲解：设置波源 -> 识别振幅和周期 -> 测量波长 -> 改变频率 -> 保持介质不变比较波速 -> 总结关系。

模型边界：首版不处理复杂边界反射、干涉、驻波或三维声场；这些作为后续独立模板。

### 5.9 Density & Buoyancy

- 模板 ID：`fluids.density-buoyancy`
- 主要学段：Elementary / Middle school
- 权益：Middle School Physics Foundations
- 建议时长：15 分钟
- 状态：第三个付费实验 MVP 已实现
- 详细合同：[density-buoyancy.md](templates/density-buoyancy.md)

教学目标：区分 mass、volume 和 density，使用 Archimedes' principle 预测浮起、悬浮或下沉。

参数：物体质量、体积、两种流体密度和重力加速度。物体形状使用固定立方体，提供 oil、water 与 salt water 流体预设。

测量值：物体密度、排开体积、浮力、重力、合力和浸没比例。画面显示液面、排液体积、漂浮平衡线和竖直受力图。

默认讲解：计算密度 -> 比较物体与流体 -> 预测状态 -> 标注浮力和重力 -> 观察平衡位置 -> 验证排液关系。

模型边界：均匀刚性立方体在静止、均匀、不可压缩流体中做一维竖直运动；包含固定系数二次阻力和槽底支持力，不模拟波浪、飞溅、表面张力、倾覆、渗水、旋转、水平运动或不规则自由表面。

### 5.10 Refraction & Total Internal Reflection

- 模板 ID：`optics.refraction-tir`
- 主要学段：Middle school
- 权益：Middle School Physics Foundations
- 建议时长：15 分钟
- 状态：第五个付费实验 MVP 已实现
- 详细合同：[refraction-total-internal-reflection.md](templates/refraction-total-internal-reflection.md)

教学目标：从法线测量角度，验证反射定律和斯涅尔定律，计算临界角，并区分临界角状态与全反射。

参数：入射角、两种介质的折射率、法线和角度标注开关。预设覆盖 Air to glass、Water to air 和 Glass to air。

测量值：入射角、反射角、折射角、临界角、当前光路状态和两种介质中的相对光速。画面同时显示界面、法线、入射/反射/折射光线和公式面板。

默认讲解：识别界面 -> 画出法线 -> 应用反射定律 -> 使用斯涅尔定律 -> 计算临界角 -> 检验全反射。

模型边界：均匀各向同性介质与平面界面的几何光学；不模拟 Fresnel 能量比例、色散、偏振、吸收、透镜或多界面光路。播放只表示构图顺序，不表示光传播时间。

### 5.11 Levers & Balance: Moments in Equilibrium

- 模板 ID：`mechanics.lever-balance`
- 主要学段：Middle school
- 权益：Middle School Physics Foundations
- 建议时长：15 分钟
- 状态：第六个付费实验 MVP 已实现
- 详细合同：[levers-and-balance.md](templates/levers-and-balance.md)

教学目标：确定支点和垂直力臂，计算顺逆时针力矩，预测水平释放后的初始转向，并用力矩平衡原理求未知质量或距离。

参数：左右质量、左右到支点距离、重力加速度，以及重力箭头和力矩箭头开关。预设覆盖平衡、左侧下沉和右侧下沉。

测量值：两侧重力、随角度变化的两侧力矩、合力矩、横梁角度、角速度、方向判断、平衡所需右侧质量和平衡所需右侧距离。问题模式可隐藏右侧质量或距离，并同步遮蔽公式和测量区中的派生答案。

默认讲解：确定支点 -> 标出重力 -> 测量垂直力臂 -> 计算力矩 -> 比较转向 -> 求解未知量。

模型边界：分析阶段使用刚性水平横梁、中央无摩擦支点和点载荷；释放阶段按 `I alpha = sum(tau)` 固定步长积分，并在 `±12°` 完全非弹性机械限位处停止。横梁为理想轻质刚体，不模拟反弹、横梁弯曲或支点摩擦。

### 5.12 Rotation & Torque

- 模板 ID：`mechanics.rotation-torque`
- 主要学段：High school
- 权益：High School Mechanics
- 建议时长：12-15 分钟

教学目标：理解 torque、lever arm、rotational equilibrium、moment of inertia 和 angular acceleration。

参数：作用力、作用点距离、作用角度、转动惯量、轴摩擦和初始角速度。首版场景固定为绕单轴转动的横杆或圆盘。

测量值：单个力矩、合力矩、角加速度、角速度、角位移和转动动能。

默认讲解：确定转轴 -> 标注力臂 -> 计算各力矩 -> 判断平衡 -> 预测转动方向 -> 观察角运动。

模型边界：单固定轴刚体；不处理三维进动、柔性结构或滚动接触。

### 5.13 Mass-Spring Oscillator

- 模板 ID：`mechanics.mass-spring`
- 主要学段：High school
- 权益：High School Mechanics
- 建议时长：12 分钟

教学目标：理解 Hooke's law、平衡位置、振幅、周期、相位和机械能交换。

参数：质量、弹簧常量、初始位移、初始速度、阻尼系数和重力开关。

测量值：位移、速度、加速度、弹性势能、动能、总能量和周期。画面显示振子、相位同步的 `x-t` 图以及能量图。

默认讲解：识别平衡位置 -> 建立恢复力 -> 预测周期 -> 跟踪相位 -> 比较动能和势能 -> 加入阻尼。

模型边界：理想线性弹簧和单自由度；阻尼模式不能继续显示无阻尼解析周期为精确结果。

### 5.14 Gravity & Orbits

- 模板 ID：`mechanics.gravity-orbits`
- 主要学段：High school
- 权益：High School Mechanics 后期内容
- 建议时长：15 分钟
- 商业角色：传播和展示优先，不作为首批付费验证

教学目标：理解万有引力、切向速度、圆轨道、撞击和逃逸之间的关系。

参数：中心天体质量、初始半径、切向速度和时间缩放。天体预设必须明确，不以卡通比例暗示真实尺度。

测量值：距离、速度、引力、总机械能、角动量和轨道状态。画面显示轨迹、速度矢量和引力矢量。

默认讲解：设置初始状态 -> 标注引力和速度 -> 比较圆轨道速度 -> 调整速度 -> 识别撞击/轨道/逃逸 -> 检查能量。

模型边界：首版使用固定中心天体的二维二体近似；不处理多体系统、相对论、潮汐或大气阻力。

## 6. 共同模板合同

每个进入开发的模板必须先创建 `docs/templates/<slug>.md`，并满足：

1. 有稳定的模板 ID、版本和主要学段。
2. 明确教学目标、参数、单位、合法范围和默认值。
3. 明确输出测量、公式、关键事件和停止条件。
4. 提供 4-6 个固定讲解步骤，讲解时间与物理时间分离。
5. 列出模型假设和不属于当前模板的场景。
6. 为标准参数、边界、非法输入和守恒量编写测试。
7. 所有矢量、角度、物体接触和轨迹几何从同一物理状态生成，禁止展示图单独写死。
8. 发布前由人工检查图形是否与计算一致，特别检查角度、单位、箭头方向和标签遮挡。
9. 目录封面必须从实际运行模板截图生成，并与发布版本同步；未完成模板不制作占位封面。

## 7. 开发顺序

### 阶段 0：收紧当前斜面实验

- 完成 Present 全屏课堂模式。
- 完成桌面、手机和投影尺寸视觉回归。
- 找英语物理教师验证五步讲解是否真实可用。

### 阶段 1：完成 Free Starter

1. Energy Track 已完成首版，进入教师验证。
2. Forces & Motion 已完成首版，进入教师验证。
3. Ohm's Law Lab 单回路首版已完成；继续统一四个免费模板的参数、测量、讲解和科学检查界面。
4. 记录教师从打开实验到开始讲解所需时间。

### 阶段 2：验证首批付费内容

1. DC Circuits 首个付费 MVP 已完成，进入教师验证。
2. Waves 第二个付费 MVP 已完成，进入教师验证。
3. Density and Buoyancy 第三个付费 MVP 已完成，进入教师验证。
4. Momentum and Collisions 第四个付费 MVP 已完成，进入教师验证。
5. Refraction and Total Internal Reflection 第五个付费 MVP 已完成，进入教师验证。
6. Levers and Balance 第六个付费 MVP 已完成，进入教师验证。
7. 保持同一实验包与 `$9.90` Early Access 价格，按重复课堂使用、教师请求和付费反馈决定第七个主题。

### 阶段 3：扩展高阶实验

按教师请求频率开发 Rotation & Torque、Mass-Spring Oscillator 和 Gravity & Orbits，不因为视觉效果提前建设低频模板。

## 8. 成功指标

模板优先级最终由真实使用数据修正：

- 实验页进入率。
- 从打开到进入 Present 的完成率和耗时。
- 同一教师 30 天内重复打开次数。
- 每个实验完成的课堂讲解次数。
- Free Starter 到实验包候补名单或购买的转化。
- 教师主动请求的下一实验主题。

单次访问量只能说明内容被发现；重复课堂展示才说明模板解决了真实教学任务。
