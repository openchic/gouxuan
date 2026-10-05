## Why

管理员需要将授权资料转换为经过审核、可检索的版本，当前没有摄取流水线。先完成上传至冻结候选的闭环，再由问答 change 复用候选进行发布评测，避免相互依赖。

## What Changes

- 提供管理员资料列表、上传、解析预览、任务状态、审核与失败阶段重试接口。
- 支持文本 PDF 与 UTF-8 Markdown，执行格式、内容、内存和耗时限制。
- 增加独立持久资料队列与 worker，阶段租约、幂等重试和迟到结果隔离。
- 构建条款分块、中文词法与向量索引，以及不可变的完整候选 manifest。
- 建立实际 embedding 调用所需的模型网关及按调用计量；后续问答复用该边界。

## Capabilities

### New Capabilities

- `knowledge-ingestion`: 管理员上传、审核、处理任务、索引及冻结候选。
- `model-metering`: 真实模型调用的关联、幂等计量与隐私约束。

### Modified Capabilities

无。

## Impact

依赖 `build-service-foundation` 和 `add-account-access`。涉及 `app/ingest.py`、`app/worker.py`、`app/model_gateway.py`、知识库路由、迁移及资料 worker 的开发编排。按实际调用引入 pypdf、jieba、embedding 适配组件。本 change 不提供公开发布与回滚，评测门禁由 `build-rag-service` 完成；不增加 OCR、自动抓取或管理平台。
