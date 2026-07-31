# Waves: Frequency, Wavelength & Speed 模板合同 v0.1

模板 ID：`waves.traveling-wave`

- 目录 ID：`middle-traveling-wave`
- 路由：`/experiments/waves`
- 主要学段：Middle school
- 权益：`middle-school-physics-foundations`
- 建议课堂时长：12 分钟
- 状态：第二个付费实验 MVP 已实现

## 教学边界

首版只表示均匀介质中向右传播的理想正弦横波。介质质点保持固定的水平坐标，只在平衡位置上下振动；波形和能量向右传播。不得把质点画成随波整体向右移动。

首版不包含反射、驻波、干涉、衍射、阻尼、色散或声波。后续若加入这些内容，必须使用各自独立且可验证的模型，不能只增加视觉箭头。

## 参数

| 参数 | 范围 | 单位 | 说明 |
|---|---:|---|---|
| `amplitudeM` | 0.1-1.2 | m | 波 A 与波 B 共用 |
| `frequencyHz` | 0.5-2.5 | Hz | 波 A 频率 |
| `waveSpeedMs` | 2-8 | m/s | 同一介质中的固定波速 |
| `comparisonFrequencyHz` | 0.5-2.5 | Hz | 波 B 频率 |
| `comparisonMode` | true / false | - | 显示或隐藏 A/B 对照 |
| `showParticles` | true / false | - | 显示介质质点及其固定水平位置 |

## 求解与测量

解析模型：

```text
T = 1 / f
lambda = v / f
y(x, t) = A sin(kx - omega t)
omega = 2 pi f
k = 2 pi / lambda
```

实时测量包含波 A 和波 B 的频率、周期和波长，以及两者共用的振幅与波速。A/B 对照只改变频率，振幅和波速保持相同。

## 课堂讲解

1. 区分质点振动方向与波的传播方向。
2. 从平衡位置测量振幅。
3. 用波源的周期运动建立频率和周期。
4. 在相邻同相位点之间测量一个波长。
5. 使用 `v = f lambda` 验证波速。
6. 比较同一介质中两种频率对应的波长。

## 科学验收

- 任意合法参数均满足 `T = 1 / f` 和 `v = f lambda`。
- 相隔一个周期的同一位置具有相同位移。
- 同一波形向右移动 `lambda / 4` 与时间前进 `T / 4` 等价。
- 所有质点的位移绝对值不超过振幅。
- A/B 对照中两列波波速相同，频率较高者波长更短。
- 播放时波形和质点同步运动，暂停后两者同时冻结。
- 波长大于 12 m 可见介质时保留正确计算并显示说明，不伪造完整波长标注。

## 实现位置

| 层 | 文件 |
|---|---|
| 求解器 | `packages/templates/src/traveling-wave/index.ts` |
| 科学测试 | `packages/templates/src/traveling-wave/traveling-wave.test.ts` |
| 教师工作台 | `apps/web/components/traveling-wave-workbench.tsx` |
| 页面与付费访问 | `apps/web/app/experiments/waves/page.tsx` |
| 目录种子 | `supabase/seed.sql` |
