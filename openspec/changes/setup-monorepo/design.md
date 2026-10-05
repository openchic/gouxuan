## Context

仓库现状：`apps/electron` 是刚生成的 electron-vite 模板骨架（三进程、无业务实现），旧产品的写作界面与运行时代码已整体删除；根 `package.json` 仍描述旧单包应用，`pnpm-workspace.yaml` 只有 pnpm 设置项、没有 `packages`；`node_modules` 已清空，`pnpm-lock.yaml` 与新的包结构不一致。

本 change 只定结构与任务编排，不实现问答客户端、检索服务与官网内容。

## Goals / Non-Goals

**Goals**

- `apps/*` 成为真实 workspace，客户端包可被 pnpm 与 turbo 管理。
- 一条根命令构建全部 JS 子包，一条命令跑全部静态检查。
- 明确依赖与配置的归属规则，避免根与包互相顶替。

**Non-Goals**

- 不创建 `apps/site`，官网技术选型与内容仍未定（PLAN.md 待定问题）。
- `services/api` 不进 pnpm workspace：它已在本 change 期间落地为 uv + Docker 的独立目录，跨语言只靠根 `compose.yml` 与 `openapi.json` 契约连接（PLAN.md 仓库结构节）。
- 客户端只清模板残留、不写业务：三进程安全默认值与标识按 4.12 修，问答运行时与界面归 `build-qa-client`。
- 不验证 DMG 与实机显示名，zip 打包已跑通。

## 结构

| 路径            | 包名                | 角色                            | 工具链                      | workspace 成员    |
| --------------- | ------------------- | ------------------------------- | --------------------------- | ----------------- |
| 根              | `gouxuan`           | 编排：turbo、prettier、git 钩子 | pnpm                        | —                 |
| `apps/electron` | `@gouxuan/electron` | Electron 问答客户端             | electron-vite、React、TS    | 是                |
| `apps/site`     | `@gouxuan/site`     | 产品官网（待建）                | Vite、React（待定）         | 是（glob 已覆盖） |
| `services/api`  | `gouxuan-api`       | 语料摄取与检索（待建）          | Python、FastAPI、uv、Docker | 否                |

glob 只有 `apps/*`，新增 JS 子包不需要再改结构定义。

`services/api` 不进 pnpm workspace：pnpm 只把含 `package.json` 的目录当包，turbo 的任务图也只从 workspace 包生成，纳进来就要在 Python 目录里放一个只做命令转发的假 `package.json`，而 turbo 对 Python 的实际收益接近零（`.venv` 缓存不了）。跨语言的两件事各有更直白的载体——运行用仓库根的 compose（`compose.yml` 定义端口、健康检查与 named volume，`compose.override.yml` 挂源码跑 `--reload`），契约用进 git 的 `openapi.json` 加 CI 的 diff 检查；CI 按栈拆 workflow、用原生 `paths:` 过滤，因此不需要 affected 图工具（Nx 的触发点记在 PLAN.md）。运行与门禁的具体形状写在 PLAN.md 的「检索服务」与「持续集成」两节，本 change 不建这些文件——服务代码还不存在。

## 任务编排

turbo 2.11.5，任务只定义在根，脚本实现留在包内：

| task        | 谁实现                                                     | dependsOn | 缓存           | 产物                |
| ----------- | ---------------------------------------------------------- | --------- | -------------- | ------------------- |
| `build`     | `electron-vite build`（site 后续为 `vite build`）          | `^build`  | 是             | `out/**`、`dist/**` |
| `typecheck` | `tsc --noEmit -p tsconfig.node.json` + `tsconfig.web.json` | 无        | 是             | 无                  |
| `build:mac` | `electron-builder --mac dmg zip`                           | `build`   | 否             | 安装包              |
| `dev`       | `electron-vite dev`                                        | 无        | 否，persistent | 无                  |

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

包内脚本只调用本包工具，不引用相邻包路径；根脚本只做转发，不重复实现构建步骤。根不再提供 `start` 与 `typecheck` 透传（除自身外无人引用，`check` 直接调 `turbo run typecheck`），跑已构建产物用 `pnpm --filter @gouxuan/electron start`。

