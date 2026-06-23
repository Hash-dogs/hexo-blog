---
name: newblog
description: 通用型博文发布助手 — 研究、撰写、构建、发布全流程，带选题/内容/提交三个检查点
invocation: /newblog
allowed_tools:
  - WebSearch
  - WebFetch
  - Read
  - Write
  - Edit
  - Bash
  - AskUserQuestion
  - Glob
  - Grep
---

# /newblog — 博文发布助手

通用型博文发布 Skill，支持 **github热门** 和 **通用** 两个分支。工作流分为 4 个阶段，包含 3 个用户检查点。

## 工作流总览

| 阶段 | 内容 | 检查点 |
|------|------|--------|
| 阶段 1 | 需求理解 + 分支选择 | — |
| 阶段 2 | 素材搜集与研究 | 🔴 Checkpoint 1：选题审查 |
| 阶段 3 | 博文撰写 + 构建验证 | 🔴 Checkpoint 2：内容审查 |
| 阶段 4 | Git 提交 + 推送 | 🔴 Checkpoint 3：提交确认 |

---

## 阶段 1：需求理解

1. 分析用户的 `/newblog <描述>`，理解要写什么主题
2. **智能判断分支**：
   - 如果描述涉及 GitHub 热门/AI Agent/LLM/MCP/Skill 等开源项目趋势 → 走 **github热门** 分支
   - 其他情况 → 走 **通用** 分支
3. 告知用户选择的分支，获得确认

---

## 阶段 2：素材搜集与研究

### github热门 分支
1. 用 WebSearch 搜索本周 GitHub Trending 上 AI Agent / LLM / MCP / Skill 相关仓库
2. 筛选出 Stars 增长最快的项目，向用户推荐 1-2 个候选
3. 用 WebFetch 抓取选定仓库的 README、官方文档、相关社区解读文章
4. 整理信息：项目定位、Stars 数据、技术栈、核心创新点、架构、安装方式等

### 通用 分支
1. 根据用户描述，用 WebSearch + WebFetch 搜集相关资料
2. 整理信息的核心脉络和要点

---

## 🔴 Checkpoint 1：选题审查

无论哪个分支，在正式开始写作前，必须执行此检查点：

1. 读取 `.claude/skills/newblog/posts-index.md`，获取所有博文的标题、分类、描述和标签
2. 筛选出与当前主题同分类（github热门/技术分享/其他）的博文标题列表，**逐条对比**新选题是否与已有博文在主题、项目名、技术领域上重复或冲突
3. 用 AskUserQuestion 向用户展示同分类已有博文列表，询问：**"以下为同分类的已有博文标题，是否与当前选题重复或有冲突？确认通过后继续。"**
4. 等待用户确认。如果用户指出撞题，调整选题方向后重新执行阶段 2（最多重试 2 次）

---

## 阶段 3：博文撰写

### 通用规则（所有分类适用）

1. **风格参考**：先阅读同分类最近一篇博文（同一 categories 的最新 .md 文件），分析其语气、篇幅、章节结构，按相同风格撰写
2. **发布时间**：`date` 和 `updated` 字段必须设置为博文完成时的**前一个整点时间**（而非 `00:00:00`）。完成博文后执行 `date +"%Y-%m-%d %H:%M:%S"` 获取当前时间，小时部分向下取整（如 22:20 完成 → `22:00:00`，09:05 完成 → `09:00:00`）
3. **模板**：使用 `templates/post-template.md` 的 YAML front-matter 结构
4. **文件命名**：`source/_posts/<英文-kebab-slug>.md`
5. **语言**：zh-CN
6. **构建**：博文保存后执行 `npm run build`，确保构建通过
7. **流程图/图表**：博文中如需展示流程图、时序图、架构图等，统一使用 Mermaid 代码块（` ```mermaid `）实现，禁止使用 ASCII 艺术图或图片截图。Mermaid 代码块在博客前端会被主题自动渲染为可视化图形

### github热门 分支专项规则

- **标题格式**：`GitHub热门项目推荐（X月X日~X月X日）{owner}/{repo} — 描述`，周时间范围根据发布日所在的自然周（周一~周日）确定
- **封面图**：`https://opengraph.githubassets.com/1/{owner}/{repo}`
- **章节结构**（固定顺序）：

  ```
  1. 引言 — 包含 Stars 增量与排名数据
  2. 项目背景 — 该领域现存问题分析
  3. 核心创新 — 项目的主要创新点和功能表格
  4. 深度架构解析 — 关键模块和设计思想
  5. 快速上手 — 安装方式和使用示例
  6. 总结 — 社区影响和未来展望
  ```

- **标签**：固定 `[开源, AI, 项目名关键标签, ...]`，再按项目特点追加
- **风格参考**：优先读 `source/_posts/headroom-context-compression-intro.md`
- **数据要求**：必须包含 Stars 总数、周增 Stars 数、技术栈语言占比
- **段落要求**：核心创新点必须用表格呈现多个维度的对比

### 通用 分支专项规则

- 章节结构自由组织，根据内容灵活安排
- 封面图可选
- 标签按需定义
- 风格参考同分类最近一篇博文

---

## 🔴 Checkpoint 2：内容审查

1. 展示刚生成的博文全文（可用 Read 读取）
2. 用 AskUserQuestion 询问用户：**"博文已撰写并构建验证通过，请检查内容和格式。需要修改吗？"**
3. 如果用户要求修改，用 Edit 修改后重新执行 `npm run build`
4. 用户确认无误后继续

---

## 阶段 4：发布

1. 执行 `git add source/_posts/<filename>`
2. 将博文信息（标题、文件名、分类、标签、描述）追加到 `.claude/skills/newblog/posts-index.md` 的对应分类下
3. 执行 `git add .claude/skills/newblog/posts-index.md`
4. 按格式写入 commit message：`feat: 发布新博文「{title}」`
5. 执行 `git commit`

---

## 🔴 Checkpoint 3：提交确认

在 `git push` 之前，用 AskUserQuestion 向用户展示以下信息并确认：

- `git remote -v` 显示的远程仓库地址
- `git config user.name` 和 `git config user.email` 显示的提交者身份
- `git status --short` 显示的变更文件列表

确认文案示例：
> **请确认以下信息无误：**
> - 远程仓库：`origin  git@github.com:Hash-dogs/hexo-blog.git`
> - 提交者：`Hash-dogs`
> - 变更文件：`source/_posts/new-post.md`
> 
> 确认后执行推送？

用户确认后，执行 `git push origin main`。告知用户 Vercel 将自动部署。
