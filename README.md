# 钩玄

基于 RAG 的保险咨询问答系统，帮助不了解保险的人判断该买什么、不必买什么。

产品与架构范围见 [PLAN.md](PLAN.md)，进行中的变更见 [openspec/changes](openspec/changes)。

当前登录三表及后续按需建表的范围见 [DATABASE.md](DATABASE.md)。

## 仓库结构

- `apps/electron`：桌面客户端（`@gouxuan/electron`）
- `apps/site`：产品官网（待建）
- `services/api`：FastAPI 服务，已接入账号认证与 Postgres，Python 工具链，不属于 pnpm workspace

## 命令

根目录只负责编排：

```bash
pnpm install     # 安装全部 workspace 依赖
pnpm dev         # 启动全部子包的开发进程
pnpm dev:api     # 检索服务（docker compose up api）
pnpm build       # turbo 构建全部 JS 子包
pnpm lint        # 根 eslint 配置覆盖 apps/**
pnpm check       # prettier 检查 + eslint + turbo run typecheck
pnpm check:api   # 检索服务：ruff check + ruff format --check + pyright + pytest + openapi 契约 diff
pnpm format      # prettier 写模式（不碰 .py/.toml/uv.lock）
pnpm format:api  # ruff --fix + ruff format
pnpm package:mac # 构建 macOS 安装包
```

检索服务还需要 `uv`（生成锁文件用 `uv lock`）。

单个子包：`pnpm --filter @gouxuan/electron dev`。检索服务：`pnpm dev:api`。

## 服务端登录

首次启动或更新服务端依赖、迁移文件后，先构建并启动服务栈：

```bash
docker compose up --build api
```

启动顺序为 Postgres、一次性 Alembic 迁移、API。当前只创建 `users`、`auth_sessions`、`refresh_tokens` 三张认证业务表，另有 Alembic 的迁移版本表；知识库和问答表随实际开发创建。登录不依赖对象存储、pgvector 或已发布语料。Compose 中的数据库凭据和映射到本机回环地址的端口只供本地开发。

在另一个终端初始化首个管理员，按提示安全输入密码：

```bash
docker compose exec api python -m app.admin_cli init-admin --email admin@example.com
```

创建或重置密码时要求 12 到 1024 个字符。重复初始化保持已有管理员账号和密码不变。其他受控操作包括 `create-user --email <邮箱> --role user`、`reset-password --email <邮箱>`、`deactivate --email <邮箱>` 和 `revoke-session --session-id <会话 UUID>`，均通过 `python -m app.admin_cli` 执行；自动化部署可使用 `--password-stdin`，密码不放入命令参数。

| 接口                    | 用途                                                 |
| ----------------------- | ---------------------------------------------------- |
| `POST /v1/auth/login`   | 提交邮箱、密码和可选的 `device_name`，返回账号与凭据 |
| `POST /v1/auth/refresh` | 提交 `refresh_token`，原子轮换两种凭据               |
| `GET /v1/auth/me`       | 携带 Bearer 访问令牌读取当前账号                     |
| `POST /v1/auth/logout`  | 携带 Bearer 访问令牌撤销当前登录会话                 |

业务 JSON 响应统一为 `{ code, message, data }`。访问令牌有效 15 分钟，成功刷新延长 30 天空闲期限，绝对上限为首次登录起 180 天；`data.refresh_expires_at` 是当前空闲期限与绝对上限中的较早时间。旧刷新令牌重放会撤销对应会话，密码重置和账号停用撤销该账号全部会话。

只验证服务端时，也可使用本机 Python 开发进程：

```bash
docker compose up -d postgres
uv --directory services/api sync --locked
uv --directory services/api run alembic upgrade head
uv --directory services/api run python -m app.admin_cli init-admin --email admin@example.com
uv --directory services/api run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

真实数据库测试为每个用例创建独立临时 schema，并在结束后删除，不清空开发账号表：

```bash
GOUXUAN_TEST_DATABASE_URL=postgresql+psycopg://gouxuan:gouxuan@127.0.0.1:55432/gouxuan pnpm check:api
```

未配置 `GOUXUAN_TEST_DATABASE_URL` 时，Postgres 集成测试明确跳过，健康接口测试仍执行。HTTP 契约提交在 `services/api/openapi.json`，`check:api` 同时检查契约漂移。

客户端当前可独立预览登录、问答、设置和知识库界面，支持本地三态主题。会话与资料使用明确标记的虚构样例，草稿仅在当前窗口内保留；客户端尚未接入服务端登录，问答和知识库服务待实现。

## 许可

- 代码（本仓库全部内容）：AGPL-3.0-only，见 [LICENSE](LICENSE)。分发桌面端或基于本仓库提供服务时，需按 AGPL 提供对应源码。Copyright (C) 2026 openchic。
- 保险语料、索引产物与评测集不在该许可下，也不进本仓库；它们的授权另行处理。
- 依赖许可已扫描：无 GPL 系家族冲突，仅 `lightningcss`、`certifi` 为 MPL-2.0（与 AGPL 兼容）。
