# Tutorials

Step-by-step guides for common 1bit workflows. Each tutorial builds on the previous one.

---

## Table of Contents

1. [Your First Session](#1-your-first-session)
2. [Review and Refactor Code](#2-review-and-refactor-code)
3. [Build a Feature from Scratch](#3-build-a-feature-from-scratch)
4. [Debug a Failing Test](#4-debug-a-failing-test)
5. [Multi-File Refactor Across a Repo](#5-multi-file-refactor-across-a-repo)
6. [Set Up Project-Wide Instructions](#6-set-up-project-wide-instructions)
7. [Create a Custom Extension Tool](#7-create-a-custom-extension-tool)
8. [Install and Use Skills](#8-install-and-use-skills)
9. [Branching with Sessions and Tree Navigation](#9-branching-with-sessions-and-tree-navigation)
10. [Extend 1bit with a Custom Provider](#10-extend-1bit-with-a-custom-provider)

---

## 1. Your First Session

**Goal:** Install 1bit, authenticate, and make your first code change.

### Step 1: Install

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

The `--ignore-scripts` flag skips dependency lifecycle scripts. 1bit does not require them.

### Step 2: Authenticate

Set an API key before launching:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Or use a subscription provider by starting 1bit and running `/login`.

### Step 3: Start a session

```bash
cd /path/to/your/project
1bit "Summarize this project and tell me how it's structured"
```

1bit reads your project files with the `read` tool and gives you a summary.

### Step 4: Make a change

Try asking for a specific change:

```text
Add a JSDoc comment to the main function in src/index.ts explaining what it does
```

1bit will `read` the file, `edit` it, and show you the diff.

### Step 5: Check your changes

View what happened:

```text
Show me the diff of what you changed
```

Or use git yourself:

```bash
git diff
```

### What you learned

- Install and authenticate
- Start an interactive session
- Ask 1bit to read and edit code
- Review changes

---

## 2. Review and Refactor Code

**Goal:** Use 1bit for code review and make targeted improvements.

### Step 1: Load the file

Start a session and reference files directly:

```bash
1bit @src/parser.ts "Review this file for bugs and style issues"
```

The `@` prefix includes the file content in your prompt.

### Step 2: Get a structured review

```text
Review src/auth.ts for:
1. Error handling gaps
2. Security issues (input validation, auth bypass)
3. Performance problems
4. TypeScript best practices

Be specific — reference line numbers.
```

### Step 3: Apply one fix at a time

```text
Fix the unhandled promise rejection on line 42 — wrap it in a try/catch that returns a 500 response
```

### Step 4: Iterate

```text
Now extract the password validation logic on lines 85-110 into a standalone function with tests
```

### Tips for effective reviews

- Be specific about what you want reviewed (security, style, performance)
- Request line-number references
- Apply fixes one at a time so you can verify each change
- Use `!git diff` between fixes to see what changed

---

## 3. Build a Feature from Scratch

**Goal:** Add a new feature to an existing project using iterative prompting.

### Step 1: Describe the feature

```text
I want to add a CSV export feature to src/reports.ts. It should:
- Accept an array of report objects
- Write a CSV file with headers matching object keys
- Handle special characters (commas, quotes, newlines) in values
- Return the file path
```

### Step 2: Review the implementation

Once 1bit generates code, review it:

```text
Review the exportCSV function for:
- Proper CSV escaping (RFC 4180)
- BOM for Excel compatibility
- Stream for large datasets instead of building one giant string
```

### Step 3: Request improvements

```text
Good points. Implement the streaming version and add a BOM. Also add a header row option.
```

### Step 4: Add tests

```text
Write tests for exportCSV covering:
- Basic export
- Values with commas, quotes, and newlines
- Empty array
- Custom headers
```

### Step 5: Integration

```text
Now wire the CSV export into the /api/reports endpoint. Add a ?format=csv query parameter.
```

### Workflow pattern

Describe → Implement → Review → Iterate → Test → Integrate

---

## 4. Debug a Failing Test

**Goal:** Use 1bit to diagnose and fix test failures.

### Step 1: Share the failure

```text
Run the tests and show me the failure output
```

Or paste the error manually:

```text
This test is failing:

expect(received).toBe(expected)

Expected: 200
Received: 500

The test is in tests/api/users.test.ts
```

### Step 2: Trace the issue

```text
Look at the test and the implementation. Find why POST /api/users returns 500 when given valid input.
```

1bit will read both the test and the implementation, trace the code path, and identify the bug.

### Step 3: Apply the fix

```text
The user ID generation is throwing because crypto.randomUUID() is not available in this Node version. Use crypto.randomUUID() with a fallback.
```

### Step 4: Verify

```text
!npm test -- tests/api/users.test.ts
```

### Advanced debugging pattern

For complex bugs, use `!node --inspect` or debug logging:

```text
Add debug logging to the login handler that prints the request body and each validation step, then run the failing test
```

---

## 5. Multi-File Refactor Across a Repo

**Goal:** Rename, restructure, or migrate patterns across multiple files.

### Step 1: Understand the scope

```text
Find all files that import from './legacy-utils' or import any function from src/legacy-utils.ts
```

### Step 2: Plan the refactor

```text
I want to split src/legacy-utils.ts into:
- src/utils/strings.ts (string manipulation functions)
- src/utils/validation.ts (validation functions)
- src/utils/format.ts (formatting functions)

List which functions go where and which files need import updates.
```

### Step 3: Execute

```text
Create the three new files, move the functions, and update all imports.
```

### Step 4: Verify

```text
!npm run check
!npm test
```

### Step 5: Clean up

```text
Remove src/legacy-utils.ts and update any barrel exports in src/utils/index.ts
```

### Large refactor tips

- Break large refactors into multiple prompts
- Run checks between each step
- Use `--exclude-tools write` for a dry run first
- Keep git checkpoints: `!git commit -m "wip"` between steps

---

## 6. Set Up Project-Wide Instructions

**Goal:** Create AGENTS.md so 1bit follows your project conventions automatically.

### Step 1: Create the file

```text
Create an AGENTS.md in the project root with:
- Build/test commands
- Code style preferences
- Safety rules
```

### Step 2: Let 1bit help write it

Ask 1bit to scan your project and generate instructions:

```text
Scan this project and create an AGENTS.md that captures:
- How to build (check package.json scripts)
- How to test (check package.json scripts and test directory)
- Coding conventions I use (infer from existing code)
- Any safety rules (don't modify generated files, don't touch config)
```

### Step 3: Refine

Review and edit the generated `AGENTS.md`. Add specifics:

```markdown
# Project Instructions

## Commands
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`
- Type check: `npx tsc --noEmit`

## Conventions
- Use `camelCase` for variables and functions
- Use `PascalCase` for classes and types
- Use `type` over `interface` for React props
- Prefer `async/await` over `.then()`
- No `any` types — use `unknown` and narrow

## Safety
- Do not modify `generated/`, `dist/`, or `node_modules/`
- Do not edit `.env` files or secrets
- Do not remove test files
- Do not modify `package-lock.json` manually

## Always
- Run `npm run check` after changes
- Run tests for affected modules
- Keep changes small and reviewable
```

### Step 4: Reload

```text
/reload
```

Now 1bit follows these rules for every session in this project.

---

## 7. Create a Custom Extension Tool

**Goal:** Build a 1bit extension that registers a custom tool callable by the LLM.

### Step 1: Create the extension

Create `~/.1bit/agent/extensions/todo-helper.ts`:

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const TODO_FILE = "todo.json";

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
}

async function loadTodos(cwd: string): Promise<TodoItem[]> {
  try {
    const data = await readFile(join(cwd, TODO_FILE), "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveTodos(cwd: string, todos: TodoItem[]) {
  await writeFile(join(cwd, TODO_FILE), JSON.stringify(todos, null, 2));
}

export default function (1bit: ExtensionAPI) {
  api.registerTool({
    name: "todo",
    label: "Todo List",
    description: "Manage a project todo list — add, list, complete, or remove items.",
    parameters: Type.Object({
      action: Type.Enum(
        { add: "add", list: "list", done: "done", remove: "remove" },
        { description: "Action to perform" },
      ),
      text: Type.Optional(
        Type.String({ description: "Todo text (required for add)" }),
      ),
      id: Type.Optional(
        Type.Number({ description: "Todo ID (required for done/remove)" }),
      ),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const todos = await loadTodos(ctx.cwd);

      switch (params.action) {
        case "add": {
          if (!params.text) {
            return { content: [{ type: "text", text: "Error: text is required for add" }], isError: true, details: {} };
          }
          const id = todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
          todos.push({ id, text: params.text, done: false });
          await saveTodos(ctx.cwd, todos);
          return { content: [{ type: "text", text: `Added todo #${id}: ${params.text}` }], details: {} };
        }
        case "list": {
          if (todos.length === 0) {
            return { content: [{ type: "text", text: "No todos." }], details: {} };
          }
          const lines = todos.map((t) => `[${t.done ? "x" : " "}] #${t.id}: ${t.text}`);
          return { content: [{ type: "text", text: lines.join("\n") }], details: {} };
        }
        case "done": {
          const item = todos.find((t) => t.id === params.id);
          if (!item) return { content: [{ type: "text", text: `Todo #${params.id} not found.` }], isError: true, details: {} };
          item.done = true;
          await saveTodos(ctx.cwd, todos);
          return { content: [{ type: "text", text: `Marked #${params.id} as done.` }], details: {} };
        }
        case "remove": {
          const idx = todos.findIndex((t) => t.id === params.id);
          if (idx === -1) return { content: [{ type: "text", text: `Todo #${params.id} not found.` }], isError: true, details: {} };
          const removed = todos.splice(idx, 1)[0];
          await saveTodos(ctx.cwd, todos);
          return { content: [{ type: "text", text: `Removed #${removed.id}: ${removed.text}` }], details: {} };
        }
        default:
          return { content: [{ type: "text", text: `Unknown action: ${params.action}` }], isError: true, details: {} };
      }
    },
  });
}
```

### Step 2: Load and test

```bash
1bit -e ~/.1bit/agent/extensions/todo-helper.ts
```

Then ask:

```text
Add a todo: "Finish the README"
List my todos
Mark todo #1 as done
```

### Step 3: Make it permanent

Move the file to the auto-discovery location:

```bash
mkdir -p ~/.1bit/agent/extensions
cp todo-helper.ts ~/.1bit/agent/extensions/
```

Now it loads automatically. Use `/reload` in a running session.

### Step 4: Add a command

```typescript
api.registerCommand("todos", {
  description: "Show todo list",
  handler: async (_args, ctx) => {
    const todos = await loadTodos(ctx.cwd);
    if (todos.length === 0) {
      ctx.ui.notify("No todos!", "info");
      return;
    }
    const lines = todos.map((t) => `[${t.done ? "x" : " "}] #${t.id}: ${t.text}`);
    ctx.ui.notify(lines.join("\n"), "info");
  },
});
```

Now `/todos` works as a slash command too.

---

## 8. Install and Use Skills

**Goal:** Add on-demand capabilities using skills.

### Step 1: Install a skill package

```bash
1bit install git:github.com/badlogic/1bit-skills@latest
```

### Step 2: List available skills

After restart or `/reload`:

```text
What skills do you have available?
```

1bit lists them in the startup header and makes them discoverable to the model.

### Step 3: Use a skill

Ask the model to perform a task that matches a skill:

```text
Search the web for "latest TypeScript best practices 2026"
```

If the installed skill package includes a `web-search` skill, the model loads it and follows its instructions.

### Step 4: Force a skill

If the model doesn't automatically load a skill:

```text
/skill:web-search "TypeScript 5.9 release notes"
```

### Step 5: Create your own skill

Create `~/.1bit/agent/skills/lint-fixer/SKILL.md`:

```markdown
---
name: lint-fixer
description: Run the project linter and auto-fix issues. Use when the user reports lint errors or wants code style cleanup.
---

# Lint Fixer

## Usage

1. Run `npm run lint` (or the project's lint command)
2. Examine output for errors
3. Fix each error, starting from the first one
4. Re-run the linter to verify

## Rules

- Respect `.eslintignore` and `.prettierignore`
- Do not disable lint rules unless the user explicitly asks
- Prefer fixing the root cause over adding disable comments
```

Reload with `/reload`. Now the model knows about `lint-fixer` and will use it when you ask about lint errors.

### Sharing skills

Skills can be bundled into [1bit packages](packages.md) and shared via npm or git. See the [1bit Skills repository](https://github.com/badlogic/1bit-skills) for examples.

---

## 9. Branching with Sessions and Tree Navigation

**Goal:** Use session branching to explore multiple approaches without losing work.

### Step 1: Start exploring

```text
I want to refactor the database layer. Give me an approach using Prisma.
```

1bit generates a Prisma-based solution.

### Step 2: Branch with /tree

Before trying a different approach, press **Escape** twice (or run `/tree`) to open the tree view. Select the user message where you asked about the database layer.

Choose "summarize" when asked about the abandoned branch so context is preserved.

### Step 3: Try a different approach

Now the editor contains your original prompt again. Edit it:

```text
I want to refactor the database layer. Give me an approach using Drizzle instead.
```

1bit generates a Drizzle-based solution.

### Step 4: Compare branches

Use `/tree` to navigate between branches. Each branch preserves its full conversation history.

```text
/tree
```

Navigate up to the branch point and down the Prisma branch to compare.

### Step 5: Fork into a new session

When you decide which approach to keep:

```text
/fork
```

This creates a new session file containing just the chosen branch, keeping the original session with all alternatives intact.

### Step 6: Name your sessions

```text
/name DB refactor — Drizzle approach
```

Named sessions are easier to find in `/resume`.

### Visual workflow

```
Session file: sessions/2026-07-09/abc123.jsonl

├─ user: "Refactor DB with Prisma"
│  └─ assistant: Prisma code...  ← Branch A
│
├─ user: "Refactor DB with Drizzle"  ← You jumped here via /tree
│  └─ assistant: Drizzle code...    ← Branch B (active)
│
└─ [Branch summary of Prisma approach]  ← Auto-summary preserved context

/fork → new session with just Branch B
```

---

## 10. Extend 1bit with a Custom Provider

**Goal:** Add a local Ollama model or a custom API endpoint.

### Step 1: Edit models.json

Create or edit `~/.1bit/agent/models.json`:

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "compat": {
        "supportsDeveloperRole": false,
        "supportsReasoningEffort": false
      },
      "models": [
        {
          "id": "llama3.1:8b",
          "name": "Llama 3.1 8B (Local)",
          "reasoning": false,
          "input": ["text"],
          "contextWindow": 128000,
          "maxTokens": 32000,
          "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }
        }
      ]
    }
  }
}
```

### Step 2: Verify

```bash
1bit --list-models ollama
```

If Ollama is running, the model appears.

```bash
1bit --provider ollama --model llama3.1:8b -p "Hello, what model are you?"
```

### Step 3: Add a remote proxy

Route a built-in provider through a proxy:

```json
{
  "providers": {
    "anthropic": {
      "baseUrl": "https://my-proxy.example.com/v1"
    }
  }
}
```

All built-in Anthropic models remain available through the proxy.

### Step 4: Override specific models

Customize cost or capabilities for specific models:

```json
{
  "providers": {
    "openrouter": {
      "modelOverrides": {
        "anthropic/claude-sonnet-4": {
          "name": "Claude Sonnet 4 (Bedrock Route)",
          "compat": {
            "openRouterRouting": {
              "only": ["amazon-bedrock"]
            }
          }
        }
      }
    }
  }
}
```

### Step 5: Dynamic model discovery via extension

For full dynamic model loading, see [Tutorial 7](#7-create-a-custom-extension-tool) and the async factory pattern in [Extensions](extensions.md#async-factory-functions):

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default async function (1bit: ExtensionAPI) {
  const response = await fetch("http://localhost:1234/v1/models");
  const payload = (await response.json()) as {
    data: Array<{ id: string; name?: string }>;
  };

  api.registerProvider("local-openai", {
    baseUrl: "http://localhost:1234/v1",
    apiKey: "$LOCAL_OPENAI_API_KEY",
    api: "openai-completions",
    models: payload.data.map((m) => ({
      id: m.id,
      name: m.name ?? m.id,
      reasoning: false,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 4096,
    })),
  });
}
```

---

## Next Steps

- [Providers](providers.md) — all authentication options
- [Extensions](extensions.md) — full extension API reference
- [Skills](skills.md) — skill creation and management
- [Sessions](sessions.md) — session branching and tree navigation
- [Custom Models](models.md) — model.json reference
- [Debugging Guide](debugging-guide.md) — troubleshooting 1bit itself
