"use client";

import {
  Building2,
  Home,
  Users,
  Settings,
  LogOut,
  BarChart3,
  MessageSquare,
  Bell,
  ChevronUp,
  Shield,
  UserCircle,
  Link2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { SessionUser, ACCESS_LEVEL_LABELS, LICENSE_LABELS } from "@/types/rbac";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { is_super_admin, is_director_or_higher, is_manager_or_higher } from "@/lib/rbac/permissions";

interface AppSidebarProps {
  user: SessionUser;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const { logout } = useAuth();

  const get_initials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const main_nav_items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      visible: true,
    },
    {
      title: "Leads",
      url: "/leads",
      icon: UserCircle,
      visible: true,
    },
    {
      title: "Conversas",
      url: "/conversations",
      icon: MessageSquare,
      visible: true,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
      visible: is_manager_or_higher(user.access_level),
    },
    {
      title: "Notificações",
      url: "/notifications",
      icon: Bell,
      visible: true,
    },
    {
      title: "Integrações",
      url: "/integrations",
      icon: Link2,
      visible: is_manager_or_higher(user.access_level),
    },
  ];

  const admin_nav_items = [
    {
      title: "Usuários",
      url: "/users",
      icon: Users,
      visible: is_manager_or_higher(user.access_level),
    },
    {
      title: "Config. Integrações",
      url: "/settings/integrations",
      icon: Settings,
      visible: is_manager_or_higher(user.access_level),
    },
    {
      title: "Admin Sistema",
      url: "/admin",
      icon: Shield,
      visible: is_super_admin(user.access_level),
    },
  ];

  const visible_main_items = main_nav_items.filter((item) => item.visible);
  const visible_admin_items = admin_nav_items.filter((item) => item.visible);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sidebar-primary">
              <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-semibold text-sm">NFloor</span>
              <span className="text-xs text-sidebar-foreground/60">
                {user.company_name || "Sistema"}
              </span>
            </div>
          </div>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible_main_items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visible_admin_items.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visible_admin_items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                      {get_initials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-medium truncate w-full">
                      {user.name}
                    </span>
                    <span className="text-xs text-sidebar-foreground/60 truncate w-full">
                      {ACCESS_LEVEL_LABELS[user.access_level]}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {user.license_type && (
                      <Badge variant="secondary" className="w-fit text-xs mt-1">
                        {LICENSE_LABELS[user.license_type]}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <Settings className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
