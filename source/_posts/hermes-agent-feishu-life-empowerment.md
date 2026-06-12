---
title: 从零部署 Hermes Agent + 飞书：开源 AI 代理的生活赋能实践
date: 2026-06-12
updated: 2026-06-12
categories:
  - 技术分享
tags:
  - Hermes Agent
  - 飞书
  - AI Agent
  - MCP
  - Docker
  - 阿里云
  - 自动化
cover:
description: 一步步教你从阿里云部署 Hermes Agent，接入飞书消息平台，集成官方 MCP，打造个人 AI 生活管家——日程管理、知识库、信息聚合、自动化流程全覆盖。
---

## 引言

2026 年，AI Agent 正在从开发者的玩具变成真正能提升生活效率的工具。但在众多 Agent 框架中，找到一个 **开源、可自我进化、支持多平台消息接入** 的方案并不容易。

**Hermes Agent** 由 Nous Research 出品，自 2026 年初开源以来迅速获得 134k+ Stars，成为社区最活跃的自主 AI Agent 框架之一。它最吸引人的特性包括：

- **自我改进的学习循环** — 完成任务后自动生成 Skill，越用越聪明
- **消息网关（Gateway）** — 一套 Agent 实例对接多个 IM 平台
- **MCP 协议支持** — 既可连接外部 MCP 服务，也可将自身暴露为 MCP Server
- **可插拔记忆后端** — 跨会话持久化记忆

而 **飞书** 作为国内领先的企业协作平台，拥有开放 API、丰富的机器人能力，以及无处不在的移动端触达——恰好成为 Hermes Agent 最理想的交互界面。

> 🎯 **本文目标**：从零开始，在阿里云 ECS 上部署 Hermes Agent → 通过 Gateway 接入飞书 → 集成飞书官方 MCP → 落地多个生活自动化场景。

**前置条件**：
- 一台云服务器（本文以阿里云配置好hermes的轻量应用服务器为例）
- 一个飞书企业账号（可免费创建）
- 基本的 Linux 和 Docker 操作知识

---

## Part 1｜部署篇：阿里云搭建 Hermes Agent

### 1.1 云服务器选购与环境初始化

![alt text](../images/hermes-feishu/image.png)

> 💡 **选型建议**：Hermes Agent 本身资源消耗不高，2C4G 足够运行 Agent + Gateway 两个进程。如果后续需要运行本地模型，建议上 4C8G+。

购买成功后打开`阿里云控制台`，进行服务器初始化，完成后已经成功再服务器安装好hermes agent

注意：阿里云预装hermes一般是安装在admin用户下的

### 1.2 可选登陆方式
**方案一：阿里云workbench登录**
`远程登录` -> `workbench`连接
![alt text](../images/hermes-feishu/Snipaste_2026-06-12_11-43-39.png)

**方案二：本地shell工具登录**
`FinalShell`或者`Xshell`通过服务器的**外网ip**进行连接

**方案三：阿里云配置的WebUI登录**
![alt text](../images/hermes-feishu/Snipaste_2026-06-12_11-47-47.png)

### 1.3 模型服务配置

Hermes Agent 需要接入一个 LLM 后端。推荐使用WebUI方式或者.env添加

**方案一：WebUI**
![alt text](../images/hermes-feishu/Snipaste_2026-06-12_11-55-24.png)

**方案二：配置.env**
先使用shell工具连接admin用户

```bash
# vim打开方式
vim ~/.hermes/.env

# nano打开方式
nano ~/.hermes/.env

# 如果没找到文件可以使用ls查看
ls -la ~/.hermes/
```


补充1：nano和vim常用指令
| 操作 | nano | vim |
|------|------|-----|
| 进入编辑 | 直接输入 | 按 `i` |
| 退出编辑模式 | 默认进入编辑模式 | 按 `Esc` |
| 保存 | `Ctrl+O` → 回车 | `:w` 回车 |
| 退出 | `Ctrl+X` | `:q` 回车 |
| 保存并退出 | `Ctrl+O` 后 `Ctrl+X` | `:wq` 回车 |
| 强制退出不保存 | `Ctrl+X` → `N` | `:q!` 回车 |
| 搜索 | `Ctrl+W` | `/关键词` 回车 |
| 跳到下一个搜索结果 | `Ctrl+W` 再回车 | `n` |

补充2：
对于linux操作系统而言，root用户和admin用户的文件权限是不同的：
* root用户的~地址是/root
* admin用户的~地址是/home/admin，且无法访问/root文件夹

