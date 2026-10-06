## Why

当前桌面端只有主题骨架，不能登录、问答或管理资料。先完成可运行的界面和本地交互，服务端契约具备后再接入认证、缓存与流式状态。

## What Changes

- 先交付界面预览阶段，使用明确标记的示例会话与资料验证路由、来源、表单和主题；未接入的业务操作不模拟成功。
- 将全部业务 HTTP、SSE 与文件上传集中到 Main，提供统一认证续期、账号隔离和结构化错误。
- 生成并实际消费 OpenAPI 类型，建立类型化 Preload 白名单与公共事件运行时校验。
- 实现 Hash 文件路由、左右布局、登录、会话、设置、来源和管理员知识库页面；设置使用独立的左侧菜单和右侧页面，菜单间距与会话列表一致，左侧顶部仅保留返回问答入口，不展示设置标题。
- 精简欢迎页问题推荐、知识库状态筛选与页面说明，问答侧栏直接从新建会话与搜索开始，移除侧栏品牌区、全局顶部栏、对话区标题栏、装饰性外观预览和重复提示，保留示例数据标识及真实错误反馈；保留原生窗口按钮与拖动区域，macOS 侧栏避让窗口按钮。
- 问答输入区复用 Astryx 官网示例的 `ChatLayout` 停靠结构和 `ChatComposer` 默认层次，仅保留必要的未接入状态提示，不在输入框内显示知识库依据提示，不再使用自定义实心底栏、扁平边框和三行固定输入区。
- 问答侧栏底部使用紧凑单行入口，左侧登录、右侧齿轮设置按钮，左右内容与会话列表对齐；设置按钮仅显示图标并保留可访问名称及提示。
- React 页面与组件按主组件名组织目录，界面组件使用 `index.tsx` 与同目录 `index.css` 并直接引入样式；拆分布局、上传弹层和错误页样式，复用样式由共享组件持有。
- 修正知识库表格操作列过窄导致“查看”文字截断的问题，保留按钮完整文字与点击区域。
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

完整业务闭环依赖 `add-account-access`、`build-knowledge-base`、`build-rag-service`，界面预览可先行。涉及客户端 Main、Preload、纯共享契约、Renderer 路由与页面，以及 pnpm 锁文件。按消费者引入 openapi-fetch、openapi-typescript、eventsource-parser、AG-UI 与 TanStack Router；SQLite 使用内建 `node:sqlite`，主题复用 Astryx。图标、公证与正式分发归发布 change，不添加模型自定义或付费入口。
