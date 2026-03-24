# Project-Journal
Reduce AI - Human communication gap by empowering memory mechanism and by introducing "Intelligent Distance" concept
# Project Journal — AI Session Memory

**Give your AI a memory that survives every session.**

<!-- AGENT-QUICK-REF
name: project-journal
type: skill for Claude Code / OpenClaw / any markdown-aware coding agent
what: two-layer session memory — Layer 1 auto-captures Q&A per turn, Layer 2 generates 9-section daily journal on save
install: cp SKILL.md ~/.claude/skills/project-journal/SKILL.md
trigger: say "save" or "保存" to generate journal
resume: say "read the latest journal" to continue from last session
files_created: journal/YYYY-MM-DD.md (daily report), journal/YYYY-MM-DD-log.md (raw log), journal/index.md (master index)
config_file: SKILL.md (contains all agent instructions)
token_cost: ~50-100 tokens per Layer 1 entry, ~800 tokens per Layer 2 journal
language: bilingual (English + Chinese), follows user language
design_principle: Intelligent Distance — one file optimized for both human scanning and agent parsing
language_sections: "#english", "#中文"
-->

[English](#english) · [中文](#中文)

---

## English

### What is this?

Project Journal is a skill for AI coding agents (Claude Code, OpenClaw, and others) that solves one of the biggest frustrations in AI-assisted development:

> **Every new session, the AI forgets everything.**

With Project Journal, your agent automatically captures what was discussed, what was built, what decisions were made, and what needs to happen next — in a structured file that any agent can read cold and immediately continue from.

It works in two layers:

**Layer 1 — Quick Capture (lightweight, per-turn)**
After each meaningful exchange, a one-line entry is appended to a raw log:
```
[14:32] Q: How do I connect Stripe to Next.js?
[14:32] A: Use @stripe/stripe-js + server-side webhook handler. Decision: use Stripe Checkout, not custom flow.
```

**Layer 2 — Daily Journal (comprehensive, end-of-session)**
When you're done for the day, the agent synthesizes the raw log into a full structured report with 9 sections: Q&A highlights, completed work, project state, known issues, next-session todo, decision record, reflection, file/command quick-reference, and agent observations (things the AI noticed that you might have missed).

### Why use it?

- **No more "where were we?"** — Start every session by saying "read the latest journal" and the agent picks up exactly where you left off
- **Decisions don't disappear** — Every decision is logged with *why* it was made, not just *what* was decided
- **Honest problem tracking** — Issues are logged by priority so nothing gets buried
- **Agent-to-agent continuity** — The "cold-start brief" at the top of each entry is written specifically for a fresh agent with zero context
- **Works for humans too** — People with ADHD, executive function challenges, or just busy schedules benefit from the same structure
- **Token-efficient by design** — A full daily journal costs ~800 tokens to generate. A cold-start brief is 3 sentences. Your agent spends less time reading history and more time doing real work. (Compare: re-explaining a project from scratch typically costs 2,000–5,000 tokens.)

### When should I use this?

**You'll get the most value if any of these sound familiar:**

**🔨 You're building something across multiple sessions**
Working on a side project, MVP, or internal tool over days or weeks. Every session, you re-explain the stack, the decisions, the current blockers. With Project Journal, you say "read the latest journal" — the agent picks up in seconds.

**🧠 You care about *why* decisions were made, not just *what* was built**
Your future self (or a new team member's agent) will ask: "why did we choose X over Y?" The journal records every decision with its reasoning, permanently.

**👥 Multiple people on your team use AI**
Team members run separate AI sessions. Journal files can be committed to git — anyone (or any agent) can load a colleague's journal and understand their progress without a sync meeting.

**🤖 You use multiple AI tools or agents**
Claude for development, another tool for design review. The journal is a neutral "project briefing" any agent can load and immediately understand — no re-explaining required.

**🎯 You want your AI to understand what you *actually* need, not just what you said**
This is the deeper value. Project Journal installs more than a memory system — it installs a cognitive framework. The **Agent Observations** section (Section 9) trains your agent to notice things from its unique perception mode that you might miss: silent errors, stale assumptions, patterns in what you keep revisiting. Over sessions, your agent gets better at bridging the gap between what you say and what you actually need.

**💡 You're not a developer, but you use AI for ongoing complex work**
Research, writing, planning, content production — any multi-session AI-assisted work benefits from session continuity. The trigger words ("save", "checkpoint", "保存") work regardless of what you're building.

**You probably don't need this if:**
- Your AI sessions are mostly short, one-off Q&A (no continuity needed)
- You're using AI for isolated tasks with no follow-up

---

### Design philosophy

This skill is built on two insights:

**1. The most expensive thing in AI-assisted development is not tokens — it's context reconstruction.**

Every time you restart a session and spend 10 minutes explaining the project again, you're paying a far higher cost than a few hundred tokens for a journal entry.

**2. The gap between human and AI intelligence is permanent — and that's the point.**

We call this the **Intelligent Distance (智能距离)** principle. It is the defining design concept behind this skill, and what sets it apart from every other memory or journaling tool.

The gap is not a technology problem to be solved. It is structural:

- **Humans are born** — intelligence grounded in embodied experience, survival, emotion, and social belonging. When you say "I want something beautiful," there is a real felt history behind that word.
- **AI is trained** — intelligence grounded in statistical patterns over data. When an agent processes "beautiful," it is referencing co-occurrence distributions, not a felt experience.

These two origins produce two fundamentally different cognitive substrates. No interface change — more capable models, robots, sensors — will merge them, because the learning mechanism at origin is different.

**The conventional response to this gap: make AI more human-like.**
**The Intelligent Distance response: accept the gap, and design a protocol that minimizes information loss when translating across it.**

Like a network protocol — not eliminating the difference between systems, but creating a conversion layer that preserves meaning across the boundary.

This produces two distinct cognitive modes an agent should switch between:

| Mode | Triggered when | Agent behavior |
|------|---------------|----------------|
| **Human mode** | Talking with a human | Human intent is a fuzzy feeling expressed in lossy language. Anchor the feeling first. Help translate feeling → concrete spec. Reduce to one achievable step. Verify against felt goal, not stated spec. |
| **Agent mode** | Talking with another agent | Precise state, boundaries, verification criteria. No ambiguity needed. Structured handoffs. |

Project Journal implements Intelligent Distance across two dimensions:
- **Format**: one file simultaneously optimized for human scanning (emoji, headers, visual priority) and agent parsing (fixed anchors, structured data, machine-readable summary)
- **Behavior**: Section 9 (Agent Observations) is where the agent records what it noticed about the gap — the invisible distance between what the human said and what they likely meant

The two-layer system (quick capture + daily synthesis) makes saving effortless — you capture as you go, synthesize when it matters.

### Trigger words

You don't need to remember commands. Just say what feels natural:

| You say | What happens |
|---------|-------------|
| `save` / `save session` | Saves full journal immediately |
| `写日志` / `记录一下` / `保存` | Same, in Chinese |
| `checkpoint` / `log this` | Same |
| `I'm done for today` / `收工` / `今天就这样` | Agent asks: "Save a journal entry?" |
| `continue tomorrow` / `明天继续` | Agent asks: "Save a journal entry?" |
| `we just finished [X]` | Agent asks: "Want to log this milestone?" |
| `don't save` / `skip` / `不用记` | Explicitly skips, no save |

The agent also uses smart judgment:
- Sessions under 5 turns → no automatic suggestion
- Sessions over 30 min with real work done → agent proactively suggests saving
- Major milestone completed → agent asks if you want to checkpoint

### Quick start

```bash
# 1. Install (Claude Code)
mkdir -p ~/.claude/skills/project-journal
cp SKILL.md ~/.claude/skills/project-journal/SKILL.md

# 2. That's it. Start a session and say:
"save session"
# or
"写日志"
```

### File structure created in your project

```
your-project/
└── journal/
    ├── index.md              ← master index of all sessions
    ├── 2026-03-23-log.md     ← raw Q&A log (auto-appended per turn)
    └── 2026-03-23.md         ← daily summary (9 sections, generated on save)
```

### Example output

Here's a real journal entry from an API platform project (your journals will reflect your own project):

```markdown
# 2026-03-23 对话日志

> **冷启动简报**
> Novada is a developer API platform (search/extract/research endpoints) live at novada-web.vercel.app.
> Today started with MVP fully deployed; only blocker was a missing Admin API Key for real search results.
> Today completed the /api/research endpoint + Playground upgrade; next step: get Admin API Key to validate real search.
>
> **动量**: 🟢 加速 — shipped research endpoint from scratch in one session

---

## 二、今日完成的工作

### /api/research endpoint
**文件**: `app/api/research/route.ts`
**做了什么**: Multi-step AI research — Claude decomposes query → parallel search → synthesizes Markdown report with citations
**为什么这样做**: Tavily has a research feature; this is the core differentiator. Used Haiku not Sonnet — research needs 3–5 calls, 10x cost difference.
**已知限制**: Search results still use mock data until Admin key arrives.

---

## 五、下次待做清单

### 🔴 必做 (blocking — can't continue without this)
- [ ] Get Novada Admin/General API Key  ⏱ 出现 1 次

### 🟡 重要 (this week)
- [ ] Test full Research flow with real key (Deep mode + credit deduction)
```

### Resuming a session

Next time you open Claude Code, just say:

> **"Read the latest journal"**

The agent will:
1. Find the most recent journal entry
2. Read the 3-sentence "cold-start brief" at the top
3. Tell you what was done and what's next
4. Ask where you want to start

### Supported agents

| Agent | Support |
|-------|---------|
| **Claude Code** | ✅ Full support (primary platform) |
| **clawhub.ai / OpenClaw** | ✅ Full support (dedicated SKILL.md included) |
| **Any agent with file read/write + markdown instructions** | ⚡ Works with adaptation |
| **Claude.ai (web)** | ⚠️ Partial — no file write; useful for reading/planning only |
| **Cursor / Windsurf / other IDE agents** | ⚡ May work if custom instruction files are supported |

### Installation

**Claude Code (global)**
```bash
mkdir -p ~/.claude/skills/project-journal
cp SKILL.md ~/.claude/skills/project-journal/SKILL.md
```

**Claude Code (project-local)**
```bash
mkdir -p .claude/skills/project-journal
cp SKILL.md .claude/skills/project-journal/SKILL.md
```

**OpenClaw / clawhub.ai**
Search for `project-journal` on clawhub.ai and install with one click.

**Auto-save on session end (optional — requires Claude Code hooks support)**
Add to `~/.claude/settings.json` to auto-trigger a save suggestion when Claude stops:
```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "prompt",
        "prompt": "If this session had meaningful work (10+ turns, files changed), suggest saving a project journal entry."
      }]
    }]
  }
}
```

> **Note:** Hook format may vary by Claude Code version. If the hook does not trigger, check the [Claude Code hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks).

### Limitations & FAQ

**Q: Does this work with all AI agents?**
A: The skill is written for Claude Code. It also works with any agent that supports file read/write and can follow markdown instructions. clawhub.ai users can install it directly.

**Q: What if I forget to save?**
A: The agent suggests saving at natural session end points. If you close the session without saving, the quick-capture log (`-log.md`) is still there — the agent can synthesize the journal from it next time.

**Q: Will the agent interrupt me to suggest saving?**
A: No. The agent suggests saving *once* at a natural session end, and only if you've done real work (10+ turns, files changed). It does not interrupt mid-conversation.

**Q: Can I use this across multiple projects?**
A: Yes. Install globally (`~/.claude/skills/`) and each project gets its own `journal/` folder at its root.

**Q: Multiple sessions in one day?**
A: All sessions on the same day update the same journal file (`journal/YYYY-MM-DD.md`). Content is merged, not overwritten.

**Q: Will the journal folder get huge?**
A: Each daily entry is ~2–4 KB. A year of daily use produces ~1 MB. No automatic cleanup needed for most projects.

**Q: The Layer 1 log isn't being created automatically — why?**
A: Layer 1 capture depends on the agent actively following instructions each turn. In very long sessions, the agent may experience instruction decay (this is a known LLM limitation, not a bug). You can always say "save" to trigger a full Layer 2 journal, which compensates by synthesizing from the complete conversation history.

---

## 中文

### 这是什么？

Project Journal 是一个给 AI 编程 agent（Claude Code、OpenClaw 等）用的 skill，解决 AI 辅助开发中最常见的问题：

> **每次新对话，AI 都会忘记之前做的一切。**

装上这个 skill 之后，你的 agent 会自动记录讨论了什么、做了什么、做了哪些决定、下一步该干什么——保存在一个结构化的文件里，任何 agent 打开就能立刻接着干。

它分两层工作：

**第一层 — 快速记录（轻量级，每轮对话）**
每次有意义的交流结束后，自动追加一行记录：
```
[14:32] Q: 怎么把 Stripe 接入 Next.js？
[14:32] A: 用 @stripe/stripe-js + 服务端 webhook。决策: 用 Stripe Checkout，不自己写支付流程。
```

**第二层 — 每日日志（完整版，会话结束时）**
当你今天做完了，agent 把第一层的原始记录综合成一份完整的 9 节报告：问答要点、完成工作、项目状态、已知问题、下次待办、决策记录、反思、文件命令速查、机器观察（AI 注意到但你可能没留意的事情）。

### 为什么要用？

- **不再问"我们做到哪了"** — 每次开始说"读一下最新的日志"，agent 立刻接上进度
- **决策不会消失** — 每个决定都记了"为什么这样做"，不只是"做了什么"
- **问题不会被掩盖** — 按优先级记录问题，没有任何事情被藏起来
- **Agent 之间的连续性** — 每篇日志顶部的"冷启动简报"专门为零上下文的全新 agent 写的
- **人类也受益** — 有执行力困难、注意力分散、或者只是太忙的人，同样从这个结构中获益
- **Token 极致高效** — 一份完整日志生成成本约 800 token，冷启动简报只有 3 句话。Agent 花更少时间读历史，更多时间干活。（对比：从头解释一个项目通常要 2,000–5,000 token。）

### 什么时候该用这个？

**如果以下场景你有一个听起来熟悉，你会从中获益最大：**

**🔨 你在做跨多个会话的长期项目**
做副业、内部工具或 MVP，前后跨越多天甚至多周。每次开新对话都要重新解释架构、决策、当前卡点。装上这个 skill 之后，说"读一下最新的日志"——agent 几秒内就能接上进度。

**🧠 你关心"为什么这样决策"，不只是"做了什么"**
六个会话之后有人问"当初为什么选 X 不选 Y？"日志永久记录了每个决策的理由。未来的你（和未来的 agent）会感谢现在的你。

**👥 团队里多人在用 AI**
不同成员各自跑 AI 会话。日志文件可以提交到 git——任何人（或任何 agent）加载后立刻理解队友进度，不需要开会同步。

**🤖 你同时用多个 AI 工具**
Claude Code 写代码，另一个工具做审查。日志是一份"中立项目简报"，任何 agent 加载就能理解上下文，不需要重新解释。

**🎯 你想让 AI 更好地理解你真正需要什么，而不只是你说的**
这是更深层的价值。Project Journal 安装的不只是记忆系统——它安装了一套认知框架。**第九节"机器观察"**训练你的 agent 从它独特的感知角度注意到你可能忽略的东西：静默错误、过时假设、你反复回到同一个问题的模式。随着会话积累，agent 越来越擅长弥合"你说的"和"你真正需要的"之间的距离。

**💡 你不是开发者，但在用 AI 做持续性的复杂工作**
研究、写作、规划、内容生产——任何需要多次会话的 AI 辅助工作都受益于会话连续性。触发词（"保存"、"save"、"checkpoint"）不限于编程项目。

**你可能不需要这个，如果：**
- 你的 AI 会话主要是短小自成一体的问答（不需要项目连续性）
- 你在用 AI 做一次性任务，没有后续会话

---

### 设计理念

这个 skill 基于两个洞察：

**1. AI 辅助开发里最贵的东西不是 token——而是重建上下文。**

每次重开对话，花 10 分钟重新解释项目，这个成本远超一两百 token 的日志记录。

**2. 人类与 AI 智能之间的距离是永久性的——这正是重点。**

我们把这个叫做**智能距离 (Intelligent Distance)** 原则。它是这个 skill 的核心设计理念，也是它与所有其他记忆和日志工具最根本的区别。

这个距离不是一个需要被解决的技术问题。它是结构性的：

- **人类是生出来的** — 智能根植于身体感知、生存经验、情感和社会归属。你说"我想要一个好看的网页"，那个"好看"背后有真实的感觉历史在支撑。
- **AI 是训练出来的** — 智能根植于数据上的统计模式。agent 处理"好看"时，引用的是共现分布，不是一个被感受过的经验。

这两种起源产生了两种根本不同的认知基底。无论 AI 能力如何提升、通过什么接口接触世界，这个基底差异不会消失——因为学习机制的起点就不同。

**传统做法：让 AI 更像人类，来缩小这个距离。**
**智能距离的做法：接受这个距离的永久存在，设计一个信息损失最少的转换协议。**

就像网络协议——不消除系统之间的差异，而是创建一个在边界上保留意义的转换层。

这产生了 agent 应该主动切换的两种认知模式：

| 模式 | 触发条件 | Agent 的行为 |
|------|---------|------------|
| **人类模式** | 对话方是人类 | 人类的意图是用有损语言表达的模糊感觉。先锚定感觉，帮助翻译感觉→具体规格，缩小到一个可执行的步骤，用感觉目标而不是字面规格来验收。 |
| **Agent 模式** | 对话方是另一个 agent | 精确的状态、边界、验收标准。无需模糊处理。结构化交接。 |

Project Journal 在两个维度实现智能距离：
- **格式维度**：一份文件同时为人类扫描（emoji、标题、视觉优先级）和 agent 解析（固定锚点、结构化数据、机器可读摘要）优化
- **行为维度**：第九节"机器观察"是 agent 记录那个 gap 的地方——那个人类说的和人类真正意思之间的不可见距离

两层系统（快速记录 + 每日合成）让保存毫不费力——边做边记，只在需要时合成。

### 触发词

不需要记特定命令，说人话就行：

| 你说什么 | 发生什么 |
|----------|----------|
| `保存` / `存一下` / `记录` | 立即保存完整日志 |
| `save` / `save session` / `checkpoint` | 同上，英文版 |
| `今天就这样了` / `收工` / `我要去了` | agent 问："要保存日志吗？" |
| `明天继续` / `continue tomorrow` | agent 问："要保存日志吗？" |
| `我们刚完成了 [X]` | agent 问："要记录这个里程碑吗？" |
| `不用记` / `skip` / `don't save` | 明确跳过，不保存 |

agent 也会自己判断：
- 不足 5 轮对话 → 不主动建议
- 超过 30 分钟且做了实质性工作 → 主动建议保存
- 完成了重要功能 → 询问是否保存检查点

### 快速开始

```bash
# 1. 安装（Claude Code）
mkdir -p ~/.claude/skills/project-journal
cp SKILL.md ~/.claude/skills/project-journal/SKILL.md

# 2. 就这样。开始对话后说：
"保存"
# 或
"save session"
```

### 会在你的项目里生成的文件

```
你的项目/
└── journal/
    ├── index.md              ← 所有会话的总索引
    ├── 2026-03-23-log.md     ← 原始问答记录（每轮自动追加）
    └── 2026-03-23.md         ← 每日完整日志（9节，保存时生成）
```

### 示例输出

以下是一个 API 平台项目的真实日志（你的日志会反映你自己的项目内容）：

```markdown
# 2026-03-23 对话日志

> **冷启动简报**
> Novada 是对标 Tavily 的开发者 API 平台，提供 Search / Extract / Research 三个端点，已上线 novada-web.vercel.app。
> 今天开始时 MVP 已完整上线，唯一阻塞点是 Admin API Key 还没拿到（搜索走 mock 数据）。
> 今天完成了 /api/research 端点 + Playground 升级；下一步最重要的是拿 Admin API Key 让真实搜索跑起来。
>
> **动量**: 🟢 加速 — 一个会话内从零完成 research 端点

---

## 二、今日完成的工作

### /api/research 端点
**文件**: `app/api/research/route.ts`
**做了什么**: 多步 AI 研究——Claude 拆解问题 → 并行搜索 → 综合带引用的 Markdown 报告
**为什么这样做**: Tavily 有 research，这是差异化核心。用 Haiku 不用 Sonnet——需要 3-5 次调用，成本差 10x。
**已知限制**: 搜索仍走 mock 数据，等 Admin key 解除。

---

## 五、下次待做清单

### 🔴 必做（阻塞项）
- [ ] 拿 Novada Admin/General API Key  ⏱ 出现 1 次

### 🟡 重要（本周）
- [ ] 用真实 key 测试完整 Research 流程（Deep 模式 + credits 扣减验证）
```

### 恢复上次进度

下次打开 Claude Code，只需说：

> **"读一下最新的日志"**

agent 会：
1. 找到最近的日志文件
2. 读"冷启动简报"（文件顶部 3 句话）
3. 告诉你做了什么、下一步是什么
4. 问你从哪里开始

### 支持的 AI agent

| Agent | 支持情况 |
|-------|----------|
| **Claude Code** | ✅ 完整支持（主要目标平台） |
| **clawhub.ai / OpenClaw** | ✅ 完整支持（附带专用 SKILL.md） |
| **任何支持文件读写 + Markdown 指令的 agent** | ⚡ 需适配，可用 |
| **Claude.ai（网页版）** | ⚠️ 部分支持——无法写文件，可用于阅读和规划 |
| **Cursor / Windsurf / 其他 IDE AI** | ⚡ 如果支持自定义指令文件，可能可用 |

### 安装方式

**Claude Code（全局安装）**
```bash
mkdir -p ~/.claude/skills/project-journal
cp SKILL.md ~/.claude/skills/project-journal/SKILL.md
```

**Claude Code（项目级安装）**
```bash
mkdir -p .claude/skills/project-journal
cp SKILL.md .claude/skills/project-journal/SKILL.md
```

**OpenClaw / clawhub.ai**
在 clawhub.ai 搜索 `project-journal`，一键安装。

**会话结束时自动保存（可选 — 需要 Claude Code 支持 hooks）**
在 `~/.claude/settings.json` 里添加，让 Claude 停止时自动建议保存：
```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "prompt",
        "prompt": "If this session had meaningful work (10+ turns, files changed), suggest saving a project journal entry."
      }]
    }]
  }
}
```

> **注意：** Hook 格式可能随 Claude Code 版本变化。如果 hook 没有触发，请查阅 [Claude Code hooks 文档](https://docs.anthropic.com/en/docs/claude-code/hooks)。

### 使用限制 & 常见问题

**Q: 这个 skill 支持所有 AI agent 吗？**
A: 主要为 Claude Code 编写。任何支持文件读写、能理解 Markdown 指令的 agent 也可使用。clawhub.ai 用户可直接一键安装。

**Q: 如果忘记保存怎么办？**
A: agent 会在会话自然结束时建议保存。如果直接关闭对话，第一层的快速记录（`-log.md`）还在——下次 agent 可以从这个原始记录合成日志。

**Q: agent 会打断我的工作来提醒保存吗？**
A: 不会。agent 只在会话自然结束时建议一次，而且必须是你真正做了事情（10 轮以上对话、有文件改动）。不会在对话中途打断你。

**Q: 可以跨多个项目使用吗？**
A: 可以。全局安装（`~/.claude/skills/`）后，每个项目在自己的根目录下会有独立的 `journal/` 文件夹。

**Q: 同一天多次 session？**
A: 同一天的所有 session 更新同一个日志文件（`journal/YYYY-MM-DD.md`），内容合并而非覆盖。

**Q: journal 文件夹会越来越大吗？**
A: 每天的日志约 2–4 KB，一年日用量约 1 MB，大多数项目无需清理。

**Q: 第一层日志没有自动创建——为什么？**
A: Layer 1 的追加记录需要 agent 在每轮后主动执行。在超长会话中，agent 可能出现指令衰减（这是 LLM 的已知限制，不是 bug）。这种情况直接说"保存"触发 Layer 2 全量日志，它会从完整对话补偿重建内容。

---

*Made with Claude Code · Distributed via clawhub.ai*
*License: MIT*
