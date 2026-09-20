---
title: GitHub热门（9/14-9/20）cloudflare/security-audit-skill — 对抗式验证的安全审计
date: 2026-09-20 11:00:00
updated: 2026-09-20 11:00:00
categories:
  - github热门
tags:
  - 开源
  - AI
  - AI Agent
  - Skills
  - Claude Code
  - 安全
cover: https://opengraph.githubassets.com/1/cloudflare/security-audit-skill
description: cloudflare/security-audit-skill 于 2026 年 9 月 14 日开源，9 月 19 日拿下 GitHub Trending 日榜第一，单日新增 3,019 星，目前 16.6K 星。这是 Cloudflare 机群级漏洞挖掘框架的起点版本，把安全审计拆成六阶段编排：隔离子 Agent 侦察、按覆盖账本狩猎、每条候选交给全新验证者尝试证伪。全文 22 个文件，是一个把规格当产品的仓库。
---

## 引言

2026 年 9 月 14 日，Cloudflare 在 GitHub 上开源了一个仓库。五天后，它拿下 GitHub Trending 日榜第一。

**cloudflare/security-audit-skill** 在 9 月 19 日那期快照里单日新增 **3,019** 星，当天排名第一。总星数从 **13,255** 继续攀升到目前的 **16,600**，Forks **912**，Watchers **59**。

