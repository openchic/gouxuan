## Context

工程骨架已经完成。JS 应用位于 `apps/*`，客户端使用 electron-vite、React 与 Astryx，Python 服务在 `services/api` 由 uv 独立管理。当前服务只提供健康接口和 OpenAPI 导出，没有数据库、账号、知识库或问答业务。

本 change 的归档保留 10 项未完成条目，后续归属见 [v1 实施计划](../../../v1-plan.md)。归档表示工程基础可交付，不代表这些条目已经实现。

## Goals / Non-Goals

**Goals:**

- 统一 workspace、根检查与任务编排，应用依赖和构建配置留在实际使用方。
- 建立可构建、可检查的 Electron 和 Python 服务骨架，清除失效配置及模板业务。
- 使用钩玄标识，并验证 macOS 打包与基础签名启动。

**Non-Goals:**

- 账号、知识库、问答、客户端业务与静态官网由后续 v1 change 实现。
- 生产部署、分栈 CI、图标替换、公证与安装显示名验收由发布 change 完成。
- 不启用自动更新，不声明 Windows 或 Linux 支持。

## Decisions

### 应用与服务分开管理

`apps/*` 中含 `package.json` 的应用进入 pnpm workspace，Python 服务使用独立 `pyproject.toml` 和 `uv.lock`，不添加只用于转发命令的假 JS 包。跨栈启动通过根 Compose，接口通过受版本管理的 OpenAPI 契约连接。

根目录保留共享 ESLint、Prettier、提交钩子与 turbo 配置；应用自己的 TypeScript、构建和打包配置留在应用目录。Python 的 Ruff、Pyright、pytest 和契约检查通过 `pnpm check:api` 运行。

### 构建与检查保持少量明确入口

turbo 只定义 `build`、`typecheck`、`build:mac` 和 `dev`。构建和类型检查可缓存，开发和 macOS 打包不缓存。ESLint 在根执行一次。根命令提供 JS 构建、检查和打包，以及独立的 API 开发与检查入口。

现有 Compose 只启动健康接口骨架；完整数据库、存储、迁移和两类 worker 随业务逐步接入，不将骨架误报为完整开发栈。

### 保留已验证的依赖配置

Electron、React、Astryx 与应用构建依赖在客户端包中声明。Astryx 使用已安装版本的预构建 CSS 和根 `Theme`，三态主题设置随客户端业务实现。

构建许可批准 Electron 与 esbuild，显式禁用 electron-winstaller 与 Astryx core 的非必要安装脚本；保留已验证的 `@electron/get` override。当前 hoist 配置与包管理器强制门禁作为可选维护项，未在本 change 修改。

### 显示名和分发路径分开

`productName` 为 `Gouxuan`，`appId` 为 `com.openchic.gouxuan`，中文显示名为钩玄，用户数据目录为 `Gouxuan`。DMG 与 ZIP 名称使用 ASCII；ZIP 允许架构和平台后缀。

已验证 DMG / ZIP 构建、Info.plist 标识、仅保留 `allow-jit` 的 entitlements、hardened runtime 签名与签名应用启动。公证、正式分发签名、访达及菜单栏显示名、图标替换仍需发布验收。

## Risks / Trade-offs

- 工程骨架不提供业务功能，现有 `/readyz` 的本地索引文件判断将由服务基础 change 替换。
- 客户端目前无业务 IPC 接口；类型化 Preload、安全导航、CSP 和认证运行层需要随实际消费者接入。
- API 测试存在上游 TestClient 弃用告警，升级依赖时复查。
- 私有语料、真实模型配置、生产密钥、发布图标与签名公证凭据由相应实施阶段提供，不能以合成测试替代上线验收。

## Migration Plan

工程配置与产品标识已在当前 checkout 落地。归档前将两份 delta spec 同步为主规格并验证，保留未完成任务及迁移记录。后续按 v1 计划的依赖顺序实施；需要回退工程配置时通过 Git 恢复对应变更，不处理未来业务数据迁移。
