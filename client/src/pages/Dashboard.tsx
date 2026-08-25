import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, CalendarDays, CheckCircle2, Github, LockKeyhole, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

const metricCards = [
  { label: "Selected repositories", key: "repositories" as const, note: "Private by default", icon: Github },
  { label: "Contributions", key: "contributions" as const, note: "Across selected work", icon: CalendarDays },
  { label: "Pull requests", key: "pullRequests" as const, note: "Creation and collaboration", icon: ArrowUpRight },
  { label: "Reviews", key: "reviews" as const, note: "Feedback shared", icon: CheckCircle2 },
];

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export default function Dashboard() {
  const overview = trpc.lastday.overview.useQuery();
  const connect = trpc.lastday.github.authorize.useMutation({
    onSuccess: result => {
      if (!result.ready || !result.authorizationUrl) {
        toast.error("GitHub App setup is incomplete", { description: result.missing.join(", ") });
        return;
      }
      window.location.assign(result.authorizationUrl);
    },
    onError: () => toast.error("Could not begin GitHub connection. Please try again."),
  });
  const syncNow = trpc.lastday.github.syncNow.useMutation({
    onSuccess: result => {
      toast.success("Contribution import completed", { description: `${result.importedDays} daily records refreshed.` });
      overview.refetch();
    },
    onError: () => toast.error("The import could not finish. Your access remains read-only and your data is unchanged."),
  });
  const enableScheduledSync = trpc.lastday.github.enableScheduledSync.useMutation({
    onSuccess: result => toast.success("Scheduled refresh enabled", { description: result.nextExecutionAt ? `Next batch: ${new Date(result.nextExecutionAt).toLocaleString()}` : "LastDayNight will refresh every 12 hours." }),
    onError: () => toast.error("Scheduled refresh is available after the published deployment is live."),
  });

  const data = overview.data;
  const isConnected = data?.connection.connected;
  const calendarMap = new Map((data?.calendar ?? []).map(day => [day.date, day.count]));
  const calendarDays = Array.from({ length: 91 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (90 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: calendarMap.get(key) ?? 0 };
  });
  const maxCalendarCount = Math.max(...calendarDays.map(day => day.count), 1);

  const heatClass = (count: number) => {
    if (count === 0) return "bg-slate-800";
    if (count / maxCalendarCount > 0.75) return "bg-amber-300";
    if (count / maxCalendarCount > 0.45) return "bg-violet-400";
    return "bg-violet-400/50";
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-7 pb-12">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#111529] p-5 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.8)] sm:p-8">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute bottom-[-6rem] left-[28%] h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium tracking-[0.16em] text-amber-200/75 uppercase">
                <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.8)]" />
                Private developer intelligence
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                Your work, kept in context.
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
                LastDayNight turns the contribution history you choose to connect into a private, readable record of your momentum.
              </p>
            </div>
            {isConnected ? (
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100 backdrop-blur">
                <div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4" /> GitHub connected</div>
                <p className="mt-1 text-xs text-emerald-100/70">Only selected repositories are available to LastDayNight.</p>
              </div>
            ) : (
              <Button onClick={() => connect.mutate()} disabled={connect.isPending} className="h-11 rounded-xl bg-amber-300 px-5 font-semibold text-slate-950 hover:bg-amber-200">
                <Github className="mr-2 h-4 w-4" />
                {connect.isPending ? "Opening GitHub…" : "Connect GitHub"}
              </Button>
            )}
          </div>
        </section>

        {overview.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metricCards.map(card => <Skeleton className="h-36 rounded-2xl" key={card.key} />)}</div>
        ) : isConnected ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metricCards.map(({ label, key, note, icon: Icon }) => (
                <article key={key} className="rounded-2xl border border-slate-800/70 bg-[#12172a] p-5 shadow-sm">
                  <div className="flex items-start justify-between"><span className="text-sm text-slate-400">{label}</span><Icon className="h-4 w-4 text-amber-300" /></div>
                  <p className="mt-6 text-3xl font-semibold tracking-tight text-white">{data?.totals[key] ?? 0}</p>
                  <p className="mt-1 text-xs text-slate-500">{note}</p>
                </article>
              ))}
            </section>
            <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-2xl border border-slate-800/70 bg-[#12172a] p-5 sm:p-6">
                <div className="flex items-start justify-between"><div><h2 className="font-semibold text-white">Contribution rhythm</h2><p className="mt-1 text-sm text-slate-500">Your selected GitHub activity, shown in UTC.</p></div><CalendarDays className="h-4 w-4 text-amber-300" /></div>
                <div className="mt-6 grid grid-cols-[repeat(13,minmax(0,1fr))] gap-1.5 sm:gap-2">
                  {calendarDays.map(day => <span title={`${day.date}: ${day.count} contributions`} key={day.date} className={`aspect-square rounded-[4px] transition-transform hover:scale-110 ${heatClass(day.count)}`} />)}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>{calendarDays[0]?.date}</span><span>Daily contribution count</span><span>{calendarDays.at(-1)?.date}</span></div>
              </article>
              <article className="rounded-2xl border border-slate-800/70 bg-[#12172a] p-5 sm:p-6">
                <div><h2 className="font-semibold text-white">Selected repositories</h2><p className="mt-1 text-sm text-slate-500">Only repositories you authorized.</p></div>
                <div className="mt-5 space-y-1">{data?.repositoryTrends.length ? data.repositoryTrends.map(repo => <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 hover:bg-slate-900/60" key={`${repo.visibility}-${repo.name}`}><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-200">{repo.name}</p><p className="mt-1 text-xs text-slate-500">{repo.primaryLanguage || "No language detected"}</p></div><Badge className={repo.visibility === "private" ? "border-slate-700 bg-slate-800 text-slate-300" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"}>{repo.visibility}</Badge></div>) : <p className="py-8 text-center text-sm text-slate-500">Repositories appear after your first import.</p>}</div>
              </article>
            </section>
            <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
              <article className="rounded-2xl border border-slate-800/70 bg-[#12172a] p-5 sm:p-6">
                <div className="flex items-center justify-between"><div><h2 className="font-semibold text-white">Recent work</h2><p className="mt-1 text-sm text-slate-500">Newest imported contribution records.</p></div><Badge className="border-0 bg-slate-800 text-slate-300">Private view</Badge></div>
                <div className="mt-5 divide-y divide-slate-800/80">
                  {data?.recentActivity.length ? data.recentActivity.map((activity, index) => (
                    <div className="flex items-center gap-4 py-4" key={`${activity.occurredAt.toISOString()}-${index}`}>
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-800 text-amber-300"><Sparkles className="h-4 w-4" /></div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-200">{activity.title || `${activity.kind.replace(/_/g, " ")} activity`}</p><p className="mt-1 text-xs text-slate-500">{new Date(activity.occurredAt).toLocaleDateString()} · {activity.isPrivate ? "Private contribution" : "Public contribution"}</p></div>
                      {activity.isPrivate ? <LockKeyhole className="h-4 w-4 text-slate-600" /> : null}
                    </div>
                  )) : <p className="py-9 text-center text-sm text-slate-500">Your first records will appear here after the initial import.</p>}
                </div>
              </article>
              <article className="rounded-2xl border border-slate-800/70 bg-[#12172a] p-5 sm:p-6">
                <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><RefreshCw className="h-4 w-4" /></div><div><h2 className="font-semibold text-white">Sync health</h2><p className="text-xs text-slate-500">Small, rate-aware batches.</p></div></div>
                <div className="mt-7 rounded-xl bg-slate-900/60 p-4"><p className="text-xs uppercase tracking-[0.14em] text-slate-500">Status</p><p className="mt-2 capitalize text-lg font-medium text-white">{statusLabel(data?.sync.status ?? "idle")}</p><p className="mt-2 text-sm leading-5 text-slate-500">{data?.sync.lastSyncedAt ? `Last update ${new Date(data.sync.lastSyncedAt).toLocaleString()}` : "Initial import starts after your repositories are authorized."}</p></div>
                <Button onClick={() => syncNow.mutate()} disabled={syncNow.isPending || data?.sync.status === "syncing"} variant="outline" className="mt-4 w-full rounded-xl border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800"><RefreshCw className={`mr-2 h-4 w-4 ${syncNow.isPending ? "animate-spin" : ""}`} />{syncNow.isPending ? "Importing selected work…" : data?.sync.lastSyncedAt ? "Refresh private insights" : "Start first import"}</Button>
                <Button onClick={() => enableScheduledSync.mutate()} disabled={enableScheduledSync.isPending} variant="ghost" className="mt-2 w-full rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200">{enableScheduledSync.isPending ? "Enabling refresh…" : "Enable 12-hour refresh"}</Button>
                <div className="mt-4 flex items-start gap-3 text-xs leading-5 text-slate-500"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />Credentials are encrypted at rest. Private repository details are never included in public highlights automatically.</div>
              </article>
            </section>
          </>
        ) : (
          <section className="grid overflow-hidden rounded-[1.75rem] border border-slate-800 bg-[#12172a] lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6 sm:p-10"><Badge className="border-amber-300/20 bg-amber-300/10 text-amber-200">Safe by design</Badge><h2 className="mt-5 max-w-md text-2xl font-semibold tracking-tight text-white">Connect only the work you choose.</h2><p className="mt-3 max-w-md text-sm leading-6 text-slate-400">LastDayNight uses a read-only GitHub App. You select repositories during installation, and you can revoke access in GitHub at any time.</p><Button onClick={() => connect.mutate()} disabled={connect.isPending} className="mt-7 h-11 rounded-xl bg-white px-5 font-semibold text-slate-950 hover:bg-slate-100"><Github className="mr-2 h-4 w-4" />{connect.isPending ? "Opening GitHub…" : "Connect GitHub securely"}</Button></div>
            <div className="border-t border-slate-800 bg-slate-900/40 p-6 sm:p-10 lg:border-t-0 lg:border-l"><div className="space-y-5">{[["01", "You choose repositories", "Install the read-only GitHub App on only selected repositories."], ["02", "We map activity", "A compact first import builds your private contribution record."], ["03", "You decide what is public", "Portfolio highlights begin as private drafts with sanitized copy."]].map(([number, title, body]) => <div className="flex gap-4" key={number}><span className="text-sm font-semibold text-amber-300">{number}</span><div><h3 className="text-sm font-medium text-slate-200">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{body}</p></div></div>)}</div></div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
