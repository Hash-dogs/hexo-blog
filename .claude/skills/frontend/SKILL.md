---
name: frontend
description: 前端页面改动助手 — 定位主题文件、给可选方案、改动后截图审核、循环直到满意再提交推送
invocation: /frontend
allowed_tools:
  - Read
  - Edit
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

# /frontend — 前端页面改动助手

对 AnZhiYu 主题的前端页面（Pug 模板 / Stylus 样式 / 主题配置 / 自定义 tag 插件）做改动，**每改一轮都产出本地截图供用户审核**，不满意就继续循环，直到用户确认才提交并推送。

核心原则：**改动没有截图证据不算完成。** 不要只用文字描述"已经改好了"。

## 工作流总览

| 阶段 | 内容 | 检查点 |
|------|------|--------|
| 阶段 0 | 环境准备（预览服务 + 构建） | — |
| 阶段 1 | 需求理解 | — |
| 阶段 2 | 定位修改处 | — |
| 阶段 3 | 提出方案（含影响面分析） | 🔴 Checkpoint 1：方案选定 |
| 阶段 4 | 执行改动 + 重建 + 截图 | 🔴 Checkpoint 2：截图审核（不满意则回到阶段 4 循环） |
| 阶段 5 | Git 提交 + 推送 | 🔴 Checkpoint 3：提交确认 |

---

## 阶段 0：环境准备

### 0.1 启动常驻预览服务（**每个会话只需一次**）

先检查是否已在运行，避免重复起进程：

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/hexo-blog/
```

返回 `200` 就说明已在运行，直接用。否则启动：

```bash
cd <repo> && (node .claude/skills/frontend/scripts/preview-server.js 5000 > /tmp/preview.log 2>&1 &)
sleep 3 && cat /tmp/preview.log
```

服务地址固定为 **`http://127.0.0.1:5000/hexo-blog/`**。

> **为什么不用 `hexo server`？** 实测两个问题：一是它的热重载在本环境不生效（改了主题 partial 后跑着的 server 60s 内不更新，日志里连一条 `Generated:` 都没有）；二是它从内存 router 提供服务，在它运行期间另开进程跑 `hexo generate`，它也不会更新，每轮迭代都得重启。预览服务脚本只读磁盘，`generate` 写完盘立刻生效。

### 0.2 确保产物是最新的

```bash
cd <repo> && rm -f db.json && npx hexo generate
```

耗时波动较大，实测 **26–85 秒**（多数情况 30 秒上下，受磁盘/杀软状态影响）。别按固定值做计划，以实际输出为准。

---

## 阶段 1：需求理解

分析用户的 `/frontend <描述>`，确认三件事，不确定就用 AskUserQuestion 问清楚，**不要靠猜**：

1. **改哪个页面/组件** —— 首页卡片？文章页目录？侧边栏？页脚？
2. **期望的视觉效果** —— "更大一点"要问清具体值或参照物
3. **是否只在特定条件下生效** —— 移动端？暗色模式？某篇文章？

---

## 阶段 2：定位修改处

### 主题结构速查

| 路径 | 内容 | 改这里的典型场景 |
|------|------|------------------|
| `themes/anzhiyu/layout/*.pug` | 页面级模板（index/post/page 等） | 增删区块 |
| `themes/anzhiyu/layout/includes/**/*.pug` | 局部模板（head/header/sidebar/footer/widgets） | 改某个组件的结构 |
| `themes/anzhiyu/source/css/_layout/*.styl` | 布局样式 | 改间距、位置 |
| `themes/anzhiyu/source/css/_page/*.styl` | 页面样式 | 改具体页面样式 |
| `themes/anzhiyu/source/css/_mode/*.styl` | 明暗模式 | 改配色 |
| `themes/anzhiyu/source/css/var.styl` | CSS 变量 | 改主题色、圆角等全局值 |
| `themes/anzhiyu/scripts/**` | Hexo 扩展（tag 插件、helper、filter） | 改渲染逻辑 |
| `_config.anzhiyu.yml` | 主题配置 | 改开关、菜单、第三方服务 |
| `themes/anzhiyu/source/css/index.styl` | 样式入口，用 `@import '_layout/*'` 等通配引入 | **一般不用改，但见下方警告** |

### 定位方法

1. 用 Grep 搜关键词（中英文都试，配置项名往往是英文）
2. 找到候选后读文件确认，**不要只看文件名就下结论**
3. 前端改动往往同时涉及 Pug（结构）+ Stylus（样式）+ `_config.anzhiyu.yml`（开关），把三处都找齐再进阶段 3

### ⚠️ 修改前必读的坑

**改 `themes/anzhiyu/source/css/` 下的 partial（`_layout/*.styl` 等）后，不删 `db.json` 的话产物 CSS 会是旧版。**

原因：`index.styl` 通过 `@import '_layout/*'` 通配引入这些 partial，而 Hexo 的渲染缓存是按**文件内容 hash** 记的。改 partial 时 `index.styl` 自身内容没变 → 缓存命中 → 输出还是旧 CSS。改 Pug 模板不受影响（每个模板是独立文件）。

