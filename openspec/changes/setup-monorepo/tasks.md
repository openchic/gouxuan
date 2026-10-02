## 1. 前置

- [x] 1.1 取得 `pnpm install` 授权并安装：turbo 2.11.5、根静态检查工具链、客户端包依赖，Electron 39.8.10 与 `electron-builder install-app-deps` 原生重建完成，`pnpm-lock.yaml` 已按 workspace 结构重建

## 2. workspace 结构

- [x] 2.1 `pnpm-workspace.yaml` 声明 `packages: ['apps/*']`，保留现有 `allowBuilds`、`overrides` 与 `minimumReleaseAgeExclude`
- [x] 2.2 新增根 `turbo.json`：`build`（`^build`，输出 `out/**`、`dist/**`）、`typecheck`、`build:mac`（依赖 `build`、不缓存）、`dev` 与 `start`（persistent、不缓存）
- [x] 2.3 根 `package.json` 改为编排包：`gouxuan` + `packageManager: pnpm@11.9.0`，脚本转发 turbo 并直接执行根 lint 与 prettier，移除 `main`、应用依赖、`postinstall` 与 `npx only-allow pnpm`
- [x] 2.4 `apps/electron/package.json` 改名 `@gouxuan/electron`、`private`、版本对齐 0.1.0，脚本名与 turbo 任务一致并改用 `pnpm`，移除 `electron-updater`、eslint 相关依赖、`prettier` 与包内 `pnpm.onlyBuiltDependencies`
- [x] 2.5 静态检查入口移到根：把 `apps/electron/eslint.config.mjs` 原样平移到根 `eslint.config.mjs`（规则集合不变，glob 覆盖 `apps/**`），配套 eslint 与插件依赖上移，`lint-staged` 跑 `eslint --fix` + `prettier --write`
- [x] 2.6 删除根目录失效配置 `tsconfig.json` 与 `playwright.config.ts`
- [x] 2.7 格式化沿用根已有的 `.prettierrc`，新增 `.prettierignore`（排除 `out`、`dist`、`release`、`pnpm-lock.yaml` 与客户端 `resources`）；`.gitignore` 增加 `.turbo/`、`.eslintcache`、`*.tsbuildinfo`
- [x] 2.8 补回 `react` 与 `react-dom`：在 2.4 剥离 eslint 依赖时把模板 devDependencies 里的这两项一并删掉了，客户端渲染层因此无法构建
- [x] 2.9 清理 `pnpm-workspace.yaml`：`allowBuilds` 删除锁文件零命中的 `@astryxdesign/cli`、`@astryxdesign/core`、`@google/genai`、`better-sqlite3`、`protobufjs`；11 条 `minimumReleaseAgeExclude` 全部删除（`pnpm config get minimumReleaseAge` 为 undefined，删后 `pnpm install` 锁文件零变化）。保留三条：`electron`、`esbuild`，以及 `electron-winstaller: false`——它必须显式表态，缺失时 `pnpm install` 报 `ERR_PNPM_IGNORED_BUILDS` 并往文件里写占位提示，连带让 `pnpm build`/`check` 的依赖状态检查失败。我最初判定它"与省略等价"无效：那次测试跑在依赖已装齐的状态下，install 是 no-op，没触发检查
- [x] 2.10 保留 `overrides: '@electron/get': 5.1.0`：移除它会让解析退回 `@electron/get` 2.0.0 与 3.0.0，锁文件多出 359 行旧传递依赖
- [x] 2.11 删除无引用命令：根 `start` 与 `typecheck` 透传、turbo `start` 任务、包内 `build:unpack`；包内 `start`（`electron-vite preview`）保留，经 `pnpm --filter @gouxuan/electron start` 调用
- [x] 2.12 目录 `packages/` 改名 `apps/`：workspace glob、`.prettierignore`、README/PLAN/change 文档引用同步；`pnpm install` 后 lockfile importer 变为 `apps/electron`，`pnpm build` 与 `pnpm check` 通过，二次 build 命中缓存
- [x] 2.13 建 `services/api` 目录骨架：`app/{api,retrieval,embedding,ingest}` 的包标记与 `tests`/`eval`/`data` 的 `.gitkeep`，`data` 内容进 `.gitignore`；不含 `pyproject.toml`、`Dockerfile` 与任何业务代码。该目录没有 `package.json`，因此不是 pnpm workspace 成员（`pnpm ls -r` 仍只列两个包，`pnpm check` 退出码 0）
- [x] 2.14 建 `services/api` 的架构配置：`pyproject.toml`（uv virtual project，无 `[build-system]`；fastapi 0.142.2、uvicorn 0.54.0、pydantic 2.13.5、pydantic-settings 2.15.0、httpx 0.28.1、numpy 2.5.3，dev 组 pytest 9.1.1 / ruff 0.16.10 / pyright 1.1.414）、`Dockerfile`（`ghcr.io/astral-sh/uv:0.12.22` 多阶段，依赖层先装）、`.dockerignore`，以及根 `compose.yml` 与 `compose.override.yml`。`docker compose config` 解析与合并通过，`tomllib` 解析 `pyproject.toml` 通过，`pnpm check` 退出码 0
- [x] 2.15 检索服务跑到可验证：`uv lock` 生成 `uv.lock`（解析 30 个包）；`app/main.py`、`app/settings.py`、`app/api/health.py`（`/healthz` 报存活、`/readyz` 报索引就绪）、`app/openapi.py` 与 4 个 pytest 落地。实测 `pnpm check:api` 通过（ruff + 4 passed），`docker compose build` 成功，`up -d` 后容器状态 `healthy`，`/healthz` 返回 200 `{"status":"ok"}`、`/readyz` 返回 503 `index_missing`，`down` 后无残留容器。根脚本加 `dev:api`（`docker compose up api`）与 `check:api`
- [x] 2.16 镜像基座改用 `ghcr.io/astral-sh/uv:python3.13-bookworm-slim`：`python:3.13-slim` 在本机拉不动（`auth.docker.io` 直接 connection refused，daocloud 镜像站在拉 blob 时 EOF），ghcr 可达；`Dockerfile` 留 `BASE` 构建参数便于切回官方镜像
- [ ] 2.17 已知上游告警：`fastapi.testclient` 触发 `StarletteDeprecationWarning: Using httpx with starlette.testclient is deprecated; install httpx2 instead`，来自 starlette 与 httpx 0.28 的组合而非本项目代码；升级 fastapi/starlette 时复查
- [x] 2.18 删掉没有代码对应的占位：`app/{retrieval,embedding,ingest}` 的空包标记、`eval/` 目录、`tests/.gitkeep`，以及 `.dockerignore` 与 pyright 配置里指向 `eval` 的死规则。删后 `pnpm check:api`（ruff + 4 passed）与 `pnpm check` 通过，PLAN 的目录树标注为目标形状
- [x] 2.19 `Dockerfile` 的 `uv sync` 补 `--no-dev`：uv 默认安装 `dependency-groups.dev`，生产镜像里因此带着 pytest/ruff/pyright 六个入口、体积 486MB。加参数后 390MB、dev 入口为 0，容器仍 `healthy`、`/healthz` 返回 200

