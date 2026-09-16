---
name: newblog
description: 研究、撰写、构建并发布 Hexo 博文，支持 GitHub 热门与通用两类选题，并在选题、内容、提交三个检查点请求用户确认。当用户要求创建、修改、审查或发布博客文章时使用。
---

# Newblog

研究、撰写、构建并发布 Hexo 博文。工作流分为 4 个阶段，包含 3 个用户检查点；每个检查点先向用户展示结论，获得确认后再继续。

## 工作流

| 阶段 | 内容 | 用户确认 |
| --- | --- | --- |
| 1 | 需求理解与分支选择 | 确认分支 |
| 2 | 素材搜集与研究 | Checkpoint 1：选题审查 |
| 3 | 博文撰写与构建验证 | Checkpoint 2：内容审查 |
| 4 | Git 提交与推送 | Checkpoint 3：提交确认 |

## 阶段 1：需求理解

1. 分析用户描述，确定博文主题。
2. 按以下规则选择分支：
   - 涉及 GitHub 热门、AI Agent、LLM、MCP、Skill 等开源项目趋势：使用 `github热门` 分支。
   - 其他主题：使用 `通用` 分支。
3. 告知用户所选分支并等待确认。

## 阶段 2：素材搜集与研究

### github热门 分支

1. 搜索本周 GitHub Trending 上与 AI Agent、LLM、MCP、Skill 相关的仓库。
2. 筛选 Stars 增长最快的项目，向用户推荐 1-2 个候选。
3. 抓取选定仓库的 README、官方文档和相关社区解读文章。
4. 整理项目定位、Stars 数据、技术栈、核心创新点、架构和安装方式。

### 通用 分支

1. 根据用户描述搜索并抓取相关资料。
2. 整理核心脉络和要点。

## Checkpoint 1：选题审查

正式开始写作前必须执行：

1. 读取 `.codex/skills/newblog/posts-index.md`，获取已有博文的标题、分类、描述和标签。
2. 筛选同分类博文，逐条对比新选题是否在主题、项目名或技术领域上重复或冲突。
3. 向用户展示同分类博文列表并确认是否撞题；如果撞题，调整选题方向后重新执行阶段 2，最多重试 2 次。

## 阶段 3：博文撰写

### 通用规则

1. 先阅读同分类最近一篇博文，沿用其语气、篇幅和章节结构。
2. **发布时间**：将 `date` 和 `updated` 设置为完成时的前一个整点，不要使用 `00:00:00`（如 22:20 完成则写 `22:00:00`）。
3. 使用 `templates/post-template.md` 的 YAML front-matter 结构。
4. 保存到 `source/_posts/<英文-kebab-slug>.md`。
5. 使用 zh-CN。
6. **构建**：保存后执行 `npm run build`，确保构建通过。
7. **富文本标签**：博文可用安知鱼主题的标签插件增强排布，**不要只写纯 Markdown**。完整 42 个标签、参数取值与全部陷阱见 `.codex/skills/newblog/tag-plugins.md`。常用速查：

   | 用途 | 语法 |
   |------|------|
   | 提示块（最常用） | `{% note info %}…{% endnote %}`（类型 `info`/`warning`/`danger`/`success`/`primary`/`default`） |
   | 折叠面板 | `{% folding blue, 标题 %}…{% endfolding %}` |
   | 选项卡 | `{% tabs 名称 %}` + `<!-- tab 标题 -->`…`<!-- endtab -->` + `{% endtabs %}` |
   | 时间线 | `{% timeline 总标题, blue %}` + `<!-- timeline 子标题 -->`…`<!-- endtimeline -->` + `{% endtimeline %}` |
   | 按钮 | `{% btn 链接, 文字, 图标, blue outline %}` |
   | 相册 | `{% gallery %}…{% endgallery %}` |
   | 隐藏内容 | `{% hideToggle 按钮文字 %}…{% endhideToggle %}` |
   | 行内标记 | `{% label 文字 blue %}`、`{% kbd Ctrl %}`、`{% u 下划线 %}`、`{% p red, 文字 %}` |
   | 流程图/图表 | `{% mermaid %}…{% endmermaid %}` |

   **三个最常踩的坑**：
   - `p`/`span` **必须带逗号**（`{% p red, 文字 %}`），单参数写法 `{% p 文字 %}` 会让构建直接报错
   - `tabs`/`timeline` 的正文必须**换行**写在 `<!-- tab 标题 -->` 的下一行，写在同一行会被静默吞掉
   - 分隔符分三种（逗号+空格 / 逗号 / 纯空格），写错不报错但渲染异常，用前先查 `tag-plugins.md` 的分隔符对照表

   **流程图/图表**：统一使用 Mermaid 标签（`{% mermaid %}...{% endmermaid %}`）实现，禁止使用 ASCII 艺术图或图片截图。不要在 Markdown 中写 ` ```mermaid ` 围栏——`hexo-renderer-marked` 会把它当作普通代码块渲染成源码，不会触发 mermaid 标签，导致图表只显示源码。（仅当内容是合法 mermaid 语法时用标签；纯 ASCII 流程图不是合法 mermaid，转标签后会渲染为空白）
8. **封面图**：
   - `github热门` 分支使用 `https://opengraph.githubassets.com/1/{owner}/{repo}`。
   - 其他分类必须配置封面图：从 `.codex/pexels-api-key` 读取 Pexels API Key，执行 `curl -s -H "Authorization: <key>" "https://api.pexels.com/v1/search?query=<英文关键词>&per_page=3&orientation=landscape"` 搜索，优先选择 `large` 尺寸 URL（追加 `?auto=compress&cs=tinysrgb&h=650&w=940`），填入 front-matter 的 `cover:` 字段。

