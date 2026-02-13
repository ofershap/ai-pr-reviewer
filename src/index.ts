import * as core from "@actions/core";
import * as github from "@actions/github";
import { getChangedFiles } from "./files";
import { reviewFiles } from "./reviewer";
import { postReview } from "./github";
import { resolveProvider } from "./providers";

async function run(): Promise<void> {
  try {
    const context = github.context;
    if (!context.payload.pull_request) {
      core.info("Not a pull request event, skipping.");
      return;
    }

    const token = core.getInput("github-token", { required: true });
    const model = core.getInput("model") || "gpt-4o";
    const maxFiles = parseInt(core.getInput("max-files") || "20", 10);
    const excludePatterns = (core.getInput("exclude-patterns") || "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const customPrompt = core.getInput("custom-prompt") || "";

    const provider = resolveProvider(model);
    const octokit = github.getOctokit(token);
    const prNumber = context.payload.pull_request.number;

    core.info(`Reviewing PR #${prNumber} with ${model}`);

    const files = await getChangedFiles(octokit, context, prNumber, {
      maxFiles,
      excludePatterns,
    });

    if (files.length === 0) {
      core.info("No reviewable files found.");
      return;
    }

    core.info(`Reviewing ${files.length} file(s)...`);

    const comments = await reviewFiles(files, provider, model, customPrompt);

    if (comments.length === 0) {
      core.info("No issues found. LGTM!");
      await postReview(octokit, context, prNumber, [], "APPROVE");
      return;
    }

    core.info(`Found ${comments.length} comment(s), posting review...`);
    await postReview(octokit, context, prNumber, comments, "COMMENT");
    core.info("Review posted successfully.");
  } catch (error) {
    core.setFailed(
      error instanceof Error ? error.message : "Unknown error occurred",
    );
  }
}

run();
