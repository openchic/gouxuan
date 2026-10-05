## Why

当前 API 只检查本地索引文件，没有真实数据库、迁移与私有资料存储。先建立持久化基础，使账号、资料与问答能够在同一事务边界上实现。

## What Changes

- 接入 Postgres / pgvector、统一数据库连接和版本化迁移。
- 接入私有 S3 兼容对象存储，提供应用实际使用的读写与可用性检查。
- 用数据库与迁移就绪检查替换本地索引文件判断，区分基础就绪和后续问答就绪。
- 扩充开发 Compose 与迁移入口；worker 随其真实业务 change 加入。

## Capabilities

### New Capabilities

- `service-foundation`: 持久化、私有存储、迁移和基础就绪行为。

### Modified Capabilities

无。

## Impact

依赖已归档的工程骨架。涉及 `services/api/app/{settings,database,models,objects}.py`、健康接口、迁移、锁文件、镜像和根 Compose。新增 SQLAlchemy 2.x、psycopg 3、Alembic 与对象存储适配依赖，不创建账号、RAG 或空 worker。验收为全新数据库迁移和存储读写，以及缺失依赖时可识别的失败。