所以阶段 4 的重建命令**固定**用：

```bash
rm -f db.json && npx hexo generate
```

别去判断"这次改动要不要删"，统一删。实测删不删耗时基本一样（甚至删掉更快），但删掉能保证正确。

---

## 阶段 3：提出方案

### 🔴 Checkpoint 1：方案选定

用 AskUserQuestion 给出 **2–4 个方案**。每个方案**必须**包含以下三项，缺一不可：

1. **改哪些文件** —— 具体路径，不要写"改一下样式"
2. **改完是什么样** —— 具体到数值（如"卡片间距 8px → 16px"）、或参照物
3. **对其他布局的影响** —— 这是重点，必须主动分析并写出来，例如：
   - 改动是否会被 `maxWidth768()` 等移动端断点覆盖，移动端会不会跟着变
   - 暗色模式（`_mode/`）下是否需要同步调整
   - 是否影响其他引用了同一 partial / CSS 变量的页面（首页、文章页、归档页、标签页）
   - 是否会造成溢出、换行、遮挡、滚动条
   - **不确定的地方要明说"不确定，需要改完截图验证"**，不要假装确定

如果某个方案有明显副作用，就直接写在选项描述里让用户知情。

---

## 阶段 4：执行改动 + 截图审核

### 4.1 改动

用 Edit 精确修改。**只改方案里列出的文件**，不要顺手重构无关代码。

### 4.2 重建

```bash
cd <repo> && rm -f db.json && npx hexo generate
```

同时检查构建输出有没有报错——有报错先修，别带着错误去截图。

### 4.3 截图

```bash
export PWCLI="$HOME/.claude/skills/playwright/scripts/playwright_cli.sh"
cd <repo>
mkdir -p .screenshots
bash "$PWCLI" open "http://127.0.0.1:5000/hexo-blog/<目标页面路径>"
```

**默认桌面视口（1440×900），每轮固定产出 2 张**：

```bash
bash "$PWCLI" resize 1440 900

# ① 改动区域的元素级特写（主证据，细节清晰）
bash "$PWCLI" screenshot "<容器> <元素> >> nth=0" --filename ".screenshots/<描述>-el.png" --hires

# ② 桌面整页（辅助证据，排查有没有把别的区块带坏）
bash "$PWCLI" screenshot --filename ".screenshots/<描述>-desktop.png" --full-page
```

**自动补移动端**：本次改动命中以下**任一**条件时，必须额外补移动端截图，不许漏：

- 改了 `maxWidth768()` 等响应式断点
- 改了 `width` / `margin` / `padding` / `gap` / `grid` / `flex` 等尺寸或排列相关属性
- 布局结构变了（元素增删、换行行为、flex/grid 排列）

```bash
bash "$PWCLI" resize 390 844
bash "$PWCLI" screenshot "<容器> <元素> >> nth=0" --filename ".screenshots/<描述>-mobile-el.png" --hires
bash "$PWCLI" screenshot --filename ".screenshots/<描述>-mobile.png" --full-page
```

**判断不了要不要截移动端时，就截。** 少截一张图的代价是移动端被改坏了你不知道；多截一张只是多看一眼。

截图统一存到仓库下的 **`.screenshots/`**（已 gitignore），文件名带上描述，方便循环多轮后对比。

**元素选择器注意**：playwright-cli 的 selector 必须**唯一且可见**，否则会以两种不同的方式失败（见下方「选元素时的两个坑」）。写之前先验证：

```bash
bash "$PWCLI" --raw eval "() => { const a=[...document.querySelectorAll('<你的选择器>')]; return 'total='+a.length+' visible='+a.filter(e=>e.getClientRects().length>0).length; }"
```

期望 `total=1 visible=1`。`total=0` 是选择器失配，`visible=0` 是命中隐藏元素——两种情况的修法不同。要取「第 N 个可见元素」用 `>> nth=N`。

常用选择器参考（实测值，**选择器分页面**，首页和文章页结果不同）：

| 选择器 | 首页 | 文章页 | 说明 |
|--------|------|--------|------|
| `.recent-posts .recent-post-item` | 10 | 0 | 首页**可见**卡片 |
| `.recent-post-item` | 16 | 0 | 含 6 张隐藏卡片，别直接用 |
| `#article-container` | 0 | 1 | 文章正文 |
| `.post-copyright` | — | 1 | 文章版权块 |
| `#sidebar` | 1 | 1 | 侧边栏 |
| `#footer` | 1 | 1 | 页脚 |
| `#page-header` | 1 | — | 顶部 banner |

### ⚠️ 选元素时的两个坑（都实际踩过）

**坑一：`:first-child` 会命中隐藏元素，且不同视口下行为不一致。**

首页有 16 个 `.recent-post-item`，但**只有 10 个可见**——另外 6 个藏在 `.topGroup` 里（`display: none`）。这些隐藏卡片恰好是某些父容器的第一个子元素。结果就是同一个选择器 `.recent-post-item:first-child`：

- 移动端 390×844 → 能截到图
- 桌面端 1440×900 → 报 `element is not visible`，然后超时失败

