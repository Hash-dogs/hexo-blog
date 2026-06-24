# 博文标题长度优化设计方案

## 问题

GitHub热门系列博文标题在博客网页端展示不全。详情页中 `font-size: 3.3rem`（~53px）、`-webkit-line-clamp: 2` 的限制下，每个标题约 68-75 字混合中英文，实际只能展示约 30-35 字，后半部分被截断。

## 方案

### 标题格式变更

```
旧：GitHub热门项目推荐（X月X日~X月X日）{owner}/{repo} — {完整描述}
新：GitHub热门（M/D-M/D）{owner}/{repo} — {精简描述}
```

### 具体修改

| 文件 | 原标题 | 新标题 |
|------|--------|--------|
| `agent-reach-intro.md` | GitHub热门项目推荐（6月22日~6月28日）Panniantong/Agent-Reach — 一键给你的 AI Agent 装上全网眼睛，零 API 费用 | GitHub热门（6/22-6/28）Panniantong/Agent-Reach — 一键给你的 AI Agent 装上全网眼睛 |
| `cc-switch-intro.md` | GitHub热门项目推荐（6月8日~6月14日）farion1231/cc-switch — 多 AI 工具配置统一管理，周增 6,621 Star 的跨平台桌面中枢 | GitHub热门（6/8-6/14）farion1231/cc-switch — 多 AI 工具配置统一管理，跨平台桌面中枢 |
| `github-trending-ecc-agent-harness-intro.md` | GitHub热门项目推荐（6月8日~6月14日）affaan-m/ECC — 212K Stars 的 Agent Harness 操作系统，Skills 生态终极集大成者 | GitHub热门（6/8-6/14）affaan-m/ECC — 212K Stars 的 Agent Harness 操作系统 |
| `last30days-skill-intro.md` | GitHub热门项目推荐（6月8日~6月14日）mvanhorn/last30days-skill — 跨平台 AI 研究神器，12K Stars 的 Skill 生态标杆 | GitHub热门（6/8-6/14）mvanhorn/last30days-skill — 跨平台 AI 研究神器 |
| `headroom-context-compression-intro.md` | GitHub热门项目推荐（6月1日~6月7日）chopratejas/headroom — AI 上下文压缩层，60-95% Token 节省且零精度损失 | GitHub热门（6/1-6/7）chopratejas/headroom — AI 上下文压缩层，60-95% Token 节省 |
| `microsoft-markitdown-intro.md` | GitHub热门项目推荐（6月1日~6月7日）microsoft/markitdown — 微软开源的通用文件转 Markdown 工具 | GitHub热门（6/1-6/7）microsoft/markitdown — 微软开源的通用文件转 Markdown 工具 |

### Skill 规则更新

在 `.claude/skills/newblog/SKILL.md` 中：
- 标题格式改为 `GitHub热门（M/D-M/D）{owner}/{repo} — 描述`
- 增加字数上限：**标题总长度不超过 50 个字符**
- 描述部分保持核心亮点，冗余修饰移入正文 `description` 元数据

### 影响范围

仅影响 6 篇 GitHub热门 系列博文的 YAML front-matter 中的 `title` 字段。文章正文内容无需改动。
