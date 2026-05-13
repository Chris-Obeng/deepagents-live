"use client";

import { Thread } from "@/components/thread";
import { ThreadListSidebar } from "@/components/threadlist-sidebar";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Home() {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/agent",
    }),
    
  });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider defaultOpen={false}>
        <div className="flex h-dvh w-full">
          <ThreadListSidebar />
          <SidebarInset>
            <SidebarTrigger className="absolute top-4 left-4 z-20" />
            <Thread />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
}
