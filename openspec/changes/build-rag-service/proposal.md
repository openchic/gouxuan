## Why

已审核的候选资料需要转换为可追溯的流式回答，并经评测后发布。当前没有会话、运行或问答实现，需要一次打通 API、worker、回答质量与语料发布的服务端闭环。

## What Changes

- 实现权限及版本过滤的混合检索、有界 RAG、结构化正文预览、严格最终核验和自包含引用。
- 实现按预算触发的自动摘要及事实回查、失败降级。
- 实现原子提交、最新一轮重跑、独立问答 worker、取消、失败收尾、公共事件持久化与重连。
- 提供会话列表、历史、缓存 ID 核对、运行状态与来源接口，完成删除及保留策略。
- 内部评测冻结候选，通过配置匹配与人工复核门禁后支持整库发布和回滚。
- 在实际模型调用与运行生命周期记录用量，保留 v2 计费接入边界。

## Capabilities

### New Capabilities

- `rag-answering`: 有依据的回答、引用、结构化预览与历史自动摘要。
- `qa-runs`: 会话与运行的持久生命周期、幂等、取消、恢复和删除。
- `corpus-publication`: 候选评测、配置门禁、整库发布及回滚。

### Modified Capabilities

无。复用已约定的账号、资料与计量能力。

## Impact

依赖前三个服务 change。涉及 `app/{qa,retrieval,execution,worker,model_gateway}.py`、会话及运行路由、知识库发布接口、迁移、公共事件和 `eval/run.py`。使用 LangGraph、按需 LangChain 适配及 JsonOutputParser；不建立持久 checkpoint、自动续跑、支付或评测平台。合成 fixture 验证闭环，真实模型和私有 golden 的上线验收归发布 change。
