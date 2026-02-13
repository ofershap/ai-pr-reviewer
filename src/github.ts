import type { ReviewComment } from "./types";

export async function postReview(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  octokit: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any,
  prNumber: number,
  comments: ReviewComment[],
  event: "APPROVE" | "COMMENT" | "REQUEST_CHANGES",
): Promise<void> {
  const body =
    comments.length === 0
      ? "✅ AI Review: No issues found. LGTM!"
      : `🔍 AI Review: Found ${comments.length} issue(s) to address.`;

  await octokit.rest.pulls.createReview({
    ...context.repo,
    pull_number: prNumber,
    body,
    event,
    comments: comments.map((c) => ({
      path: c.path,
      line: c.line,
      side: c.side,
      body: c.body,
    })),
  });
}
