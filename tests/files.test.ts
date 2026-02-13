import { describe, it, expect, vi } from "vitest";
import { getChangedFiles } from "../src/files";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockOctokit(files: any[]) {
  return {
    rest: {
      pulls: {
        listFiles: vi.fn().mockResolvedValue({ data: files }),
      },
    },
  };
}

const context = { repo: { owner: "test", repo: "test" } };

describe("getChangedFiles", () => {
  it("returns files with patches", async () => {
    const octokit = mockOctokit([
      { filename: "src/index.ts", patch: "@@ +1 @@", status: "modified" },
    ]);
    const files = await getChangedFiles(octokit, context, 1, {
      maxFiles: 20,
      excludePatterns: [],
    });
    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe("src/index.ts");
  });

  it("excludes files without patches", async () => {
    const octokit = mockOctokit([
      { filename: "src/index.ts", patch: null, status: "modified" },
    ]);
    const files = await getChangedFiles(octokit, context, 1, {
      maxFiles: 20,
      excludePatterns: [],
    });
    expect(files).toHaveLength(0);
  });

  it("excludes removed files", async () => {
    const octokit = mockOctokit([
      { filename: "old.ts", patch: "@@ -1 @@", status: "removed" },
    ]);
    const files = await getChangedFiles(octokit, context, 1, {
      maxFiles: 20,
      excludePatterns: [],
    });
    expect(files).toHaveLength(0);
  });

  it("excludes binary files", async () => {
    const octokit = mockOctokit([
      { filename: "image.png", patch: "binary", status: "added" },
    ]);
    const files = await getChangedFiles(octokit, context, 1, {
      maxFiles: 20,
      excludePatterns: [],
    });
    expect(files).toHaveLength(0);
  });

  it("excludes files matching patterns", async () => {
    const octokit = mockOctokit([
      { filename: "yarn.lock", patch: "diff", status: "modified" },
      { filename: "dist/bundle.js", patch: "diff", status: "modified" },
      { filename: "src/app.ts", patch: "diff", status: "modified" },
    ]);
    const files = await getChangedFiles(octokit, context, 1, {
      maxFiles: 20,
      excludePatterns: ["*.lock", "dist/**"],
    });
    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe("src/app.ts");
  });

  it("respects maxFiles limit", async () => {
    const octokit = mockOctokit(
      Array.from({ length: 30 }, (_, i) => ({
        filename: `file${i}.ts`,
        patch: "diff",
        status: "modified",
      })),
    );
    const files = await getChangedFiles(octokit, context, 1, {
      maxFiles: 5,
      excludePatterns: [],
    });
    expect(files).toHaveLength(5);
  });
});
