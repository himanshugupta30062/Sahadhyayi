
import React from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { LayoutDashboard, BookOpen, Upload, Mic, Tag, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Stories", url: "/stories", icon: BookOpen },
  { title: "Upload Story", url: "/stories/upload", icon: Upload },
  { title: "Audio Journal", url: "/audio-journal", icon: Mic },
  { title: "Tags & Life Events", url: "/tags", icon: Tag },
  { title: "Account Settings", url: "/settings", icon: Settings },
];

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 border-r border-amber-200 w-full">
      <SidebarContent>
        <div className="flex flex-col items-center py-6 space-y-4">
          <img
            src="/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png"
            alt="Sahadhyayi"
            className="w-12 h-12"
          />
          <span className="font-extrabold text-lg text-amber-700 tracking-tight">Sahadhyayi</span>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="px-5 text-xs text-muted-foreground uppercase tracking-widest mb-2">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="mb-1">
                  <SidebarMenuButton
                    asChild
                    className={`w-full flex items-center gap-3 px-5 py-2 rounded-md transition-colors ${
                      location.pathname === item.url
                        ? "bg-amber-200 text-amber-900"
                        : "hover:bg-orange-100 hover:text-amber-900"
                    }`}
                    tabIndex={0}
                    onClick={() => navigate(item.url)}
                  >
                    <div className="flex items-center">
                      <item.icon className="w-5 h-5" />
                      <span className="ml-2">{item.title}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;

