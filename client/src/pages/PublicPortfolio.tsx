import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link, useRoute } from "wouter";

export default function PublicPortfolio() {
  const [, params] = useRoute("/p/:slug");
  const slug = params?.slug ?? "";
  const item = trpc.lastday.portfolio.publicBySlug.useQuery({ slug }, { enabled: Boolean(slug) });
  if (item.isLoading) return <main className="grid min-h-screen place-items-center bg-[#0b0e1b] text-slate-400">Loading highlight…</main>;
  if (!item.data) return <main className="grid min-h-screen place-items-center bg-[#0b0e1b] p-6 text-center"><div><p className="text-sm text-slate-500">This public highlight is unavailable.</p><Link href="/"><Button className="mt-4 rounded-xl">Return home</Button></Link></div></main>;
  return <main className="min-h-screen bg-[#0b0e1b] px-5 py-8 text-slate-100 sm:px-8"><div className="mx-auto max-w-3xl"><Link href="/"><Button variant="ghost" className="-ml-3 text-slate-400 hover:bg-slate-800 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4" />LastDay</Button></Link><article className="mt-14 rounded-[2rem] border border-slate-800 bg-[#12172a] p-7 shadow-2xl sm:p-12"><div className="flex items-center gap-2 text-xs font-medium tracking-[0.15em] text-amber-300 uppercase"><Sparkles className="h-4 w-4" /> Owner-published highlight</div><h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">{item.data.headline}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{item.data.description}</p><div className="mt-8 flex flex-wrap gap-2">{item.data.tags.map(tag => <Badge className="border-slate-700 bg-slate-800 px-3 py-1 text-slate-300" key={tag}>{tag}</Badge>)}</div><p className="mt-12 border-t border-slate-800 pt-5 text-xs leading-5 text-slate-500">This page contains only content the owner chose to publish. Private repository names, source links, and underlying activity remain private.</p></article></div></main>;
}
