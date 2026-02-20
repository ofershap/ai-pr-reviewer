# AI PR Reviewer — GitHub Action for Automated Code Review

[![CI](https://github.com/ofershap/ai-pr-reviewer/actions/workflows/ci.yml/badge.svg)](https://github.com/ofershap/ai-pr-reviewer/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/ofershap/ai-pr-reviewer)](https://github.com/ofershap/ai-pr-reviewer/blob/main/LICENSE)

A GitHub Action that reviews pull requests with AI. Posts inline comments on bugs, security issues, and code smells. Supports OpenAI (GPT-4o) and Anthropic (Claude).

![AI PR reviewer demo — inline code review comments on a GitHub pull request](assets/demo.gif)

## Quick Start

```yaml
name: AI Review
on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: ofershap/ai-pr-reviewer@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

## Using Claude

```yaml
- uses: ofershap/ai-pr-reviewer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    model: claude-sonnet-4-20250514
```

## Inputs

| Input               | Required | Default               | Description                           |
| ------------------- | -------- | --------------------- | ------------------------------------- |
| `github-token`      | Yes      | `${{ github.token }}` | GitHub token for posting reviews      |
| `openai-api-key`    | No\*     | —                     | OpenAI API key                        |
| `anthropic-api-key` | No\*     | —                     | Anthropic API key                     |
| `model`             | No       | `gpt-4o`              | Model to use                          |
| `max-files`         | No       | `20`                  | Max files to review per PR            |
| `exclude-patterns`  | No       | `*.lock,...`          | Comma-separated glob patterns to skip |
| `custom-prompt`     | No       | —                     | Additional review instructions        |

\*One of `openai-api-key` or `anthropic-api-key` is required depending on the model.

## What It Reviews

The AI focuses on actionable issues:

- **Bugs** — logic errors, off-by-one, null references
- **Security** — injection, eval, hardcoded secrets
- **Performance** — unnecessary loops, missing memoization
- **Error handling** — uncaught exceptions, missing validation
- **Type safety** — unsafe casts, missing null checks

It intentionally skips style/formatting (that's what linters are for).

## Custom Instructions

```yaml
- uses: ofershap/ai-pr-reviewer@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    custom-prompt: "Focus on React performance. Flag missing useMemo/useCallback."
```

## Other Projects

- [ts-result](https://github.com/ofershap/ts-result) — Rust-style Result<T, E> for TypeScript
- [spotlight-card](https://github.com/ofershap/spotlight-card) — Animated spotlight card for React
- [ai-commit-msg](https://github.com/ofershap/ai-commit-msg) — AI-powered git commit messages

## Author

[![Made by ofershap](https://gitshow.dev/api/card/ofershap)](https://gitshow.dev/ofershap)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/ofershap)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat&logo=github&logoColor=white)](https://github.com/ofershap)

## License

MIT
