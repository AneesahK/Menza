import { AppSidebar } from "@/components/layout/app-sidebar";
import { auth } from "@/server/auth";
import { SidebarInset, SidebarProvider } from "@demo/ui/components/sidebar";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh">{children}</SidebarInset>
    </SidebarProvider>
  );
}
