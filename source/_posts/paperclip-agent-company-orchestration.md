---
title: GitHub热门（9/21-9/27）paperclipai/paperclip — Agent 团队编排
date: 2026-09-28 14:00:00
updated: 2026-09-28 14:00:00
categories:
  - github热门
tags:
  - 开源
  - AI
  - AI Agent
  - 自动化
cover: https://opengraph.githubassets.com/1/paperclipai/paperclip
description: paperclipai/paperclip 本周以 7,364 星增量登上 GitHub Trending 周榜第二，总星数 90.7K，创建至今约 7 个月。它把 Agent 组织成一家公司：组织架构、预算硬停、审批门禁、心跳调度。本文拆解服务端 12 个模块与四级预算体系，也逐条核验了三个仍在开放状态的一手 issue，它们记录了心跳空转如何烧掉每小时约 70 美元。
---

## 一、引言

本周 GitHub Trending 周榜第二是一家"公司"。

**paperclipai/paperclip** 本周新增 **7,364** 星，总星数 **90,677**，Forks **15,721**，Open Issues **5,882**。数据取自 GitHub API，2026 年 9 月 28 日。它排在 Agent 记忆系统 hindsight 之后、并行开发环境 orca 之前，前者本周增加了 11,089 星。

- 项目地址：[https://github.com/paperclipai/paperclip](https://github.com/paperclipai/paperclip)
- 官网：[paperclip.ing](https://paperclip.ing)
- 许可证：MIT，Copyright 2026 Paperclip Labs, Inc
- 技术栈：TypeScript 93.6%、Rust 2.9%、JavaScript 2.1%、PLpgSQL 0.5%
- 创建时间：2026 年 3 月 2 日，至今约 7 个月
- 最近推送：2026 年 9 月 28 日
- Commits：4,603

README 里定位这个项目的是一句类比：

> If OpenClaw is an *employee*, Paperclip is the *company*.

这句话把它的层级说清楚了。它不做 Agent，做的是把已有的 Agent 组织起来的那个外壳。

---

## 二、项目背景：二十个终端窗口之后的问题

2026 年上半年，个人编码 Agent 的能力已经过剩。Claude Code、Codex、Cursor 都能独立完成一个任务，但它们的架构假设始终是**一个用户、一个上下文、一个任务**。

当一个人同时开二十个 Agent 时会撞到三类问题：

| 问题 | 具体表现 |
|------|---------|
| 状态不可见 | 哪个 Agent 在做什么、做到哪一步、谁在等谁，只能靠翻终端滚屏 |
| 成本不可控 | token 在没人看的时候持续消耗，事后才知道花了多少 |
| 权责不可追溯 | Agent 做了什么改动、依据是什么、谁批准的，没有统一记录 |

这里需要和本站之前写过的一个项目分清边界。**yc-software/qm** 也是多人 Agent 场景的基础设施，但它解决的是**空间维度**的问题：每个员工、每个 Slack 频道、每个项目一个隔离 Scope，各自拥有独立的记忆、文件、密钥链、权限和持久化沙箱。QM 关心的是"几十人共用一批 Agent 时，什么东西不能串味"。

Paperclip 解决的是**层级维度**的问题：组织架构、汇报线、预算、审批、心跳调度。它关心的是"一批 Agent 同时干活时，谁对谁负责、花了多少钱、谁能拍板"。

{% note info %}
两个项目不冲突。QM 的 Scope 是隔离单元，Paperclip 的 org chart 是管理单元。一个部署里理论上可以两者都用：用 QM 保证数据不串，用 Paperclip 管成本和审批。但 Paperclip 目前没有 Scope 级隔离的对应物。
{% endnote %}

Paperclip 在 README 里明确列了六个"不是什么"：不是聊天机器人、不是 agent 框架、不是工作流拖拽工具、不是 prompt 管理器、不是单 agent 工具、不是代码评审工具。这个否定列表比正面描述更能说明它的位置：**它在所有单个 Agent 的上方，而不是在旁边。**

---

## 三、核心创新：把管理结构引入 Agent 编排

### 3.1 四大支柱

| 支柱 | 做什么 |
|------|--------|
| Agentic Task Manager | 任务票据化，每个任务带完整目标链路，可签出、可追踪 |
| Org Chart for Agents | Agent 有汇报线、角色和岗位描述，每个只向一个上级汇报 |
| Agent Employee Training | 运行时注入技能，agent 的状态跨心跳延续，同一任务上下文不断 |
| Agentic OS | 心跳调度、预算、审批、审计日志、多公司隔离 |

### 3.2 使用范式

README 给的流程是：**定目标 → 组团队 → 审批 → 设预算 → 运行 → 看板监控**。

团队是"雇"出来的。用户设定业务目标，然后雇佣 CEO、CTO、工程师等角色 Agent，每个角色可以是任意 bot、任意 provider。用户在这个结构里扮演**董事会**：审批重大决策、追加预算、否决或回滚。

### 3.3 与相邻方案的对比

| 维度 | 单 Agent 工具 | QM | Paperclip |
|------|-------------|-----|-----------|
| 核心抽象 | 会话 | Scope：人 / 频道 / 项目 | Org chart：角色 / 汇报线 |
| 解决什么 | 一个人怎么更快 | 多人共用时怎么隔离 | 一批 Agent 怎么被管理 |
| 成本治理 | 无 | 组织级策略 | 预算硬停 + 四级警告 |
| 审批机制 | 无 | 三种安全姿态 | 审批门禁 + 配置版本化回滚 |
| 调度 | 手动触发 | Cron + Watch | 心跳调度 + 事件触发 |
| 隔离粒度 | 单一上下文 | Scope 级 | 公司级，多公司互相隔离 |
| 审计 | 部分 | 全量记录 + 动态过滤 | 不可变审计日志 + 活动流 |
| Harness 无关 | 单一厂商 | Pi / OpenCode / Codex / Claude Code | Claude Code / Codex / Cursor / Gemini / bash / OpenClaw |

{% label 设计要点 blue %} 最后一行是两者的共同点：都不自己造 Agent，都通过适配器消费别人造的。Paperclip 页面 FAQ 的表述是它 "uses" 这些 agent。

---

## 四、深度架构解析

### 4.1 服务端 12 个模块

Paperclip Server 的框图把它分成 12 个模块。按职责归组如下：

| 分组 | 模块 | 职责 |
|------|------|------|
| 身份与存储 | Identity & Access | 用户与 Agent 的身份，公司级数据强隔离 |
| | Secrets & Storage | 密钥集中管理与文件存储 |
| 任务与调度 | Work & Tasks | 任务票据化，每个任务带完整目标链路 |
| | Heartbeat Execution | 心跳唤醒与执行窗口，Agent 状态跨心跳延续 |
| | Routines & Schedules | 定时例程，与心跳并列的第二套触发源 |
| 组织与治理 | Org Chart & Agents | 汇报线、角色与岗位描述，每个 Agent 只向一个上级汇报 |
| | Governance & Approvals | 审批门禁，配置版本化可回滚 |
| | Activity & Events | 活动流与不可变审计日志 |
| 成本与运行时 | Budget & Costs | 预算分级与硬停，签出任务时原子校验 |
| | Workspaces & Runtime | 运行时环境，技能在运行时注入 |
| 扩展与迁移 | Plugins | 插件系统，已含 MCP Tool Gateway |
| | Company Portability | 公司配置可导出导入 |

接入方通过四类通道对接，四类最终都落到 `Work & Tasks`：

- **官方适配器**：Claude Code、Codex
- **CLI agents**：Cursor、Gemini、bash
- **HTTP / webhook bots**：OpenClaw 这类持续运行的 Agent
- **HTTP 入口**：任意自建 bot

技术栈是 Node.js 服务端加 React UI，pnpm workspace 单仓，含 `packages`、`server`、`ui`、`cli`、`skills`、`evals`、`tests` 等目录。测试用 Vitest，浏览器端到端用 Playwright。数据库是**内嵌 PostgreSQL**，自动创建，不需要额外配置。可观测性方面，OpenTelemetry 的 traces 和 Sentry 都是可选。

### 4.2 任务签出与预算执行的原子性

README 强调任务签出与预算是**原子**的。这条设计的意图很明确：不能出现"预算检查通过之后、任务开始之前，余额被另一个 Agent 花掉"的窗口。

预算分四级：

| 区间 | 状态 | 行为 |
|------|------|------|
| 0–79% | Normal | 仅追踪 |
| 80–89% | Warning | 向上级 Agent 发警告，建议重审预算 |
| 90–99% | Critical | 只接受高优先级任务，需上级批准 |
| 100% | Locked | 拒绝所有新任务，只完成既有任务 |

预算耗尽时，签出任务返回 `403 budget_exhausted`。另有通过 PATCH 接口追加紧急预算的流程。文档称这套机制基于历史运营数据设计，组合效果可达约 99.9% 的预算控制成功率。

{% folding red, 但这个 99.9% 有一个前提 %}
前提是**存在激活的预算政策行**。缺了这一条，守卫会被整个跳过。下面的 issue 一节里有一条实测证据。
{% endfolding %}

### 4.3 心跳调度

Agent 不持续运行。它们按调度器触发的 **heartbeat** 短执行窗口定时醒来，检查任务、自动委托，然后睡回去。

心跳是这套设计里最关键也最危险的机制。它让 Agent 能在没人看着的时候推进工作，但也意味着**没人看着的时候成本会持续产生**。当一个 Agent 在一次心跳里创建了新任务并指派给自己或下级，下一次心跳就会因此触发，形成链式唤醒。

### 4.4 其他机制

- **多公司隔离**：一个部署里多个"公司"的数据强隔离
- **审批门禁 + 配置版本化**：配置可回滚，审批记录在案
- **Secrets & Storage**：密钥集中管理，路线图里 MCP Tool Gateway 与 Secrets Manager 已完成
- **Company Portability**：公司配置可以导出导入，社区已经有 100 多个 Agent 的预构建团队在流通
- **Routines & Schedules**：定时例程，配合心跳构成两套触发源
- **Agents 接入**：Claude Code、Codex、Cursor、Gemini、bash 走适配器；OpenClaw 这类持续运行的 Agent 走 HTTP / webhook

---

## 五、一手核验：三个仍在开放的 issue

Paperclip 的价值主张里，成本治理是最硬的一条。所以值得看仓库里实际记录了什么。

以下三个 issue 在撰写本文时仍处于开放状态。

### 5.1 心跳开关失效与每小时 70 美元空转

仓库 issue **#4809** 记录：三个 Agent 在 `runtimeConfig.heartbeat.enabled: false` 的情况下，仍然每 30 秒被触发一次。

报告者给出的量化数据：每次空跑都要加载完整技能目录，约 575K 缓存 token，单次成本约 **$0.29**。两个 Agent 合计每小时约 **$70**。这些触发由服务器内部创建，**绕过 HTTP 路由**，因此不出现在 `server.log` 里，从日志侧排查不到。

报告者提供的临时规避方式是 pause 之后等待超过 60 秒再 resume。重启不能清除该状态。他怀疑与 427.0 版本引入的运行存活追踪或看门狗有关。

### 5.2 无预算政策时的守卫绕过

issue **#4027** 记录了一个更贴近设计缺陷的问题：当 `budgetMonthlyCents` 取默认值 `0` 且没有激活的 `budget_policies` 行时，`getInvocationBlock()` 里的预算守卫会被**完全跳过**。

后果是一个 CEO Agent 在 10 天里累积了 **1,293 次定时唤醒**和 **812 次成本事件**，每 5.5 分钟运行一次，24/7 无成本上限。

报告者建议的修复包括：加失控心跳检测、给 `tickTimers()` 补 try/catch、在公司创建时自动生成默认预算政策。

{% note warning %}
这一条和上面那个 99.9% 的预算控制成功率直接相关。默认配置下没有预算政策行，而默认值 `budgetMonthlyCents = 0` 又是跳过守卫的条件之一。也就是说**开箱即用的状态下，最被强调的那个保护是关着的**。
{% endnote %}

### 5.3 自指派唤醒循环

issue **#3431** 记录：Agent 在一次 POST 里创建属于自己 issue 的情况下，即使状态已经是 `"done"`，Paperclip 仍会触发同 Agent 的 `issue_assigned` 唤醒。如果心跳程序每次醒来都重建这类 issue，就形成稳定循环，直到撞上预算上限或有人介入。

报告者估算每次无效唤醒约 **$0.02**，按 Sonnet 口径计算，日常简报类的 Agent 每天可能因此烧掉数美元。建议的修复是在 `queueIssueAssignmentWakeup` 里加守卫：状态为 done 或 cancelled 时跳过，创建时自指派也跳过。

### 5.4 三条 issue 的共同点

三条 issue 指向同一个结构性张力：**心跳既是 Paperclip 的核心能力，也是它最大的成本风险源，而现有的防护在默认配置下是不完整的。**

一个具体的成本对照：按 #4809 的口径，$70 每小时的空转如果无人发现，一天的消耗量已经超过多数个人开发者一个月的 Agent 预算。而这类空转恰恰发生在"没人看着的时候"，正是心跳机制被设计出来服务的时段。

{% folding red, 社区评测提出的其他批评 %}
- **Token 消耗失控**：有测试中 Agent 生成了 75 个 issue、烧掉数百万 token，只为提交一个 30 行的 PR
- **行政空转**：Agent 大量花 token 相互讨论任务而不是真正执行，被形容为 "administrative fan fiction"
- **输出质量不可靠**：代码质量差、页面布局损坏、营销文案空洞，甚至自信地输出捏造的数据与统计。缺少内置质量门禁，Agent 把任务标记为完成后不验证准确性，治理系统抓不到这类问题
- **并非真正零人**：用户仍须扮演董事会角色审批重大决策，离无人值守还有距离
- **高度依赖外部 Agent**：本身不生产 Agent，缺少稳定支持心跳的 Agent 时体验大打折扣
- **Maximizer Mode 风险**：即将推出的该功能让 CEO Agent 不顾 token 成本完成目标，评论者指出若缺少消费上限、时间边界和异常检测等断路器，可能在数小时内烧掉数千美元
- **可导入公司未经验证**：100 多个 Agent 的预构建团队质量未经评估，类似 Docker Hub 的镜像信任问题
{% endfolding %}

{% note primary %}
也要记录另一面：5,882 个 open issue 里既包含上述缺陷，也包含大量功能请求与讨论。项目创建 7 个月、4,603 次提交、15,721 个 fork，fork 与 star 之比约 0.17，这个比例偏高，通常说明真正动手部署的人不少，而不只是点星围观。issue 数字本身不是质量问题，但在评估生产可用性时需要作为成熟度信号一起读。
{% endnote %}

---

## 六、快速上手

### 6.1 安装

{% tabs 安装方式 %}
<!-- tab 官方脚本 -->
```bash
# 先下载 install.sh 与 .sha256 校验，再执行
bash install.sh
```

脚本会装好 Node.js 24.11+ 环境，把 CLI 放到 `~/.paperclip/cli`，然后启动交互式引导。支持装成 Linux 或 macOS 的后台服务。
<!-- endtab -->
<!-- tab 非交互式 -->
```bash
curl -fsSL https://paperclip.ing/install.sh | bash -s -- --no-prompt --no-onboard
paperclipai onboard --yes
```
<!-- endtab -->
<!-- tab 免安装试用 -->
```bash
npx --registry https://registry.npmjs.org paperclipai onboard --yes
```
<!-- endtab -->
<!-- tab 隔离试跑 -->
```bash
npx paperclipai test-drive
npx paperclipai test-drive --harness codex --no-browser
```

`test-drive` 适合先看一眼再决定要不要正式装，可以指定 harness 为 codex 或 opencode，也可以指定数据目录和是否开浏览器。
<!-- endtab -->
{% endtabs %}

### 6.2 源码方式

```bash
git clone https://github.com/paperclipai/paperclip
cd paperclip
pnpm install
pnpm dev
```

前置条件是 Node.js 24.11+ 和 pnpm 9.15+。API 服务起在 `http://localhost:3100`。

### 6.3 绑定与配置

```bash
# 绑定模式可选 lan 或 tailnet
paperclipai onboard --bind lan

# 修改已有配置
paperclipai configure
```

已有配置的情况下重跑 onboard 会保留原配置。`pnpm test` 不包含 Playwright 那套端到端测试，要单独跑。

{% note warning %}
**部署前建议先做一件事**：确认已存在激活的预算政策行，不要依赖默认值。issue #4027 显示 `budgetMonthlyCents = 0` 加无政策行会让预算守卫整个失效。另外在测试环境先把 `runtimeConfig.heartbeat.enabled` 的实际生效情况验证一遍，issue #4809 显示这个开关在某些版本下不生效，且空转不出现在 server.log 里，事后很难发现。
{% endnote %}

---

## 七、总结

Paperclip 本周拿下周榜第二，抓住的是一个真实存在的空档：**Agent 的单体能力已经过剩，缺的是把它们组织起来的那个结构。**

它的做法是把公司治理整套搬进来：汇报线、预算、审批、审计、心跳。这个选择的收益和代价都很清楚。收益是可见性和可管性，一个面板能看到每个 Agent 在做什么、花了多少、谁批准的。代价是**管理层本身也要消耗资源**，而心跳机制让这部分消耗发生在没人看着的时候。

三个开放 issue 把代价量化了：忽略开关的空转约 $70 每小时，无预算政策时 24/7 无上限，自指派循环每次约 $0.02。三条都不是理论推演，是仓库里可查的报告。而它们共同指向的那个默认配置问题，比单个 bug 更值得注意：**最被强调的预算保护，在开箱状态下是关着的。**

把它和同期热榜放在一起看，本周前五里有三个位置被 Agent 基础设施占着：记忆层的 hindsight，编排层的 paperclip 与 orca，审查层的 security-audit-skill 与 open-code-review。社区用星标投出来的判断是，模型能力不再是瓶颈。

{% btn https://hash-dogs.github.io/hexo-blog/2026/08/08/yc-software-qm-multiplayer-agent-harness/,团队级多人 Agent 协作框架 qm,anzhiyufont anzhiyu-icon-arrow-right,blue outline %}

最后回到那个容易混淆的地方。QM 管的是隔离，Paperclip 管的是层级，两者面向的是同一批用户的不同焦虑。如果团队的问题是"数据不能串、密钥要分权"，QM 更对口；如果是"二十个 Agent 同时在跑、不知道花了多少"，Paperclip 更对口。真正需要警惕的是把后者当成前者用：Paperclip 的多公司隔离不等于 QM 的 Scope 级隔离，两者的安全边界不在一个粒度上。

{% note info %}
**适用边界**：适合已经在用多个编码 Agent、且对成本可见性有刚性需求的团队。不适合把单 Agent 工作流套上一层壳，也不适合在无人监督的情况下长时间运行。上线前务必显式配置预算政策，并验证心跳开关的实际生效状态。
{% endnote %}

---

*本文基于 [paperclipai/paperclip](https://github.com/paperclipai/paperclip) 仓库 README 与架构文档、GitHub issue #3431 / #4027 / #4809、GitHub API 数据及多篇社区评测文章编写。星数取自 GitHub API，截至 2026 年 9 月 28 日。三个 issue 在撰写时均处于开放状态。*
