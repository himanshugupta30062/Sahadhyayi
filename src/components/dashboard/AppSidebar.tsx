import {
  Home,
  BookOpen,
  FileText,
  Users,
  Compass,
  Gamepad2,
  UserRound,
  PenLine,
  Microscope,
  LibraryBig,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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

const sections = [
  {
    label: "Workspace",
    items: [
      { title: "Home", url: "/dashboard", icon: Home },
      { title: "My Bookshelf", url: "/bookshelf", icon: LibraryBig },
    ],
  },
  {
    label: "Explore",
    items: [
      { title: "Library", url: "/library", icon: BookOpen },
      { title: "Research Papers", url: "/research-papers", icon: Microscope },
      { title: "Social Media", url: "/social", icon: Users },
      { title: "Reading Groups", url: "/groups", icon: Users },
      { title: "Articles", url: "/articles", icon: FileText },
      { title: "Authors", url: "/authors", icon: UserRound },
      { title: "Games", url: "/games", icon: Gamepad2 },
    ],
  },
  {
    label: "Create",
    items: [
      { title: "Write an Article", url: "/articles/write", icon: PenLine },
    ],
  },
];

const AppSidebar = () => {
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/dashboard") return location.pathname === "/dashboard" || location.pathname === "/";
    return location.pathname === url || location.pathname.startsWith(`${url}/`);
  };

  return (
    <>
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-r border-border/70 bg-background md:top-16 md:h-[calc(100svh-4rem)]"
    >
      <SidebarHeader className="px-4 pb-5 pt-4 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center justify-between gap-2">
        <Link
          to="/dashboard"
          className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/70 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          aria-label="Sahadhyayi home"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-100 ring-1 ring-amber-200/70 dark:bg-amber-950/50 dark:ring-amber-800/50">
            <img
              src="/optimized-assets/site-logo.webp"
              alt=""
              className="h-8 w-8 object-contain"
              width={32}
              height={32}
            />
          </span>
          <span className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-[15px] font-bold tracking-tight text-foreground">
              Sahadhyayi
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              A reader's space
            </span>
          </span>
        </Link>
        <SidebarTrigger
          aria-label="Collapse or expand navigation"
          className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground group-data-[collapsible=icon]:mx-auto"
        />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-5 px-3 py-2 group-data-[collapsible=icon]:px-2">
        {sections.map((section) => (
          <SidebarGroup key={section.label} className="p-0">
            <SidebarGroupLabel className="mb-2 h-6 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80 group-data-[collapsible=icon]:sr-only">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {section.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        size="lg"
                        className={
                          "h-10 rounded-xl px-3 text-[13px] font-medium transition-all " +
                          (active
                            ? "bg-amber-100 text-amber-950 shadow-sm hover:bg-amber-100 hover:text-amber-950 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-950/60 dark:hover:text-amber-100"
                            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground")
                        }
                      >
                        <Link
                          to={item.url}
                          aria-current={active ? "page" : undefined}
                        >
                          <item.icon className="h-[18px] w-[18px] shrink-0" />
                          <span>{item.title}</span>
                          {active && (
                            <span
                              aria-hidden="true"
                              className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-600 dark:bg-amber-400"
                            />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-3 pb-4 pt-2 group-data-[collapsible=icon]:px-2">
        <div className="rounded-xl border border-border/70 bg-muted/40 px-3 py-3 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <Compass className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">Keep exploring</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Read. Reflect. Connect.</p>
            </div>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={location.pathname === "/profile"}
              tooltip="Profile"
              className="h-10 rounded-xl px-3 text-[13px] font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            >
              <Link to="/profile" aria-current={location.pathname === "/profile" ? "page" : undefined}>
                <UserRound className="h-[18px] w-[18px]" />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    </>
  );
};

export default AppSidebar;
