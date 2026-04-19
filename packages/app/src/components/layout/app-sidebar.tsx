"use client";

import { api } from "@/trpc/react";
import { PiChatDefaultStroke } from "@demo/icons/pika/stroke/communication";
import { PiLogOutRightStroke } from "@demo/icons/pika/stroke/general";
import { PiCheckTickSingleStroke } from "@demo/icons/pika/stroke/general";
import { PiPlusDefaultStroke } from "@demo/icons/pika/stroke/maths";
import { Button } from "@demo/ui/components/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@demo/ui/components/sidebar";
import { useRouter, useSearchParams } from "next/navigation";

function logoutAction() {
  // biome-ignore lint/suspicious/noDocumentCookie: required to clear auth cookie on logout
  document.cookie = "auth-token=; path=/; max-age=0";
  window.location.href = "/login";
}

export function AppSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentConversationId = searchParams.get("c");

  const { data: conversations } = api.chat.getConversations.useQuery();

  const handleNewChat = () => {
    router.push("/");
  };

  const handleSelectConversation = (id: string) => {
    router.push(`/?c=${id}`);
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-semibold">Menza</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleNewChat}
          >
            <PiPlusDefaultStroke />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations?.map((conv) => (
                <SidebarMenuItem key={conv.id}>
                  <SidebarMenuButton
                    isActive={currentConversationId === conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    tooltip={conv.title ?? "New Conversation"}
                  >
                    <PiChatDefaultStroke />
                    <span className="truncate">
                      {conv.title ?? "New Conversation"}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {(!conversations || conversations.length === 0) && (
                <p className="px-2 py-4 text-xs text-muted-foreground">
                  No conversations yet
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => router.push("/memories")}
        >
          <PiCheckTickSingleStroke />
          <span>Saved Memories</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={logoutAction}
        >
          <PiLogOutRightStroke />
          <span>Sign out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
