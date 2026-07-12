# Debugging Guide

Troubleshoot common issues with 1bit — startup failures, model problems, extension bugs, session corruption, and performance.

---

## Table of Contents

- [Debug Command](#debug-command)
- [Startup Issues](#startup-issues)
- [Authentication & Provider Issues](#authentication--provider-issues)
- [Model & Response Issues](#model--response-issues)
- [Tool Execution Issues](#tool-execution-issues)
- [Extension Issues](#extension-issues)
- [Session & Persistence Issues](#session--persistence-issues)
- [Performance Issues](#performance-issues)
- [Network & Connectivity](#network--connectivity)
- [Configuration Issues](#configuration-issues)
- [Crash & Error Reporting](#crash--error-reporting)

---

## Debug Command

The fastest way to diagnose issues is the built-in `/debug` command:

```text
/debug
```

This writes diagnostic information to `~/.1bit/agent/1bit-debug.log`, including:
- Rendered TUI lines with ANSI codes (for display/layout issues)
- Last messages sent to the LLM (for model response issues)
- System prompt (for context file issues)

Run `/debug` right after you encounter a problem, then inspect the log:

```bash
less ~/.1bit/agent/1bit-debug.log
```

### Environment Variables for Debugging

| Variable | Purpose |
|----------|---------|
| `PI_OFFLINE=1` | Disable all network operations (update checks, telemetry) |
| `PI_SKIP_VERSION_CHECK=1` | Skip the version update check only |
| `PI_TELEMETRY=0` | Disable install/update telemetry |
| `PI_CACHE_RETENTION=long` | Enable extended prompt caching (where supported) |
| `PI_EXPERIMENTAL=1` | Enable experimental features |
| `PI_CODING_AGENT_DIR=/custom/path` | Override config directory |
| `PI_CODING_AGENT_SESSION_DIR=/custom/path` | Override session directory |
| `PI_PACKAGE_DIR=/custom/path` | Override package directory |
| `PI_HARDWARE_CURSOR=1` | Enable hardware cursor for IME support |

Start a clean debugging session:

```bash
PI_OFFLINE=1 PI_SKIP_VERSION_CHECK=1 1bit --verbose
```

The `--verbose` flag forces detailed startup output.

---

## Startup Issues

### 1bit doesn't start or exits immediately

**Symptoms:** Command not found, immediate exit, or "segmentation fault"

**Checklist:**

1. **Node.js version:** 1bit requires Node.js >= 22.19.0
   ```bash
   node --version
   ```

2. **Installation:** Verify the package is installed
   ```bash
   npm ls -g @earendil-works/pi-coding-agent
   ```

3. **Reinstall if corrupted:**
   ```bash
   npm uninstall -g @earendil-works/pi-coding-agent
   npm install -g --ignore-scripts @earendil-works/pi-coding-agent
   ```

4. **Check for permission issues:** Ensure `~/.1bit/agent/` is writable
   ```bash
   ls -la ~/.1bit/agent/
   ```

5. **Run with verbose output:**
   ```bash
   1bit --verbose
   ```

### "Command not found" after install

**Checklist:**

1. Verify npm global bin is in your PATH:
   ```bash
   npm bin -g
   # Should produce something like /home/user/.nvm/versions/node/v22/bin
   echo $PATH | grep "$(npm bin -g)"
   ```

2. Reinstall and check:
   ```bash
   npm install -g --ignore-scripts @earendil-works/pi-coding-agent
   which 1bit
   ```

3. On Windows, ensure npm global modules path is in `%PATH%`:
   ```powershell
   npm bin -g
   # Add the output to your PATH environment variable
   ```

### Slow startup

**Symptoms:** Long delay before the UI appears.

**Checklist:**

1. **Disable update checks:**
   ```bash
   PI_SKIP_VERSION_CHECK=1 1bit
   ```

2. **Disable all network operations:**
   ```bash
   PI_OFFLINE=1 1bit
   ```

3. **Check for large context files:** If `AGENTS.md` or `CLAUDE.md` is very large, startup takes longer

4. **Check extension loading:** Many or slow extensions delay startup. Disable with `--no-extensions`:
   ```bash
   1bit --no-extensions
   ```

5. **Check for network timeout:** If your network is slow or blocked, auth refreshes and update checks can time out. Use `PI_OFFLINE=1`.

6. **Check session directory:** A very large `~/.1bit/agent/sessions/` directory can slow session listing
   ```bash
   du -sh ~/.1bit/agent/sessions/
   ```

### Theme or display issues

**Symptoms:** Garbled text, wrong colors, layout broken.

**Checklist:**

1. **Try a different theme:**
   ```text
   /settings → theme → light
   ```
   Or directly in `~/.1bit/agent/settings.json`:
   ```json
   { "theme": "light" }
   ```

2. **Check terminal compatibility:** 1bit requires a modern terminal with true color (24-bit) support. Test your terminal:
   ```bash
   printf "\x1b[38;2;255;100;0mTRUECOLOR\x1b[0m\n"
   ```

3. **Check terminal size:** Ensure terminal is at least 80x24

4. **Reduce editor padding** if layout is stretched:
   ```json
   { "editorPaddingX": 0 }
   ```

5. **Check for TERM variable issues:**
   ```bash
   echo $TERM
   # Should be xterm-256color, tmux-256color, or similar
   ```

---

## Authentication & Provider Issues

### "No credentials configured" or model not available

**Symptoms:** Model doesn't appear in `/model` or `--list-models`, or you get "No credentials configured".

**Checklist:**

1. **Check which models have credentials:**
   ```bash
   1bit --list-models
   ```
   Only models whose provider has valid credentials appear.

2. **Verify environment variable is set correctly:**
   ```bash
   echo $ANTHROPIC_API_KEY | head -c 10
   # Should show the start of your key
   ```

3. **Verify the variable was exported (not just set):**
   ```bash
   env | grep ANTHROPIC
   ```

4. **Check auth.json:**
   ```bash
   ls -la ~/.1bit/agent/auth.json
   cat ~/.1bit/agent/auth.json | head -c 100
   ```
   File should have `0600` permissions.

5. **Try setting the key via auth.json** if env var isn't being picked up:
   ```bash
   1bit --mode json --list-models
   ```

6. **For local models (Ollama, LM Studio):** The `apiKey` field is a placeholder, but 1bit still requires *some* auth to show models. Either:
   - Set a dummy key in `models.json`
   - Save a key for that provider with `/login`
   - Pass `--api-key` when selecting the model

7. **For Azure OpenAI:** Confirm all three variables are set:
   ```bash
   echo $AZURE_OPENAI_API_KEY
   echo $AZURE_OPENAI_BASE_URL
   echo $AZURE_OPENAI_API_VERSION  # optional
   ```

8. **For Bedrock:** Confirm AWS credentials work:
   ```bash
   aws sts get-caller-identity
   ```

### OAuth / Login failures

**Symptoms:** `/login` fails or browser doesn't open.

**Checklist:**

1. **Check that a browser is available:** 1bit opens the OAuth URL in your default browser. If headless (SSH), use the URL shown in the terminal.

2. **Check for firewall/proxy blocking:** OAuth flows need outbound HTTPS to the provider.

3. **Token expiry:** OAuth tokens auto-refresh when expired. If refresh fails, re-run `/login`.

4. **GitHub Copilot specific:**
   - The "model not supported" error means you need to enable the model in VS Code first: Copilot Chat → model selector → select model → "Enable"
   - For GitHub Enterprise Server, enter your server domain instead of pressing Enter at the github.com prompt

### "Rate limited" or 429 errors

**Symptoms:** Requests are rejected with HTTP 429.

**Checklist:**

1. **Check provider rate limits:** Each provider has different tiers. API key plans typically have lower limits than subscription plans.

2. **Reduce request frequency:** Wait between large prompts.

3. **Use a different transport:** Some providers rate-limit SSE vs WebSocket differently:
   ```json
   { "transport": "websocket" }
   ```

4. **Check for cache busting:** Without prompt caching, repeated similar requests cost more. Use `/compact` to keep context lean.

---

## Model & Response Issues

### Model returns empty or truncated responses

**Symptoms:** Assistant response is empty, cuts off mid-sentence, or returns "I'm sorry, I can't help with that."

**Checklist:**

1. **Check context window usage:**
   ```text
   /session
   ```
   If context is near the limit, compact:
   ```text
   /compact
   ```

2. **Check for content filtering:** Some providers filter certain topics. Try with a different model.

3. **Check max tokens setting:** Increase if output is being cut:
   ```json
   { "thinkingBudgets": { "high": 32768 } }
   ```

4. **Switch models temporarily** to isolate provider-specific issues:
   ```text
   /model
   ```

### Model responds with wrong or low-quality answers

**Symptoms:** Responses are off-topic, too brief, or missing expected analysis.

**Checklist:**

1. **Improve your prompt:** Be specific about what you want and the format.

2. **Check context files:** Your `AGENTS.md` or `CLAUDE.md` may be overriding the system prompt with instructions that change model behavior.

3. **Check for conflicting system prompts:**
   - `--system-prompt` replaces the default prompt entirely
   - `.1bit/SYSTEM.md` replaces the default system prompt
   - Multi-file context files may contain contradictory instructions

4. **Check thinking level:** If you set thinking too low, the model may skip reasoning:
   ```text
   /settings → thinking level → high
   ```

5. **Disable extensions** to isolate if one is interfering:
   ```bash
   1bit --no-extensions
   ```

### Thinking not working

**Symptoms:** Extended thinking/reasoning is enabled but the model doesn't show thinking.

**Checklist:**

1. **Check if the model supports thinking:**
   ```bash
   1bit --list-models | grep claude-sonnet-4
   ```
   Look for `yes` in the `thinking` column.

2. **Check thinking level isn't set to `off`:**
   ```text
   /settings → thinking level
   ```

3. **Cycle thinking with Shift+Tab** to make sure it's active.

4. **For DeepSeek V4:** Only `off`, `high`, and `xhigh` levels work. `minimal`, `low`, and `medium` are disabled. Switch to `high`:
   ```text
   /settings → thinking level → high
   ```

5. **For local models:** Ollama/vLLM may not support extended thinking. Set `"reasoning": true` in `models.json` only if the model supports it.

### Model is too slow

**Symptoms:** Response generation takes much longer than expected.

**Checklist:**

1. **Check the model:** Larger models (Opus, Fable 5, o3) are inherently slower.

2. **Check thinking level:** Extended thinking adds latency. Try `minimal` or `off`:
   ```
   Shift+Tab → cycle down
   ```

3. **Check context size:** Very large contexts slow down every request. Use `/compact`.

4. **Check network latency:** Some providers have far-away servers. Use `--list-models` to check which providers are configured.

5. **Switch to a faster model:**
   ```text
   /model → claude-haiku-4 or gpt-4o-mini or deepseek-v4-flash
   ```

6. **Check transport:** WebSocket may be faster than SSE for some providers:
   ```json
   { "transport": "websocket" }
   ```

### "Model not supported" error

**Checklist:**

1. **For GitHub Copilot:** Enable the model in VS Code: Copilot Chat → model selector → select model → "Enable"

2. **For custom models.json entries:** Verify the model `id` matches exactly what the provider expects.

3. **For OpenRouter:** The model ID must include the OpenRouter prefix (e.g., `openrouter/anthropic/claude-sonnet-4`).

---

## Tool Execution Issues

### File tools not working (read/write/edit)

**Symptoms:** "Permission denied", "File not found", or unexpected errors.

**Checklist:**

1. **Check file paths:** 1bit runs in the current working directory. Use absolute paths or verify relative paths:
   ```text
   What is the current working directory?
   ```

2. **Check permissions:** Ensure 1bit has read/write access to the files.

3. **Check for blocked tools:** An extension may be blocking certain operations:
   ```bash
   1bit --no-extensions
   ```
   If it works without extensions, check `tool_call` event handlers.

4. **Check for excluded tools:**
   ```bash
   1bit --exclude-tools write
   ```

5. **Check for active tool restrictions:**
   ```text
   !1bit --list-tools
   ```

### Shell commands failing

**Symptoms:** `!command` returns errors or empty output.

**Checklist:**

1. **Check the shell command syntax:** Some commands need full paths.

2. **Check for shell-specific config:** If you use `nvm`, `rvm`, or other shell-specific tools, the command may need sourcing:
   ```bash
   source ~/.bashrc && your-command
   ```

3. **Check for timeout:** Long-running commands get a default timeout. Increase if needed:
   ```bash
   !sleep 30  # May time out
   ```

4. **Check if output was truncated:** Very long output is truncated. Use `!!command > /tmp/output.txt` to capture full output.

5. **Check if `!!` (hidden command) is being used** when `!` (visible command) was intended.

6. **Check for extension blocking:** An extension may intercept `user_bash` events:
   ```bash
   1bit --no-extensions
   ```

### Tool call results are wrong or unexpected

**Symptoms:** The model misinterprets tool results, or tools return unexpected data.

**Checklist:**

1. **Check for tool_result modification:** An extension may be modifying results via `tool_result` event handlers.

2. **Check for incomplete data:** Tool results are serialized for the model. Very large outputs may be truncated.

3. **Check the model's tool use:** Some models handle tool input/output differently. Switch models to compare.

### "No tools available" error

**Symptoms:** Model reports it has no tools to use.

**Checklist:**

1. **Check `--no-tools` and `--no-builtin-tools` flags.**
   ```bash
   1bit --no-tools          # Disables ALL tools
   1bit --no-builtin-tools  # Disables built-in tools only
   ```

2. **Check `--tools` allowlist:**
   ```bash
   1bit --tools read,bash   # Only read and bash enabled
   ```

3. **Check if an extension cleared tools:**
   ```bash
   1bit --no-extensions
   ```

---

## Extension Issues

### Extension not loading

**Symptoms:** Extension features don't appear, no errors shown.

**Checklist:**

1. **Check extension location:** Only extensions in auto-discovered locations or explicit CLI paths load.
   - Global: `~/.1bit/agent/extensions/*.ts` or `*/index.ts`
   - Project: `.1bit/extensions/*.ts` or `*/index.ts` (after trust)
   - CLI: `1bit -e ./path/to/extension.ts`

2. **Check for syntax errors:** Validate the TypeScript:
   ```bash
   npx tsc --noEmit --strict ~/.1bit/agent/extensions/my-extension.ts
   ```

3. **Check for import errors:** If the extension imports from packages, ensure dependencies are installed.

4. **Run with verbose:**
   ```bash
   1bit --verbose -e ./my-extension.ts
   ```
   Extension load errors appear in startup output.

5. **Check TypeScript/JIT compatibility:** Extensions use `jiti` for TypeScript execution. Some modern TypeScript features may not work.

### Extension causing crashes

**Symptoms:** 1bit crashes or freezes when an extension is loaded.

**Checklist:**

1. **Isolate the extension:** Load extensions one at a time to find the culprit:
   ```bash
   1bit --no-extensions -e ./suspect-extension.ts
   ```

2. **Check for infinite loops or unhandled promises:** Async extensions that never resolve block startup.

3. **Check for resource leaks:** Extensions that open sockets, file watchers, or timers in the factory function (before `session_start`) can cause issues.

4. **Check memory usage:** Extensions that store large state in closures may cause memory pressure.

5. **Verify extension types match installed version:**
   ```bash
   npm ls @earendil-works/pi-coding-agent
   ```

### Extension events not firing

**Symptoms:** Event handlers don't run.

**Checklist:**

1. **Check event name spelling:** Event names are case-sensitive:
   ```typescript
   // Correct
   api.on("session_start", handler);
   
   // Wrong
   api.on("sessionStart", handler);
   ```

2. **Check that the handler is registered before the event fires.**

3. **Check return values:** Some events require specific return values to work (e.g., `project_trust` needs `{ trusted: "yes" | "no" | "undecided" }`).

4. **Check mode compatibility:** Some UI features don't work in non-interactive modes. Guard with:
   ```typescript
   if (ctx.mode !== "tui") return;
   ```

5. **Check if earlier handlers consume the event:** For `input` events, the first `"handled"` return wins.

---

## Session & Persistence Issues

### Session not saved

**Symptoms:** After quitting, the session is gone.

**Checklist:**

1. **Check `--no-session` flag:** Ephemeral mode doesn't save:
   ```bash
   1bit --no-session
   ```

2. **Check session directory permissions:**
   ```bash
   ls -la ~/.1bit/agent/sessions/
   ```

3. **Check disk space:**
   ```bash
   df -h ~/.1bit/agent/
   ```

4. **Check for session directory override:**
   ```bash
   echo $PI_CODING_AGENT_SESSION_DIR
   ```

### Cannot resume a session

**Symptoms:** `1bit -c` or `/resume` doesn't show expected sessions.

**Checklist:**

1. **Check you're in the same working directory:** Sessions are organized by the `cwd` they were started in.

2. **Check the session directory:**
   ```bash
   ls ~/.1bit/agent/sessions/ | head -20
   ```

3. **Use explicit path:**
   ```bash
   1bit --session /path/to/session.jsonl
   ```

4. **Check for renamed or moved session files:** Session files are referenced by their original path.

### Session file corrupted

**Symptoms:** `/resume` shows sessions but can't open them, or 1bit crashes when loading.

**Checklist:**

1. **Validate the JSONL format:**
   ```bash
   head -1 session.jsonl | python3 -m json.tool
   ```
   The first line should be a valid JSON session header object with `"type": "session"`.

2. **Check for truncated files:** Sessions should end with a complete message entry.

3. **Recover from backup:** Session files are append-only. Even if corrupted at the end, earlier entries should be valid. Remove trailing corrupted lines and the session should load.

4. **Check for encoding issues:** Session files are UTF-8. Binary content in tool results can sometimes cause issues.

5. **File a bug report** if corruption happens without obvious cause (unexpected shutdown, disk full, etc.).

### Compaction not working

**Symptoms:** Context never compacts, or `/compact` does nothing.

**Checklist:**

1. **Check if compaction is enabled:**
   ```json
   // ~/.1bit/agent/settings.json
   { "compaction": { "enabled": true } }
   ```

2. **Check threshold:** Compaction triggers when `contextTokens > contextWindow - reserveTokens`:
   ```json
   { "compaction": { "reserveTokens": 16384, "keepRecentTokens": 20000 } }
   ```
   If your session is short, it may not exceed the threshold.

3. **Force compaction:**
   ```text
   /compact
   ```

4. **Check for extension blocking:** Extensions can cancel compaction via `session_before_compact`:
   ```bash
   1bit --no-extensions
   ```

---

## Performance Issues

### High memory usage

**Symptoms:** 1bit process uses hundreds of MB or GB of RAM.

**Checklist:**

1. **Large context:** Long-running sessions accumulate tokens. Use `/compact` or `/new`.

2. **Large image attachments:** Each image consumes significant memory. Use smaller images or text descriptions.

3. **Large extension state:** Extensions that store large in-memory data structures.

4. **Large tool results:** `read` and `bash` can return very large outputs that stay in context.

5. **Check memory use:**
   ```bash
   ps -o pid,rss,command -p $(pgrep -f "1bit")
   ```

### High CPU usage

**Symptoms:** 1bit uses 100% CPU when idle.

**Checklist:**

1. **Check for extension background work:** Some extensions poll or watch files.
   ```bash
   1bit --no-extensions
   ```

2. **Check for terminal rendering issues:** Some terminals are slow at rendering. Try `--mode json` to eliminate TUI overhead.

3. **Check for infinite loops in user_bash handlers.**

---

## Network & Connectivity

### "Connection refused" or timeout

**Symptoms:** 1bit can't connect to the provider API.

**Checklist:**

1. **Check internet connectivity:**
   ```bash
   curl -s -o /dev/null -w "%{http_code}" https://api.anthropic.com
   ```

2. **Check for proxy:** If behind a corporate proxy, set `HTTP_PROXY` / `HTTPS_PROXY`:
   ```bash
   export HTTPS_PROXY=http://proxy.company.com:8080
   1bit
   ```
   Proxy can also be set per-credential in `auth.json`.

3. **Check DNS resolution:**
   ```bash
   nslookup api.anthropic.com
   ```

4. **Check firewall:** Some networks block AI provider APIs.

5. **For Bedrock:** Verify AWS region and permissions:
   ```bash
   aws bedrock list-foundation-models --region us-east-1
   ```

6. **For Azure OpenAI:** Check the base URL format:
   ```
   https://your-resource.openai.azure.com
   https://your-resource.cognitiveservices.azure.com
   https://your-resource.ai.azure.com
   ```

### Update check hangs or fails

**Symptoms:** Slow startup due to update check timeout.

**Fix:**
```bash
PI_SKIP_VERSION_CHECK=1 1bit
```
Or permanently:
```bash
export PI_SKIP_VERSION_CHECK=1
```

---

## Configuration Issues

### Context files not loading

**Symptoms:** Instructions in `AGENTS.md` aren't being followed.

**Checklist:**

1. **Check file name:** Must be `AGENTS.md` or `CLAUDE.md` (case-sensitive).

2. **Check location:** Files are loaded from cwd and parent directories. Verify:
   ```text
   What context files are loaded?
   ```
   Or check startup header for loaded context files.

3. **Check `--no-context-files` / `-nc` flag:**
   ```bash
   1bit --no-context-files
   ```

4. **Check for SYSTEM.md override:** If `.1bit/SYSTEM.md` or `~/.1bit/agent/SYSTEM.md` exists, it replaces the default system prompt. Context files are *appended* to the system prompt, but a custom SYSTEM.md may omit context file loading.

5. **Reload after changes:**
   ```text
   /reload
   ```

### Settings not applying

**Symptoms:** Changed settings have no effect.

**Checklist:**

1. **Check file location:** Global: `~/.1bit/agent/settings.json`. Project: `.1bit/settings.json`.

2. **Check JSON validity:**
   ```bash
   python3 -m json.tool ~/.1bit/agent/settings.json
   ```

3. **Check project trust:** Project `.1bit/settings.json` only loads after the project is trusted.
   ```text
   /trust
   ```

4. **Reload:**
   ```text
   /reload
   ```

5. **Check for conflicting settings:** Project settings override global settings.

6. **Check field names:** Settings keys are case-sensitive. See [Settings](settings.md) for exact names.

### Keybindings not working

**Symptoms:** Keyboard shortcuts don't do what's documented.

**Checklist:**

1. **Check terminal emulator:** Some terminals intercept certain key combinations before passing to apps. Common conflicts:
   - Ctrl+P: Often "print" in some terminals
   - Alt+Enter: Fullscreen in Windows Terminal
   - Ctrl+W: Close tab in many terminals

2. **Check custom keybindings file:** `~/.1bit/agent/keybindings.json` overrides defaults.

3. **Check for terminal multiplexer (tmux) intercept:**
   - tmux may consume Alt+arrows, Ctrl+arrows, etc.
   - See [tmux setup](tmux.md) for configuration

4. **Show current keybindings:**
   ```text
   /hotkeys
   ```

5. **Verify keybinding format:**
   ```json
   { "keybindings": { "ctrl+g": "external_editor" } }
   ```

---

## Crash & Error Reporting

### 1bit crashes

**Symptoms:** Process terminates unexpectedly.

**Checklist:**

1. **Get the error output:** Run 1bit in the same terminal and capture the crash output:
   ```bash
   1bit 2>&1 | tee /tmp/1bit-crash.log
   ```

2. **Check Node.js version:**
   ```bash
   node --version
   ```

3. **Isolate the cause:**
   ```bash
   1bit --no-extensions --no-skills --no-context-files
   ```

4. **Check for segfaults:**
   ```bash
   dmesg | grep -i "1bit\|node"
   ```

5. **Reproduce with `--verbose`:**
   ```bash
   1bit --verbose
   ```

### Reporting bugs

When filing a bug report, include:

1. **1bit version:**
   ```bash
   1bit -v
   ```

2. **Node.js version:**
   ```bash
   node --version
   ```

3. **OS and terminal:**
   ```bash
   uname -a
   echo $TERM
   ```

4. **Debug log (if applicable):**
   ```bash
   1bit --verbose 2>&1 | tee /tmp/1bit-bug-report.log
   ```

5. **Steps to reproduce** — minimal, reproducible example.

6. **What you expected vs what happened.**

File issues at [github.com/1bit-systems/1bit-agent/issues](https://github.com/1bit-systems/1bit-agent/issues) using the issue templates.

---

## Common Error Messages Reference

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `No credentials configured` | API key not set | Set the env var or use `/login` |
| `Model not supported` | Model not available on this provider | Enable in Copilot settings or verify model ID |
| `429 Too Many Requests` | Rate limited | Wait, reduce frequency, or upgrade plan |
| `401 Unauthorized` | Invalid API key | Check key and regenerate if stale |
| `400 Bad Request` | Invalid request format | Check model ID and parameters |
| `Connection refused` | Provider unreachable | Check network, proxy, firewall |
| `ETIMEDOUT` | Request timed out | Check network, increase timeout, switch transport |
| `ENOSPC` | Disk full | Free disk space in session/config directory |
| `EACCES` | Permission denied | Check file/directory permissions |
| `SyntaxError` in extension | TypeScript error | Validate with `tsc --noEmit` |
| `Cannot find module` | Missing dependency | Run `npm install` in extension directory |
| `Session file not found` | Session path is wrong or deleted | Use `/resume` or check the file path |
| `Context overflow` | Context window exceeded | Run `/compact` or start `/new` |

---

## Quick Diagnostic Commands

```bash
# Version info
1bit -v

# List available models with credentials
1bit --list-models

# List models for a specific provider
1bit --list-models anthropic

# Check install
npm ls -g @earendil-works/pi-coding-agent

# Start with verbose logging
1bit --verbose

# Start offline (skip update checks)
PI_OFFLINE=1 1bit

# Start with minimal config
1bit --no-extensions --no-skills --no-context-files --no-themes

# Run a one-shot test
1bit -p "Say hello"

# Write debug info
# Inside 1bit: /debug
# Then check:
cat ~/.1bit/agent/1bit-debug.log | head -50

# Check config directory
ls -la ~/.1bit/agent/

# Check sessions
ls -la ~/.1bit/agent/sessions/ | tail -10

# Check auth
ls -la ~/.1bit/agent/auth.json
```

---

## Getting Help

- **GitHub Issues:** [github.com/1bit-systems/1bit-agent/issues](https://github.com/1bit-systems/1bit-agent/issues)
- **Discussions:** [github.com/1bit-systems/1bit-agent/discussions](https://github.com/1bit-systems/1bit-agent/discussions)
- **Security issues:** See [SECURITY.md](https://github.com/1bit-systems/1bit-agent/blob/main/SECURITY.md)
- **RFCs:** [rfc.earendil.com](https://rfc.earendil.com/keyword/1bit/)

---

## See Also

- [Development](development.md) — local setup and project structure
- [Security](security.md) — sandboxing and trust boundaries
- [Containerization](containerization.md) — running in containers
- [Settings](settings.md) — configuration reference
