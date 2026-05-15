import { toBaseMessages, toUIMessageStream } from "@ai-sdk/langchain";
import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { agent } from "@/agent/deepAgent";
import { injectQuoteContext } from "@assistant-ui/react-ai-sdk";
import dotenv from "dotenv";

dotenv.config();

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  // Convert AI SDK UIMessages to LangChain messages
  // Include attachments (images, documents, etc.) not just text
  const langchainBaseMessages = await toBaseMessages(
    injectQuoteContext(messages),
  );

  // Sanitize tool calls to ensure args exists
  langchainBaseMessages.forEach((m: any) => {
    if (m.tool_calls && Array.isArray(m.tool_calls)) {
      m.tool_calls.forEach((tc: any) => {
        if (!tc.args) {
          tc.args = {};
        }
      });
    }
  });

  console.log(langchainBaseMessages);
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
