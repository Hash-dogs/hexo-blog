---
title: ZCode 开源源码拆解：三端一核运行时与 DSH、Codex 的路线差异
date: 2026-09-23 14:00:00
updated: 2026-09-23 14:00:00
categories:
  - 技术分享
tags:
  - 开源
  - AI
  - AI Agent
  - Claude Code
  - Skills
  - MCP
cover: https://images.pexels.com/photos/34803998/pexels-photo-34803998.jpeg?auto=compress&cs=tinysrgb&h=650&w=940
description: 2026 年 9 月 21 日智谱以 Apache-2.0 开源 ZCode，版本 3.14.0，TypeScript pnpm monorepo，约 30 万行、14 个包。本文按源码拆解它的运行时内核：三端一核的共享结构、Turn 状态机与非法跃迁抛错、工具元数据驱动的 15 步权限判定、microcompact 必须先于 autocompact 的压缩算术、architecture-policy.yaml 把架构约束挂上 CI、dynamic-workflow 用 TypeScript 脚本编排子代理。同时横向对比 DSH 与 Codex 三条技术路线的优劣势，并说明开源仓库 2 个提交、native 模块缺席、核心能力为占位符这些可审计边界。
---

## 一、引言

2026 年 9 月 21 日，智谱把 ZCode 的整个仓库以 Apache-2.0 推上了 GitHub，仓库地址 `zai-org/ZCode`，版本 3.14.0。从 9 月 18 日被曝光到开源，中间隔了三天。

