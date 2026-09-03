---
title: GitHub热门（8/31-9/6）tt-a1i/archify — 可验证的Agent架构图
date: 2026-09-03 16:00:00
updated: 2026-09-03 16:00:00
categories:
  - github热门
tags:
  - 开源
  - AI
  - AI Agent
  - Skills
  - Claude Code
cover: https://opengraph.githubassets.com/1/tt-a1i/archify
description: tt-a1i/archify 上周从约 4000 星暴涨到 34,000+ 星、登顶 GitHub Trending，这是一款让 Claude Code、Cursor、Codex 等 Agent 交付「可验证」架构图的 Skill：Agent 先写类型化 JSON IR，再由渲染器做 schema/布局校验，确定性地编译成单文件 HTML/SVG，把「看着对」拆成可核验的问题。
---

## 引言

上周（8/24-8/30）GitHub Trending 几乎被 Agent 生态包场，而涨得最快的当属 **tt-a1i/archify**：两周内从约 **4,000 星** 一路冲到 **34,000+ 星**，并于 8/28 前后以单日 **+4,260 星** 登顶全类目热门第一。截至 9/2 累计已突破 **41.8K Stars**、Fork 约 2.9K，仍在快速攀升。

它做的不是又一款「画图生成器」，而是把架构图当成一份**可以被验收的交付物**——Agent 不再是一次性丢回一张漂亮图片，而是先写出**带类型的 JSON 中间表示（IR）**，经渲染器做 schema 与布局校验、通过后才确定性地编译成单文件 HTML/SVG。正如其 README 所言：*「Agent 先写类型化 JSON，再由本地渲染器验证、交付成单文件 HTML。」*

