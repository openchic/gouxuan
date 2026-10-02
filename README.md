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
pnpm check:api   # 检索服务的 ruff 与 pytest
pnpm package:mac # 构建 macOS 安装包
```

检索服务还需要 `uv`（生成锁文件用 `uv lock`）。

单个子包：`pnpm --filter @gouxuan/electron dev`。