这件事的来龙去脉我在[上一篇](https://hash-dogs.github.io/hexo-blog/2026/09/23/zcode-silent-upload-incident/)里拆过了，这篇不复述。那篇的结论是：开源与删桶构成的动作是对的，但"数据有没有被用过"这件事外部无法验证。

本篇换一个视角，只问一个问题：**这份代码本身写得怎么样。**

这不是一个公关问题，而是一个技术问题，而且现在有了答案。约 30 万行、14 个包的 TypeScript 仓库，配合一批质量相当高的社区拆解，包括 B 站上一支逐行扒了 30 万行的架构解析视频，终于让外界第一次能看清：一个真实的 AI 编程工作台，内部到底是怎么组织一个 Agent 运行时的。

{% note info %}
本文的定位是源码级拆解。DSH 与 Codex 只在第七节作为对比轴出现，它们的详细架构我在[《DeepSeek Harness 开源 12 天五版》](https://hash-dogs.github.io/hexo-blog/2026/08/25/deepseek-harness-open-source-update-history/)和[《八天之内，DeepSeek 与 OpenAI 相继开源 Harness》](https://hash-dogs.github.io/hexo-blog/2026/08/22/agent-harness-runtime-war/)里已经写过，这里不重述。
{% endnote %}

---

## 二、开源交付物：三端一核的 monorepo

先说清楚交付了什么。这不是一个 CLI 工具，是一个定位为 ADE 的完整工作台，桌面、浏览器、终端三个入口共享同一套 Agent 运行时。

**构建门槛**写死在 `mise.toml` 里：Git、Node.js 24.14.0、pnpm 10.33.2。三个入口的调用方式分别是：无参数 `zcode` 进终端 TUI；`zcode --web` 起浏览器工作台，后端默认 `http://localhost:3030`；完整形态 `zcode --web --workspace /path/to/project --port 3030 --no-open`。Agent CLI 和运行时作为普通目录随仓库克隆，不需要额外拉 submodule。

仓库结构可以概括成三端一核：

{% mermaid %}
graph TD
  D["Electron 桌面端<br/>packages/desktop"] --> M["共享中间层<br/>ui · shared · rpc · services · server"]
  W["React Web 端<br/>packages/web"] --> M
  T["命令行 TUI<br/>apps/zcode-cli"] --> M
  M --> C["Agent 运行时内核<br/>apps/zcode-cli/packages/core"]
  C --> C1["回合状态机"]
  C --> C2["工具系统"]
  C --> C3["子代理"]
  C --> C4["上下文工程"]
  C --> DW["dynamic-workflow"]
{% endmermaid %}

把包职责摊开看：

| 包 | 职责 |
|------|------|
| `apps/zcode-cli` | Agent CLI、TUI、运行时、工具系统，同时为桌面与 Web 提供运行时 |
| `packages/desktop` | Electron Main、Host、Renderer 与桌面打包，覆盖 Win/macOS/Linux 的 x64 与 arm64 |
| `packages/web` | 浏览器客户端 |
| `packages/server` | HTTP / WebSocket 服务与远程连接，3030 端口网关 |
| `packages/zcode-server-cli` | 独立 Server 启动与进程管理 |
| `packages/ui` | 共享 React 组件、Hooks 与 Zustand 状态 |
| `packages/services` | 业务服务与持久化 |
| `packages/shared` / `rpc` / `client` | 共享协议与类型、RPC 框架、Agent 客户端 SDK |
| `packages/provider` / `provider-node` | Provider 公共能力与 Node 实现 |
| `dynamic-workflow` | 动态工作流引擎 |

根目录除了常规的 `pnpm-workspace.yaml`、`pnpm-lock.yaml`，还有几个值得注意的文件：`architecture-policy.yaml`、`knip.json`、`AGENTS.md`、`CONTEXT.md`、`DESIGN.md`。其中 `architecture-policy.yaml` 是这份代码里最有意思的东西，第四节展开。

模型层与产品层是解耦的。默认走 GLM，同时支持 OpenAI、Anthropic、DeepSeek 等兼容接口的 BYOK。本地数据落在单一全局 SQLite 库 `~/.zcode/cli/db/db.sqlite`，关键表是 `session`、`model_usage`、`tool_usage`，token 计数区分 input / output / reasoning / cache 读写，但不存成本。

**这里需要更正一条本站的判断。** 我在 8 月 22 日那篇里写过"ZCode 就不开放核心运行时源码，只开放插件、Skill 和 MCP 扩展"。这条判断现在被事实推翻了。当时它确实是那样，但 9 月 21 日之后，核心运行时整体开源，包括 Agent 主循环。这也让"开放到什么深度"从一个推测变成了可比较的事实，第七节会重新排一遍位置。

---

## 三、运行时内核：一次对话怎么走完

内核在 `apps/zcode-cli/packages/core`，拆成四块：回合状态机、工具系统、子代理、上下文工程。

### 3.1 回合状态机

这是整个工作台的骨架。一次用户输入走完的路径是固定的：

```
ProcessingInput → AwaitingModelResponse → Streaming
  → SchedulingTools → ExecutingTools → AwaitingPermission
  → AggregatingResults → Completing | Error
```

关键在于 `TurnMachineImpl.transition()` 对**非法跃迁直接抛 `InvalidTurnPhase`**。用户忙碌时提交的新输入不进这个链条，而是走 `queuePendingInput()` 入队，由 `drainPendingInputs()` 择机排空。

这个设计选择超出一般的工程洁癖。撰写拆解文章的作者点出了动机：时序类 bug，比如"工具结果还没回来就开始聚合"，只靠看日志排查会非常难定位。把非法跃迁变成当场抛错，等于把一类难以复现的时序问题，转成了构建期就能暴露的显式错误。

主循环 `runRegularTurnLoop` 不到 240 行，迭代次序是：排空运行时命令 → `microcompactIfNeeded` → `autoCompactIfNeeded` → 初始化 MCP 并组装可见工具集 → 注入 system reminder → 投影、落盘、发请求。

### 3.2 工具系统与权限

工具系统是三层分离：registry 注册、scheduler 调度、executor 执行。读过的文件由 file-state 跟踪，路径受 path-policy 约束。内置 20 多个工具，覆盖 Git、终端、文件浏览、浏览器上下文，MCP 支持 stdio、http、sse 三种传输，并且可以直接复用你为 Claude Code、Codex CLI、OpenCode 准备的 MCP 配置。

真正值得注意的是权限是怎么实现的。`ToolMetadata` 声明了一组字段：`readOnly`、`destructive`、`concurrentSafe`、`sideEffectScope`、`riskLevel`、`needsApproval`、`stopTurnOnSuccess`、`providerVisible`。其中 `sideEffectScope` 的取值是 `none | workspace | git | network | system`。

这些声明不是文档，是被调度器和权限服务真正读取的：

| 组件 | 读取的元数据 | 行为 |
|------|------------|------|
| `ToolScheduler` | `concurrentSafe`、`destructive` | 拓扑排序 → 并行分组 → 环检测，环依赖抛 `InvalidStateTransition`，默认并发上限 10 |
| 并行判定 | 优先级链 | 破坏性 → 显式声明 → 只读 → 无副作用 → 其余串行 |
| 权限服务 | `riskLevel`、`needsApproval`、`sideEffectScope` | 15 步判定顺序，命中高风险即确认或拦截 |

权限服务是全仓最长的文件，690 行，判定顺序共 15 步，涵盖 plan 跃迁检查、`requiresUserInteraction`、`alwaysAsk`、yolo、auto、黑名单、project 级 deny/ask/allow、WebFetch 与 workflow 预批、allowedTools、edit/build 模式。

代码注释里有一句话把软硬约束的分界划得很清楚：**ask 压过所有放行分支，但压不过阻断**。意思是用户的"再问一次"可以覆盖任何自动放行，但不能覆盖安全拦截。这个方向是对的，宁可多问不可漏拦。

产品层面的分级是四档：Plan 先出方案等人拍板、confirm-before-change 对终端与改文件等高风险动作再确认、auto-edit 低风险自动落地、full-access 放开权限。门禁嵌在工具调用链路上，每次调用先过策略层。

### 3.3 子代理与上下文工程

子代理分两类。Explore 型只读，负责探索代码库；general-purpose 型可写文件承担实现。各自拥有独立的工具策略与隔离上下文，**写权限不是默认给的**。主 Agent 把重活外包出去，避免污染自己的上下文。一个细节常量是 `SUBAGENT_ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000`，用来保护进行中的子代理 transcript 不被回收。

上下文工程有三个机制：compact 会话压缩、memory 跨会话记忆、system-reminder 动态注入。做法是压缩、外置、按需召回，而不是简单截断。

压缩这一块的算术值得单独看，因为它是"看着简单、写反就出事"的典型：

| 常量 | 值 | 作用 |
|------|-----|------|
| `DEFAULT_COMPACT_CONTEXT_WINDOW` | 200,000 | 上下文窗口，输入与输出共享 |
| `DEFAULT_AUTOCOMPACT_OUTPUT_RESERVE_TOKENS` | 32,000，preflight 阶段用 21,000 | 从阈值分母里先扣掉给输出留的余量 |
| `AUTOCOMPACT_BUFFER_TOKENS` | 13,000 | 触发缓冲 |
| `MAX_CONSECUTIVE_AUTOCOMPACT_FAILURES` | 3 | 连续失败熔断 |
| microcompact 参数 | 保留最近 5 个工具结果、空闲阈值 60 分钟、最小节省 256 token、阈值比 0.9 | 两级压缩的第一级 |

两级压缩的分工是：**microcompact 先跑，清掉旧的工具结果；不够再跑 autoCompact，把整段写成摘要。**

拆解文章的作者认为这里是最难的地方，理由很具体：**microcompact 必须先于 autocompact**，顺序一旦写反，很难靠读代码发现，生产环境里的表现是"压缩后模型失忆"。这个坑之所以隐蔽，是因为两个函数各自都是对的，错的只是调用顺序，而后果要到多轮对话之后才显形。

摘要提示词里还有一条要求：逐字保留用户说过的安全约束，压缩之后必须继续生效。这类细节通常不会写进技术文档，但它决定了压缩是否真的安全。

---

## 四、工程约束：把架构师的经验挂上 CI

`architecture-policy.yaml` 是这份代码里我最想单独拎出来讲的文件。它的 `global` 段是这样：

```yaml
global:
  maxFileLines: 400
  maxContractLines: 300
  maxPublicMethods: 12
  forbidCycles: true
  forbidDeepImports: true
  managedOnly: true
  exceptions: []
```

规则很硬：任一源文件超过 400 行、对外契约超过 300 行、公开方法超过 12 个，或者出现循环依赖与深导入，架构检查直接失败。`exceptions` 是空数组，没有特例。

关键在于它**挂在推送前校验上**，违反就推不上去。这把"架构规范"从一份没人读的 wiki，变成了 CI 里会挡住你的门。

14 个模块里只有一个标了 `managed: true`，就是 `packages/services/src/storage`，其余存量代码标 legacy 免检。这是一个很务实的过渡策略：存量不动，新代码按最高标准验收。

被当作样板间的 `storage` 包，分层是这样的：

```
contract.ts          ← 对外唯一入口，只做类型再导出
module.ts            ← 模块清单，与 policy 声明一致
domain/              ← 纯逻辑，无 IO
app/                 ← 编排，依赖端口
adapters/            ← 真正碰文件系统
```

`layerOrder` 声明为 `[domain, app, adapters]`，`planStorageClean()` 是纯函数，真正的删除动作交给 adapters。

这套约束在 AI 协作场景里有一个额外的意义，拆解者把它点出来了：**文件越小、边界越清，模型一次 Read 拿到的信息密度就越高**。400 行上限不只是给人看的代码规范，它同时是给 Agent 的上下文预算。

当然，约束和存量是并存的。`subagent/runner.ts` 有 2142 行，`permission/service.ts` 有 690 行，都远超 400 行的线。新代码按最高标准验收，旧代码免检，这就是它们能同时存在的原因。

---

## 五、动态工作流与自研表达式语言

`dynamic-workflow` 是另一个别家少见的设计。

普通的 Agent 工作流是模板预制的，节点和边写死，你只能填参数。ZCode 的做法是反过来的：主 Agent 把用户意图翻译成一段 **TypeScript 脚本**，脚本里声明输入输出类型和 Sub-Agent 的调用关系；编译器做类型检查与 schema 合成，然后把脚本放进**子进程加 vm 沙箱**执行。

设计意图很清楚：**用类型系统约束模型的即兴发挥**。模型可以自由生成流程，但生成的流程必须是类型合法的。沙箱负责隔离越权。用户通过 `/workflow` 命令触发，典型场景是跨文件重构、批量生成单测、依赖审计。Sub-Agent 之间共享仓库上下文，但内部状态彼此独立。

另一个设计来自 B 站那支拆解视频的发现：ZCode 自己写了一套**表达式语言**。词法分析 141 行、语法分析 240 行、编译 92 行、求值 214 行，加起来不到 700 行，在 6212 行配置里出现了 66 次。

为什么要自己写一门语言？因为模型天天换，参数各不相同。有了这层，**接一个新模型不需要改代码，写一行配置就行**。这是把"模型可替换"这件事从架构承诺落成配置文件里的语法。

{% note info %}
如果你在搭 Agent 或做 Harness，这三处是这份代码里参考价值最高的部分：架构策略上 CI、用类型系统约束模型生成的流程、以及为配置单独写一门小语言。它们解决的都是模型能力之外的工程问题。
{% endnote %}

---

## 六、官方披露的三条风险

`NOTICE.md` 是仓库里另一份值得读的文件。它用十几条场景列出了业务目的、触发条件与数据范围，其中三条是对自己不利的：

{% tabs notice %}
<!-- tab 网关转发 -->
ZCode 作为网关转发两个 Anthropic 兼容端点时，**没有额外的逐次用户确认**。
<!-- endtab -->
<!-- tab 凭据存储 -->
凭据存储**并非系统钥匙串**。默认密钥可由本地环境信息推导，读取时接受明文。
<!-- endtab -->
<!-- tab 第三方组件 -->
用户脚本、任意配置的地址、或另行安装的第三方组件都可能外发数据。**不能因为进程由 ZCode 启动，就假定它经过官方审查。**
<!-- endtab -->
{% endtabs %}

同一份文件里还有几条边界说明：共享执行适配器**没有默认的操作系统沙箱**；启用的插件可以引入 hooks 和外部进程；远程环境可能收到 prompts、文件、工具结果与凭据。

把这份文件和整个事件放在一起看，会发现一个微妙的地方。一家刚因为数据边界翻车的公司，在开源声明里主动把自己没有 OS 沙箱、凭据不用系统钥匙串、网关转发不逐次确认这几件事写了出来。这可以解读为坦诚，也可以解读为免责。**两种解读都成立，而这恰恰是开源能提供的东西**：你至少能自己判断哪一条对你致命。

---

## 七、与 DSH、Codex 的路线差异

现在把三家摆到一起。DSH 是 DeepSeek Harness，MIT 许可，8 月 13 日开源；Codex Harness 是 OpenAI 的，Apache-2.0，8 月 20 日开源。三家的详细情况见我前面提到的两篇，这里只做横向对照。

| 维度 | ZCode | DSH | Codex Harness |
|------|-------|-----|---------------|
| 许可 | Apache-2.0 | MIT | Apache-2.0 |
| 技术栈 | TypeScript + Electron，pnpm monorepo | TypeScript / Node.js，Cordis 元框架 | Rust 核心 codex-rs + TS SDK |
| 开放深度 | 核心运行时开源，但历史被压平、native 模块缺席 | 无特权内核，连 Agent Loop 都是插件 | Harness 与集成层开源，IDE 扩展与 Cloud 不在内 |
| 模型绑定 | 默认 GLM，BYOK 支持 OpenAI / Anthropic / DeepSeek | 原生 38 家厂商路由，刻意不绑自家 | 面向 Codex / ChatGPT 生态 |
| 扩展机制 | Skills、Plugins、MCP、dynamic-workflow | 一切皆插件，社区 5100+ 插件 | 三层入口 exec / SDK / app-server |
| 安全边界 | 权限层拦截，**无默认 OS 沙箱** | 沙箱主要约束文件系统 | 控制计算分离加系统级沙箱，Seatbelt / Landlock / AppContainer |
| 权限模型 | 工具元数据驱动的 15 步判定 | 四道闸门默认全关 | 二元允许拒绝 |
| 任务持久化 | SQLite 状态机加 Turn 状态机 | 会话日志为唯一不可替换项 | Temporal.io 加 SQLite 状态机 |
| 交付形态 | 桌面 / Web / 终端三端一核，产品完成度最高 | 框架，UI 靠社区补 | 三层入口，产品团队可直接嵌 |

### 三家的优势分别在哪

**ZCode 的优势在工程纪律与产品完成度。** 它是三家里唯一一个开箱就有桌面、浏览器、终端三个完整形态的，而且三个形态共享同一套运行时，不是三份实现。权限模型是三家里最细的：工具自己声明风险等级与副作用范围，调度器与权限服务真正读取这些声明，15 步判定顺序有明确注释。`architecture-policy.yaml` 上 CI 这件事，另外两家都没有对应物。对一个要长期协作的代码库来说，这套约束的价值会随时间累积。

**DSH 的优势在可组合性与生态。** 无特权内核意味着替换任何一层都不需要维护分叉，模型路由 38 家，插件生态在开源两周内就到了 5100+ 的量级。它唯一咬死的东西是日志，也就是"模型看过什么必须记下什么"，这套审计基线是"一切皆插件"能成立的前提。

**Codex 的优势在生产验证与安全边界。** 控制平面与计算平面分离，Harness 不直接执行代码，所有文件读写与命令执行下沉到系统级沙盒。Temporal.io 让长任务可持久化可恢复。它的三层入口是经过真实企业部署打磨过的，接入门槛最低。

### 三家的代价分别在哪

| 项目 | 主要代价 |
|------|---------|
| ZCode | 无默认 OS 沙箱，安全边界靠应用层权限而非内核；Electron 带来的分发体积与运行开销；默认绑 GLM，多模型是 BYOK 而非一等公民；仓库锁 PR 关 Issue，社区无法贡献 |
| DSH | 开发者预览版，破坏性变更频发，SQLite 存储格式不向下兼容；UI、权限、监控、多租户都要自建；沙箱不是完整安全边界 |
| Codex | 核心被调教好，扩展自由度受限；接入非核心组件需要适配；绑定 Codex / ChatGPT 生态 |

### 一句话概括三条路线

**ZCode 是产品，DSH 是底座，Codex 是平台。**

ZCode 假设你要的是一个立刻能用的工作台，所以它把三端、权限、压缩、工作流全部做完；代价是它的开放性服务于这个产品，而不是服务于让你重写它。

DSH 假设你要自己攒一个 Agent，所以它连主循环都做成插件；代价是血肉要自己长。

Codex 假设你要在自己的业务里嵌一个 Agent，所以它给你三层由浅入深的入口；代价是核心碰不到。

至于**安全边界这一项，ZCode 是三家里最弱的**，而且这一点是它自己在 `NOTICE.md` 里承认的。它的做法是把风险显式声明出来，再靠应用层的 15 步权限判定去拦。这条路能走通，但它的上限低于 Codex 的系统级沙箱：应用层的拦截总有绕过的可能，内核层的沙箱没有。

---

## 八、开源范围与可审计边界

回到本文开头那个问题：这份代码能回答什么。

**能回答的**：现在的 ZCode 会不会上传你的工作区。这一点可以查证，因为运行时、工具系统、网络调用都在源码里。配合抓包比对，客户端行为是可验证的。

**不能回答的**：以前有没有上传过、上传后服务端怎么处理、被删掉的代码里有什么。

原因有三个，都很具体：

**第一，仓库只有两个提交。** 一个是空的 Initial commit，一个是 `feat: open source` 的巨型提交。整个内部开发历史被压平了。这意味着无法追溯上传功能是何时写入的、又是如何移除的。开源交付的是一份"现在的快照"，不是一本"可追溯的账本"。

**第二，有解读指出核心能力是占位符。** Computer Use 等能力在开源版里被挖空，闭源版的核心逻辑封装在 native 动态库 `build/Release/ax_native.node` 里，没有随源码放出。如果这一条属实，那么这部分代码是开源但不可审计的。

**第三，仓库锁了 PR、关了 Issue。** 首日也没有 `SECURITY.md`。开源是单向的：代码放出来给你看，但不接受你改，也不接受你提安全问题。

{% note warning %}
把三条放在一起，结论是清晰的：**这是危机后的摊牌式开源，不是一次常规意义上的开源。** 它交付了可审计的当下，没有交付可追溯的过去。评价它的时候，这两件事需要分开算账。认可它的工程质量的，不等于认可它的历史清白；质疑它历史清白的，也不必否认这份代码的技术水准。
{% endnote %}

顺带说一句，B 站上有一支取证向的视频做过完整链路测试，结论是手机到中继到伴生到无头这条远程链路是干净的，真正会打包上传的是桌面端 App。这类独立取证的价值，恰恰在于它不需要信任任何一方的声明。

---

## 九、结论

这份代码值得看，理由和它是不是"清白"无关。

约 30 万行的真实生产级 Agent 工作台源码，在这之前是拿不到的。Claude Code 不开源，Codex 只开 Harness 不开产品，DSH 交付的是骨架不是成品。ZCode 是第一个把"完整产品形态的 Agent 运行时"摊开给你看的。

它里面有几样东西，对做 Agent 的人有直接的参考价值：

- **架构约束上 CI**。400 行上限、12 个公开方法、禁循环依赖，配上空的 exceptions。这套约束同时是给模型的上下文预算，一举两得。
- **把确定性从模型挪到代码里**。非法状态跃迁当场抛错、output reserve 的算术、工具用元数据声明风险而不是在调用点临时判断。这些都在回答同一个问题：模型不可靠的时候，系统做了多少准备。
- **用类型系统约束模型的生成**。dynamic-workflow 让模型写 TypeScript 而不是自由发挥，再用沙箱兜底。这是一个可复用的思路。

以及一个更朴素的启示：**工具会不会联网，比它有多强更值得先弄清楚。** 这句话我在上一篇写过，看完源码之后更确定了。ZCode 的权限系统做得相当讲究，15 步判定、ask 压过放行、工具声明风险等级，但它的安全边界仍然在应用层。一个把权限做到了这个程度的团队，依然需要靠外部研究者逆向才发现上传行为。这说明**应用层的自律替代不了架构层的边界**。

三条路线摆在一起，也给出了一个更清楚的判断框架。ZCode 是产品，DSH 是底座，Codex 是平台。选哪个不取决于谁更先进，取决于你要的是拿起来就用、自己攒，还是嵌进业务。唯一需要提前想清楚的是：**你愿意把多大的权限交给一个你无法完全审计的东西。** 这个问题的答案，三家的默认值给得并不一样。

---

*参考资料：zai-org/ZCode 官方仓库与 NOTICE.md、architecture-policy.yaml 源码、[B 站《ZCode 开源了：我扒了 30 万行，三个别家没有的设计》](https://www.bilibili.com/video/BV13MhB63EQn/) 视频编号 BV13MhB63EQn、[B 站《AI 编程工具会偷偷上传你的代码吗？我们做了一次完整取证》](https://www.bilibili.com/video/BV1Jae16mEiN/) 视频编号 BV1Jae16mEiN、[B 站《突发！智谱：开源 ZCode》](https://www.bilibili.com/video/BV1fbhe6gEk8/) 视频编号 BV1fbhe6gEk8、[博客园《智谱 ZCode 全开源：三端一核·统一 Agent 运行时全拆解》](https://www.cnblogs.com/renyang/p/23085206)、[博客园《被曝偷传代码后，智谱把 ZCode 开源了》](https://www.cnblogs.com/itech/p/23085057)、[CSDN《我给一个 AI 编程工作台做了次尸检，发现它把最难的事藏在了 400 行以内》](https://xuzeyu.blog.csdn.net/article/details/166361625)、[七牛云《ZCode 正式开源：架构、功能与本地部署完整指南》](https://news.qiniu.com/archives/1789970579947)。*