**改用 playwright 的 `>> nth=N` 语法，并限定在可见容器内：**

```bash
bash "$PWCLI" screenshot ".recent-posts .recent-post-item >> nth=0" --filename ".screenshots/x-el.png" --hires
```

**坑二：加伪类可能让选择器整体失配。** `.recent-posts .recent-post-item` 匹配 10 个，但后缀 `:first-child` 后匹配 **0** 个（可见卡片不是其父容器的第一个子元素）。报错是 `does not match any elements`，和坑一的 `not visible` 是**两种不同的失败**，看到报错先分清是哪一种。

### 定位元素的办法

```bash
# 办法一：探匹配数（写选择器前必做，必须返回 1）
bash "$PWCLI" --raw eval "() => document.querySelectorAll('<选择器>').length"

# 办法二：连可见性一起看（复杂页面更该用这个）
bash "$PWCLI" --raw eval "() => { const a=[...document.querySelectorAll('<选择器>')]; return 'total='+a.length+' visible='+a.filter(e=>e.getClientRects().length>0).length; }"

# 办法三：拿快照，按文本反查
bash "$PWCLI" snapshot
bash "$PWCLI" find "<页面上可见的文字>"
```

**不要凭直觉拼后代选择器。** 例如 `#recent-posts` 和 `.recent-posts` 其实是同一个元素（id 和 class 都在它身上），这类细节只能实测确认。

### 4.4 自查后再交付

截图产出后 **先用 Read 读一遍 PNG 自己看**：

- 改动是否真的生效了（对比改动前的印象）
- 有没有明显破版、溢出、错位
- 有没有把别的区块带坏

自己发现明显问题就直接回 4.1 重改，**不要把一眼就不对的截图丢给用户**，那是在浪费用户的审核次数。

### 🔴 Checkpoint 2：截图审核

用 AskUserQuestion 展示本轮结果，必须包含：

- **本轮改了什么**（文件 + 具体改动）
- **截图路径**（用户要能自己打开看）
- **自查结论**：符合预期 / 发现什么问题 / 哪里不确定
- **与上一轮相比的差异**（如果是循环中的第 2 轮及以后）

询问用户是否满意。**不满意就回到 4.1 继续改，这是一个循环，不要急着往下走。** 循环期间把每轮的截图和改动都保留在 `.screenshots/`，用户可能想对比。

---

## 阶段 5：提交

### 🔴 Checkpoint 3：提交确认

在提交前，用 AskUserQuestion 展示：

- `git status --short` 的变更文件列表
- `git remote -v` 的远程仓库
- `git config user.name` 的提交者身份
- 拟用的 commit message

**确认要点**：确保 `.screenshots/`、`.playwright-cli/`、`public/`、`db.json` 都**没有**出现在待提交列表里。

提交格式：

```
feat: <改动描述>
```

或修复类改动用 `fix:`。

用户确认后执行 `git add <具体文件>` + `git commit` + `git push origin main`，**三步一次做完，不要再单独问要不要 push**（Checkpoint 3 的确认同时覆盖了推送授权）。

推送后告知用户：推送到 `main` 会触发 GitHub Actions 自动构建并部署到 `gh-pages` 分支，线上站点稍后生效。

---

## 快速参考

```bash
# 预览服务（会话内启动一次）
node .claude/skills/frontend/scripts/preview-server.js 5000
# → http://127.0.0.1:5000/hexo-blog/

# 重建（每次改动后）
rm -f db.json && npx hexo generate          # ~26-31s

# 截图（默认桌面 1440×900）
export PWCLI="$HOME/.claude/skills/playwright/scripts/playwright_cli.sh"
mkdir -p .screenshots
bash "$PWCLI" resize 1440 900
bash "$PWCLI" screenshot "<容器> <元素> >> nth=0" --filename ".screenshots/x-el.png" --hires
bash "$PWCLI" screenshot --filename ".screenshots/x-desktop.png" --full-page

# 改动涉及断点 / 尺寸 / 排列时，补移动端 390×844
bash "$PWCLI" resize 390 844
bash "$PWCLI" screenshot "<容器> <元素> >> nth=0" --filename ".screenshots/x-mobile-el.png" --hires
bash "$PWCLI" screenshot --filename ".screenshots/x-mobile.png" --full-page
```

## 常见问题

| 现象 | 原因 / 处理 |
|------|-------------|
| 截图里样式没变 | 没删 `db.json`。重跑 `rm -f db.json && npx hexo generate` |
| 页面 404 | 漏了 `/hexo-blog/` 前缀（对应 `_config.yml` 的 `root`） |
| 预览服务起不来，日志有 EADDRINUSE | 端口已被占用，多半是上一轮的服务还活着，直接用别重启 |
| 元素截图报 `does not match any elements` | 选择器整体失配（加伪类导致），用 `--raw eval` 验证匹配数 |
| 元素截图报 `element is not visible` 后超时 | 命中了隐藏元素（如 `.topGroup` 里的卡片），改用 `>> nth=N` 取可见的 |
| 全页截图太长看不清细节 | 正常现象，主要证据用元素级截图，全页只用来排查连带影响 |
