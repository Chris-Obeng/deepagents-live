import type * as React from "react";
import { Sparkles, LogIn } from "lucide-react";
import { GitHubIcon } from "@/components/github";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ThreadList } from "@/components/thread-list";
import { Show, UserButton, SignInButton } from "@clerk/nextjs";

export function ThreadListSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="aui-sidebar-header mb-2 border-b">
        <div className="aui-sidebar-header-content flex items-center justify-between">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <div className="cursor-pointer">
                  <div className="aui-sidebar-header-icon-wrapper flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-white">
                    <Sparkles className="aui-sidebar-header-icon size-4" />
                  </div>
                  <div className="aui-sidebar-header-heading me-6 flex flex-col gap-0.5 leading-none">
                    <span className="aui-sidebar-header-title font-semibold tracking-tight text-lg">
                      DeepAgent
                    </span>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>
      <SidebarContent className="aui-sidebar-content px-2">
        <ThreadList />
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter className="aui-sidebar-footer border-t p-2">
        <SidebarMenu>
          <Show when="signed-in">
            <SidebarMenuItem className="mb-1">
              <div className="flex items-center gap-2 px-2 py-1.5 w-full hover:bg-sidebar-accent rounded-md">
                <UserButton showName />
              </div>
            </SidebarMenuItem>
          </Show>
          <Show when="signed-out">
            <SidebarMenuItem className="mb-1">
              <SignInButton mode="modal">
                <SidebarMenuButton size="lg" className="cursor-pointer">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <LogIn className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">Sign In</span>
                    <span className="text-xs text-muted-foreground">Log in to your account</span>
                  </div>
                </SidebarMenuButton>
              </SignInButton>
            </SidebarMenuItem>
          </Show>
          
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
