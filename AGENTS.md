# gouxuan 项目协作约定

`PLAN.md` 描述总体目标

## React 前端目录

- 根 CSS 只保留主题、reset 和基础规则；共享样式归实际复用的共享组件，页面不得依赖其他页面加载 CSS。纯状态 Provider 和无独立 DOM 的路由适配组件不创建空样式文件。
- 代码变更使用 `code-style` skill。

## 开发运行与验证

- 只要有代码调整，就应主动启动并保持 `pnpm --dir apps/electron dev` 运行，不限于界面改动。已有可用开发进程时复用，避免重复启动；完成验证和交付后不主动关闭应用，除非用户明确要求停止。
- 优先通过开发模式热更新验证代码和界面；Main、Preload 等变更无法热更新时，重启开发进程后继续保持运行。仅在发布构建、开发模式不可用或需要验证打包产物时再使用 `pnpm --dir apps/electron build` 或 preview，构建检查不能代替开发应用运行与验证。

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

<!-- prettier-ignore-start -->
<!-- ASTRYX:START -->
Astryx v0.6.5 · 166 components
CLI: run every command as `pnpm exec astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — start every page from a template. Never lay out a page from scratch:
1. `astryx build "<idea>"` — START HERE: names the [page] template to start from (always one: the closest match, or the app shell), two other templates, and the [block]s + [component]s for parts it lacks. No args = full playbook.
2. `astryx template <name> <path>` — scaffold that template into your project. Keep its frame, gap and padding; replace its data, copy and sections; delete sections you do not need.
3. `astryx template <Block>` for a part the template lacks; `astryx component <Name>` for props + examples before you use or change a component.
Changing a page you already have? Keep it: skip step 2 and add blocks and components inside its sections.

RULES:
- No <div> — components do all layout/spacing, page frame included.
- Frame first: the template you scaffold sets the page frame. Read `astryx docs layout` before you change it — region widths, breakpoint behavior.
- Dense data = rows (Table, List/Item), never Card-wrapped list items; Card is for standalone widgets. Status = StatusDot/Token; Badge = counts only.
- Custom styling: component props first; else style/className with tokens — var(--color-*|--spacing-*|--radius-*). No raw hex/px. (No StyleX/Tailwind compiler here — don't use xstyle/utility classes.)
- Tokens for every value (`astryx docs tokens`). Brand/accent belongs in the theme (`astryx theme list` / `theme add <slug>`, or `astryx theme template` for a custom one) — never override --color-* in :root.
- SELF-CHECK before you finish: re-read the file and replace any raw <div>/<span> layout, imported .css/@apply, or hardcoded value (#hex, 16px) with the component or a token (var(--color-*|--spacing-*|…)). Confirm the page kept its template's frame, gap and padding. If unsure a component/prop exists, run `astryx component <Name>` / `astryx search "<thing>"`; don't hand-roll CSS.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   166 components by category
  template --list    page + block recipes
  docs <topic>       authoring, browser-support, color, elevation, getting-started, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling-libraries, styling, theme, tokens, typography, working-with-ai
  docs cli           commands, API reference, integration authoring (one level at a time)
  swizzle <Name>     eject component source for deep customization
  upgrade --from <old version> --apply   run after any Astryx or integration dependency bump
<!-- ASTRYX:END -->
<!-- prettier-ignore-end -->