## 依赖与配置归属

- 静态检查工具链与配置只在根有一份：`eslint.config.mjs` 从 `apps/electron/` 原样上移，规则集合不变（`@electron-toolkit/eslint-config-ts` + react + react-hooks + react-refresh + prettier 关闭冲突规则），配套的 eslint 与插件依赖随之上移。新增子包不需要复制插件与版本。
- `@electron-toolkit/tsconfig`、`utils` 仍留在客户端包，被包内代码与 tsconfig 直接继承。`@electron-toolkit/preload` 在 4.12 清除全量 `ipcRenderer` 暴露后已无代码引用，但退掉它要改 lockfile，留到 Preload 类型化契约落地时一起处理。
- `typescript` 在根与客户端包都声明同一个 `^5.9.3` range：根需要它满足 eslint ts 预设的 peer，包需要它跑 `tsc --noEmit`。重装后要确认 pnpm 解析成同一版本。
- Astryx 三件套（`@astryxdesign/core`、`@astryxdesign/theme-neutral`、peer `@stylexjs/stylex`）在客户端包内声明，走预构建 CSS 而非 `@astryxdesign/build` 的 vite 插件：后者 peer 要 vite 8，本仓库被 electron-vite 5 钉在 vite 7。core 的 postinstall 只打印一句提示，`pnpm-workspace.yaml` 的 `allowBuilds` 因此显式写 `false`。
- Python 侧的格式化只有 ruff 一个负责人：prettier 不认 `.py`/`.toml`/`uv.lock`（实测报 No parser），`openapi.json` 是 JSON 会被收，故进 `.prettierignore`；`[tool.ruff.format] quote-style = "single"` 让 Python 与 JS 共用同一套引号习惯。
- 应用运行时依赖（react、electron、vite、未来的 Astryx/SQLite）全部在包内声明，不依赖根安装顺带提供。模板带的 `electron-builder install-app-deps` postinstall 已删：4.10 的 asar 审计里没有任何原生模块，这条是 no-op。
- `tsconfig` 留在包内：main/preload 与 renderer 分属 node 与 dom 两套 lib 和 globals，客户端包的三件套是 electron-vite 的约定；收到根上只会变成根 project 引用再绕回包内。
- prettier 配置沿用仓库根已有的 `.prettierrc`（`semi: false`、`singleQuote: true`、`tabWidth: 2`、`trailingComma: "es5"`、`arrowParens: "avoid"`）。实测第一次 `pnpm format` 按它重写了 20 个文件：给对象与数组补尾逗号、把 `(details) =>` 收成 `details =>`。模板源码 0 条带分号语句、最长行 80，与 `semi: false` 一致。
- Playwright 配置跟随 e2e 用例放在客户端包内；现在没有用例，所以没有配置文件。
- `pnpm-workspace.yaml` 的 `allowBuilds` 要覆盖每一个带构建脚本的依赖：`electron`（下载二进制）与 `esbuild` 批准，`electron-winstaller` 显式 `false`。没有表态过的包会让 `pnpm install` 报 `ERR_PNPM_IGNORED_BUILDS` 并往文件里写占位提示，连带 `pnpm build`/`check` 的依赖状态检查一起失败——省略不等于 false。
- `.npmrc` 的 `shamefully-hoist=true` 暂时保留：它会让包解析到未声明的依赖，掩盖声明缺失；打包时还让 electron-builder 的依赖遍历把根 devDeps 全列成 `duplicate dependency references` 噪音（实测 `app.asar` 内容并未被污染）。移除需要重装并逐包验证，属于独立一次改动。
- 包管理器约束目前是声明而非强制：根写 `packageManager: pnpm@11.9.0`，但实测 turbo 2.11.5 在 `npm run build` 下不报错、照常命中缓存。原先的 `npx only-allow pnpm` 每次安装要联网取包，删除它等于放弃唯一的硬门禁；要恢复强制只能靠 corepack 或重新引入守卫。

## Decisions