由于阿里云的hermes默认安装在admin用户文件夹下，所以一般使用shell连接也会使用admin用户操作。当你忘记admin用户的password时，只能通过root用户进行更改（阿里云网页UI中只能修改root的password，无法修改admin的password）
```bash
# 先登录root后，在root用户下修改admin密码
passwd admin
```

---

## Part 2｜集成篇：Hermes Gateway 接入飞书

### 2.1 飞书开放平台应用创建

1. 登录 [飞书开放平台](https://open.feishu.cn/)
2. 点击"创建企业自建应用"
3. 填写应用名称（如"我的 AI 管家"）和描述
4. 创建完成后进入 **凭证与基础信息**，记录 `App ID` 和 `App Secret`
5. 启用 **机器人能力**


### 2.2 Gateway 配置方式

**方法 A：使用配置向导（推荐）**

```bash
# 进入终端执行配置向导
hermes gateway setup
```

按照交互提示：
1. 选择 `Feishu / Lark`
2. 扫描二维码或输入 App ID 和 App Secret
3. 选择域：`feishu`（国内）或 `lark`（国际）
4. 选择连接模式：`websocket`（推荐）

**方法 B：手动配置（适合自动化部署）**

在 `.env` 中添加以下配置：

```bash
# === 飞书 Gateway 配置 ===
FEISHU_APP_ID=cli_xxxxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
FEISHU_DOMAIN=feishu              # feishu 或 lark
FEISHU_CONNECTION_MODE=websocket  # websocket 或 webhook
FEISHU_WEBHOOK_PORT=8765          # webhook 模式时的端口
```


### 2.3 权限与安全设置

在[飞书开放平台](https://open.feishu.cn/?lang=zh-CN)右上角，进入开发者后台，点击你创建的**机器人bot**，进入**权限管理**页面，给应用添加需要的权限

具体权限可以到[最后一章](#part-4实战篇生活场景功能实现)根据所需服务选择

注意对机器人权限进行进行任何修改后，需要发布新版本才会修改成功


### 2.4 启动 Gateway 与消息测试

```bash
# 启动 Gateway
hermes gateway restart
```

---

## Part 3｜扩展篇：飞书官方 MCP 集成

### 3.1 MCP 协议速览

**MCP（Model Context Protocol）** 是由 Anthropic 提出的开放协议，为 AI 模型提供标准化的工具调用接口。可以把 MCP 理解为"AI 世界的 USB 协议"——标准化的接入方式让任何 MCP 客户端都能无缝使用各种工具。

Hermes Agent 的 MCP 架构支持两种模式：

- **MCP Client 模式** — Hermes 作为客户端，连接外部 MCP Server（如飞书 MCP、GitHub MCP），获取工具能力
- **MCP Server 模式** — Hermes 自身暴露为 MCP Server，供其他应用（如 Claude Desktop、VS Code）调用

本文主要使用 **Client 模式**，让 Hermes 通过飞书官方 MCP 调用飞书 API。

<!-- TODO: 添加 MCP 协议示意图 -->

### 3.2 安装飞书官方 MCP Server

飞书（Lark）官方 MCP Server 提供了对飞书开放 API 的标准化访问能力，包括云文档、云盘、日历、通讯录等模块。

优先在**admin用户**下进行安装（root用户下安装可能会安装在/root目录下，hermes服务无法访问）

> 🚧 **注意**：飞书官方 MCP Server 的具体安装命令和包名请参考 [飞书开放平台 MCP 文档](https://open.feishu.cn/)。以下为通用参考步骤。

**前置环境配置：**

```bash
# 1. 安装 nvm（gitee 镜像）
git clone https://gitee.com/mirrors/nvm.git ~/.nvm

# 2. 写入环境变量 + 指定阿里云 Node 下载镜像
cat >> ~/.bashrc << 'EOF'
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export NVM_NODEJS_ORG_MIRROR=https://mirrors.aliyun.com/nodejs-release
EOF

source ~/.bashrc

# 3. 安装 Node LTS
nvm install --lts && nvm use --lts

# 4. 配置 npm 阿里云镜像
npm config set registry https://mirrors.aliyun.com/npm/

# 5. 验证
node -v
npm -v
```

**MCP服务安装：**

```bash
# 全局安装
npm install -g @larkhq/mcp-server-lark

# 验证
lark-mcp --version
```

### 3.3 区分飞书的用户身份权限和应用身份权限


一、用户身份权限
本质是授予机器人一个用户的权限，该权限需要用户使用自己的id和secret来获取的`user-access-token`来实现授权。

因此使用用户权限的bot可以访问该用户下的被开放的私人数据如云盘，知识库，会议记录等等

二、应用身份权限
hermes默认使用的操作方式（无需手工配置），通过gateway连接后会自动得到一个`tenant-access-token`，获得公共资源的访问能力，如以bot身份在某些群聊中发送信息、获取信息（bot需要在该群聊内），获取该bot加入的群聊列表等等


### 3.4 配置用户身份权限给hermes
本质是存储user-access-token到服务器本地，同时也要解决token到期时自动获取新token问题

一、在飞书开发者后台的安全设置中添加下面重定向url
```
http://localhost:3100/callback
```

二、建立ssh连接
在本地windows的终端使用ssh连接云服务器
```bash
# 由于阿里云服务器内默认是无头服务器，连接不上浏览器，所以需要使用ssh连接云服务器于本机浏览器
ssh -L 3100:127.0.0.1:3100 admin@你的服务器外网IP

# password为admin的密码
```
三、云服务登录lar-mcp

```bash
npx -y @larksuiteoapi/lark-mcp login -a <your_app_id> -s <your_app_secret>

# 加载中会出现一个url，使用本地浏览器打开url进行权限确认
# 确认成功后会出现类似login successfully字样
# 授权后 user-access-token 和 refresh-token 都会保存到本地 ~/.lark-mcp/ 目录下。
# 这一步是报错的大源头，如果login成功也没有出现两个token可能是飞书更新了相关逻辑，可以查查官网
```

<!-- 补充：快速获得user-access-token的方法


```bash
# 先在飞书开发者平台添加重定向url：
https://www.feishu.cn

# 本地浏览器访问飞书官方授权码网页并登录，登陆后再跳转url中有一个字段 code
https://open.feishu.cn/open-apis/authen/v1/authorize

# 本地终端
curl -X POST 'https://open.feishu.cn/open-apis/authen/v1/oidc/access_token' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer t-g1046c8WJU4HVXTIYDZVK7ELZFII346APGXJJ52T' \
  -d '{
    "grant_type": "authorization_code",
    "code": "你拿到的code"
  }'
``` -->

四、刷新token的脚本
```bash
# 云服务器终端创建脚本
# 注意填入你的id，secret
cat > ~/refresh_lark_token.sh << 'EOF'
#!/bin/bash

APP_ID=""
APP_SECRET=""
CONFIG_FILE="/home/admin/.hermes/config.yaml"
TOKEN_FILE="/home/admin/.lark_tokens"

# 读取当前 refresh_token
REFRESH_TOKEN=$(cat $TOKEN_FILE | grep refresh_token | awk '{print $2}')

# 获取 app_access_token
APP_TOKEN=$(curl -s -X POST 'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal' \
  -H 'Content-Type: application/json' \
  -d "{\"app_id\":\"$APP_ID\",\"app_secret\":\"$APP_SECRET\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['app_access_token'])")

# 用 refresh_token 换新的 user_access_token
RESPONSE=$(curl -s -X POST 'https://open.feishu.cn/open-apis/authen/v1/oidc/refresh_access_token' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $APP_TOKEN" \
  -d "{\"grant_type\":\"refresh_token\",\"refresh_token\":\"$REFRESH_TOKEN\"}")

NEW_ACCESS_TOKEN=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['access_token'])")
NEW_REFRESH_TOKEN=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['refresh_token'])")

if [[ $NEW_ACCESS_TOKEN == u-* ]]; then
  # 更新 token 文件
  echo "refresh_token $NEW_REFRESH_TOKEN" > $TOKEN_FILE
  
  # 更新 config.yaml 里的 user_access_token
  sed -i "s/- \"u-.*\"/- \"$NEW_ACCESS_TOKEN\"/" $CONFIG_FILE
  
  # 重启 hermes
  pkill -f lark-mcp
  
  echo "$(date): Token 刷新成功" >> /home/admin/.lark_token_refresh.log
else
  echo "$(date): Token 刷新失败: $RESPONSE" >> /home/admin/.lark_token_refresh.log
fi
EOF

# 添加权限
chmod +x ~/refresh_lark_token.sh

# 第一次创建地址保存当前的refresh-token（从前面的~/.lark-mcp/文件中获取）
echo "refresh_token 你的refresh-token" > ~/.lark_tokens

# 测试脚本
bash ~/refresh_lark_token.sh
cat ~/.lark_token_refresh.log


# 设置crontab，定时更新
crontab -e

# 里面添加（crontab本质是一个vim）
0 * * * * /home/admin/refresh_lark_token.sh
```


### 3.5 以sse模式启动MCP Server常驻服务

在 Hermes 配置中注册飞书 MCP Server：

```yaml
# 获取node，lark-mcp的地址
which node
which lark-mcp

# vim/nano打开config.yaml
vim ~/hermes/config.yaml

# 第一次添加mcp服务是没有mcp_servers字段的，自己创建即可
# 一定要换绝对路径：admin下~换为/home/admin
# 十分注意yaml文件的缩进，一定要对齐
# user-access-token在3.4步返回的json中
mcp_servers:
  lark-docs:
    command: which node的结果转换为绝对路径
    args:
    - which lark-mcp的结果转换为绝对路径
    - mcp
    - -a
    - 你的id
    - -s
    - 你的secret
    - --token-mode
    - user_access_token
    - -u
    - 你的user-access-token（用于第一次配置，后面使用脚本刷新）
    tools:
      include: '[]'
    resources: false
    prompts: false

```

---

## Part 4｜实战篇：生活场景功能实现

### 4.1 智能日程管理

**场景：** 通过飞书对话让 bot 创建、查询、修改日历事件，例如"帮我明天下午 3 点创建一个与团队的周会，持续 1 小时"

**实现思路：**
1. 用户在飞书发送自然语言指令
2. Hermes Agent 解析时间、标题、参与人等关键信息
3. 调用飞书 MCP 日历 API 完成日程操作
4. 将结果以飞书消息卡片形式返回确认

**支持的操作：**
- 📅 **创建日程**：指定时间、标题、参与人、地点
- 🔍 **查询日程**：按日期范围、关键词检索
- ✏️ **修改/取消日程**：更新已有事件
- ⏰ **日程提醒**：设置提前通知

**需要在飞书后台打开的权限：**
- `calendar:calendar` — 日历读写（创建、查询、修改日程）
- `calendar:calendar.event` — 日历事件管理
- `im:message` — 发送消息卡片给用户确认

```bash
# 对话示例
用户: "周五下午 4 点和张三对齐项目进度，帮我加个日程"
Agent: "已为你创建日程：📅 项目对齐（本周五 16:00-17:00），已邀请张三"
```

### 4.2 信息聚合推送

**场景：** 每天早上定时推送当日天气、技术热点和日程摘要到飞书，开启高效的一天

**实现思路：**
1. Hermes Cron 调度器在设定时间触发
2. Agent 并行聚合天气 API、RSS 订阅源、飞书日历事件
3. 调用飞书 MCP 将内容格式化为富文本消息卡片
4. 推送到指定飞书个人或群聊

**支持的操作：**
- 🌤 **天气播报**：接入和风天气/OpenWeather API 获取当日天气
- 📰 **技术热点**：订阅 GitHub Trending、Hacker News、RSS
- 📋 **日程摘要**：查询当天飞书日历事件概览
- 🎯 **每日提醒**：自定义待办事项或习惯打卡

**需要在飞书后台打开的权限：**
- `im:message` — 发送消息卡片到个人或群聊
- `im:chat` — 获取群聊列表，定位推送目标
- `calendar:calendar` — 查询当日日程用于摘要

```yaml
# config.yaml cron_jobs 配置
cron_jobs:
  - name: "daily_briefing"
    schedule: "0 8 * * *"   # 每天早上 8 点
    skill: "daily_briefing"
    channel: "oc_xxxxx"      # 飞书群聊或私聊 ID
```

```bash
# 示例推送内容（飞书消息卡片）
┌─────────────────────────────────┐
│ ☀️ 早安！今日简报              │
│ 📅 2026年6月12日 星期五         │
│                                 │
│ 🌤 上海：晴 28~34°C            │
│ 📰 GitHub 热门：hermes-agent   │
│ 📋 今日日程：2项 · 周会 15:00  │
└─────────────────────────────────┘
```

### 4.3 AI 生活助手

**场景：** 将飞书 bot 当作你的私人 AI 助理，通过自然语言对话完成日常查询、记录和提醒

**实现思路：**
1. 用户在飞书直接发送消息给 bot，无需特定指令格式
2. Hermes Agent 根据意图自动路由到对应的 Skill 或 MCP 工具
3. 结合记忆系统跨会话维护上下文（如记账连续累计）
4. 返回结构化回复或富文本消息

**支持的操作：**
- 🔎 **信息查询**：联网搜索、百科、天气、汇率
- 📝 **记录与笔记**：快捷记录到飞书文档或个人知识库
- ⏰ **提醒与待办**：创建定时提醒、循环提醒
- 💰 **记账与统计**：记录日常开支，定期生成消费报表
- 🗣 **闲聊陪伴**：日常对话、灵感记录

**需要在飞书后台打开的权限：**
- `im:message` — 收发消息（bot 的基础能力）
- `contact:user.base` — 读取用户基本信息（称呼个性化）
- `drive:drive` — 将对话记录、笔记存为云盘文档
- `docx:document` — 创建/修改飞书文档（详细记录）
- `calendar:calendar` — 创建提醒日程

```bash
# 对话示例
用户: "记一笔，今晚买水果花了 38 块"
Agent: "✅ 已记录：🍎 水果 - ¥38.00（2026-06-12）"
用户: "我这个月一共花了多少钱"
Agent: "📊 本月已记 18 笔，合计 ￥2,356.00，较上月同期 -12%"
```

### 4.4 知识库与云盘

**场景：** 通过bot对个人云盘，知识库内内容进行操作（读取，修改等）

**实现思路：**
1. 通过飞书 MCP 云盘 API 上传 / 下载 / 搜索文件
2. 配合 Hermes 记忆系统实现语义搜索
3. 自动归档聊天中的重要文件到知识空间

**支持的操作：**
- 📤 **上传**：将对话中的文件自动保存到云盘知识库目录
- 📥 **下载**：根据描述找到文件并推送到对话中
- 🔍 **搜索**：语义级检索云盘中的文档内容
- 📋 **归档**：定时整理飞书群聊中的共享文件

需要在飞书后台打开的权限：
- drive:drive
- drive:file
- wiki:wiki
- docx:document


```bash
# 对话示例
用户: "帮我找我上周上传的那份 Hermes 部署文档"
Agent: "找到了！这是你上周三上传的《Hermes Agent 阿里云部署指南》，我帮你做个摘要..."
```

<!-- TODO: 添加 Skill 配置、云盘 API 调用示例 -->

### 4.5 自动化流程

**场景：** 设定定时任务或触发器，让 Agent 自动完成巡检、汇总、通知等重复性工作

**实现思路：**
1. 通过 Hermes Cron 调度器或飞书定时消息配置触发条件
2. Agent 在后台自动执行预定义的 Skill 流程
3. 执行结果自动推送到飞书个人或指定群聊
4. 支持条件分支——异常时告警，正常时静默

**支持的操作：**
- 🔁 **定时巡检**：每 30 分钟检测服务器健康状态，异常时告警
- 📊 **日报/周报生成**：定时汇总云盘文档、日历事件生成报告
- 📥 **自动归档**：将飞书群聊中过期文件自动整理到知识库
- 🚨 **监控告警**：对接服务监控，异常时自动推送飞书消息

**需要在飞书后台打开的权限：**
- `im:message` — 推送执行结果到个人或群聊
- `im:chat` — 获取群聊列表，管理推送目标
- `drive:drive` — 自动归档文件到云盘
- `calendar:calendar` — 生成日程汇总报告

```yaml
# config.yaml 自动化任务配置
cron_jobs:
  - name: "server_health_check"
    schedule: "*/30 * * * *"       # 每 30 分钟
    skill: "check_server_health"
    channel: "oc_xxxxx"
    
  - name: "weekly_report"
    schedule: "0 18 * * 5"         # 每周五 18:00
    skill: "weekly_summary"
    channel: "oc_xxxxx"
```

```bash
# 对话示例
用户: "每天晚上 10 点帮我总结当天的飞书文档更新"
Agent: "✅ 已设置定时任务，每晚 22:00 自动汇总文档变更并推送到你的私聊"
```

---

## 总结与展望


### 安全性注意事项

- **API Key 管理**：使用环境变量而非硬编码，定期轮换
- **权限最小化**：飞书应用只申请必要的 API 权限
- **用户白名单**：启用 `FEISHU_ALLOWED_USERS` 限制访问范围


### 后续可扩展方向

- 🤖 **多 Agent 协作** — 部署多个专用 Agent（如工作助理、家庭管家），共享记忆后端
- 🔗 **更多 MCP 工具链** — 接入 GitHub MCP、Notion MCP、数据库 MCP 等
- 🧠 **本地模型部署** — 结合 Ollama 或 vLLM，实现完全本地化运行
- 📊 **监控与日志** — 接入 Grafana 或 Prometheus，可视化 Agent 运行状态

---

## 附录

### 常用命令速查

| 命令 | 用途 |
|------|------|
| `hermes gateway setup` | 配置消息网关 |
| `hermes gateway start` | 启动消息网关 |
| `hermes mcp list` | 列出已配置的 MCP 服务 |
| `hermes mcp add <name> --url <endpoint>` | 添加 MCP 服务 |
| `hermes chat` | 命令行对话模式 |
| `hermes cron list` | 查看定时任务 |
| `docker compose logs -f` | 查看运行日志 |

---

