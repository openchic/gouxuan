# gouxuan 项目协作约定

`PLAN.md` 描述总体目标

## React 前端目录

- 页面和组件目录与主组件同名，有独立界面的模块使用 `index.tsx` 与同目录 `index.css`，由组件直接引入样式。页面私有组件和 hooks 留在页面模块内，共享组件和 hooks 通过 `index.ts` 统一导出。
- 根 CSS 只保留主题、reset 和基础规则；共享样式归实际复用的共享组件，页面不得依赖其他页面加载 CSS。纯状态 Provider 和无独立 DOM 的路由适配组件不创建空样式文件。

## openspec 规则

- 除非用户明确要求，不要将后续需求混入当前 change。后续改动默认归入当前相关且尚未归档的 change；只有用户明确要求新建 change，或当前 change 无关或已归档时，才创建新的 change。创建新 change 前，先归档其他尚未归档的 change。
- Explore 阶段只用于探索方案和确认需求。用户确认 `proposal` 后，结束 Explore，进入 fast-forward 和 apply 流程，连续生成或更新剩余文档、实现代码并完成必要验证；除非遇到需求歧义、设计冲突或错误，否则不逐项请求确认。
- 实现过程中，代码变更必须同步更新当前 change 的 `proposal`、`spec`、`design` 和 `tasks`，保持方案、约束、实现和进度一致。
- 归档前检查任务完成情况；发现未完成任务时，直接逐项列出任务编号与内容，并等待用户确认后再继续归档。
- 归档前先 review 相关文档，清理过时描述，并同步移除或简化由此产生的冗余代码；然后将 delta spec 同步到主规格并确认结果。
- 完成归档后，提交归档文档及相关代码变更。
- Bug 的 spec 必须记录已确认的用户可见现象、根因和最终处理约束；排查日志、临时诊断代码和失败试改只保留在 design 或归档记录中，不混入长期规格。

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
