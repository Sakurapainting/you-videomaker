# You Videomaker

You Videomaker 是一个不依赖具体模型的项目工作区，用来把模糊需求整理成可审查、可复现的决策包。

模型负责适合语言和推理的工作：理解需求、提取事实、比较方案、说明不确定性、规划下一步。仓库负责把这些工作留下可检查的记录：来源与案例放在一起，陈述引用稳定的来源 ID，确定性的检查器会在生成报告前拒绝无依据的决策。

项目把来源和中间产物写进仓库，让最终产物可以重新生成，并把能自动判断的质量要求做成检查门。本项目不调用模型 API，用户或 Agent 直接编辑 `case.json`，再运行仓库工具即可。

## 快速开始

在仓库根目录执行：

```powershell
npm test
node tools/check.js cases/demo
node tools/render.js cases/demo
Get-Content cases/demo/out/brief.md
```

创建一个新案例：

```powershell
node tools/new.js migration-plan --title "迁移计划" --question "怎样把旧系统迁移到新系统？"
```

然后把来源记录放到 `cases/migration-plan/sources/`，填写 `case.json`，运行检查器并生成报告。检查器会严格检查 ID、来源和引用关系，但不会假装自动判断文章质量；表达是否清楚、建议是否合理，仍需要 GPT 或人工复核。

## 案例目录

```text
cases/<slug>/
  case.json       # 事实、方案、决策、下一步和验收标准
  sources/        # 每个来源一个 Markdown 文件
  out/            # 自动生成的报告和机器可读检查结果
```

字段格式见 [`docs/schema.md`](docs/schema.md)，完整流程见 [`docs/workflow.md`](docs/workflow.md)。当 Agent 被要求处理案例时，入口规则在 [`AGENTS.md`](AGENTS.md)。英文说明见 [`README.en.md`](README.en.md)。

## 核心原则

- **上下文显式化**：来源和约束是文件，不依赖隐藏的聊天记录。
- **陈述分类型**：已证实事实、推断和未决问题分开保存。
- **决策可回溯**：每个建议都要有理由、条件、风险、下一步和验收标准。
- **生成可复现**：相同的 `case.json` 和来源会生成相同的 Markdown 报告。
- **允许不确定**：未解决的问题必须显示出来，不能被悄悄写成确定结论。

## 目录说明

| 路径 | 作用 |
|---|---|
| `src/core.js` | 案例校验和报告渲染核心 |
| `tools/new.js` | 创建新案例骨架 |
| `tools/check.js` | 检查来源、引用、方案和决策完整性 |
| `tools/render.js` | 生成 `out/brief.md` |
| `tests/` | 正常案例和失败输入测试 |
| `cases/demo/` | 可直接运行的示例案例 |
