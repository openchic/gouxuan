## Why

当前桌面端只有主题骨架，不能登录、问答或管理资料。服务端契约具备后，客户端需要将认证、缓存与流式状态组织成用户可操作的完整闭环。

## What Changes

- 将全部业务 HTTP、SSE 与文件上传集中到 Main，提供统一认证续期、账号隔离和结构化错误。
- 生成并实际消费 OpenAPI 类型，建立类型化 Preload 白名单与公共事件运行时校验。
- 实现 Hash 文件路由、左右布局、登录、会话、设置、来源和管理员知识库页面。
- 实现 SQLite 缓存、连续事件序号、缓存 ID 核对、离线历史、草稿与偏好。
- 支持浅色、深色与跟随系统，默认跟随系统，统一原生和页面外观并恢复偏好。
- 收紧 CSP、IPC sender、导航与 Markdown 资源边界，移除闲置 preload 依赖。

## Capabilities

### New Capabilities

- `desktop-access`: 登录生命周期、请求桥接、安全边界与本地主题偏好。
- `desktop-conversations`: 会话界面、流式状态、引用、缓存和恢复体验。
- `desktop-knowledge`: 管理员资料管理入口与操作体验。

### Modified Capabilities

无。

## Impact

依赖 `add-account-access`、`build-knowledge-base`、`build-rag-service`。涉及客户端 Main、Preload、纯共享契约、Renderer 路由与页面，以及 pnpm 锁文件。按消费者引入 openapi-fetch、openapi-typescript、eventsource-parser、AG-UI 与 TanStack Router；SQLite 使用内建 `node:sqlite`，主题复用 Astryx。图标、公证与正式分发归发布 change，不添加模型自定义或付费入口。
