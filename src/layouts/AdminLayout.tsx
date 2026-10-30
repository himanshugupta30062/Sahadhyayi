import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity, BookOpen, ChevronLeft, ChevronRight, FileCheck2, FlaskConical,
  LayoutDashboard, LogOut, Menu, MessageSquare, PanelLeftClose, PanelLeftOpen,
  Settings2, ShieldCheck, Users, X, UserRoundCog, WandSparkles, Globe2,
} from "lucide-react";
import { useAuth } from "@/contexts/authHelpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sections = [
  {
    label: "Workspace",
    items: [{ label: "Overview", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Content operations",
    items: [
      { label: "PDF submissions", href: "/admin/book-pdfs", icon: BookOpen },
      { label: "PDF verification", href: "/admin/book-pdf-reviews", icon: FileCheck2 },
      { label: "Library quality", href: "/admin/library-quality", icon: ShieldCheck },
      { label: "Library archive", href: "/admin/library-archive", icon: BookOpen },
      { label: "Author enrichment", href: "/admin/author-enrichment", icon: WandSparkles },
      { label: "Book Expert RAG", href: "/admin/book-expert-rag", icon: FlaskConical },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Website analytics", href: "/admin/visitors", icon: Activity },
      { label: "User feedback", href: "/admin/feedback", icon: MessageSquare },
      { label: "Roles & permissions", href: "/admin/roles", icon: UserRoundCog },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const active = (href: string) =>
    href === "/admin"
      ? location.pathname === "/admin"
      : location.pathname === href || location.pathname.startsWith(`${href}/`);

  const handleSignOut = async () => {
    await signOut();
    navigate("/signin", { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <Link to="/admin" className="flex min-w-0 items-center gap-3 font-semibold tracking-tight">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500 text-slate-950">
            <BookOpen className="h-5 w-5" />
          </span>
          {!collapsed && <span className="truncate">Sahadhyayi <span className="text-amber-400">Admin</span></span>}
        </Link>
        <Button variant="ghost" size="icon" className="hidden h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white lg:inline-flex" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close admin menu">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <nav aria-label="Admin navigation" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <section key={section.label}>
            {!collapsed && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{section.label}</p>}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const selected = active(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    aria-current={selected ? "page" : undefined}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
                      selected ? "bg-amber-400/15 font-semibold text-amber-300 ring-1 ring-inset ring-amber-300/20" : "text-slate-400 hover:bg-white/5 hover:text-white",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        {!collapsed && (
          <div className="mb-3 min-w-0 px-2">
            <p className="truncate text-sm font-medium text-white">{user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Administrator"}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
        )}
        <Button variant="ghost" className={cn("w-full justify-start gap-3 text-slate-400 hover:bg-white/5 hover:text-white", collapsed && "justify-center px-2")} onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />{!collapsed && "Sign out"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="-mt-16 flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className={cn("fixed inset-y-0 left-0 z-[120] hidden transition-[width] duration-200 lg:block", collapsed ? "w-[76px]" : "w-64")}>
        {sidebar}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-[130] lg:hidden">
          <button className="absolute inset-0 bg-slate-950/60" onClick={() => setMobileOpen(false)} aria-label="Close admin menu overlay" />
          <aside className="relative h-full w-[min(19rem,85vw)] shadow-2xl">{sidebar}</aside>
        </div>
      )}
      <div className={cn("flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200", collapsed ? "lg:ml-[76px]" : "lg:ml-64")}>
        <header className="sticky top-0 z-[90] flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-9 w-9 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open admin menu"><Menu className="h-4 w-4" /></Button>
            <div>
              <p className="text-sm font-semibold">Admin workspace</p>
              <p className="hidden text-xs text-slate-500 sm:block">Manage the Sahadhyayi platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 sm:inline-flex"><Globe2 className="h-3.5 w-3.5" /> Platform operations</span>
            <Button asChild variant="outline" size="sm"><Link to="/dashboard">View user site <ChevronRight className="ml-1 h-3.5 w-3.5" /></Link></Button>
          </div>
        </header>
        <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
