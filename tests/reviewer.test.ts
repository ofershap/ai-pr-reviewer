import { describe, it, expect, vi } from "vitest";
import { reviewFiles } from "../src/reviewer";
import type { AIProvider, ChangedFile } from "../src/types";

function mockProvider(response: string): AIProvider {
  return {
    name: "mock",
    chat: vi.fn().mockResolvedValue(response),
  };
}

const sampleFile: ChangedFile = {
  filename: "src/app.ts",
  patch: `@@ -1,3 +1,5 @@
+const x = eval(userInput);
+console.log(x);`,
  status: "modified",
};

describe("reviewFiles", () => {
  it("returns comments from AI response", async () => {
    const provider = mockProvider(
      JSON.stringify([{ line: 1, comment: "eval() is a security risk" }]),
    );
    const comments = await reviewFiles([sampleFile], provider, "gpt-4o", "");
    expect(comments).toHaveLength(1);
    expect(comments[0].path).toBe("src/app.ts");
    expect(comments[0].line).toBe(1);
    expect(comments[0].body).toContain("eval()");
  });

  it("returns empty array when AI finds no issues", async () => {
    const provider = mockProvider("[]");
    const comments = await reviewFiles([sampleFile], provider, "gpt-4o", "");
    expect(comments).toHaveLength(0);
  });

  it("handles markdown-wrapped JSON response", async () => {
    const provider = mockProvider(
      '```json\n[{"line": 2, "comment": "Missing error handling"}]\n```',
    );
    const comments = await reviewFiles([sampleFile], provider, "gpt-4o", "");
    expect(comments).toHaveLength(1);
  });

  it("handles invalid JSON gracefully", async () => {
    const provider = mockProvider("This is not JSON");
    const comments = await reviewFiles([sampleFile], provider, "gpt-4o", "");
    expect(comments).toHaveLength(0);
  });

  it("reviews multiple files", async () => {
    const provider = mockProvider(
      JSON.stringify([{ line: 1, comment: "Issue found" }]),
    );
    const files = [sampleFile, { ...sampleFile, filename: "src/other.ts" }];
    const comments = await reviewFiles(files, provider, "gpt-4o", "");
    expect(comments).toHaveLength(2);
    expect(provider.chat).toHaveBeenCalledTimes(2);
  });

  it("passes custom prompt to AI", async () => {
    const provider = mockProvider("[]");
    await reviewFiles([sampleFile], provider, "gpt-4o", "Focus on security");
    const call = (provider.chat as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0][1].content).toContain("Focus on security");
  });
});