## 3. 标识

- [x] 3.1 `electron-builder.yml`：`appId: com.openchic.gouxuan`、`productName: Gouxuan`、`mac.extendInfo.CFBundleDisplayName: 钩玄`、`dmg.artifactName: Gouxuan-${version}.${ext}`
- [x] 3.2 删除 `win`/`nsis`/`linux`/`appImage`/`publish` 配置段与 `dev-app-update.yml`，并同步 `files` 排除列表
- [x] 3.3 `README.md` 标题与描述改为钩玄

## 4. 验证

- [x] 4.1 `pnpm ls -r --depth -1` 列出根 `gouxuan@0.1.0` 与 `@gouxuan/electron@0.1.0`
- [x] 4.2 `pnpm build`（electron-vite 三进程产物写入 `apps/electron/out`）与 `pnpm check`（prettier + eslint + typecheck）通过；第二次 `pnpm build` 报 `1 cached, 1 total`
- [x] 4.3 `pnpm lint` 从根单进程覆盖包内文件：首轮就在 `apps/electron/src/main/index.ts` 与两个配置文件上报出 13 条 prettier 规则差异，修完后 0 问题；仓库内只有一份 `eslint.config.mjs`
- [x] 4.4 `pnpm why -r typescript` 只有 `typescript@5.9.3` 一份解析结果，根与客户端包共用
- [x] 4.5 实测 `npm run build` 不被 turbo 拒绝，输出 `FULL TURBO` 并命中缓存：`packageManager` 字段只是声明，不构成包管理器门禁
- [x] 4.6 `openspec validate setup-monorepo --type change --strict --no-interactive` 通过
- [x] 4.7 macOS 打包实测（zip）：产物 `Gouxuan-0.1.0-arm64-mac.zip`（105M，全 ASCII）；`Info.plist` 为 `CFBundleDisplayName=钩玄`、`CFBundleName=Gouxuan`、`CFBundleIdentifier=com.openchic.gouxuan`；无证书时签名按预期跳过（`CSC_IDENTITY_AUTO_DISCOVERY=false`）
- [x] 4.8 首次 `pnpm format` 按根 `.prettierrc` 规范了 20 个文件（模板源码补尾逗号、单参数箭头去括号），根 lint 配置的 react 版本显式写为 `19.2`
- [x] 4.9 删除本次另建的 `.prettierrc.yaml`：prettier 查找顺序里它排在仓库根已有的 `.prettierrc` 之后，从未生效
- [x] 4.10 修掉安装包内容泄漏：首次打包 `app.asar` 里有 `.turbo/turbo-build.log` 与 `turbo-typecheck.log`，加 `'!.turbo/**'` 排除后从 33 个文件降到 30 个，只剩 `out/`、`package.json`、`resources/icon.png` 与 `@electron-toolkit`；根 devDeps（eslint、commitlint、lint-staged）未进包，`shamefully-hoist` 只让 electron-builder 的依赖遍历输出噪音
- [ ] 4.11 DMG 产物与实机显示名未验证：`--mac dmg` 需要 dmg 工具链（当时 `registry.npmmirror.com` DNS 不可达），访达与菜单栏是否取 `CFBundleDisplayName` 要装一次真实应用才知道

## 5. 归属后续 change

- [ ] 5.1 服务落地时一起建：`services/api/Dockerfile` 与 `.dockerignore`、根 `compose.yml` 与 `compose.override.yml`、`.github/workflows/{client,api}.yml`（`paths` 过滤 + `openapi.json` diff 门禁 + `docker build`），并加根脚本 `dev:api` 与 `check:api`
- [ ] 5.2 客户端安全边界与标识落地：`sandbox`、`contextIsolation`、收紧 renderer meta CSP 里的 `style-src 'unsafe-inline'` 并补 main 侧响应头、窗口标题、`setAppUserModelId`、替换模板图标与模板演示组件（`build-qa-client`）
- [ ] 5.3 `shamefully-hoist` 的移除与逐包依赖验证
- [ ] 5.4 若确实需要阻止 npm/yarn 执行根脚本，另行选择 corepack 或安装守卫
