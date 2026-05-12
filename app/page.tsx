"use client";

import { GeneratePdfFormToolUI } from "@/components/pdf-tool-ui";
import { Thread } from "@/components/thread";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";

export default function Home() {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/agent",
    }),
  });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-full">
        <GeneratePdfFormToolUI />
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
}
