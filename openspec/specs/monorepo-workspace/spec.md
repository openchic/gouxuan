# monorepo-workspace Specification

## Purpose

统一桌面客户端、静态官网与独立 Python 服务的工程边界，使应用能够通过根命令构建和检查，并明确依赖、配置与锁文件归属，避免子项目依赖未声明的提升结果或重复配置。

## Requirements

### Requirement: workspace 成员

仓库 MUST 通过 `pnpm-workspace.yaml` 的 `packages: ['apps/*']` 声明 JS 子包，子包必须持有自己的 `package.json` 才能被 pnpm 与 turbo 管理。

#### Scenario: 客户端包受管

- **WHEN** 在根列出 workspace 包
- **THEN** `@gouxuan/electron` 出现在包列表中，其依赖进入同一份锁文件

#### Scenario: 新增子包不改结构定义

- **WHEN** 在 `apps/` 下新增一个含 `package.json` 的子包
- **THEN** 无需修改 `pnpm-workspace.yaml` 与 `turbo.json`，该包即参与根命令

### Requirement: 任务编排分层

JS 构建、类型检查与打包任务 MUST 在根 `turbo.json` 定义，具体命令实现在各子包自己的脚本中；根 `package.json` 转发 JS 任务与共享检查，并通过独立入口编排 Python 检查及服务启动，不重复实现子包构建步骤。JS 静态检查 MUST 作为单个根任务执行，不拆成 per-package 的 turbo 任务。

#### Scenario: 根命令构建全部子包

- **WHEN** 在根执行 `pnpm build`
- **THEN** turbo 对每个声明了 `build` 的子包执行其脚本，任一失败整体失败并保留各自输出目录

#### Scenario: 静态检查只跑一次

- **WHEN** 在根执行 `pnpm lint`
- **THEN** 单个 ESLint 进程使用根 `eslint.config.mjs` 覆盖全部子包源码，仓库内不存在包级 ESLint 配置

#### Scenario: 单子包开发

- **WHEN** 需要只运行客户端开发进程
- **THEN** 可以使用 `pnpm --filter @gouxuan/electron dev` 绕过 turbo，且不依赖相邻子包存在

#### Scenario: 缓存可复现

- **WHEN** 子包的 `build` 与 `typecheck` 结果被 turbo 缓存
- **THEN** 源码与配置未变化时第二次执行直接命中缓存，`dev` 与 `build:mac` 不写入缓存

### Requirement: 依赖与配置归属

静态检查与格式化工具链及其配置 MUST 只在根声明一份；应用运行时依赖与 `tsconfig` MUST 由使用它的子包自行声明，不依赖根安装或 hoist 结果补足缺失的声明。

#### Scenario: 包不依赖提升生效

- **WHEN** 子包代码使用某个依赖
- **THEN** 该依赖声明在这个包的 `package.json` 中，而不是依赖根安装或 hoist 结果

#### Scenario: 新增子包不复制检查工具

- **WHEN** workspace 内新增一个 JS 子包
- **THEN** 该包不需要声明 eslint 及其插件依赖即可获得根规则检查

#### Scenario: 全仓一种排版

- **WHEN** 在任意子包内执行格式化
- **THEN** 使用根 `.prettierrc`，仓库内不存在第二份 prettier 配置
