import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowUpRight, BookOpen, FileCheck2, MessageSquare, ShieldCheck, Users, UserRoundCog, WandSparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client-universal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const shortcuts = [
  { title: "Review PDF submissions", description: "Inspect quarantined uploads and verification results.", href: "/admin/book-pdf-reviews", icon: FileCheck2 },
  { title: "Manage the library", description: "Review library quality and archived records.", href: "/admin/library-quality", icon: BookOpen },
  { title: "Manage platform access", description: "Assign roles and configure granular permissions.", href: "/admin/roles", icon: UserRoundCog },
  { title: "Review user feedback", description: "Read feedback submitted by the community.", href: "/admin/feedback", icon: MessageSquare },
  { title: "Website analytics", description: "Inspect visits and engagement activity.", href: "/admin/visitors", icon: Activity },
  { title: "Enrich author records", description: "Improve author metadata and profile completeness.", href: "/admin/author-enrichment", icon: WandSparkles },
];

export default function AdminOverview() {
  const roles = useQuery({
    queryKey: ["admin-overview-role-count"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_user_roles");
      if (error) throw error;
      return (data ?? []) as { user_id: string; role: string }[];
    },
    staleTime: 60_000,
  });

  const adminCount = roles.data?.filter((item) => item.role === "admin").length;

  return (
    <main className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Sahadhyayi control center</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Good to see you.</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Your central workspace for content operations, community support and platform governance.</p>
        </div>
        <Button asChild variant="outline"><Link to="/dashboard">Open user experience <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="pb-2"><CardDescription>Assigned platform roles</CardDescription><CardTitle className="text-3xl">{roles.isLoading ? "—" : roles.isError ? "Unavailable" : roles.data?.length ?? 0}</CardTitle></CardHeader>
          <CardContent className="text-xs text-slate-500">Current role assignments</CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="pb-2"><CardDescription>Administrator accounts</CardDescription><CardTitle className="text-3xl">{roles.isLoading ? "—" : roles.isError ? "Unavailable" : adminCount ?? 0}</CardTitle></CardHeader>
          <CardContent className="text-xs text-slate-500">Accounts with full admin role</CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="pb-2"><CardDescription>Access control</CardDescription><CardTitle className="flex items-center gap-2 text-xl"><ShieldCheck className="h-5 w-5 text-emerald-600" /> Database enforced</CardTitle></CardHeader>
          <CardContent className="text-xs text-slate-500">Role checks are performed by Supabase</CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="pb-2"><CardDescription>Workspace</CardDescription><CardTitle className="flex items-center gap-2 text-xl"><Users className="h-5 w-5 text-sky-600" /> Operations</CardTitle></CardHeader>
          <CardContent className="text-xs text-slate-500">Content, community and platform tools</CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div><h2 className="text-xl font-semibold">Quick actions</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Jump directly to the areas that need attention.</p></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} to={item.href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-700">
              <div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"><Icon className="h-5 w-5" /></span><ArrowUpRight className="h-4 w-4 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div>
              <h3 className="mt-4 font-semibold">{item.title}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
            </Link>;
          })}
        </div>
      </section>

      <Card className="border-amber-200 bg-amber-50/70 shadow-none dark:border-amber-900/60 dark:bg-amber-950/20">
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200"><ShieldCheck className="h-5 w-5" /></div>
          <div className="flex-1"><p className="font-semibold">Keep access secure</p><p className="text-sm text-slate-600 dark:text-slate-400">Review role assignments regularly and grant only the permissions each team member needs.</p></div>
          <Button asChild variant="outline" className="shrink-0 border-amber-300 bg-white dark:border-amber-800 dark:bg-slate-900"><Link to="/admin/roles">Review permissions</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
