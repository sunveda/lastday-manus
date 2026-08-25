import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { ArrowRight, CalendarDays, Github, LockKeyhole, Sparkles } from "lucide-react";
import { Link } from "wouter";

const privacySteps = [
  { icon: LockKeyhole, title: "Choose access", text: "Install the read-only GitHub App on only the repositories you approve." },
  { icon: CalendarDays, title: "See context", text: "Import recent contribution history first, then synchronize in small, rate-aware batches." },
  { icon: Sparkles, title: "Publish deliberately", text: "Turn your work into sanitized highlights without revealing private repository details." },
];

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0e1b] text-slate-100">
      <div className="pointer-events-none absolute left-1/2 top-[-16rem] h-[36rem] w-[40rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-300 text-sm text-slate-950">L</span>
          LastDay
        </Link>
        {loading ? null : user ? (
          <Link href="/dashboard"><Button className="rounded-xl bg-white text-slate-950 hover:bg-slate-100">Open dashboard</Button></Link>
        ) : (
          <Button variant="ghost" onClick={() => startLogin()} className="text-slate-300 hover:bg-white/5 hover:text-white">Sign in</Button>
        )}
      </nav>

      <section className="relative mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-amber-100"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" />Private GitHub intelligence</div>
          <h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-white sm:text-6xl">See the work GitHub leaves between the lines.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">A private, mobile-first record of your selected GitHub contributions—designed for reflection, trend discovery, and a portfolio you control.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            {user ? (
              <Link href="/dashboard"><Button className="h-12 rounded-xl bg-amber-300 px-5 font-semibold text-slate-950 hover:bg-amber-200">Open your workspace <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            ) : (
              <Button onClick={() => startLogin()} className="h-12 rounded-xl bg-amber-300 px-5 font-semibold text-slate-950 hover:bg-amber-200"><Github className="mr-2 h-4 w-4" />Get started securely</Button>
            )}
            <a href="#privacy"><Button variant="outline" className="h-12 rounded-xl border-slate-700 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white">How privacy works</Button></a>
          </div>
          <p className="mt-4 text-xs text-slate-500">Read-only GitHub access. You choose repositories. Nothing public without approval.</p>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] border border-white/10 bg-[#12172a]/85 p-5 shadow-[0_40px_100px_-45px_rgba(0,0,0,0.95)] backdrop-blur sm:p-7">
            <div className="flex items-center justify-between"><div><p className="text-xs font-medium tracking-[0.14em] text-slate-500 uppercase">Your quiet signal</p><p className="mt-2 text-xl font-semibold text-white">Contribution rhythm</p></div><CalendarDays className="h-5 w-5 text-amber-300" /></div>
            <div className="mt-7 grid grid-cols-12 gap-1.5">{Array.from({ length: 84 }, (_, index) => <span key={index} className={`aspect-square rounded-[4px] ${index % 17 === 0 ? "bg-amber-300" : index % 7 === 0 ? "bg-violet-400/70" : index % 5 === 0 ? "bg-slate-600" : "bg-slate-800"}`} />)}</div>
            <div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-900/70 p-4"><p className="text-xs text-slate-500">Selected work</p><p className="mt-2 text-2xl font-semibold text-white">Private</p></div><div className="rounded-2xl bg-slate-900/70 p-4"><p className="text-xs text-slate-500">Portfolio control</p><p className="mt-2 text-2xl font-semibold text-white">Yours</p></div></div>
          </div>
          <div className="absolute -bottom-6 -left-5 flex items-center gap-3 rounded-2xl border border-emerald-200/10 bg-[#182338] px-4 py-3 shadow-xl"><div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300"><LockKeyhole className="h-4 w-4" /></div><span className="text-xs text-slate-300">Private by default</span></div>
        </div>
      </section>

      <section id="privacy" className="relative border-t border-white/5 bg-[#0e1221] py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-3 sm:px-8">
          {privacySteps.map(({ icon: Icon, title, text }) => <div key={title}><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><Icon className="h-5 w-5" /></div><h2 className="mt-5 font-semibold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>)}
        </div>
      </section>
    </main>
  );
}
