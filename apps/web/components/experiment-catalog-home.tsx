"use client";

import {
  ArrowRight,
  Atom,
  BookOpen,
  Calculator,
  Check,
  ChevronRight,
  FlaskConical,
  Globe2,
  Languages,
  ListChecks,
  MonitorPlay,
  Presentation,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {useState} from "react";

type CatalogLocale = "en" | "zh-CN";

const copy = {
  en: {
    nav: {experiments: "Experiment library", workflow: "How it works", pricing: "Pricing", faq: "FAQ", account: "Account"},
    tryFree: "Try a free experiment",
    explore: "Explore experiments",
    heroKicker: "Interactive physics for classroom teaching",
    heroTitle: "Interactive physics experiments, ready for class.",
    heroBody: "Adjust real lesson parameters, reveal forces and formulas step by step, and present the result on any classroom screen.",
    heroNote: "No student accounts required. Start with four complete experiments for free.",
    releaseStatus: [
      {value: "14", label: "experiments available"},
      {value: "4", label: "free lessons"},
      {value: "10", label: "in the Middle School Pack"},
      {value: "Next", label: "High School support"},
    ],
    lesson: "Live lesson preview",
    lessonStep: "03 / Resolve gravity",
    physicsStatus: "Deterministic model",
    measurements: "Measurements",
    acceleration: "Acceleration",
    endVelocity: "End velocity",
    forceDown: "Down-slope force",
    trust: ["No coding", "Guided explanations", "Deterministic physics", "Classroom-ready"],
    libraryKicker: "Experiment library",
    libraryTitle: "Interactive physics experiments, ready for class.",
    libraryBody: "Four free and ten paid middle-school experiments are ready now. The library keeps growing after classroom and scientific review, with High School support planned next.",
    switchLanguage: "Switch to Chinese",
    workflowKicker: "Teacher workflow",
    workflowTitle: "From lesson objective to classroom display in minutes",
    workflow: [
      {title: "Choose the concept", body: "Find a released experiment by concept and subject instead of building a simulation from scratch."},
      {title: "Set your example", body: "Adjust only the values your lesson needs, with units, ranges, assumptions, and checks kept visible."},
      {title: "Explain it live", body: "Move through a prepared teaching sequence while the diagram, equations, and measurements stay synchronized."},
    ],
    benefitsKicker: "Built for the front of the room",
    benefitsTitle: "A teaching instrument, not another student portal",
    benefitsBody: "Science Studio stays focused on the part teachers repeat every week: making an abstract process visible, accurate, and easy to explain.",
    benefits: [
      {title: "Presentation-first", body: "Large labels and restrained controls remain legible on projectors and interactive whiteboards."},
      {title: "Guided Explain mode", body: "Every experiment follows a short teaching sequence, so the visual appears when the explanation needs it."},
      {title: "Science checks", body: "Parameter limits, model assumptions, and calculation checks are part of the lesson, not hidden in documentation."},
      {title: "English-first conventions", body: "SI units, familiar variable names, and classroom language are designed for international science teaching."},
    ],
    pricingKicker: "Experiment packs",
    pricingTitle: "Start free. Add the first teacher pack when you need it.",
    pricingBody: "The Middle School Pack includes ten experiments now and future reviewed additions to that pack. High School will launch later as a separate collection.",
    available: "Available now",
    earlyAccess: "Early access available",
    future: "In development",
    targetPrice: "One-time price",
    priceAtRelease: "Pricing announced at release",
    freePrice: "$0",
    freeName: "Free Starter",
    freeDesc: "Try the complete classroom workflow before deciding whether the format fits your teaching.",
    middleName: "Middle School Physics Foundations",
    middleDesc: "A focused paid pack of circuit, waves, forces, fluids, optics, energy, and magnetism lessons for middle school.",
    highName: "High School Physics",
    highDesc: "Advanced mechanics, electricity, waves, and optics experiments built for high-school teaching sequences.",
    currentAccess: "Four complete classroom experiments",
    expanding: "No account needed for classroom presentation",
    opensAtFive: "Ten released experiments available now",
    futureIncluded: "Future Middle School additions included",
    oneTimeAccess: "One-time teacher access, no subscription",
    highScope: "High-school curriculum and advanced models",
    separatePack: "A separate pack when it is classroom-ready",
    reviewedRelease: "Released only after classroom and scientific review",
    faqKicker: "FAQ",
    faqTitle: "Before you bring it into class",
    faq: [
      {q: "Is Science Studio a replacement for physical labs?", a: "No. It is a classroom explanation and demonstration tool. It helps teachers make forces, motion, equations, and model assumptions visible before or after hands-on work."},
      {q: "Do students need accounts?", a: "No. The first version is teacher-led. A teacher opens the experiment and presents it on a projector, interactive whiteboard, or shared screen."},
      {q: "Which grade levels are supported?", a: "All 14 released experiments currently target middle-school physics. Elementary and high-school lessons will appear only after they are classroom-ready."},
      {q: "Are the calculations scientifically verified?", a: "Each released experiment uses a deterministic solver, explicit SI units, documented assumptions, parameter validation, and automated tests. It is educational modeling, not engineering certification software."},
      {q: "Does it work on classroom displays?", a: "Yes. The interface is designed around teacher projection and common classroom screens, with large diagram labels and a focused presentation workflow."},
      {q: "What can I use for free?", a: "Inclined Plane & Friction, Energy Track, Forces & Motion, and Ohm's Law Lab are free now, including parameter controls, synchronized measurements, science checks, and guided explanation steps."},
    ],
    finalTitle: "Make the next physics explanation visible.",
    finalBody: "Open any free lesson and test the full classroom workflow.",
    footerTagline: "Guided interactive physics experiments for classroom presentation.",
    product: "Product",
    status: "Current status",
    support: "Support",
    legal: "Legal",
    contact: "Contact",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    refunds: "Refund Policy",
    freeExperiment: "Free experiment library",
    curriculum: "Planned curriculum",
    rights: "Science Studio. Built for teacher-led science lessons.",
  },
  "zh-CN": {
    nav: {experiments: "实验目录", workflow: "使用方式", pricing: "实验包", faq: "常见问题", account: "账户"},
    tryFree: "试用免费实验",
    explore: "查看实验目录",
    heroKicker: "面向课堂讲解的交互式物理实验",
    heroTitle: "打开即可讲课的交互式物理实验。",
    heroBody: "调整真实例题参数，逐步展示受力、公式和结果，并在任何课堂屏幕上清楚呈现。",
    heroNote: "学生无需账号，可先免费使用四个完整课堂实验。",
    releaseStatus: [
      {value: "14", label: "个实验已上线"},
      {value: "4", label: "个免费实验"},
      {value: "10", label: "个初中付费实验"},
      {value: "下一阶段", label: "支持高中课程"},
    ],
    lesson: "实时课堂预览",
    lessonStep: "03 / 分解重力",
    physicsStatus: "确定性物理模型",
    measurements: "测量结果",
    acceleration: "加速度",
    endVelocity: "最终速度",
    forceDown: "沿斜面合力",
    trust: ["无需编程", "结构化讲解", "确定性计算", "适合课堂展示"],
    libraryKicker: "实验目录",
    libraryTitle: "打开即可讲课的交互式物理实验。",
    libraryBody: "目前有四个免费和十个付费初中实验。实验通过课堂与科学审核后会持续加入，下一阶段将支持高中课程。",
    switchLanguage: "Switch to English",
    workflowKicker: "教师使用流程",
    workflowTitle: "几分钟内从教学目标进入课堂展示",
    workflow: [
      {title: "选择知识点", body: "按知识点和主题寻找已发布实验，不需要从空白场景搭建模拟。"},
      {title: "设置例题参数", body: "只调整本节课需要的数值，同时查看单位、范围、模型假设与科学检查。"},
      {title: "按步骤讲解", body: "沿准备好的教学顺序展示，示意图、公式与测量值始终同步。"},
    ],
    benefitsKicker: "为教室前方的大屏设计",
    benefitsTitle: "这是讲解工具，不是另一个学生管理平台",
    benefitsBody: "Science Studio 专注于教师每周都会重复的任务：把抽象过程讲得看得见、算得准、说得清。",
    benefits: [
      {title: "展示优先", body: "大号标注和克制控件可在投影仪与交互白板上保持清晰。"},
      {title: "引导讲解模式", body: "每个实验都有简短教学步骤，在讲到对应内容时出现正确的可视化。"},
      {title: "科学检查", body: "参数边界、模型假设和计算检查直接进入课堂流程，不藏在说明文档中。"},
      {title: "英语课程规范", body: "SI 单位、常用变量与课堂文案按海外科学教学场景设计。"},
    ],
    pricingKicker: "实验包",
    pricingTitle: "先免费使用，需要时再解锁教师实验包。",
    pricingBody: "初中实验包现含十个实验，并包含未来通过审核的初中新增实验。高中课程会在准备好后作为独立实验包上线。",
    available: "当前可用",
    earlyAccess: "早期访问，现已开放",
    future: "开发中",
    targetPrice: "一次性价格",
    priceAtRelease: "上线时公布价格",
    freePrice: "$0",
    freeName: "免费入门包",
    freeDesc: "先体验完整课堂讲解流程，再判断是否适合自己的教学方式。",
    middleName: "初中物理基础包",
    middleDesc: "围绕电路、波、力学、流体、光学、能量与磁学组织的初中付费课堂实验。",
    highName: "高中物理实验包",
    highDesc: "围绕高中教学顺序建设的进阶力学、电学、波动与光学实验。",
    currentAccess: "四个完整课堂实验",
    expanding: "课堂展示无需学生账号",
    opensAtFive: "十个已发布实验现在可用",
    futureIncluded: "未来新增的初中实验持续包含",
    oneTimeAccess: "一次性教师访问，不订阅",
    highScope: "高中课程与进阶模型",
    separatePack: "达到课堂可用标准后独立上线",
    reviewedRelease: "通过课堂与科学审核后再发布",
    faqKicker: "常见问题",
    faqTitle: "带进课堂前需要知道的事",
    faq: [
      {q: "它会替代真实物理实验吗？", a: "不会。它是课堂解释与演示工具，帮助教师在动手实验前后把受力、运动、公式和模型假设讲清楚。"},
      {q: "学生需要注册账号吗？", a: "不需要。首版由教师打开实验，并通过投影仪、交互白板或屏幕共享进行展示。"},
      {q: "支持哪些学段？", a: "目前发布的 14 个实验都面向初中物理。小学和高中实验会在达到课堂可用标准后再加入目录。"},
      {q: "计算经过科学验证吗？", a: "每个正式实验都使用确定性求解器、明确的 SI 单位和模型假设，并包含参数验证与自动化测试。它是教育模型，不是工程认证软件。"},
      {q: "适合课堂大屏吗？", a: "适合。界面以教师投屏为中心，示意图标注较大，并提供聚焦的课堂讲解流程。"},
      {q: "目前哪些内容免费？", a: "斜面与摩擦、能量轨道、力与运动和欧姆定律实验当前免费，均包含参数控制、同步测量、科学检查和引导式讲解流程。"},
    ],
    finalTitle: "让下一次物理讲解真正看得见。",
    finalBody: "打开任一免费实验，体验完整课堂流程。",
    footerTagline: "面向课堂展示的引导式交互物理实验。",
    product: "产品",
    status: "当前状态",
    support: "支持",
    legal: "法律信息",
    contact: "联系我们",
    terms: "服务条款",
    privacy: "隐私政策",
    refunds: "退款政策",
    freeExperiment: "免费实验目录",
    curriculum: "规划课程范围",
    rights: "Science Studio，面向教师主导的科学课堂。",
  },
};

function HeroExperimentPreview({locale}: {locale: CatalogLocale}) {
  const text = copy[locale];
  const angleDegrees = 32;
  const angleRadians = angleDegrees * Math.PI / 180;
  const rampBottom = {x: 480, y: 325};
  const rampTop = {
    x: rampBottom.x - (rampBottom.y - 37) / Math.tan(angleRadians),
    y: 37,
  };
  const downhill = {x: Math.cos(angleRadians), y: Math.sin(angleRadians)};
  const outwardNormal = {x: Math.sin(angleRadians), y: -Math.cos(angleRadians)};
  const rampLength = Math.hypot(rampBottom.x - rampTop.x, rampBottom.y - rampTop.y);
  const blockContact = {
    x: rampTop.x + downhill.x * rampLength * 0.46,
    y: rampTop.y + downhill.y * rampLength * 0.46,
  };
  const blockHalfHeight = 31;
  const blockCenter = {
    x: blockContact.x + outwardNormal.x * blockHalfHeight,
    y: blockContact.y + outwardNormal.y * blockHalfHeight,
  };
  const angleArcRadius = 46;
  const angleArc = Array.from({length: 17}, (_, index) => {
    const arcAngle = angleRadians * index / 16;
    const x = rampBottom.x - angleArcRadius * Math.cos(arcAngle);
    const y = rampBottom.y - angleArcRadius * Math.sin(arcAngle);
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
  const angleLabelRadius = 68;
  const angleLabel = {
    x: rampBottom.x - angleLabelRadius * Math.cos(angleRadians / 2),
    y: rampBottom.y - angleLabelRadius * Math.sin(angleRadians / 2),
  };
  const vectorEnd = (direction: {x: number; y: number}, length: number) => ({
    x: blockCenter.x + direction.x * length,
    y: blockCenter.y + direction.y * length,
  });
  const normalEnd = vectorEnd(outwardNormal, 105);
  const frictionEnd = vectorEnd({x: -downhill.x, y: -downhill.y}, 100);
  const parallelEnd = vectorEnd(downhill, 108);

  return (
    <div className="hero-lab" aria-label="Inclined plane experiment preview">
      <div className="hero-lab-bar">
        <span><span className="live-dot" />{text.lesson}</span>
        <span>{text.physicsStatus}</span>
      </div>
      <div className="hero-lab-layout">
        <div className="hero-canvas">
          <div className="hero-canvas-heading">
            <span>{text.lessonStep}</span>
            <strong>Inclined Plane &amp; Friction</strong>
          </div>
          <svg viewBox="0 0 720 400" role="img" aria-label={`Force diagram for a block on a ${angleDegrees} degree inclined plane`}>
            <defs>
              <pattern id="hero-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#d8dbd3" strokeWidth="1" />
              </pattern>
              <marker id="arrow-coral" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#e85d42" />
              </marker>
              <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#2659a8" />
              </marker>
            </defs>
            <rect width="720" height="400" fill="url(#hero-grid)" />
            <path d={`M ${rampTop.x} ${rampTop.y} L ${rampBottom.x} ${rampBottom.y} L ${rampTop.x} ${rampBottom.y} Z`} fill="#e4e6df" stroke="#242520" strokeWidth="4" strokeLinejoin="round" />
            <path d={angleArc} fill="none" stroke="#2659a8" strokeWidth="3" />
            <text x={angleLabel.x} y={angleLabel.y} textAnchor="middle" dominantBaseline="middle" fill="#2659a8" fontSize="21" fontWeight="700">{angleDegrees}°</text>
            <g transform={`translate(${blockCenter.x} ${blockCenter.y}) rotate(${angleDegrees})`}>
              <rect x="-37" y="-31" width="74" height="62" rx="4" fill="#f6f7f2" stroke="#1d1e1b" strokeWidth="4" />
              <text x="0" y="8" textAnchor="middle" fill="#1d1e1b" fontFamily="Georgia, serif" fontSize="23" fontStyle="italic" fontWeight="700">m</text>
            </g>
            <line x1={blockCenter.x} y1={blockCenter.y} x2={blockCenter.x} y2={blockCenter.y + 120} stroke="#e85d42" strokeWidth="4" markerEnd="url(#arrow-coral)" />
            <text x={blockCenter.x + 12} y={blockCenter.y + 112} fill="#e85d42" fontSize="19" fontWeight="700">F<tspan baselineShift="sub" fontSize="13">g</tspan></text>
            <line x1={blockCenter.x} y1={blockCenter.y} x2={normalEnd.x} y2={normalEnd.y} stroke="#e85d42" strokeWidth="4" markerEnd="url(#arrow-coral)" />
            <text x={normalEnd.x + 9} y={normalEnd.y - 4} fill="#e85d42" fontSize="19" fontWeight="700">N</text>
            <line x1={blockCenter.x} y1={blockCenter.y} x2={frictionEnd.x} y2={frictionEnd.y} stroke="#e85d42" strokeWidth="4" markerEnd="url(#arrow-coral)" />
            <text x={frictionEnd.x - 9} y={frictionEnd.y - 7} textAnchor="end" fill="#e85d42" fontSize="19" fontWeight="700">f<tspan baselineShift="sub" fontSize="13">k</tspan></text>
            <line x1={blockCenter.x} y1={blockCenter.y} x2={parallelEnd.x} y2={parallelEnd.y} stroke="#2659a8" strokeWidth="3" strokeDasharray="8 7" markerEnd="url(#arrow-blue)" />
            <text x={parallelEnd.x - 3} y={parallelEnd.y + 24} textAnchor="end" fill="#2659a8" fontSize="18" fontWeight="700">mg sin θ</text>
            <text x="520" y="86" fill="#676b63" fontSize="16" fontWeight="650">NET FORCE</text>
            <text x="520" y="122" fill="#181917" fontFamily="Georgia, serif" fontSize="25" fontStyle="italic">F = mg(sin θ − μ cos θ)</text>
            <text x="520" y="167" fill="#2659a8" fontSize="23" fontWeight="750">18.7 N</text>
            <path d="M520 206 H665" stroke="#c6c9c0" />
            <text x="520" y="244" fill="#676b63" fontSize="16" fontWeight="650">PREDICTION</text>
            <text x="520" y="278" fill="#12766d" fontSize="23" fontWeight="750">Block slides</text>
          </svg>
        </div>
        <aside className="hero-measurements">
          <span className="hero-measurements-title">{text.measurements}</span>
          <dl>
            <div><dt>{text.acceleration}</dt><dd>6.24 <small>m/s²</small></dd></div>
            <div><dt>{text.endVelocity}</dt><dd>9.84 <small>m/s</small></dd></div>
            <div><dt>{text.forceDown}</dt><dd>18.7 <small>N</small></dd></div>
          </dl>
          <div className="hero-step-rail" aria-label="Lesson steps">
            {["Set up", "Forces", "Components", "Predict", "Result"].map((step, index) => (
              <span className={index === 2 ? "active" : ""} key={step}><i>{index + 1}</i>{step}</span>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ExperimentCatalogHome() {
  const [locale, setLocale] = useState<CatalogLocale>("en");
  const text = copy[locale];

  return (
    <div className="home-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" href="/" aria-label="Science Studio home">
            <span className="brand-mark"><FlaskConical size={17} /></span>
            <strong>Science Studio</strong>
          </Link>
          <nav className="site-nav" aria-label="Primary navigation">
            <Link href="/experiments">{text.nav.experiments}</Link>
            <a href="#workflow">{text.nav.workflow}</a>
            <a href="#pricing">{text.nav.pricing}</a>
            <a href="#faq">{text.nav.faq}</a>
          </nav>
          <div className="site-actions">
            <button className="site-locale-button" type="button" aria-label={text.switchLanguage} title={text.switchLanguage} onClick={() => setLocale((current) => current === "en" ? "zh-CN" : "en")}>
              <Languages size={16} /><span>{locale === "en" ? "EN" : "中文"}</span>
            </button>
            <Link className="header-account-link" href="/account" aria-label={text.nav.account} title={text.nav.account}><UserRound size={15} /><span>{text.nav.account}</span></Link>
            <Link className="header-cta" href="/experiments/inclined-plane">{text.tryFree}<ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="home-hero" id="product">
          <div className="hero-copy">
            <span className="section-kicker"><Atom size={15} />{text.heroKicker}</span>
            <h1>{text.heroTitle}</h1>
            <p>{text.heroBody}</p>
            <div className="hero-actions">
              <Link className="primary-cta" href="/experiments/inclined-plane">{text.tryFree}<ArrowRight size={17} /></Link>
              <Link className="secondary-cta" href="/experiments">{text.explore}<ChevronRight size={16} /></Link>
            </div>
            <span className="hero-note"><Check size={14} />{text.heroNote}</span>
            <dl className="hero-release-status" aria-label="Current curriculum release status">
              {text.releaseStatus.map((item) => <div key={item.label}><dt>{item.value}</dt><dd>{item.label}</dd></div>)}
            </dl>
          </div>
          <HeroExperimentPreview locale={locale} />
        </section>

        <section className="trust-strip" aria-label="Product qualities">
          <div>{text.trust.map((item, index) => {
            const Icon = [SlidersHorizontal, ListChecks, Calculator, MonitorPlay][index];
            return <span key={item}><Icon size={17} />{item}</span>;
          })}</div>
        </section>

        <section className="home-section library-callout">
          <div className="section-heading split-heading">
            <div><span className="section-kicker"><BookOpen size={15} />{text.libraryKicker}</span><h2>{text.libraryTitle}</h2></div>
            <div className="library-callout-copy"><p>{text.libraryBody}</p><Link href="/experiments">{text.explore}<ArrowRight size={16} /></Link></div>
          </div>
        </section>

        <section className="home-section workflow-section" id="workflow">
          <div className="section-heading centered-heading"><span className="section-kicker"><ListChecks size={15} />{text.workflowKicker}</span><h2>{text.workflowTitle}</h2></div>
          <ol className="workflow-list">
            {text.workflow.map((item, index) => {
              const Icon = [BookOpen, SlidersHorizontal, Presentation][index];
              return <li key={item.title}><span className="workflow-number">0{index + 1}</span><Icon size={22} /><h3>{item.title}</h3><p>{item.body}</p></li>;
            })}
          </ol>
        </section>

        <section className="benefits-band">
          <div className="benefits-inner">
            <div className="benefits-intro"><span className="section-kicker"><Presentation size={15} />{text.benefitsKicker}</span><h2>{text.benefitsTitle}</h2><p>{text.benefitsBody}</p></div>
            <div className="benefits-list">
              {text.benefits.map((item, index) => {
                const Icon = [MonitorPlay, ListChecks, ShieldCheck, Globe2][index];
                return <article key={item.title}><Icon size={20} /><div><h3>{item.title}</h3><p>{item.body}</p></div></article>;
              })}
            </div>
          </div>
        </section>

        <section className="home-section pricing-section" id="pricing">
          <div className="section-heading split-heading"><div><span className="section-kicker"><FlaskConical size={15} />{text.pricingKicker}</span><h2>{text.pricingTitle}</h2></div><p>{text.pricingBody}</p></div>
          <div className="pricing-grid">
            <article className="pricing-card current"><span className="plan-status"><Check size={13} />{text.available}</span><h3>{text.freeName}</h3><strong>{text.freePrice}</strong><p>{text.freeDesc}</p><ul><li><Check size={14} />{text.currentAccess}</li><li><Check size={14} />{text.expanding}</li></ul><Link href="/experiments/inclined-plane">{text.tryFree}<ArrowRight size={15} /></Link></article>
            <article className="pricing-card available-pack"><span className="plan-status"><Check size={13} />{text.earlyAccess}</span><h3>{text.middleName}</h3><strong>$9.90 <small>{text.targetPrice}</small></strong><p>{text.middleDesc}</p><ul><li><Check size={14} />{text.opensAtFive}</li><li><RefreshCw size={14} />{text.futureIncluded}</li><li><Check size={14} />{text.oneTimeAccess}</li></ul><Link href="/experiments/dc-circuits">View pack<ArrowRight size={15} /></Link></article>
            <article className="pricing-card"><span className="plan-status future"><Sparkles size={13} />{text.future}</span><h3>{text.highName}</h3><strong className="planned-price">{text.priceAtRelease}</strong><p>{text.highDesc}</p><ul><li><Check size={14} />{text.highScope}</li><li><Check size={14} />{text.separatePack}</li><li><ShieldCheck size={14} />{text.reviewedRelease}</li></ul></article>
          </div>
        </section>

        <section className="home-section faq-section" id="faq">
          <div className="faq-layout">
            <div className="section-heading"><span className="section-kicker"><ShieldCheck size={15} />{text.faqKicker}</span><h2>{text.faqTitle}</h2></div>
            <div className="faq-list">{text.faq.map((item) => <details key={item.q}><summary>{item.q}<span>+</span></summary><p>{item.a}</p></details>)}</div>
          </div>
        </section>

        <section className="final-cta-band"><div><h2>{text.finalTitle}</h2><p>{text.finalBody}</p></div><Link className="primary-cta light" href="/experiments/inclined-plane">{text.tryFree}<ArrowRight size={17} /></Link></section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand"><Link className="site-brand" href="/"><span className="brand-mark"><FlaskConical size={17} /></span><strong>Science Studio</strong></Link><p>{text.footerTagline}</p></div>
        <div><strong>{text.product}</strong><Link href="/experiments">{text.nav.experiments}</Link><a href="#workflow">{text.nav.workflow}</a><a href="#pricing">{text.nav.pricing}</a></div>
        <div><strong>{text.support}</strong><Link href="/account">{text.nav.account}</Link><Link href="/contact">{text.contact}</Link><Link href="/experiments">{text.freeExperiment}</Link></div>
        <div><strong>{text.legal}</strong><Link href="/terms">{text.terms}</Link><Link href="/privacy">{text.privacy}</Link><Link href="/refund-policy">{text.refunds}</Link></div>
        <small>© 2026 {text.rights}</small>
      </footer>
    </div>
  );
}
