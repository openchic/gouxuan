## Why

v1 需要介绍产品、说明咨询范围并提供桌面下载，当前尚无官网应用。静态官网可以独立开发和部署，不依赖问答服务运行。

## What Changes

- 新建独立的静态官网应用，提供产品介绍、能力范围、使用说明、FAQ 与下载入口。
- 复用既定 Astryx 依赖与语义 token，按应用组织构建和开发配置。
- 使用明确的发布下载配置，尚无安装包时不展示虚假可用下载。
- 验证官网与桌面依赖、构建产物相互隔离。

## Capabilities

### New Capabilities

- `product-site`: 可静态部署的产品信息与真实下载行为。

### Modified Capabilities

无。

## Impact

仅依赖已归档的工程骨架，可以与服务 change 并行。涉及 `apps/site`、pnpm 锁文件及必要根构建输出配置，使用 Vite、React 19 与 Astryx；不提取没有复用消费者的 UI 包。服务端登录、在线问答与付费均不进入官网。实际发布地址与托管验收归 `prepare-v1-release`。
