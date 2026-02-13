import type { ChangedFile } from "./types";

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".mp4",
  ".webm",
  ".zip",
  ".tar",
  ".gz",
  ".pdf",
]);

interface FileOptions {
  maxFiles: number;
  excludePatterns: string[];
}

function matchesPattern(filename: string, pattern: string): boolean {
  const regex = new RegExp(
    "^" +
      pattern
        .replace(/\./g, "\\.")
        .replace(/\*\*/g, "{{GLOBSTAR}}")
        .replace(/\*/g, "[^/]*")
        .replace(/\{\{GLOBSTAR\}\}/g, ".*") +
      "$",
  );
  return regex.test(filename);
}

function isBinary(filename: string): boolean {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getChangedFiles(
  octokit: any,
  context: any,
  prNumber: number,
  options: FileOptions,
): Promise<ChangedFile[]> {
  const { data: files } = await octokit.rest.pulls.listFiles({
    ...context.repo,
    pull_number: prNumber,
    per_page: 100,
  });

  return (files as { filename: string; patch?: string; status: string }[])
    .filter(
      (f) =>
        f.patch &&
        f.status !== "removed" &&
        !isBinary(f.filename) &&
        !options.excludePatterns.some((p) => matchesPattern(f.filename, p)),
    )
    .slice(0, options.maxFiles)
    .map((f) => ({
      filename: f.filename,
      patch: f.patch!,
      status: f.status,
    }));
}
