import * as core from "@actions/core";
import type { AIProvider, ChatMessage } from "./types";

class OpenAIProvider implements AIProvider {
  name = "openai";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: ChatMessage[], model: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.1 }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${text}`);
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
    };
    return data.choices[0]?.message?.content ?? "";
  }
}

class AnthropicProvider implements AIProvider {
  name = "anthropic";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: ChatMessage[], model: string): Promise<string> {
    const system = messages.find((m) => m.role === "system")?.content ?? "";
    const userMessages = messages
      .filter((m) => m.role === "user")
      .map((m) => ({ role: "user" as const, content: m.content }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system,
        messages: userMessages,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${text}`);
    }

    const data = (await response.json()) as {
      content: { text: string }[];
    };
    return data.content[0]?.text ?? "";
  }
}

export function resolveProvider(model: string): AIProvider {
  if (model.startsWith("claude")) {
    const apiKey = core.getInput("anthropic-api-key");
    if (!apiKey)
      throw new Error("anthropic-api-key is required for Claude models");
    return new AnthropicProvider(apiKey);
  }

  const apiKey = core.getInput("openai-api-key");
  if (!apiKey) throw new Error("openai-api-key is required for OpenAI models");
  return new OpenAIProvider(apiKey);
}