**目录用 `apps/` 而不是 `packages/`**：可部署单元与后端服务对称分层——`apps/*` 放客户端与官网，`services/*` 放检索服务；`packages/` 暗示"库"，而这两个子项目都是应用。改名与 workspace glob、`.prettierignore`、lint 覆盖范围和文档引用在同一次整理里一起改完。

**服务用 Docker 运行、检查留在 host**：容器负责"跑起来"和"可部署"，ruff、pytest 与契约生成在 host 用 uv 跑。每次 build 镜像再跑测试会把本地反馈从秒级拖到分钟级，而镜像可构建性由 CI 单独一步覆盖。

**包名带 scope，产物名不能写 `${name}`**：`@gouxuan/electron` 含斜杠，electron-builder 的 `${name}` 模板会拼出带斜杠的文件路径。`dmg.artifactName` 显式写 `Gouxuan-${version}.${ext}`。

**显示名与产物名分离**：`productName` 用 ASCII 的 `Gouxuan`，中文显示名走 macOS `CFBundleDisplayName: 钩玄`。这样安装包、卷标与签名路径都不含非 ASCII 字符。zip 打包实测 `Info.plist` 三项都对（`CFBundleDisplayName=钩玄`、`CFBundleName=Gouxuan`、`CFBundleIdentifier=com.openchic.gouxuan`），但访达与菜单栏是否真的取 `CFBundleDisplayName` 还要装一次才知道。

**v1 只保留 mac 打包段**：模板的 `win`/`nsis`/`linux`/`appImage` 段全部删除。留着未验证的平台配置比缺配置更贵——它们同样参与 `${name}` 展开与产物命名。

**自动更新残留删除**：`electron-updater` 依赖、`dev-app-update.yml` 与 `electron-builder.yml` 的 `publish` 段（指向 `https://example.com/auto-updates`）删除，PLAN.md 的 v1 明确不含自动更新。

**静态检查入口在根**：ESLint 9 的 flat config 按当前工作目录查找，编辑器和 CI 都以仓库根为工作目录；配置放在包内会让根上跑的那套规则与包内跑的那套不一致，同一份源码出现两种检查结果，且每加一个包就要复制插件与版本。因此把包内那份 `eslint.config.mjs` 原样平移到根——规则集合不变，glob 从配置文件所在目录展开后覆盖 `apps/**`——与根既有的 `.prettierrc` 一起只在根存在，`lint-staged` 因此可以直接跑 `eslint --fix` 而不必跨包指定 config 路径。代价是 `pnpm --filter @gouxuan/electron lint` 不再存在，包专属规则差异要写成根配置里的 `files` 段。

## Risks / Trade-offs

- **打包验了一半，公证没做**：zip 与 DMG 产物、`Info.plist` 标识、asar 内容、hardened runtime 签名（本机 `Apple Development` 证书）与只留 `allow-jit` 的 entitlements 都已实测，签名后的应用能起。未验的是公证与访达/菜单栏显示名（需要装一次真机）。
- **客户端安全只剩三项未收**：模板的 `sandbox: false`、`shell.openExternal`、全量 `ipcRenderer` 暴露与旧标识已在 4.12 清除；剩下 CSP 的 `style-src 'unsafe-inline'` 收紧、main 侧响应头，以及 `build/entitlements.mac.plist` 收窄到只留 `allow-jit` 后是否影响签名公证——三项都要真机验，归 `build-qa-client` 与 `prepare-v1-release`。
- **图标仍是模板 Electron 图标**：`build/icon.icns` 转出 png 确认为 Electron 原子 logo，已随 zip 进包；`build/icon.{ico,png}` 与 `resources/icon.png` 已删（分别服务已删的 windows/linux 段），换图标需要钩玄的图标资产。
- **依赖版本回退**：模板给的是 electron 39、vite 7、react 19.2，与旧实现的 electron 43、vite 8 不同；接入 Astryx 时按新范围验证兼容性，不假设旧版本行为。

## Open Questions

- 官网子包用 Vite React 还是 Astro，是否随本 change 一起建壳。
- `shamefully-hoist` 何时移除、以什么验证结果移除。
- 是否需要恢复 Windows/Linux 打包段。
