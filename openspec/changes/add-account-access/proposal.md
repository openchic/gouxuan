## Why

v1 的会话与管理员资料操作需要账号归属和权限边界，当前服务尚无登录能力。建立受控账号生命周期，才能安全接入知识库和问答。

## What Changes

- 提供管理员 CLI 初始化、创建账号和重置密码，固定普通用户及管理员两个角色。
- 提供邮箱密码登录、续期、退出与当前账号接口。
- 使用有期限的不透明令牌，支持刷新轮换、重放检测、账号停用和设备吊销。
- 为后续业务提供服务端身份、角色和资源归属检查，以及稳定错误契约。

## Capabilities

### New Capabilities

- `account-access`: 受控账号管理、登录会话与权限行为。

### Modified Capabilities

无。

## Impact

依赖 `build-service-foundation`。涉及账号与令牌迁移、`app/auth.py`、`app/admin_cli.py`、`app/api/auth.py` 及 OpenAPI。引入 Argon2id 密码哈希；桌面凭据管理归客户端 change。自助注册、邮件验证和付费不在本 change。通过 CLI 与 HTTP 验证完整登录生命周期及越权拒绝。
