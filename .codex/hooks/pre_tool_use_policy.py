#!/usr/bin/env python3

import json
import re
import sys


DESTRUCTIVE_COMMANDS = [
    (
        re.compile(r"(^|\s)git\s+reset\s+--hard(\s|$)"),
        "Blocked destructive git history reset. Ask the user before discarding local changes.",
    ),
    (
        re.compile(r"(^|\s)git\s+checkout\s+--(\s|$)"),
        "Blocked file checkout revert. Ask the user before discarding local changes.",
    ),
    (
        re.compile(r"(^|\s)git\s+restore(\s+--source=\S+)?\s+--(\s|$)"),
        "Blocked file restore revert. Ask the user before discarding local changes.",
    ),
    (
        re.compile(r"(^|\s)git\s+clean\b.*\s-[^\n]*f"),
        "Blocked git clean. Ask the user before removing untracked files.",
    ),
    (
        re.compile(r"(^|\s)rm\s+-[^\n]*\b[rf][^\n]*\s"),
        "Blocked recursive file removal. Ask the user before removing files.",
    ),
]

SENSITIVE_PATH_RE = re.compile(r"(^|[/'\"`\s])(\.env(\.[^/'\"`\s]+)?|[^/'\"`\s]*credentials[^/'\"`\s]*)($|[/'\"`\s])")
SENSITIVE_WRITE_RE = re.compile(
    r"(^|\s)(rm|mv|cp|install|touch|truncate|tee)\b|(^|\s)sed\s+-i\b|(^|\s)perl\s+-i\b|[>]{1,2}",
)


def deny(reason: str) -> None:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            }
        )
    )


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0

    command = payload.get("tool_input", {}).get("command", "")
    if not command:
        return 0

    for pattern, reason in DESTRUCTIVE_COMMANDS:
        if pattern.search(command):
            deny(reason)
            return 0

    if SENSITIVE_PATH_RE.search(command) and SENSITIVE_WRITE_RE.search(command):
        deny("Blocked direct shell edits to environment or credentials files. Confirm with the user first.")
        return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
