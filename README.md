# 钩玄

基于 RAG 的保险咨询问答系统，帮助不了解保险的人判断该买什么、不必买什么。

产品与架构范围见 [PLAN.md](PLAN.md)，进行中的变更见 [openspec/changes](openspec/changes)。

## 仓库结构

- `apps/electron`：桌面客户端（`@gouxuan/electron`）
- `apps/site`：产品官网（待建）
- `services/api`：语料摄取与检索服务，Python 工具链，不属于 pnpm workspace（待建）

## 命令

根目录只负责编排：

```bash
pnpm install     # 安装全部 workspace 依赖
pnpm dev         # 启动全部子包的开发进程
pnpm dev:api     # 检索服务（docker compose up api）
pnpm build       # turbo 构建全部 JS 子包
pnpm lint        # 根 eslint 配置覆盖 apps/**
pnpm check       # prettier 检查 + eslint + turbo run typecheck
pnpm check:api   # 检索服务：ruff check + ruff format --check + pyright + pytest + openapi 契约 diff
pnpm format      # prettier 写模式（不碰 .py/.toml/uv.lock）
pnpm format:api  # ruff --fix + ruff format
pnpm package:mac # 构建 macOS 安装包
```

检索服务还需要 `uv`（生成锁文件用 `uv lock`）。

单个子包：`pnpm --filter @gouxuan/electron dev`。检索服务：`pnpm dev:api`。

客户端当前可独立预览登录、问答、设置和知识库界面，支持本地三态主题。会话与资料使用明确标记的虚构样例，草稿仅在当前窗口内保留；登录、问答和知识库服务尚未接入。

## 许可

- 代码（本仓库全部内容）：AGPL-3.0-only，见 [LICENSE](LICENSE)。分发桌面端或基于本仓库提供服务时，需按 AGPL 提供对应源码。Copyright (C) 2026 openchic。
- 保险语料、索引产物与评测集不在该许可下，也不进本仓库；它们的授权另行处理。
- 依赖许可已扫描：无 GPL 系家族冲突，仅 `lightningcss`、`certifi` 为 MPL-2.0（与 AGPL 兼容）。
