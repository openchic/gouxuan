## Why

客户端已经换成 `apps/electron` 的 electron-vite 骨架，但仓库还不是 workspace：`pnpm-workspace.yaml` 没有 `packages` 字段，那个包不受 pnpm 管理；根 `package.json` 仍是旧单包应用的配置，指向已不存在的 `src/`、`build/` 和 `openwriter` 标识。产品需要客户端、官网和 Python 检索服务三部分共存，先把结构与任务编排定下来，后续 change 才有落点。

## What Changes

- `pnpm-workspace.yaml` 声明 `packages: ['apps/*']`，`apps/electron` 成为 workspace 成员。
- 新增根 `turbo.json`，定义 `build`/`typecheck`/`build:mac`/`dev` 四个任务。
- 删除无引用命令：根 `start` 与 `typecheck` 透传、turbo 的 `start` 任务、包内 `build:unpack`。
- 根 `package.json` 改为纯编排包：包名 `gouxuan`，保留 turbo 转发脚本、全仓静态检查与格式化，以及 git 钩子依赖，不再承载应用依赖与应用构建脚本。
- 客户端包改名 `@gouxuan/electron`，只声明应用运行时与构建依赖；`productName`、`appId`、产物名改为钩玄标识，`artifactName` 显式使用 ASCII。
- 删除自动更新残留（`electron-updater` 依赖、`dev-app-update.yml`、`publish` 配置段）与模板的 win/linux 打包段。
- **BREAKING** 静态检查入口移到根：把 `apps/electron/eslint.config.mjs` 原样平移到根（规则集合不变），删除包内那份与包内 eslint 相关依赖，`lint` 不再是 turbo 任务。
- 删除根目录失效配置：`tsconfig.json`（引用已不存在的 node/web 配置）与 `playwright.config.ts`（`testDir: ./e2e` 已不存在）。
- 格式化沿用根已有的 `.prettierrc`，新增 `.prettierignore`。
- 建立 uv 管理的 FastAPI 健康接口、OpenAPI 导出、基础测试、API 镜像与 Compose，并提供根 API 启动和检查入口。
- 清除客户端模板业务与多平台残留，保留安全窗口配置、Astryx 主题管线与 macOS 标识；客户端业务和完整服务部署由 v1 后续 change 实现。

## Capabilities

### New Capabilities

- `monorepo-workspace`: workspace 边界、turbo 任务编排、依赖与配置归属规则。
- `product-identity`: 钩玄 的包名、应用标识、产物命名与显示名分离。

### Modified Capabilities

无。主规格目前为空，客户端能力由后续 change 建立。

## Impact

配置：`pnpm-workspace.yaml`、`turbo.json`、根与 `apps/electron` 的 `package.json`、根 `eslint.config.mjs`、`apps/electron/electron-builder.yml`、`.gitignore`、`.prettierignore`。

依赖：根承接 turbo 与静态检查工具链，应用依赖留在客户端包，Python 使用独立 `uv.lock`。构建许可批准 Electron 与 esbuild，并显式禁用 electron-winstaller 与 Astryx core 的非必要安装脚本；保留已验证的 `@electron/get` override。

未包含：账号、知识库、RAG、客户端业务、官网内容与生产发布。未完成事项保留在 tasks，并按 [v1 实施计划](../../../v1-plan.md) 迁移到后续 change；不将迁移等同于实现完成。
