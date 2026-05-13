import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { agent } from "@/agent/deepAgent";
import { injectQuoteContext } from "@assistant-ui/react-ai-sdk";

import dotenv from "dotenv";

dotenv.config();

function getTextOnlyMessages(messages: UIMessage[]): UIMessage[] {
  return messages
    .map((message) => ({
      ...message,
      parts: message.parts.filter((part) => part.type === "text"),
    }))
    .filter((message) => message.parts.length > 0);
}

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  // Convert AI SDK UIMessages to LangChain messages
  const langchainBaseMessages = await toBaseMessages(
    getTextOnlyMessages(injectQuoteContext(messages)),
  );

  const config = { configurable: { thread_id: messages[0].id } };
  console.log("config", config);
  const streamEvents = agent.streamEvents(
    {
      messages: langchainBaseMessages,
    },
    { ...config, version: "v2" },
  );

  return createUIMessageStreamResponse({
    stream: toUIMessageStream(streamEvents),
  });
}
