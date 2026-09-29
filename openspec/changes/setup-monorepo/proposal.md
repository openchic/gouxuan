## Why

客户端已经换成 `packages/electron` 的 electron-vite 骨架，但仓库还不是 workspace：`pnpm-workspace.yaml` 没有 `packages` 字段，那个包不受 pnpm 管理；根 `package.json` 仍是旧单包应用的配置，指向已不存在的 `src/`、`build/` 和 `openwriter` 标识。产品需要客户端、官网和 Python 检索服务三部分共存，先把结构与任务编排定下来，后续 change 才有落点。

## What Changes

- `pnpm-workspace.yaml` 声明 `packages: ['packages/*']`，`packages/electron` 成为 workspace 成员；Python 服务留在 glob 之外。
- 新增根 `turbo.json`，定义 `build`/`typecheck`/`build:mac`/`dev`/`start` 五个任务。
- 根 `package.json` 改为纯编排包：包名 `gouxuan`，保留 turbo 转发脚本、全仓静态检查与格式化，以及 git 钩子依赖，不再承载应用依赖与应用构建脚本。
- 客户端包改名 `@gouxuan/electron`，只声明应用运行时与构建依赖；`productName`、`appId`、产物名改为钩玄标识，`artifactName` 显式使用 ASCII。
- 删除自动更新残留（`electron-updater` 依赖、`dev-app-update.yml`、`publish` 配置段）与模板的 win/linux 打包段。
- **BREAKING** 静态检查入口移到根：把 `packages/electron/eslint.config.mjs` 原样平移到根（规则集合不变），删除包内那份与包内 eslint 相关依赖，`lint` 不再是 turbo 任务。
- 删除根目录失效配置：`tsconfig.json`（引用已不存在的 node/web 配置）与 `playwright.config.ts`（`testDir: ./e2e` 已不存在）。
- 格式化沿用根已有的 `.prettierrc`，新增 `.prettierignore`。

## Capabilities

### New Capabilities

- `monorepo-workspace`: workspace 边界、turbo 任务编排、依赖与配置归属规则。
- `product-identity`: 钩玄 的包名、应用标识、产物命名与显示名分离。

### Modified Capabilities

无。主规格目前为空，客户端能力由后续 change 建立。

## Impact

配置：`pnpm-workspace.yaml`、`turbo.json`、根与 `packages/electron` 的 `package.json`、根 `eslint.config.mjs`、`packages/electron/electron-builder.yml`、`.gitignore`、`.prettierignore`。

依赖：根新增 turbo 2.11.5，并承接从包内上移的静态检查工具链（eslint、`@electron-toolkit/eslint-config-ts`、`@electron-toolkit/eslint-config-prettier`、eslint-plugin-react/react-hooks/react-refresh、typescript）与 prettier；已执行 `pnpm install`，`pnpm-lock.yaml` 按 workspace 结构重建。`pnpm-workspace.yaml` 的 `allowBuilds` 与 `minimumReleaseAgeExclude` 仍列着已不被任何包声明的条目（`@astryxdesign/*`、`@google/genai`、`better-sqlite3`、`protobufjs`、typescript-eslint 8.66.0），其中一部分会随客户端实现回来，届时再核对。

未包含：客户端问答实现、官网子包内容、`services/api` 实现——这些不属于结构范围。
