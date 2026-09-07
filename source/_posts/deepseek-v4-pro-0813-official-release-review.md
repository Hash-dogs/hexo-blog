---
title: DeepSeek V4 Pro 0813 正式版发布：Agent 能力补齐后，离 Fable 5 只差 5%
date: 2026-08-13 11:00:00
updated: 2026-08-13 11:00:00
categories:
  - 技术分享
tags: [技术分享, AI, DeepSeek, LLM, AI Agent, 开源, 大模型评测]
cover: https://images.pexels.com/photos/17483871/pexels-photo-17483871.png?auto=compress&cs=tinysrgb&h=650&w=940
description: DeepSeek 在 8 月 13 日上线 V4 Pro 0813 正式版，保持极低定价的同时，把 Agent 基准从预览版短板拉进第一梯队。本文汇总官方技术报告、NIST 测评与爱范儿、36氪等实测数据，拆解关键突破与行业影响。
---

## 引言

8 月 13 日凌晨，DeepSeek 官网几乎没有预告地更新了一个表格字段：`deepseek-v4-pro` 对应的模型版本从 Preview 变成了 **DeepSeek-V4-Pro-0813**。没有单独发布会，没有重量级官宣，但 API 价格页、OpenRouter、DeepSeek Chat 已经开始切换到这版权重。

更值得关注的是，这次更新补上的不是普通的知识或推理分数，而是此前被诟病最深的 **Agent 能力**。如果把 4 月预览版和 8 月正式版放在一起看，很多 Agent 基准几乎是「从不会做」变成了「第一梯队能打」。

这篇文章会把官方技术报告、DeepSeek 官方价格页、NIST 政府测评，以及爱范儿、36氪、Decrypt 等媒体实测放在一起，拆清楚 V4 Pro 0813 到底强在哪里，以及它为什么会对下游行业产生连锁反应。

> **结论速览：** V4 Pro 0813 是一次针对 Agent 能力的后训练升级；官方自报的 10 项 Agent 基准较预览版大幅提升，相对 Fable 5 平均约落后 5.3%，但 API 价格约低 46 倍。它把开源模型从「便宜够用」进一步推向「便宜且接近前沿」。

---

## 一、0813 到底更新了什么

从 API 层面看，变化很小：模型名 `deepseek-v4-pro` 没有变，上下文窗口仍是 **1M tokens**，最大输出仍是 **384K tokens**，也继续支持 thinking/non-thinking、JSON Output、Tool Calls、Responses API、Anthropic API 兼容、Chat Prefix Completion 与 FIM Completion。

但从权重和基准看，变化非常明显。V4 Pro 0813 是在同一套架构上，针对大代码库加载、长任务规划、持续工具调用等 Agent 场景重新做了后训练，让 1M 上下文和 384K 输出真正变成可用能力。

{% mermaid %}
graph TD
    A[V4 Pro Preview<br/>2026-04] -->|Agent 专项后训练| B[V4 Pro 0813<br/>2026-08-13]
    B --> C[API 名称不变<br/>deepseek-v4-pro]
    B --> D[1M context<br/>384K max output]
    B --> E[代码 Agent / 长任务能力大幅提升]
{% endmermaid %}

DeepSeek 对这次正式版的定位很清晰：**Flash 负责高并发、低成本、高频调用；Pro 负责重推理、长上下文、复杂 Agent 工作流。** 两个版本形成 V4 系列的双轨结构。

![DeepSeek V4 Pro 与 V4 Flash 的双版本定位](/images/deepseek-v4-pro-0813/deepseek-v4-pro-flash.png)

| 时间 | 事件 |
|------|------|
| 2026-04-24 | V4 Pro / V4 Flash 以 Preview 形式发布，权重和 API 同时开放 |
| 2026-07-31 | V4 Flash 0731 正式版先行上线，Agent 基准反超 V4 Pro Preview |
| 2026-08-12/13 | V4 Pro 0813 正式版上线，API 名称不变，Agent 能力补齐 |

---

## 二、关键测评数据

先看 DeepSeek 官方放出的 0813 与预览版、V4 Flash、Opus 4.8、Fable 5 的对比。需要先说明：这些是 **厂商自报分**，其中 DSBench-FullStack 和 DSBench-Hard 是 DeepSeek 内部测试集，还没有公开第三方榜单可交叉验证。

| 基准 | V4 Pro Preview | V4 Pro 0813 | Opus 4.8 | Fable 5 |
|------|---------------|-------------|----------|---------|
| Terminal Bench 2.1 | 72.1 | **87.9** | 85.0 | 88.0 |
| DeepSWE | 12.8 | **62.7** | — | — |
| CyberGym | 52.7 | **83.3** | 78.3 | 83.1 |
| AutomationBench | 12.8 | **31.8** | 27.2 | — |
| DSBench-FullStack | 41.8 | **71.1** | 71.6 | — |
| DSBench-Hard | 31.1 | **67.2** | 71.7 | — |
| NL2Repo | 38.5 | **61.5** | 69.7 | — |
| HLE with tools | — | **60.0** | — | 63.0 |

