## Why

v1 的会话与管理员资料操作需要账号归属和权限边界，当前服务尚无登录能力。建立受控账号生命周期，才能安全接入知识库和问答。

## What Changes

- 提供管理员 CLI 初始化、创建账号和重置密码，固定普通用户及管理员两个角色。
- 提供邮箱密码登录、续期、退出与当前账号接口。
- 当前只迁移 `users`、`auth_sessions`、`refresh_tokens` 三张认证业务表，后续业务表随对应功能开发创建，设计见 [DATABASE.md](../../../DATABASE.md)。
- 使用有期限的不透明令牌，支持刷新轮换、重放检测、账号停用和设备吊销。
- 访问凭据有效 15 分钟，会话空闲期限通过续期滑动延长 30 天，首次登录起最多保留 180 天。
- 提供服务端身份和角色校验及稳定错误契约；资源归属检查在后续业务查询中实现。

## Capabilities

### New Capabilities

- `account-access`: 受控账号管理、登录会话与权限行为。

### Modified Capabilities

无。

## Impact

依赖 `build-service-foundation` 的 Postgres 连接与迁移能力；登录不依赖对象存储、pgvector 或已发布语料。涉及认证三表迁移、`app/auth.py`、`app/admin_cli.py`、`app/api/auth.py` 及 OpenAPI。引入 Argon2id 密码哈希；桌面凭据管理归客户端 change。自助注册、邮件验证和付费不在本 change。通过 CLI 与 HTTP 验证完整登录生命周期及越权拒绝。
