## Context

客户端当前只有空 Preload、根 Astryx Theme 和安全窗口默认值，尚无认证、路由或缓存。依赖服务端契约完成后实施；目录遵循 PLAN 的 Main / Preload / shared / Renderer，页面私有 hooks、components 和 api.ts 留在所属页面。

## Goals / Non-Goals

**Goals:** 一个 Main 认证与请求入口，明确账号隔离和流式终态，缓存恢复与主题偏好可验证。

**Non-Goals:** Renderer 不直接访问服务、SQL、令牌或文件；不建离线业务写队列、自定义模型配置、支付页面或另一个主题状态源。

## Decisions

### Main 请求与登录代次

`request.ts` 以 openapi-fetch 接 Electron net.fetch，在 ready 后初始化；HTTP、SSE 和上传共用 AuthSession。访问令牌在内存，刷新令牌由 safeStorage 加密单独持久化，不进入 SQLite 或 Renderer。

`auth.ts` 保存账号、登录代次、令牌版本和期限；提前续期与并发 401 共用 single-flight，迟到旧 401 优先使用已有新版本。登录无需认证，刷新禁用递归刷新。认证成功最多重放一次且仅限可重建请求，提交或上传保留原幂等键；网络结果不明不盲重发。403、429 和暂时网络失败不清凭据；确定吊销才结束代次并合并通知。

退出或切换账号中止旧请求和订阅，写入前检查代次；IPC 返回错误码、提示、请求 ID 和可重试状态，不传自定义 Error 对象属性。SSE middleware 不读取流正文，连接与心跳超时由 stream 管理。

### 类型契约与进程边界

`shared/api.generated.ts` 由受版本控制的 OpenAPI 生成并被 Main 实际消费；IPC、事件和错误定义为浏览器兼容的纯类型与校验，不 import Electron、Node 或 Main 模块。

`ipc.ts` 检查 sender 和参数，Preload 只暴露专用业务方法及订阅清理函数，不暴露通用 ipcRenderer。实际消费者接入时移除 `@electron-toolkit/preload`，不引入通用请求代理到 Renderer。

### SSE、reducer 与 SQLite

eventsource-parser 负责分帧，每个 data JSON.parse 后校验公共事件。按 runId 和序号去重，通过类型化 IPC 供 useReducer 管理预览、核验、权威快照和终态。文本结束不等于回答完成；失败和取消预览不能作已确认正文。路由切换只调整界面订阅，不停止 Main 的流与缓存写入。

缓存使用 `node:sqlite`，验证 Electron 内建 Node 兼容性。批量事务保存消息投影、引用、运行及连续已应用序号，终态立即提交；仅已落库序号作为恢复位置。不逐 token 同步写库，测量 Main 阻塞。

先显示缓存后刷新，使用会话修订和消息 / 运行 ID 合并。启动、焦点与联网后分批核对缓存 ID，不将分页缺席当删除；失败保留待刷新缓存，明确不可访问才清理并留下本地删除标记拦截迟到结果。账号缓存隔离，退出清理历史缓存；草稿与界面偏好独立按账号保存。离线只读历史与本地偏好，不排队业务写入。初值 30 天、100 会话、目标 200MB，损坏缓存可重建。

### 路由、页面与管理员入口

TanStack Router 文件路由配 Hash History，路由实例在渲染树外。登录、chat 草稿 / 会话、settings 与管理员 knowledge 共享实际布局；路由 ID 为选中会话依据，beforeLoad 检查账号，loader 只经 Preload 读数据，写操作由用户触发。URL 不携带令牌和正文。

管理员上传经原生文件选择器和专用 Main 方法，Renderer 不接受任意本地路径读取权限。页面轮询任务，离开停止轮询但不停止服务端任务；审核对照解析与定位，评测通过后显式发布或回滚。

### 三态主题与安全样式

设置提供 light / dark / system，默认 system。偏好由 Main 现有本地设置按账号保存，登录页默认跟随系统；通过 nativeTheme.themeSource 同步原生界面，Renderer 的根 Astryx Theme 使用同一 mode，复用已安装 token 和根同步行为，不加主题库。系统变化实时响应，固定模式不变；窗口显示前恢复偏好与背景，避免闪烁，不重建会话或中断运行。

保留 sandbox / contextIsolation / nodeIntegration 默认值；生产只加载本地打包页，限制导航、新窗口和允许的平台服务地址。Markdown 链接、图片及来源访问经白名单与授权，不自动拉任意远程资源。CSP 按实际 Astryx / StyleX 运行需求收紧，生产禁用宽泛 script 规则；样式需动态注入时验证 nonce 等受限方案，不承诺未经验证的一刀切禁用 inline。

## Risks / Trade-offs

- native SQLite 同步操作阻塞 Main → 合并批量写入并测量耗时，避免无数据依据引入额外进程。
- 续期、账号切换和迟到事件竞态 → 代次及令牌版本检查，故障场景验证。
- CSP 与实际样式注入不兼容 → 在打包页面验证组件与弹层，按来源收紧并记录必要规则。

## Migration Plan

按 Main 请求和凭据、类型桥接、缓存及页面顺序接入，每项同步真实 OpenAPI 与公共事件。SQLite 以本地 schema 版本迁移，损坏时只重建历史缓存，不删除独立偏好。保持现有用户目录和安全窗口配置；失败回退保留可恢复历史与加密凭据格式说明。