### github热门 分支专项规则

- 标题格式：`GitHub热门（M/D-M/D）{owner}/{repo} — 描述`；周范围按发布日所在自然周（周一至周日）确定。
- 标题总长度不超过 50 个字符；描述只保留 `{owner}/{repo}` 加一句核心亮点，冗余细节放入正文。
- 封面图使用 `https://opengraph.githubassets.com/1/{owner}/{repo}`。
- 章节结构固定为：引言（含 Stars 增量与排名）、项目背景、核心创新（用表格对比多个维度）、深度架构解析、快速上手、总结。
- 标签固定为 `[开源, AI, 项目名关键标签, ...]`，再按项目特点追加。
- 风格参考优先读 `source/_posts/headroom-context-compression-intro.md`。
- 必须包含 Stars 总数、周增 Stars 数和技术栈语言占比。
- 核心创新点用表格呈现多个维度的对比。

### 通用 分支专项规则

- 章节结构根据内容灵活安排。
- 封面图必须按通用规则通过 Pexels API 搜索配置。
- 标签按需定义。
- 风格参考同分类最近一篇博文。

## Checkpoint 2：内容审查

1. 向用户展示刚生成的博文全文。
2. 询问用户是否需要修改内容和格式。
3. 如需修改，调整后重新执行 `npm run build`。
4. 用户确认后继续。

## 阶段 4：发布

1. 执行 `git add source/_posts/<filename>`。
2. 将博文信息（标题、文件名、分类、标签、描述）追加到 `.codex/skills/newblog/posts-index.md` 的对应分类下。
3. 执行 `git add .codex/skills/newblog/posts-index.md`。
4. 使用 `feat: 发布新博文「{title}」` 作为 commit message。
5. 执行 `git commit`。

## Checkpoint 3：提交确认

推送前向用户展示以下信息并确认：

- `git remote -v` 显示的远程仓库地址。
- `git config user.name` 和 `git config user.email` 显示的提交者身份。
- `git status --short` 显示的变更文件列表。

确认文案示例：

> 请确认以下信息无误：
> - 远程仓库：`origin git@github.com:Hash-dogs/hexo-blog.git`
> - 提交者：`Hash-dogs`
> - 变更文件：`source/_posts/new-post.md`
>
> 确认后执行推送？

用户确认后执行 `git push origin main`，并告知用户 Vercel 将自动部署。