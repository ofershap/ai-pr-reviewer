export interface ChangedFile {
  filename: string;
  patch: string;
  status: string;
}

export interface ReviewComment {
  path: string;
  line: number;
  body: string;
  side: "RIGHT";
}

export interface AIProvider {
  name: string;
  chat(messages: ChatMessage[], model: string): Promise<string>;
}

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}
