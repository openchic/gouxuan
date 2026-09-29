## 1. 前置

- [x] 1.1 取得 `pnpm install` 授权并安装：turbo 2.11.5、根静态检查工具链、客户端包依赖，Electron 39.8.10 与 `electron-builder install-app-deps` 原生重建完成，`pnpm-lock.yaml` 已按 workspace 结构重建

## 2. workspace 结构

- [x] 2.1 `pnpm-workspace.yaml` 声明 `packages: ['packages/*']`，保留现有 `allowBuilds`、`overrides` 与 `minimumReleaseAgeExclude`
- [x] 2.2 新增根 `turbo.json`：`build`（`^build`，输出 `out/**`、`dist/**`）、`typecheck`、`build:mac`（依赖 `build`、不缓存）、`dev` 与 `start`（persistent、不缓存）
- [x] 2.3 根 `package.json` 改为编排包：`gouxuan` + `packageManager: pnpm@11.9.0`，脚本转发 turbo 并直接执行根 lint 与 prettier，移除 `main`、应用依赖、`postinstall` 与 `npx only-allow pnpm`
- [x] 2.4 `packages/electron/package.json` 改名 `@gouxuan/electron`、`private`、版本对齐 0.1.0，脚本名与 turbo 任务一致并改用 `pnpm`，移除 `electron-updater`、eslint 相关依赖、`prettier` 与包内 `pnpm.onlyBuiltDependencies`
- [x] 2.5 静态检查入口移到根：把 `packages/electron/eslint.config.mjs` 原样平移到根 `eslint.config.mjs`（规则集合不变，glob 覆盖 `packages/**`），配套 eslint 与插件依赖上移，`lint-staged` 跑 `eslint --fix` + `prettier --write`
- [x] 2.6 删除根目录失效配置 `tsconfig.json` 与 `playwright.config.ts`
- [x] 2.7 根新增 `.prettierrc.yaml`（`semi: false` + `singleQuote: true`，依据模板源码实测 0 条带分号语句、最长行 80）与 `.prettierignore`；`.gitignore` 增加 `.turbo/`、`.eslintcache`、`*.tsbuildinfo`
- [x] 2.8 补回 `react` 与 `react-dom`：在 2.4 剥离 eslint 依赖时把模板 devDependencies 里的这两项一并删掉了，客户端渲染层因此无法构建
- [ ] 2.9 在客户端依赖重新接入后，核对 `pnpm-workspace.yaml` 的 `allowBuilds` 与 `minimumReleaseAgeExclude`：当前仍列着不被任何包声明的旧条目（`@astryxdesign/*`、`@google/genai`、`better-sqlite3`、`typescript-eslint@8.66.0`），其中一部分会随 `build-qa-client` 回来

## 3. 标识

- [x] 3.1 `electron-builder.yml`：`appId: com.openchic.gouxuan`、`productName: Gouxuan`、`mac.extendInfo.CFBundleDisplayName: 钩玄`、`dmg.artifactName: Gouxuan-${version}.${ext}`
- [x] 3.2 删除 `win`/`nsis`/`linux`/`appImage`/`publish` 配置段与 `dev-app-update.yml`，并同步 `files` 排除列表
- [x] 3.3 `README.md` 标题与描述改为钩玄

## 4. 验证

- [x] 4.1 `pnpm ls -r --depth -1` 列出根 `gouxuan@0.1.0` 与 `@gouxuan/electron@0.1.0`
- [x] 4.2 `pnpm build`（electron-vite 三进程产物写入 `packages/electron/out`）与 `pnpm check`（prettier + eslint + typecheck）通过；第二次 `pnpm build` 报 `1 cached, 1 total`
- [x] 4.3 `pnpm lint` 从根单进程覆盖包内文件：首轮就在 `packages/electron/src/main/index.ts` 与两个配置文件上报出 13 条 prettier 规则差异，修完后 0 问题；仓库内只有一份 `eslint.config.mjs`
- [x] 4.4 `pnpm why -r typescript` 只有 `typescript@5.9.3` 一份解析结果，根与客户端包共用
- [x] 4.5 实测 `npm run build` 不被 turbo 拒绝，输出 `FULL TURBO` 并命中缓存：`packageManager` 字段只是声明，不构成包管理器门禁
- [x] 4.6 `openspec validate setup-monorepo --type change --strict --no-interactive` 通过
- [ ] 4.7 `pnpm package:mac` 产物名为 `Gouxuan-<version>.dmg` 与 `.zip`，访达与菜单栏显示名确认为钩玄
- [ ] 4.8 首次 `pnpm format` 规范了 20 个文件（模板源码补尾逗号、`react` 版本在根 lint 配置显式写 `19.2`）；打包与界面验证后再复查一次

## 5. 归属后续 change

- [ ] 5.1 客户端安全边界与标识落地：`sandbox`、`contextIsolation`、CSP、窗口标题、`setAppUserModelId`、替换模板图标与模板演示组件（`build-qa-client`）
- [ ] 5.2 `shamefully-hoist` 的移除与逐包依赖验证
- [ ] 5.3 若确实需要阻止 npm/yarn 执行根脚本，另行选择 corepack 或安装守卫
