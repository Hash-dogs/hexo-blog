---
title: GitHub热门（6/8-6/14）mvanhorn/last30days-skill — 跨平台 AI 研究神器
date: 2026-06-15
updated: 2026-06-15
categories:
  - github热门
tags:
  - 技术分享
  - 开源
  - AI
  - Skills
  - Claude Code
  - 研究工具
cover: https://opengraph.githubassets.com/1/mvanhorn/last30days-skill
description: mvanhorn/last30days-skill 本周以 12,053 stars 的增量登顶 GitHub 热门第一，这是一款革命性的 AI Agent Skill，能在 Reddit、X、YouTube、HN、Polymarket 等 14+ 平台跨源研究任意话题，并合成带有引用的深度摘要，代表着 Claude Skills 生态爆发的标志性项目。
---

## 引言

本周 GitHub Trending 榜单上，**mvanhorn/last30days-skill** 以 **12,053 stars** 的增量强势登顶，总量突破 **41,000 stars**，Forks 超过 **3,300**。这是一个基于 Python 构建的 AI Agent Skill，正在重新定义开发者获取和综合多平台信息的方式。

项目地址：[https://github.com/mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill)  
作者：Matt Van Horn（June smart oven 联合创始人、Lyft 前联合创始人）  
许可证：MIT  
技术栈：Python 100%

---

## 项目背景：信息过载时代的研究困境

### 信息源的碎片化

今天的开发者每天面对的信息源前所未有的多：

- **Reddit** 上有深度的技术讨论和社区反馈
- **Hacker News** 汇聚了最前沿的技术资讯和创业动态
- **X (Twitter)** 有行业领袖的实时观点
- **YouTube** 有详细的技术教程和产品评测
- **Polymarket** 反映了市场对技术趋势的真实预期

然而，手动在这些平台之间切换、搜索、筛选和综合信息，每天可能需要耗费 **1-2 小时**。更糟糕的是，每个平台都有自己独特的搜索语法、排名算法和访问限制，让系统性研究变得异常困难。

### 现有方案的局限性

在 last30days-skill 出现之前，社区的做法无非几种：

- **手动浏览**：效率低下，容易陷入信息茧房
- **RSS 阅读器**：只能追踪已知源，缺乏跨源综合能力
- **单平台搜索工具**：只针对一个平台优化，无法聚合多源信息
- **通用搜索引擎**：结果倾向于 SEO 优化内容，而非真实的社区讨论

市场上缺少一个 **能同时搜索 14+ 平台、自动去重和聚类、并对结果进行深度综合的 AI 研究代理**——这正是 last30days-skill 要解决的问题。

---

## 核心创新：AI Agent 技能生态的标杆

last30days-skill 的核心创新可以概括为 **"一次查询，全网综合"** 的理念：

### 1. 14+ 平台的跨源搜索

一次 `/last30days <话题>` 命令，即可在以下平台并行搜索：

| 平台 | 配置要求 | 说明 |
|------|---------|------|
| Reddit | ✅ 零配置 | 公共 JSON API，自动发现相关 Subreddit |
| Hacker News | ✅ 零配置 | Algolia API，搜索评论和帖子 |
| Polymarket | ✅ 零配置 | Gamma API，获取市场预期数据 |
| GitHub | ✅ 零配置 | 公共 API，搜索仓库和讨论 |
| X / Twitter | 🔑 Cookie 或 xAI Key | 浏览器会话自动提取或 API Key |
| YouTube | 🔑 yt-dlp | `brew install yt-dlp` 即可 |
| Bluesky | 🔑 App Password | 免费申请 |
| TikTok | 🔑 ScrapeCreators API | 100 次免费调用 |
| Instagram | 🔑 ScrapeCreators API | 同上 |
| Web 搜索 | 🔑 Exa / Brave API | Exa 每月 1000 次免费 |

**渐进式解锁**是设计亮点：用户可以从零配置的 Reddit + HN + Polymarket 开始，逐步解锁更多源，每次扩展只需 30 秒设置。

### 2. 智能预研解析（Intelligent Pre-Research Resolution）

这是 v3 版本的"杀手级功能"。在搜索真正开始之前，一个 **Python 预研大脑** 会自动将话题解析为平台特定的标识符：

- **人物 → X 账号**：将"Peter Steinberger" 解析为 `@steipete`
- **产品 → GitHub 仓库**：自动找到正确的 repo
- **话题 → Subreddit**：发现 `r/openclaw`、`r/ClaudeCode` 等相关社区
- **公司 → 创始人**：双向解析人物与组织的关系

这就是为什么 v3 能发现 v2 永远找不到的内容——它搜索的是 **对的人和社区**，而不仅仅是关键词。

### 3. 双法官评分系统（Dual-Judge Synthesis）

每个结果由 **两名评分法官** 独立评估：

1. **相关性法官**（Relevance Judge）——标准的话题匹配评分
2. **趣味性法官**（Humor/Virality Judge）——评估内容的机智程度、传播潜力

每份简报末尾都有一个 **"最佳评论"（Best Takes）** 板块——将最巧妙的段子和最 viral 的引语嵌入叙事中，这在传统信息聚合工具中是前所未有的设计。

### 4. 五维加权综合评分

每个结果由 **五个维度** 综合打分：

| 信号 | 权重类型 | 实现方式 |
|------|---------|---------|
| 双向文本相似度 | 动态调整 | 句向量 + 同义词扩展 |
| 参与度速度归一化 | 动态调整 | Δ(点赞/评论/分享)/Δt |
| 来源权威性 | 固定权重 | HN > Reddit > X 的层级体系 |
| 跨平台重合检测 | 动态调整 | 三词元 Jaccard 相似度 |
| 时间衰减 | 指数衰减 | e^(−λ·天数) |

当同一个故事在 Reddit、X 和 YouTube 同时出现时，**基于实体的重叠检测** 会将它们合并为一个聚类，而不是展示三个独立的条目。

### 5. 对比模式（Comparative Mode）

这是最受好评的功能之一。输入：

```
/last30days Claude Code vs Codex
```

系统会并行执行三次独立研究，然后生成一份并排对比报告。这得益于 v3 的 **单次通过架构**——之前需要 3 次串行研究（12+ 分钟），现在只需要一次并行查询（约 3 分钟）。

还支持 `--competitors` 标志，让推理模型自动发现话题的前 2 名竞争对手，然后在三个完整流水线上并行展开并合并结果。

### 6. 多输出格式

| 标志 | 格式 | 适用场景 |
|------|------|---------|
| `--emit=compact` | 聚类优先的 Markdown | 开发终端（默认） |
| `--emit=json` | 完整的 v3 结构化报告 | 程序化处理 |
| `--emit=context` | 简短的综合上下文 | 快速浏览 |
| `--emit=html` | 深色模式、打印友好的 HTML | 分享和归档 |

HTML 简报会自动保存到 `~/Documents/Last30Days/{topic}-brief.html`，无需手动指定。

---

## 深度架构解析

### v3 Pipeline

last30days-skill 定义了一个 **八阶段流水线**：

```
阶段一：查询规划（Plan the query）
  → 预研实体解析，识别人物、产品、社区
  
阶段二：并行检索（Retrieve per subquery per source）
  → 向所有平台同时发出针对性查询
  
阶段三：归一化与去重（Normalize and dedupe）
  → 基于实体的重叠检测，合并相同内容
  
阶段四：最佳片段提取（Extract best snippets）
  → 按源提取最相关的引用
  
阶段五：加权 RRF 融合（Fuse with weighted RRF）
  → Reciprocal Rank Fusion 加权合并
  
阶段六：单一相关性重排（Rerank with one relevance score）
  → 统一打分后重新排序
  
阶段七：证据聚类（Cluster evidence）
  → 跨源聚类合并
  
阶段八：渲染聚类结果（Render ranked clusters）
  → 输出为 Markdown / JSON / HTML
```

### 三层架构

| 层级 | 组件 |
|------|------|
| **搜索引擎层** | 14+ 平台适配器（Reddit、X、YouTube、HN、GitHub、TikTok 等） |
| **分析引擎层** | 去重、五维评分、情感分析、趋势检测 |
| **输出生成层** | 结构化报告、对比表格、可执行提示、HTML 简报 |

源代码组织在 `scripts/` 和 `scripts/lib/` 目录下，每个平台有独立的适配器（`reddit.py`、`xai_x.py`、`polymarket.py` 等），加上 `scoring.py` 和 `dedupe.py` 核心模块。

### 安全模型

- **不发布、不点赞、不修改** 任何平台的内容
- **不访问个人账户**
- **不在提供商之间共享 API Key**
- **不在输出文件中记录 API Key**
- 每作者最多 3 条上限，防止单一声音主导
- 支持 macOS Keychain 存储 API Key

---

## 快速上手

### 安装方式

**方式一：Claude Code（推荐，自动更新）**

```
/plugin marketplace add mvanhorn/last30days-skill
/plugin install last30days
```

**方式二：Codex / Cursor / Copilot / Gemini CLI（50+ Agent 兼容）**

```bash
npx skills add mvanhorn/last30days-skill -g
```

指定目标平台：
```bash
npx skills add mvanhorn/last30days-skill -g -a codex
npx skills add mvanhorn/last30days-skill -g -a cursor
```

**方式三：claude.ai 网页版**

1. 从 latest release 下载 `last30days.skill` 文件
2. 进入 claude.ai → 设置 → Capabilities → Skills → 点击 `+` 上传

**方式四：手动安装**

```bash
git clone https://github.com/mvanhorn/last30days-skill.git ~/.claude/skills/last30days
```

### 使用示例

```bash
# 基础用法：研究一个话题
/last30days nvidia earnings reaction

# 对比模式
/last30days Claude Code vs Codex

# 快速模式（更快的返回）
/last30days --quick AI video tools

# 深度模式（最全面的结果）
/last30days --deep best Claude Code skills

# HTML 格式输出
/last30days --emit=html MCP server trends
```

### 环境要求

- Python 3.12+
- 需要 `GOOGLE_API_KEY`、`OPENAI_API_KEY` 或 `XAI_API_KEY` 其中之一
- 运行时间：**2-8 分钟**，取决于话题深度

### 渐进式源解锁

1. **零配置即用**：Reddit、HN、Polymarket、GitHub
2. **运行 `/last30days setup`**：30 秒解锁 X、YouTube、TikTok（自动提取浏览器 Cookie）
3. **Exa API**：每月 1000 次免费搜索
4. **ScrapeCreators API**：100 次免费调用，解锁 TikTok + Instagram
5. **Bluesky App Password**：免费创建

---

## 社区反响

last30days-skill 的成功不仅在于其技术实现，更在于它抓住了两个关键趋势：

### Skills 生态的范式转变

2026 年 6 月第二周被业界称为 **"AI Agent Skills 生态爆发周"**。多个 Skill 项目集中登榜，标志着 AI 应用正从"通用对话"彻底转向"垂直技能插件"架构。开发者评价称：

> *"Skills are becoming the new packages."*（技能正在成为新的包管理器）

last30days-skill 正是这一趋势的标杆之作——它证明了 **一个定义良好的 Skill（65 行配置 + Python 脚本）** 可以达到商业 SaaS 产品级别的价值。

### 跨平台信息聚合的刚需

在信息爆炸的时代，开发者越来越需要一个 **"信息参谋"**——能自动扫描所有值得关注的平台，提炼出真正重要的内容，并以结构化的方式呈现。last30days-skill 正好填补了这个空白。

---

## 未来展望

基于 current README 和社区反馈，以下几个方向值得关注：

1. **更多平台支持**：Discord、Telegram 群组、Slack 社区等封闭平台的搜索
2. **定时监控模式**：While 循环的自定义监控，当出现特定趋势时主动通知
3. **团队协作**：多用户共享研究结果，团队级的信息雷达
4. **可视化仪表板**：超越 HTML 简报，提供交互式的趋势看板
5. **LLM 无关化**：支持更多推理模型作为后端，降低对特定提供商的依赖

---

## 总结

mvanhorn/last30days-skill 不仅仅是一个信息搜索工具，它代表了一种 **新的信息消费范式**——让 AI Agent 替你完成跨平台的信息检索、筛选、聚类和综合，你只需要关注最终的结论和洞察。

在 AI Agent Skills 生态爆发的 2026 年，last30days-skill 以 **41,000+ Stars** 和 **每周 12,000+ 新增 Stars** 的强势表现，证明了"让 Agent 替我研究"这一需求的巨大市场。它有望成为 Claude Code 等 AI 编程工具生态中的 **标配技能组件**，就像浏览器的第一个标签页一样自然。

---

> **生产数据**：基于 GitHub Trending 2026 年第 24 周统计（2026-06-08 ~ 2026-06-14）。项目总 Stars 41,279+，周增 12,053，Forks 3,300+。同期 trending 项目中 AI/Agent 相关占 58.5%。

*本文基于 [mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) 仓库 README、SKILL.md 文档及社区文章编写，数据截至 2026 年 6 月 15 日。*
