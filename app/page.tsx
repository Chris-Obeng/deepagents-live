"use client";

import { Thread } from "@/components/thread";
import { ThreadListSidebar } from "@/components/threadlist-sidebar";
import Header from "@/components/custom/header";
import { 
  AssistantRuntimeProvider, 
  CompositeAttachmentAdapter, 
  SimpleImageAttachmentAdapter, 
  SimpleTextAttachmentAdapter,
  WebSpeechSynthesisAdapter 
} from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Home() {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/agent",
    }),
    adapters: {
      speech: new WebSpeechSynthesisAdapter(),
      attachments: new CompositeAttachmentAdapter([
  new SimpleImageAttachmentAdapter(),
  new SimpleTextAttachmentAdapter(),
])
    },
  });
  return (
    <TooltipProvider>
      <AssistantRuntimeProvider runtime={runtime}>
        <SidebarProvider defaultOpen={false}>
          <div className="flex h-screen w-full overflow-hidden">
            <ThreadListSidebar />
            <SidebarInset className="flex flex-col h-full overflow-hidden relative">
              <Header />
              <Thread />
            </SidebarInset>
          </div>
        </SidebarProvider>
      </AssistantRuntimeProvider>
    </TooltipProvider>
  );
}
