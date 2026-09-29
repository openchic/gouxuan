## Context

仓库现状：`packages/electron` 是刚生成的 electron-vite 模板骨架（三进程、无业务实现），旧的 Pi Agent、Astryx 界面与 SQLite 持久化代码已整体删除；根 `package.json` 仍描述旧单包应用，`pnpm-workspace.yaml` 只有 pnpm 设置项、没有 `packages`；`node_modules` 已清空，`pnpm-lock.yaml` 与新的包结构不一致。

本 change 只定结构与任务编排，不实现问答客户端、检索服务与官网内容。

## Goals / Non-Goals

**Goals**

- `packages/*` 成为真实 workspace，客户端包可被 pnpm 与 turbo 管理。
- 一条根命令构建全部 JS 子包，一条命令跑全部静态检查。
- 明确依赖与配置的归属规则，避免根与包互相顶替。

**Non-Goals**

- 不创建 `packages/site`，官网技术选型与内容仍未定（PLAN.md 待定问题 5）。
- 不创建 `services/api`，只固定它不进 workspace 的边界。
- 不改客户端业务代码：模板的 `sandbox: false`、缺失 CSP、`setAppUserModelId('com.electron')`、窗口标题与模板图标都属于后续客户端 change。
- 不做安装包与 macOS 显示名验证，`pnpm package:mac` 仍未执行。

## 结构

| 路径                | 包名                | 角色                            | 工具链                   | workspace 成员    |
| ------------------- | ------------------- | ------------------------------- | ------------------------ | ----------------- |
| 根                  | `gouxuan`           | 编排：turbo、prettier、git 钩子 | pnpm                     | —                 |
| `packages/electron` | `@gouxuan/electron` | Electron 问答客户端             | electron-vite、React、TS | 是                |
| `packages/site`     | `@gouxuan/site`     | 产品官网（待建）                | Vite、React（待定）      | 是（glob 已覆盖） |
| `services/api`      | `gouxuan-api`       | 语料摄取与检索（待建）          | Python、FastAPI、uv      | 否                |

`packages: ['packages/*']` 一条 glob 覆盖已有和未来新增的 JS 包；新增官网子包不需要改 workspace 定义，也不需要动 turbo 任务图。

`services/api` 留在 glob 之外：pnpm 只把含 `package.json` 的目录当作包，turbo 的任务图只从 workspace 包生成，纳进来就要额外维护一个只做命令转发的假 `package.json`。同仓不同链保住的是主要收益——`openapi.json` 契约与服务端、客户端改动落在同一个 commit；独立仓库要付两套 CI 与跨仓对齐成本，现阶段不需要。等服务端同时供给多个前端或需要独立发布节奏时再拆。

## 任务编排

turbo 2.11.5，任务只定义在根，脚本实现留在包内：

| task        | 谁实现                                                     | dependsOn | 缓存           | 产物                |
| ----------- | ---------------------------------------------------------- | --------- | -------------- | ------------------- |
| `build`     | `electron-vite build`（site 后续为 `vite build`）          | `^build`  | 是             | `out/**`、`dist/**` |
| `typecheck` | `tsc --noEmit -p tsconfig.node.json` + `tsconfig.web.json` | 无        | 是             | 无                  |
| `build:mac` | `electron-builder --mac dmg zip`                           | `build`   | 否             | 安装包              |
| `dev`       | `electron-vite dev`                                        | 无        | 否，persistent | 无                  |
| `start`     | `electron-vite preview`                                    | 无        | 否，persistent | 无                  |

`lint` 不进任务图：ESLint 配置在根，一次进程覆盖全部包，交给 turbo 分发反而要把配置拆回包内。

`build` 的 `dependsOn: ['^build']` 目前不产生实际等待（包之间没有依赖），它的作用是当 workspace 内出现被依赖的包时不需要再改任务图。`build:mac` 关掉缓存，因为产物是安装包、体积大且依赖签名环境。

## 命令面

| 命令                                  | 位置 | 实际执行                                                  |
| ------------------------------------- | ---- | --------------------------------------------------------- |
| `pnpm dev`                            | 根   | `turbo run dev`，同时起全部包的开发进程                   |
| `pnpm build`                          | 根   | `turbo run build`                                         |
| `pnpm check`                          | 根   | `prettier --check .` + `eslint .` + `turbo run typecheck` |
| `pnpm lint`                           | 根   | `eslint .`，一次进程覆盖全部包                            |
| `pnpm package:mac`                    | 根   | `turbo run build:mac`                                     |
| `pnpm format`                         | 根   | `prettier --write .`，全仓统一                            |
| `pnpm --filter @gouxuan/electron dev` | 根   | 只起客户端，绕过 turbo                                    |

包内脚本只调用本包工具，不引用相邻包路径；根脚本只做转发，不重复实现构建步骤。

## 依赖与配置归属

