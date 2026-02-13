import type { AIProvider, ChangedFile, ReviewComment } from "./types";

const SYSTEM_PROMPT = `You are an expert code reviewer. Review the following code diff and identify issues.

For each issue found, respond with a JSON array of objects:
[
  {
    "line": <line_number_in_the_new_file>,
    "comment": "<concise description of the issue and suggested fix>"
  }
]

Focus on:
- Bugs and logic errors
- Security vulnerabilities
- Performance issues
- Missing error handling
- Type safety issues

Do NOT comment on:
- Style/formatting (leave that to linters)
- Minor naming preferences
- Import ordering

If the code looks good, respond with an empty array: []

IMPORTANT: Only respond with valid JSON. No markdown, no explanation outside the JSON.`;

function buildFilePrompt(file: ChangedFile, customPrompt: string): string {
  let prompt = `File: ${file.filename}\nStatus: ${file.status}\n\nDiff:\n\`\`\`\n${file.patch}\n\`\`\``;
  if (customPrompt) {
    prompt += `\n\nAdditional instructions: ${customPrompt}`;
  }
  return prompt;
}

function parseResponse(response: string, filename: string): ReviewComment[] {
  try {
    const cleaned = response
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleaned) as { line: number; comment: string }[];

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item) =>
          typeof item.line === "number" && typeof item.comment === "string",
      )
      .map((item) => ({
        path: filename,
        line: item.line,
        body: `🤖 **AI Review**\n\n${item.comment}`,
        side: "RIGHT" as const,
      }));
  } catch {
    return [];
  }
}

export async function reviewFiles(
  files: ChangedFile[],
  provider: AIProvider,
  model: string,
  customPrompt: string,
): Promise<ReviewComment[]> {
  const allComments: ReviewComment[] = [];

  for (const file of files) {
    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      { role: "user" as const, content: buildFilePrompt(file, customPrompt) },
    ];

    const response = await provider.chat(messages, model);
    const comments = parseResponse(response, file.filename);
    allComments.push(...comments);
  }

  return allComments;
}
