# 从零部署 Hermes Agent + 飞书：开源 AI 代理的生活赋能实践 — 博文设计方案

## 元数据

- **日期**: 2026-06-12
- **分类**: 技术分享
- **专题**: Hermes Agent × 飞书集成
- **目标读者**: 有 Linux/Docker 基础的开发者，对 AI Agent 和效率工具感兴趣的读者

## 博文目标

向读者完整展示如何从零开始，在阿里云上部署 Nous Research 出品的 Hermes Agent，通过 Gateway 接入飞书消息平台，集成飞书官方 MCP，最后落地到多个生活自动化场景。

## 全文结构

### 标题
**从零部署 Hermes Agent + 飞书：开源 AI 代理的生活赋能实践**

### 引言
- Hermes Agent 背景（Nous Research, 134k+ Stars, MIT 许可证）
- 为什么选飞书作为交互界面（触达率高、移动端友好、群聊协作）
- 文章目标 & 前置条件
- 最终效果预览（一张飞书对话截图）

### Part 1｜部署篇：阿里云搭建 Hermes Agent

**1.1 云服务器选购与环境初始化**
- 阿里云 ECS 推荐配置（2C4G 起步）
- 系统选择（Ubuntu 22.04 LTS / Debian 12）
- 安全组规则配置（开放必要端口）
- Docker & Docker Compose 安装

**1.2 Docker 部署 Hermes Agent**
- 拉取官方镜像 `nousresearch/hermes-agent`
- 配置文件目录挂载规划（config/、skills/、data/）
- `docker-compose.yml` 完整配置模板
- 首次启动与日志验证

**1.3 模型服务配置**
- OpenAI 兼容 API 配置方式
- 阿里云 DashScope（通义千问）接入
- 多 API Key 轮换（v0.7.0 特性）
- 模型选择建议

**1.4 首次启动验证**
- `hermes chat` 命令行交互测试
- 确认 Agent 正常响应

### Part 2｜集成篇：Hermes Gateway 接入飞书

**2.1 飞书开放平台应用创建**
- 登录 [open.feishu.cn](https://open.feishu.cn/)
- 创建企业自建应用
- 获取 App ID 与 App Secret
- 开启机器人能力
- 配置事件订阅（WebSocket / Webhook）

**2.2 Gateway 配置方式**
- 方法 A：`hermes gateway setup` 配置向导（推荐）
- 方法 B：手动编辑 `.env` 配置
- 配置项详解（FEISHU_APP_ID, FEISHU_APP_SECRET, FEISHU_DOMAIN, FEISHU_CONNECTION_MODE 等）

**2.3 权限与安全设置**
- 飞书应用权限配置清单
- FEISHU_ALLOWED_USERS 白名单机制
- FEISHU_GROUP_POLICY 群聊策略
- 敏感信息保护建议

**2.4 启动 Gateway 与消息测试**
- `hermes gateway start` 启动
- 查看 Gateway 连接日志
- 发送第一条飞书消息给 Agent
- 常见问题排查

### Part 3｜扩展篇：飞书官方 MCP 集成

**3.1 MCP 协议速览**
- MCP（Model Context Protocol）是什么
- Hermes 的 MCP 架构：Client 模式 vs Server 模式
- Hermes 作为 MCP Client 连接外部服务

**3.2 安装飞书官方 MCP Server**
- 什么是 Lark MCP Server
- 安装方式（npm / pip / 二进制）
- 功能概览（文档、云盘、日历、通讯录等 API）

**3.3 注册 MCP Server 到 Hermes**
- 编辑 `config.yaml` 添加 MCP 服务定义
- MCP 工具注册命令
- 连接测试验证

**3.4 创建 Skill 绑定 MCP 工具**
- Hermes Skill 机制简介
- 编写一个调用飞书 MCP 的 Skill
- 在飞书对话中触发 Skill
- 效果验证

### Part 4｜实战篇：生活场景功能实现

**4.1 智能日程管理**
- 场景描述：通过飞书对话创建日历事件
- 调用飞书 MCP 日历 API
- Skill 实现：自然语言 → 日程创建
- 效果演示

**4.2 信息聚合推送**
- 场景描述：每日定时推送新闻/天气/待办
- Hermes Cron 调度器配置
- 多源信息聚合 Skill
- 飞书消息卡片格式化

**4.3 AI 生活助手**
- 场景描述：自然语言对话完成任务
- 意图识别与路由
- 结合飞书富文本交互
- 场景示例（查快递、设提醒、问百科）

**4.4 知识库与云盘**
- 场景描述：文档存储、语义检索、文件管理
- 利用飞书 MCP 云盘 API 上传/下载文件
- 构建个人知识库，语义搜索快速检索
- 自动归档聊天文件到知识空间
- 配合 Hermes 记忆系统跨会话复用

**4.5 自动化流程**
- 场景描述：定时任务 + 飞书通知
- Hermes Cron Job 配置
- 自定义自动化工作流 Skill
- 场景示例（每日总结、订阅监控、定期备份）

### 总结与展望
- 踩坑记录汇总
- 安全性注意事项（API Key 管理、权限最小化）
- 后续可扩展方向（多 Agent 协作、更多 MCP 工具链）
- 参考资源列表

### 附录
- 常用命令速查表
- 环境变量完整参考
- 飞书 MCP API 权限列表

## Hexo 配置变更

### `_config.yml`
- 新增 `category_map` 项（可选）：`技术分享` → `tech-share`

### 主题配置（`_config.anzhiyu.yml`）
- `home_top.category` 新增 "技术分享" 分类卡片
- CSS 扩充 4 分类宽度适配

### Scaffold 模板
- `post.md` 新增 `categories` 与 `tags` 前页元数据

## 技术要点汇总

| 模块 | 关键技术 | 版本要求 |
|------|---------|---------|
| 部署 | Docker, ECS, Ubuntu | Hermes Agent v0.7.0+ |
| 飞书集成 | Gateway, WebSocket, Feishu API | v0.6.0+ |
| MCP | MCP Client, Lark MCP Server | v0.7.0+ |
| 生活场景 | Cron, Skill, Memory | v0.7.0+ |

## 参考资料

- Hermes Agent: https://github.com/NousResearch/hermes-agent
- 飞书开放平台: https://open.feishu.cn/
- Lark MCP Server: 待确认官方地址
- AnZhiYu Theme: https://github.com/anzhiyu-c/hexo-theme-anzhiyu