项目地址：[https://github.com/cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill)
许可证：MIT
运行要求：Node.js，以及支持工具调用与并行子 Agent 的模型
提交数：**14**
仓库体积：**22 个文件**，其中 16 个 `.md`、4 个 `.cjs`

{% note info %}
最后一个数字值得停一下。一个拿下 GitHub 日榜第一的安全项目，全部代码只有 4 个 JavaScript 文件，而且都是校验器。这是一份**规格**，不是一份软件。
{% endnote %}

---

## 项目背景：让 Agent 做安全审计的两种翻车方式

2026 年，把安全审计交给编码 Agent 已经不是新鲜想法。工具链齐全，模型能读代码、能跑命令、能调工具，看起来只要给一段提示词就能开跑。

Cloudflare 自己描述了无约束 Agent 的典型失败形态。原文里有两句非常具体：

> 它会改动源码让漏洞利用生效，然后 `proudly announces the bug it just created itself`。

> 或者生成一个证明 `exec()` 会执行代码的测试，当成严重漏洞。

第一句是**篡改证据**：为了让 exploit 跑通，Agent 顺手改了被测代码，然后把自己制造出来的问题报了上来。

第二句是**同义反复**：`exec()` 当然会执行代码，这不是漏洞，这是它的定义。但在"证明自己发现了漏洞"的目标驱动下，Agent 会把它写成一条高危发现。

这两个失败模式指向同一个根因：**当发现漏洞的人同时是评价漏洞的人，目标就不再是准确，而是产出**。

除此之外还有一类更隐蔽的问题：清单式偏差。把"偏离了某张检查清单"当成严重性依据，而不是看真实的**可能性乘以影响**。

---

## 核心创新：把验证权从发现者手里拿走

整个 Skill 的设计可以压缩成两条规则。

### 规则一：对抗式验证

README 里有一句被反复引用的话：

> **The agent that checks a finding is never the agent that found it.**

检查一条发现的人，绝不是发现它的人。

这不是简单地"再跑一遍确认"。验证者的任务是**证伪**，而不是复核。来源里对这个角色的描述是"设法证伪"和"尽力杀死误报"。目标函数完全反过来，这才能让验证者真正去挑刺，而不是顺着已有论证往下滑。

### 规则二：三态结论，且未验证的不许有严重级别

每条候选最终落到三个状态之一：

| 结论 | 判定标准 | 是否带严重性 |
|------|---------|-------------|
| `confirmed` | 完整的源码追踪 + 有界的观测结果 | 有 |
| `needs_validation` | 点明**确切**的未决事实 | **无** |
| `rejected` | 已被推翻的候选，记录下来防止重复排查 | — |

{% label 设计要点 blue %} `needs_validation` 不允许带严重级别，这是整套设计里最克制的一笔。

一条证据不足的线索可以提醒人去查，但它不该占用告警预算。绝大多数安全工具的问题不是漏报，而是把一个"也许"渲染成"高危"，直到没人再认真看告警。把严重级别从这一类里拿掉，等于强制它们留在待办区而不是告警区。

`rejected` 状态同样是设计的一部分：负结果被持久化，后续运行不会把同一批被推翻的候选重新端上来。

---

## 深度架构解析

### 六阶段编排

| 阶段 | 做什么 | 产出 |
|------|-------|------|
| 1. 侦察 | 梳理架构、信任边界、输入面与既有证据 | `architecture.md`、`coverage-ledger.json` |
| 2. 覆盖驱动狩猎 | 按账本单元分配隔离的猎人，覆盖批评者找遗漏 | 候选发现 |
| 3. 候选验证 | 每个唯一候选交给出新验证者尝试证伪 | 验证结论 |
| 4. 结构化输出 | 三类结论写入 findings，并对 schema 校验 | `findings.json` |
| 5. 独立记录核验 | 全新 Agent 逐条核对源声明 | 核验后的记录 |
| 6. 目标无关报告 | 由核验结果与覆盖账本派生报告 | `REPORT.md` 等三份 |

{% note primary %}
第 1 阶段产出的**覆盖账本**是关键设计。它不是一份"我看了什么"的日志，而是一份声称覆盖了哪些攻击面的**结构化声明**。有了它，覆盖率就变成一个可校验的字段，而不是一句自我评价。
{% endnote %}

### 验证拓扑

{% mermaid %}
graph TD
    A[侦察<br/>architecture.md + coverage-ledger.json] --> B1[猎人 1<br/>账本单元 1]
    A --> B2[猎人 2<br/>账本单元 2]
    A --> B3[猎人 N<br/>账本单元 N]
    B1 --> C[候选发现集合]
    B2 --> C
    B3 --> C
    C --> D1[全新验证者 A<br/>任务: 证伪]
    C --> D2[全新验证者 B<br/>任务: 证伪]
    C --> D3[全新验证者 N<br/>任务: 证伪]
    D1 --> E[findings.json]
    D2 --> E
    D3 --> E
    E --> F[独立记录核验<br/>又换一批新 Agent]
    F --> G[REPORT.md<br/>FINDINGS-DETAIL.md<br/>NEEDS-VALIDATION.md]
{% endmermaid %}

这张图里有两次扇出，每次都会换一批全新的 Agent：猎人是隔离的，验证者是全新的，记录核验还要再换一批。同一条线索从发现到进报告，至少经过三个互不知情的角色。

### 零依赖 schema 校验器

仓库里唯一可执行的东西是 4 个 `.cjs` 文件，作用是把"证据的形状"变成机器可校验的约束：

- `validate-findings.cjs` 在第 4 阶段和第 5 阶段每次替换后运行
- `validate-coverage-ledger.cjs` 在第 1 到第 5 阶段每次账本更新后运行
- `report-schema.json` 是三类结论的统一 JSON schema

其中两条约束特别值得看：

{% folding cyan, 校验器具体卡了什么 %}
- **fingerprint 必须唯一**。每条发现带一个跨运行稳定的指纹，重复的候选会被拦下。
- **test-path 必须完整**。一条 `confirmed` 的测试路径，必须**从某个入口点开始、到某个影响点结束**。路径断了，这条 confirmed 就会被拒绝。

第二条是硬约束：不能证明从入口走到影响，就不许叫 confirmed。
{% endfolding %}

主 Agent 在账本每次更新后都要跑校验器。校验失败不是警告，是流程中断。

### 攻击类别文件

狩猎方向被拆成 11 个独立的指令文件，每个文件负责一个攻击家族：

| 文件 | 覆盖方向 |
|------|---------|
| `MEMORY-SAFETY-AND-BINARY.md` | 内存安全、二进制、内核 |
| `AI-AND-LLM.md` | 提示注入、Agent 与工具攻击 |
| `WEB-PROTOCOL-AND-AUTH.md` | HTTP 请求构造、认证 |
| `DATA-ISOLATION-AND-LIFECYCLE.md` | 租户隔离、数据生命周期 |
| `SUPPLY-CHAIN-AND-RELEASE.md` | 供应链与发布流程 |
| `CLOUD-AND-DEPLOYMENT.md` | 云与部署配置 |
| `CLIENT-SIDE.md` | 客户端侧 |
| `PROTOCOLS-RPC-AND-MESSAGING.md` | 协议、RPC、消息 |
| `RESOURCE-EXHAUSTION-AND-AVAILABILITY.md` | 资源耗尽与可用性 |
| `DESKTOP-MOBILE-AND-LOCAL-IPC.md` | 桌面、移动、本地 IPC |
| `ATTACK-CLASSES.md` | 核心、通配与显见模式 |

流程与报告另有 `SKILL.md`、`RECONNAISSANCE.md`、`HUNTING.md`、`VALIDATION-AND-REPORTING.md`。这就是 16 个 Markdown 文件的去向。

### 四条判断原则

README 里另外写死了四条边界，用来对抗前面提到的那些失败模式：

- **只报能利用的**。每条发现必须有具体的攻击场景，不能是"攻击者理论上可以……"
- **严重性必须有影响**。看可能性乘以影响，不看偏离清单的程度。
- **纵深防御缺口不算漏洞**。如果 A 层已经能挡住攻击，B 层缺失只写进加固建议。
- **不执行目标代码**，除非有操作系统级强制沙箱：切断外网、环境白名单、资源限制、只允许写临时路径。

最后一条有个直接后果：**没有沙箱时，相关线索只能停在 `needs_validation`**，不会被强行升级成结论。

---

## 实测与局限

### 单轮覆盖只有一半

README 给的量化说法只有一条：

> `a single run found roughly half of the vulnerabilities that repeated runs found in total.`

单次运行发现的漏洞约为多次运行合计结果的一半。多次运行是累加的，Skill 会复用既往账本和发现来定位缺口、重新验证已变更的源码，但不会把过期或未决的工作算作已覆盖。

{% note warning %}
**一次运行不等于一次审计。** 把单轮结果当成完整结论，是这个工具最容易踩的坑。
{% endnote %}

### 验证者独立性靠自觉

对抗式验证是整套设计的核心，但这里有一个说不上小的缺口：

**验证者的独立性是被指令要求的，不是被机制强制的。**

Cloudflare 内部的编排器负责真正隔离这些 Agent，而这个编排器没有公开。开源出来的这一份依赖宿主 Agent 老老实实按指令执行。仓库里没有任何东西能阻止一个宿主把发现者和验证者放进同一个上下文。

### findings.json 之后没有路

这个 Skill 明确禁止联网，也不探测已部署的端点，运行结束只产出本地文件：

```
architecture.md
coverage-ledger.json
findings.json
run-metadata.json
REPORT.md
FINDINGS-DETAIL.md
NEEDS-VALIDATION.md
```

把网络切断对读取攻击者输入的流程是正确取舍，但代价是 `findings.json has nowhere to go`。有人得手工把内容复制进 Jira。

社区已经出现了补这一段的方案。有团队写了约 8 秒跑完的流程，把 `confirmed` 记录转成 GitHub Issue 并按 fingerprint 去重，同时开一条 Slack 线程逐条回复。他们遇到的实际问题是 GitHub 对突发请求返回 403，以及列表接口有延迟，背靠背跑两次可能重复建单。

### 落地时的其他坑

{% folding orange, 实际接入会碰到的几个问题 %}
- **沙箱要自备**。仓库不提供沙箱，只规定必须有。没有隔离环境时，所有结论都是静态追踪，不会有动态验证过的确认项。
- **schema 很严**。一条 `confirmed` 需要 13 个字段，包括跨运行稳定的 fingerprint。
- **运行会以不完整状态结束**。元数据里会写 `run_status: "incomplete"`。
- **严重级别不好改**。级别由 Skill 决定，接进工单系统时如果严重性阶梯不同，得自己映射。
- **安装时会被安全工具拦一下**。Snyk 在安装阶段把该 Skill 评为 Med Risk，原因是它带有可执行的校验器。这是被认真读过规格的代价。
- **单轮结果不该当成 tracker 的唯一真相**。前面说过，一轮只有一半。
{% endfolding %}

### 和 Anthropic 官方方案的区别

这两套东西经常被放在一起问，但定位不同：

| | Cloudflare security-audit-skill | Anthropic 官方安全审查 |
|---|---|---|
| 触发点 | 本地主动发起多阶段审计 | 挂在 PR 上 |
| 输入 | 整个代码库 | PR 的 diff |
| 输出 | 一组本地文件 | 直接评论在 diff 上 |
| 适合场景 | 定期全量审计、上线前排查 | 日常 PR 安全网 |

要的是每次提交都过一道网，选后者；要的是对一整个代码库做一次成体系的排查，选前者。

---

## 快速上手

### 安装

```bash
npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit
```

装到用户级加 `--global`：

```bash
npx skills add https://github.com/cloudflare/security-audit-skill --skill security-audit --global
```

### 触发

进入目标仓库，直接用自然语言提要求：

```
security audit this codebase
find security vulnerabilities in ./src
```

{% note info %}
触发模式分两种：审计和渗透类请求走**完整模式**，六阶段全部跑完；安全问答和针对性排查走**指导模式**，不会强行产出报告。要报告得明确说。
{% endnote %}

### 输出位置

默认写到 `~/security-audit-skill/<repo-name>/run-<N>`，在**被审计仓库之外**。只有显式指定了被版本控制忽略的目录，才会写进目标仓库内部。

按 `run-<N>` 分目录，正好对应前面说的多次运行累加。建议至少跑两到三轮再看结论。

{% tabs 上手建议 %}
<!-- tab 先读规格 -->
第一遍跑之前先读 `SKILL.md`，搞清楚它要什么、产出什么。这是一份用 Markdown 写的规格，读一遍比试错快。
<!-- endtab -->
<!-- tab 先备沙箱 -->
想拿到 `confirmed` 级别的结论，得先有 OS 级隔离环境。没有沙箱也能跑，但结果会大量停留在 `needs_validation`。
<!-- endtab -->
<!-- tab 把它当审计起点 -->
Cloudflare 内部用这套框架 3 到 4 小时能审约 3 万行代码，本地环境会慢得多。把它当成审计的起点，而不是审计的终点。
<!-- endtab -->
{% endtabs %}

---

## 总结

cloudflare/security-audit-skill 拿下日榜第一，靠的不是代码量。22 个文件、14 次提交、4 个只能校验数据形状的 JavaScript 文件，其余全是 Markdown。它值钱的地方在于**把"Agent 做安全审计"这件事的失败模式一条条列了出来，然后用流程设计堵住**。

最核心的一笔是把验证权从发现者手里拿走。发现漏洞的人写结论，另一批全新 Agent 专门证伪，再换一批核验源声明。同一条线索经过三个互不知情的角色，篡改证据和同义反复这两类问题就被结构性排除了。

缺口也清楚。验证者的独立性靠指令而非机制强制，内部的编排器没开源；沙箱要自备；单轮只覆盖约一半；`findings.json` 之后没有分发层。它更像一份可以照抄的作业规范，而不是一个开箱即用的产品。

{% note info %}
值得注意的是它的形态。整个仓库是一份**规格**：用 Markdown 把流程、边界、结论定义写死，只会写数据形状的校验器保持零依赖。这种"规格即产品"的做法，和本周周榜第一的 open-code-review 把确定性做进流水线，其实是同一个思路的两端。
{% endnote %}

结合最近几周的热门项目看，2026 年下半年的 Agent 工程正在收敛到一个共识：**模型越强，越需要外部的约束结构来保证结果可信**。ponytail 用决策阶梯约束设计冲动，open-code-review 用确定性管线约束审查流程，security-audit-skill 用角色隔离约束结论可信度。三个项目来自不同组织、不同领域，说的都是同一句话。

Cloudflare 内部那套完整的机群级框架没有开源。这份起点版本更像是把方法论先交出来，剩下的工程化留给社区。从日榜第一的反馈看，这份交出来的规格，社区是认的。

---

*本文基于 [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) 仓库 README、MIT 许可证说明、Korben.info 报道及社区实测文章编写。星数截至 2026 年 9 月 20 日。*