项目地址：[https://github.com/tt-a1i/archify](https://github.com/tt-a1i/archify)  
官方站点：[https://tt-a1i.github.io/archify/](https://tt-a1i.github.io/archify/)  
许可证：MIT  
技术栈：JavaScript 60.8%、HTML 39.0%、Mermaid 0.1%、Shell 0.1%

---

## 项目背景：当 Agent 开始画图，谁来验收

### AI 画图进化的两条路线

2025-2026 年，随着 Claude Code、Cursor、Codex 等编程 Agent 普及，「让 Agent 生成图表」成了一个高频需求。市面上大致有两条路线：

- **自由发挥型**：直接让 LLM 描述一段 Mermaid 或 SVG，交给模型「看着画」。速度快，但图常常**节点错位、连线交叉、信息重叠**，更糟的是——模型会**凭空补出系统中不存在的拓扑**。
- **编辑器型**：接入 draw.io、Excalidraw 等图形编辑器。交互灵活，但输出是**不可版本化**的二进制，无法放进 CI 审查，也没法跟 PR 或代码对应。

两条路线共同的痛点，是**图只是一张「看」的图片，而不是一份「可核验的对结果」**。当团队把 AI 引入架构评审、PR 评审时，他们想知道的不只是「长得好不好看」，而是：这张图是由哪份结构化描述生成的、通过了哪些检查、哪些结论还需要回到代码里确认。

### Mermaid 的局限

Mermaid 是当前最常用的图表描述语言，但它本质是**输入语言**。模型手写 Mermaid，一样可能画出语义错误、路由错乱或标签挤在一起的图——Mermaid 只管渲染，不管**这张图要不要得**。

---

## 核心创新：把「看着对」拆成可核验的问题

Archify 最核心的思路，是**不信任渲染出的图像，而把「看着对」拆成一串可以用程序检查的问题**。它把 Agent 从「自由画图」里拉出来，拐进一条「先结构化、再校验、后交付」的管道：

| 维度 | 传统自由画图 / Mermaid | Archify |
|------|------------------------|---------|
| 中间产物 | 直接写 Mermaid / SVG | 类型化 JSON IR（按 schema 定义） |
| 校验方式 | 无，渲染即完成 | schema + 布局 + 路由 + 标签间距校验 |
| 交付标准 | 「看起对」 | 所有检查通过 + 哈希/字节数回执 |
| 拓扑来源 | 模型自由发挥 | 只能复用已写入的节点与关系，不凭空补拓扑 |
| 输出格式 | 单一图片 | 单文件 HTML + PNG/SVG/WebM + 分享卡 |
| 失败处理 | 直接渲染脏图 | 返回带规则码的机器可读诊断，供 Agent 修订 |
| 可核验性 | 无 | 图形快照 + 证据模式（可选绑定 Git commit 溯源） |

### 1. 五类图表

Archify 覆盖五类开发中最常见的图：

- **架构图（Architecture）**——组件、服务、存储、边界
- **流程图（Workflow）**——CI/CD、审批、工具调用、Runbook
- **时序图（Sequence）**——API 调用、缓存回退、鉴权、异步链路
- **数据流图（Data Flow）**——管道、血缘、PII、消费者
- **生命周期图（Lifecycle）**——状态、重试、等待、终态结果

### 2. 双层信任模型

Archify 在 README 中刻意区分了两层信任——这是它与其他「画图工具」最本质的不同：

| 层 | Archify 保证什么 | 仍需人类核实什么 |
|----|------------------|------------------|
| 产物信任（Artifact） | schema/布局/路由/最终 HTML 校验，防止坏图或遮挡 | 图是否足够清晰、范围是否得当 |
| 事实信任（Factual） | 校验过的代码位置可钉在某个具体 commit 上 | 节点、边、部署边界是否真的反映真实系统 |

文章特别提醒不要混为一谈：*「一个 JSON 文件即使通过全部验证，也只说明它是一张合格的图，不说明 Agent 对业务架构的理解天然正确。」*

---

## 深度架构解析

### 五步流水线：Generate → Validate → Preview → Deliver → Iterate

```
graph TD
    A[Generate 生成] -->|Agent 写类型化 JSON IR| B[Validate 校验]
    B -->|通过| C[Preview 预览 可选]
    B -->|失败 返回规则码诊断| A
    C --> D[Deliver 交付]
    D --> E[Iterate 迭代]
```

1. **Generate（生成）**——Agent 根据代码库或口头描述，按 schema 写出类型化 JSON IR，而不是直接写 HTML。
2. **Validate（校验）**——内置校验器检查 schema 与布局；失败返回机器可读的 JSON，含固定的规则码（rule codes）和可执行的修复建议。
3. **Preview（预览，可选）**——一个只绑定 `127.0.0.1` 随机端口的本地 watcher；失败时保留上一次的好结果，避免「越改越烂」。
4. **Deliver（交付）**——渲染出的候选图必须通过每一道关卡后，才原子性地替换目标产物，并返回 hash 与字节数回执（receipt）。对多版本对比，还有 **Architecture Delta**：机器回执式比较 Before/Delta/After 快照，标明新增、删除、变更、移动、重连的事实。
5. **Iterate（迭代）**——Agent 编辑 JSON 源，未涉及的结构保持稳定。

### 关键机制

- **`validate --json`**：同时检查 schema、布局、路由和标签间距。
- **`visual-check`**：生成后在多个桌面尺寸下截图取证，验证「在不同屏幕上都不塌」。
- **「真实」交互**：节点搜索、上游/下游可达性追踪、精确路由探测、角色对比、引导式「故事讲解」——但**交互只能重用已写入的节点和关系，不应凭空补出系统拓扑**。
- **证据模式（Evidence，默认关闭）**：可把节点标成「SRC n」，并打开钉在一个公开 Git commit 上的源码/行号，实现事实溯源。
- 约束：图须有一条清晰主线、主节点约 12 个以内；**Mermaid 只作输入语言**，输出会被改写为 Archify JSON；通用自动布局、托管分享、所见即所得编辑**明确不在范围内**。

### CLI 入口

`node archify/bin/archify.mjs`，子命令包含 `doctor`、`demo`、`guide`、`validate`、`preview`、`deliver`、`compare`。

---

## 快速上手

### 安装

```bash
# 持久安装（全局，写入对应 Agent 的 skills 目录）
npx skills add tt-a1i/archify -g

# 临时试用（无状态，指定 Agent）
npx skills use tt-a1i/archify@archify --agent codex
```

支持的 Agent 与安装位置：

| Agent | 安装位置 |
|-------|----------|
| Claude Code | `~/.claude/skills/` |
| Codex CLI | `~/.agents/skills/` |
| Cursor | 内置 Skills |
| OpenCode | 内置 Skills |
| Claude.ai | 上传 `archify.zip` 作为 Skill |
| Raven | 手动解压到 `~/.raven/workspace/skills` |
| DeepSeek Harness | 社区插件（非 DeepSeek 官方产品） |

### 使用示例

```bash
# 生成一张图
archify generate "Browser -> API -> Redis cache -> PostgreSQL fallback"

# 校验（schema + 布局 + 路由 + 标签间距）
archify validate --json

# 本地预览（只绑定 127.0.0.1）
archify preview

# 交付（所有关卡通过后才原子替换目标，可 --open）
archify deliver --open

# 对比多个验证过的快照（Architecture Delta）
archify compare
```

**隐私说明**：Archify 只会拉取一个固定 manifest 用于可选的更新提醒，不发送任何版本/Agent/项目数据；可用 `ARCHIFY_UPDATE_CHECK_DISABLED=1` 彻底关闭。

---

## 总结

Archify 的爆火不是「一个魔法画图模型突然出现」，而是**一个持续迭代的 Skill 终于落在真实需求上**——它不是 4/15 创建后就吃老本的一次性 README，到爆火当天仍有提交，近期工作集中在 DeepSeek Harness 集成验收、可复现 ZIP 与示例证明上。

它的信号意义在于：**Agent 交付的杠杆正从「生得好看」转向「能核验」**。当 AI 进入架构评审与 PR 评审，团队要的不仅是图本身，更是「这份结构化描述是什么、它失败了哪些检查、哪些结论还需要回到代码」。

对已有代码库/规格/流程、想要一份**可版本化架构产物**的开发者，Archify 尤其合适——例如 PR 场景的「Before/Delta/After」对比，或讲清缓存未命中、鉴权、重试等单一路径。若是快速白板、自由拖拽或多人协作，这套约束反而过重，现有画图工具更快。社区共识是：**对陌生仓库，先限定 8-12 个核心组件、一条主线、外部依赖与信任边界，再让人核对 JSON 与证据链接，才是它的正确用法。**

*本文基于 [tt-a1i/archify](https://github.com/tt-a1i/archify) 仓库 README、官方站点及 36kr / verysmallwoods 等相关报道编写，星数数据截至 2026 年 9 月 2 日。*