- 静态检查工具链与配置只在根有一份：`eslint.config.mjs` 从 `packages/electron/` 原样上移，规则集合不变（`@electron-toolkit/eslint-config-ts` + react + react-hooks + react-refresh + prettier 关闭冲突规则），配套的 eslint 与插件依赖随之上移。新增子包不需要复制插件与版本。
- `@electron-toolkit/tsconfig`、`utils`、`preload` 仍留在客户端包，它们被包内代码与 tsconfig 直接继承。
- `typescript` 在根与客户端包都声明同一个 `^5.9.3` range：根需要它满足 eslint ts 预设的 peer，包需要它跑 `tsc --noEmit`。重装后要确认 pnpm 解析成同一版本。
- 应用运行时依赖（react、electron、vite、未来的 Pi/Astryx/SQLite）全部在包内声明，不依赖根安装顺带提供。旧的 `electron-builder install-app-deps` postinstall 已随应用依赖移到包内。
- `tsconfig` 留在包内：main/preload 与 renderer 分属 node 与 dom 两套 lib 和 globals，客户端包的三件套是 electron-vite 的约定；收到根上只会变成根 project 引用再绕回包内。
- prettier 配置沿用仓库根已有的 `.prettierrc`（`semi: false`、`singleQuote: true`、`tabWidth: 2`、`trailingComma: "es5"`、`arrowParens: "avoid"`）。实测第一次 `pnpm format` 按它重写了 20 个文件：给对象与数组补尾逗号、把 `(details) =>` 收成 `details =>`。模板源码 0 条带分号语句、最长行 80，与 `semi: false` 一致。
- Playwright 配置跟随 e2e 用例放在客户端包内；现在没有用例，所以没有配置文件。
- `.npmrc` 的 `shamefully-hoist=true` 暂时保留。它会让包解析到未声明的依赖，掩盖声明缺失；移除需要重装并逐包验证，属于独立一次改动。
- 包管理器约束目前是声明而非强制：根写 `packageManager: pnpm@11.9.0`，但实测 turbo 2.11.5 在 `npm run build` 下不报错、照常命中缓存。原先的 `npx only-allow pnpm` 每次安装要联网取包，删除它等于放弃唯一的硬门禁；要恢复强制只能靠 corepack 或重新引入守卫。

## Decisions

**目录用 `packages/` 而不是 `apps/`**：以已建成的目录为准，两个前端与未来的共享包同层，避免在结构里区分「应用」与「库」而实际只有应用。

**包名带 scope，产物名不能写 `${name}`**：`@gouxuan/electron` 含斜杠，electron-builder 的 `${name}` 模板会拼出带斜杠的文件路径。`dmg.artifactName` 显式写 `Gouxuan-${version}.${ext}`。

**显示名与产物名分离**：`productName` 用 ASCII 的 `Gouxuan`，中文显示名走 macOS `CFBundleDisplayName: 钩玄`。这样安装包、卷标与签名路径都不含非 ASCII 字符。这条要在真正打包时验证菜单栏与访达显示是否取到 `CFBundleDisplayName`。

**v1 只保留 mac 打包段**：模板的 `win`/`nsis`/`linux`/`appImage` 段全部删除。留着未验证的平台配置比缺配置更贵——它们同样参与 `${name}` 展开与产物命名。

**自动更新残留删除**：`electron-updater` 依赖、`dev-app-update.yml` 与 `electron-builder.yml` 的 `publish` 段（指向 `https://example.com/auto-updates`）删除，PLAN.md 的 v1 明确不含自动更新。

**静态检查入口在根**：ESLint 9 的 flat config 按当前工作目录查找，编辑器和 CI 都以仓库根为工作目录；配置放在包内会让根上跑的那套规则与包内跑的那套不一致，同一份源码出现两种检查结果，且每加一个包就要复制插件与版本。因此把包内那份 `eslint.config.mjs` 原样平移到根——规则集合不变，glob 从配置文件所在目录展开后覆盖 `packages/**`——与根既有的 `.prettierrc` 一起只在根存在，`lint-staged` 因此可以直接跑 `eslint --fix` 而不必跨包指定 config 路径。代价是 `pnpm --filter @gouxuan/electron lint` 不再存在，包专属规则差异要写成根配置里的 `files` 段。

## Risks / Trade-offs

- **打包链路未验证**：`pnpm build`、`pnpm check` 与 turbo 缓存已实测通过，但 `pnpm package:mac` 未执行，中文 `CFBundleDisplayName` 是否被访达与菜单栏采用、去掉 `publish` 段后产物是否仍生成更新元数据，都要等真实打包。
- **`pnpm-lock.yaml` 与新结构不一致**：它仍描述旧单包的依赖树，重新安装前 `--frozen-lockfile` 一定失败。
- **模板安全默认值与 PLAN.md 冲突**：`src/main/index.ts` 里 `sandbox: false`、`webContents` 允许 `shell.openExternal`、无 CSP、窗口无标题与 `setAppUserModelId('com.electron')`，与「sandbox + contextIsolation + 严格 CSP」的安全边界相反。这些是客户端实现内容，已在 tasks 里点名归属，但不在本 change 修。
- **图标仍是模板 Electron 图标**：`build/icon.*` 与 `resources/icon.png` 需要在发布前换成钩玄图标。
- **调试配置路径失效**：`packages/electron/.vscode/launch.json` 用 `${workspaceRoot}/node_modules/.bin/electron-vite` 定位可执行文件，workspace 布局下该工具装在包内目录；这份包内 `.vscode` 与仓库根的编辑器配置也会互相顶替。归属客户端 change 处理。
- **依赖版本回退**：模板给的是 electron 39、vite 7、react 19.2，与旧实现的 electron 43、vite 8 不同；重新接入 Pi 与 Astryx 时按新范围验证兼容性，不假设旧版本行为。

## Open Questions

- 官网子包用 Vite React 还是 Astro，是否随本 change 一起建壳。
- `shamefully-hoist` 何时移除、以什么验证结果移除。
- 是否需要恢复 Windows/Linux 打包段。
- 许可证与 `LICENSE` 的版权方写法（当前是 `openvain`，仓库已迁到 `openchic` 组织）。
