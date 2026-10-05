# product-identity Specification

## Purpose

统一钩玄的仓库、应用与桌面分发标识，将用户可见的中文名称和签名、公证所需的 ASCII 产物路径分开管理，并仅声明已支持的 macOS 分发及手动更新方式，便于后续发布验收。

## Requirements

### Requirement: 标识统一

仓库与客户端 MUST 使用钩玄标识：根包名 `gouxuan`、客户端包名 `@gouxuan/electron`、`appId` `com.openchic.gouxuan`、`productName` `Gouxuan`，包描述与文档标题不再出现旧产品名。

#### Scenario: 打包标识

- **WHEN** 读取 `apps/electron/electron-builder.yml`
- **THEN** `appId` 与 `productName` 为钩玄取值，不存在模板占位标识

#### Scenario: 文档不残留旧标识

- **WHEN** 在仓库根文档与配置中检索旧产品名
- **THEN** 结果为空

### Requirement: 产物名与显示名分离

安装包与压缩产物文件名 MUST 全部使用 ASCII，中文显示名通过 macOS `CFBundleDisplayName` 承载；`artifactName` 不得使用 `${name}` 模板，因为带 scope 的包名含斜杠会拼出非法文件路径。

#### Scenario: 生成 macOS 产物

- **WHEN** 执行 `pnpm package:mac`
- **THEN** DMG 文件名为 `Gouxuan-<version>.dmg`，ZIP 文件名以 `Gouxuan-<version>` 开头且允许包含架构与平台后缀，两者均不含斜杠与非 ASCII 字符

#### Scenario: 桌面显示名

- **WHEN** 打包后的应用出现在访达与菜单栏
- **THEN** 显示名为钩玄；若 `CFBundleDisplayName` 未生效，调整为 ASCII 显示名加 macOS 本地化字符串，产物名保持不变

### Requirement: 只声明已验证的能力

客户端 MUST 只保留当前确实支持的打包平台与更新方式；v1 不声明 Windows/Linux 产物，也不启用自动更新通道。

#### Scenario: 平台配置范围

- **WHEN** 检查 `electron-builder.yml`
- **THEN** 不存在未支持的 `win`、`nsis`、`linux`、`appImage` 配置段

#### Scenario: 无更新通道

- **WHEN** 检索自动更新相关依赖与配置
- **THEN** 没有 `electron-updater` 依赖、`dev-app-update.yml` 与 `publish` 配置段