几个变化尤其值得注意：

- **Terminal Bench 2.1** 从 72.1 涨到 87.9，单次提升 15.8 分，已经逼近 Kimi K3 的 88.3，超过 Opus 4.8 的 85.0，与 Fable 5 的 88.0 只差 0.1 分。
- **DeepSWE** 从 12.8 涨到 62.7，接近原来的 4.9 倍。这意味着软件工程 Agent 能力从「基本做不动」直接进入可交付区间。
- **CyberGym** 达到 83.3，甚至略高于 Fable 5 的 83.1，说明在安全攻防类长任务上已经有一项反超。
- **DSBench-Hard** 从 31.1 翻倍到 67.2，对高难度全栈开发任务不再有明显短板。

Decrypt 做过一个更克制的算法：把 Fable 5 在公开可比项目上的相对领先平均一下，是 **5.3%**；如果剔除差距被拉大的「无工具 HLE」，剩余项目平均只领先 **2.8%**。

也就是说，DeepSeek 已经不是靠某项单项第一取胜，而是在终端操作、代码工程、工具调用、安全攻防、长任务执行上同时进入第一梯队。这种「没有明显短板」的状态，比单榜登顶更难。

---

## 三、关键突破点

0813 的能力跃迁，建立在 V4 系列已经重构过的底层架构上。根据 [arXiv:2606.19348](https://arxiv.org/abs/2606.19348) 和 [Hugging Face 模型卡](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro)：

| 维度 | 具体方案 | 价值 |
|------|---------|------|
| 模型规模 | 1.6T 总参数、49B 激活的 MoE | 大模型容量，但单 token 计算被控制在较低水平 |
| 注意力架构 | CSA + HCA 混合注意力 | 在 1M 上下文下，单 token 推理 FLOPs 只有 V3.2 的 27%，KV cache 只有 10% |
| 连接结构 | Manifold-Constrained Hyper-Connections（mHC） | 强化深网络中的信号传播稳定性 |
| 优化器 | Muon | 更快收敛、更稳训练 |
| 数据规模 | 超过 32T tokens | 为长上下文与多域知识提供基础 |
| 精度 | MoE 专家参数 FP4，其余参数 FP8 | 平衡显存和性能 |

![DeepSeek V4 的混合注意力、MoE 与长上下文架构示意](/images/deepseek-v4-pro-0813/deepseek-v4-architecture.png)

最核心的工程突破是 **长上下文效率**。百万 token 上下文曾经是昂贵配置，但 CSA/HCA 让 V4 Pro 在长文档、大代码库、长日志、多轮工具调用场景里，不必为了省 token 频繁压缩记忆。这对 Agent 的连续性至关重要：窗口不够时，Agent 只能不断遗忘；窗口足够时，它才能真正完成「读整个仓库 → 持续改 → 持续验证」的长闭环。

如果只看知识类旧榜，V4 Pro 的绝对分数并不总是第一。但 V4 Pro Max 在 [LiveCodeBench](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro) 达到 93.5、GPQA Diamond 达到 90.1、SWE-bench Verified 达到 80.6，已经进入开源模型第一档，并显著缩小了与闭源前沿模型的差距。

---

## 四、价格与成本账

0813 版本发布后，DeepSeek 官方价格页没有涨价：

| 计费项 | V4 Pro 0813 | V4 Flash 0731 |
|--------|------------|---------------|
| 缓存命中输入 / 1M tokens | $0.003625 | $0.0028 |
| 缓存未命中输入 / 1M tokens | $0.435 | $0.14 |
| 输出 / 1M tokens | $0.87 | $0.28 |
| 并发上限 | 500 | 2500 |

人民币口径下，Pro 是缓存命中 0.025 元、输入 3 元、输出 6 元；Flash 是 0.02 元、1 元、2 元。Pro 约是 Flash 的 3 倍，但放在前沿模型里仍然便宜得不像同一个量级。

作为对比，Fable 5 的公开价是输入 $10、输出 $50；V4 Pro 是 $0.435 和 $0.87。按混合单价粗算，Fable 5 约 $30，V4 Pro 约 $0.65，**前者是后者约 46 倍**。这也解释了为什么媒体会用「只差 5%，价格却便宜 4,600%」来概括这次发布。

不过 DeepSeek 官方价格页同时留了一句话：未来计划对 API 服务整体提价，而且可能幅度不小，具体以官方公告为准。因此现在的价格是真实的，但开发者在做长期预算时不能默认它永远不变。

---

## 五、对行业下游领域的影响

### 1. AI Agent 与软件工程

V4 Pro 0813 最直接的冲击在代码 Agent 和自动化工作流。官方已经给出 Claude Code、OpenCode、OpenClaw 等接入方式，同时保留 OpenAI 与 Anthropic 两套兼容端点。这意味着现有 Agent 工具链可以低摩擦切换，不需要重新适配私有协议。

对工程团队来说，1M 输入 + 384K 输出让「一次调用吞下整个仓库、持续生成和修改代码」更接近现实；DeepSWE、NL2Repo、DSBench 的提升，也对应到真实任务里更少的中途失忆和更完整的长任务交付。

### 2. 模型成本与商业化

DeepSeek V4 Pro 和 Grok 4.6 几乎同一天发布，再加上 OpenAI 此前的 GPT-5.6 Luna 降价，前沿模型正在进入一轮价格与能力同时挤压的周期。对创业公司而言，高质量 Agent 的 token 成本下降，意味着可以尝试更多长任务、更频繁的自主循环；对闭源巨头而言，则意味着必须用生态、工具链和企业服务来维持溢价。

### 3. 开源生态

V4 Pro 的权重以 MIT 协议发布在 Hugging Face，虽然 0813 正式版权重尚未更新，但 4 月预览版已经能下载，上个月模型仓库下载量超过 140 万。开源模型离闭源前沿「差 5 分但便宜 46 倍」的事实，会继续推动本地化部署、私有化推理和可审计 AI 的需求。

### 4. 安全与长上下文研究

CyberGym 83.3 的分值意味着它在攻防自动化、漏洞分析、日志追踪等场景具备可用能力。与此同时，1M 上下文和高压缩注意力也给法律文书、科研文献、金融尽调、长周期监控等需要「一次性理解海量材料」的领域提供了更低成本的入口。

---

## 六、对其他模型的影响

V4 Pro 0813 的冲击，不是把某个模型简单「打下榜」，而是重新分配不同模型的竞争位置。它同时挤压闭源旗舰的定价空间，也让国内开源同行必须重新校准自己的差异化。

| 模型/厂商 | 最直接的压力 | V4 Pro 0813 带来的变量 |
|----------|-------------|----------------------|
| OpenAI GPT-5.x / GPT-5.6 | 高端推理模型的 token 单价 | 即便 OpenAI 已对 GPT-5.6 Luna 降价 80%，DeepSeek 在单任务成本上仍保持明显优势 |
| Anthropic Claude Opus / Fable | 被直接对标，且价格差被反复放大 | Fable 5 平均领先约 5.3%，但混合单价约为 V4 Pro 的 46 倍；能力接近但成本逻辑完全反转 |
| Moonshot Kimi K3 | 开源旗舰第一梯队的国内竞争 | K3 在规模、部分榜单上领先，但 DeepSeek 用 Flash/Pro 双轨重新切分「规模旗舰」与「低价 Agent」市场 |
| Alibaba Qwen | 大模型体量、云生态和企业市场 | V4 Pro 1.6T 参数与低 API 价，对 Qwen 的推理服务和企业采购形成性价比压力 |
| xAI Grok 4.6 | 同一天发布的长任务 Agent 叙事 | 两家几乎同时推出 Agent 向产品，价格战从 Flash 延伸到旗舰层 |
| Google Gemini / Meta | 中端到旗舰的性价比重排 | DeepSeek 在 Artificial Analysis 等第三方榜单上，以明显更低成本进入同一能力区间 |

更重要的是，这种竞争已经从「谁最聪明」扩大到「谁能被大规模部署」。当第二名足够便宜、足够开放，前沿模型就必须用生态、工具链和企业级服务去维持溢价，而不能再只靠基准表领先。

---

## 七、国家策略层面的信号

从国家竞争视角看，V4 Pro 0813 至少释放了四个信号：

| 政策/战略维度 | V4 Pro 0813 的含义 |
|--------------|------------------|
| 开源扩散与采用竞赛 | CFR 认为真正的竞争不只是「前沿模型谁更强」，还在于谁能在全球南方和产业部门里被快速部署。中国开源模型在 Hugging Face 的下载量已超过美国模型 |
| 算力与出口管制 | V4 针对华为 Ascend 芯片做了推理优化，但 CFR 指出 DeepSeek 仍高度依赖受限的美国技术，并面临算力不足。出口管制没有阻止中国追赶，反而刺激了算法效率创新 |
| 开放 vs 封闭路线 | Fortune 提出，当前 AI 竞赛正从「美国 vs 中国」转向「开放 vs 封闭」。V4 Pro 以低成本开源权重，强化了开放路线在全球采用中的吸引力 |
| 知识产权与国家安全 | 美方持续指控 DeepSeek 等通过蒸馏攻击获取能力，并讨论实体清单、制裁与多边施压。这会让模型能力和安全审查越来越绑定 |

> **关键判断：** V4 Pro 0813 不只是一个模型版本。它同时是一个「低成本开源模型能否在全球经济中持续扩散」的测试样本，以及中美在算力、知识产权、采用速度三条线上博弈的又一枚变量。

---

## 八、仍需保持谨慎

有三点不能被「直逼 Fable 5」的标题盖过去：

1. **0813 的跑分主要是厂商自报。** 爱范儿、36氪等报道引用的都是 DeepSeek 公布的同一张表。截至发稿，还没有权威第三方对 0813 权重做完整复测。
2. **NIST 的 CAISI 官方测评针对的是 4 月版本。** 在 [NIST 2026 年 5 月的评估](https://www.nist.gov/news-events/news/2026/05/caisi-evaluation-deepseek-v4-pro)中，V4 Pro 被认为是 CAISI 迄今测过的最强中国模型，但整体能力仍落后美国前沿约 8 个月，且自报分高于 CAISI 实测分。0813 是否改变了这一结论，需要新一轮独立评估。
3. **开源权重还没有同步。** 当前 Hugging Face 仓库仍是预览版。对本地部署和严格合规场景来说，API 的 0813 与可下载权重之间仍有时间差。

![NIST CAISI 对 DeepSeek V4 Pro 的能力趋势评估](/images/deepseek-v4-pro-0813/nist-deepseek-v4-capability.png)

因此，0813 更适合被理解为「Agent 短板被显著修复的一次关键后训练升级」，而不是一张已经完成独立验证的最终成绩单。

---

## 总结

DeepSeek V4 Pro 0813 的核心价值不是又刷了一个知识类榜单，而是把 **1M 上下文、384K 输出、极低价格** 与 **第一梯队 Agent 能力** 组合在一起。它用 5% 左右的性能差距，换来了一个数量级以上的成本优势。

对开发者来说，最值得做的不是反复刷新跑分，而是拿自己的真实 Agent 任务去压一遍：大仓库改造、长文档整理、多步骤工具调用、安全攻防日志分析。只有在这些场景里稳定交付，V4 Pro 0813 的价值才算真正兑现。

---

**参考资料：**

- [DeepSeek API Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing)
- [DeepSeek-V4 arXiv 技术报告](https://arxiv.org/abs/2606.19348)
- [DeepSeek-V4-Pro Hugging Face 模型卡](https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro)
- [NIST CAISI Evaluation of DeepSeek V4 Pro](https://www.nist.gov/news-events/news/2026/05/caisi-evaluation-deepseek-v4-pro)
- [爱范儿：实测 DeepSeek V4 Pro 正式版](https://www.ifanr.com/1674965)
- [36氪：DeepSeek V4 Pro has been released](https://eu.36kr.com/en/p/3937119315377283)
- [Decrypt：DeepSeek Upgrades V4 Pro](https://decrypt.co/375507/china-deepseek-upgrades-v4-pro-claude-fable)
- [Pandaily：DeepSeek V4 Pro Goes Live](https://pandaily.com/deepseek-v4-pro-goes-live-closes-in-on-frontier-tier)
- [Unite.AI：DeepSeek Ships V4 Pro](https://www.unite.ai/deepseek-ships-v4-pro-as-its-flagship-model-leaves-preview/)
- [Wccftech：DeepSeek Prices V4-Pro-0813](https://wccftech.com/deepseek-prices-its-new-v4-pro-0813-model-at-0-87-per-1-million-output-tokens-as-the-high-flying-chinese-ai-lab-wows-with-its-soaring-token-consumption/)
- [CFR：DeepSeek V4 Signals a New Phase in the U.S.-China AI Rivalry](https://www.cfr.org/articles/deepseek-v4-signals-a-new-phase-in-the-u-s-china-ai-rivalry)
- [Fortune：Has the AI race shifted from U.S. vs China to open vs closed?](https://fortune.com/2026/08/04/has-the-ai-race-shifted-from-u-s-vs-china-to-open-vs-closed/)
- [VentureBeat：DeepSeek-V4 arrives with near state-of-the-art intelligence](https://venturebeat.com/technology/deepseek-v4-arrives-with-near-state-of-the-art-intelligence-at-1-6th-the-cost-of-opus-4-7-gpt-5-5)
- [Reuters：DeepSeek's new AI model is by far the cheapest of well-known models to run](https://www.reuters.com/business/retail-consumer/deepseeks-new-ai-model-is-by-far-cheapest-well-known-models-run-research-firm-2026-08-03/)
