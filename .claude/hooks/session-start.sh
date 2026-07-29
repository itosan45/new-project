#!/bin/bash
set -euo pipefail

# Only relevant for Claude Code on the web / remote sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if ! command -v codex >/dev/null 2>&1; then
  npm install -g @openai/codex >/dev/null 2>&1 || true
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "codex CLI install failed; the codex-plugin-cc plugin will not work this session." >&2
  exit 0
fi

if codex login status >/dev/null 2>&1; then
  exit 0
fi

if [ -n "${OPENAI_API_KEY:-}" ]; then
  if printenv OPENAI_API_KEY | codex login --with-api-key >/dev/null 2>&1; then
    exit 0
  fi
  echo "codex login --with-api-key failed even though OPENAI_API_KEY is set; check the key." >&2
  exit 0
fi

echo "Codex is not authenticated yet. Run 'codex login --device-auth' and finish the code entry from any phone/browser (no PC required), or set OPENAI_API_KEY as an environment variable for fully automatic headless login on future sessions." >&2
