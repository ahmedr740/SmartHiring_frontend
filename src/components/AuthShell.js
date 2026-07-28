import { BadgeCheck, Sparkles, UsersRound } from "lucide-react";
import BrandMark from "./BrandMark";
import LanguageSwitcher from "./LanguageSwitcher";

function AuthShell({ eyebrow, title, description, children }) {
    return (
        <div className="jh-page min-h-screen lg:grid lg:grid-cols-[0.9fr_1.1fr]">
            <aside className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col xl:p-16">
                <div className="absolute -left-28 top-1/3 h-80 w-80 rounded-full bg-brand-600/50 blur-3xl" aria-hidden="true" />
                <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-accent-500/30 blur-3xl" aria-hidden="true" />
                <div className="relative z-10 flex items-start justify-between gap-4"><BrandMark light subtitle="Hospitality staffing" /><LanguageSwitcher light compact /></div>
                <div className="relative z-10 my-auto max-w-lg py-16">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-200">Built for hospitality teams</p>
                    <h2 className="mt-5 text-5xl font-extrabold leading-tight tracking-[-0.04em]">The right people.<br />The right shift.<br /><span className="text-brand-200">Right when it matters.</span></h2>
                    <p className="mt-6 text-lg leading-8 text-brand-100">One trusted place for restaurants and hospitality professionals to connect, coordinate, and get work done.</p>
                    <div className="mt-10 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                            <UsersRound size={22} className="text-brand-200" aria-hidden="true" />
                            <p className="mt-3 font-extrabold">Trusted connections</p>
                            <p className="mt-1 text-sm text-brand-100">Profiles, ratings, and clear expectations.</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                            <BadgeCheck size={22} className="text-accent-300" aria-hidden="true" />
                            <p className="mt-3 font-extrabold">Confident decisions</p>
                            <p className="mt-1 text-sm text-brand-100">Every shift managed from one place.</p>
                        </div>
                    </div>
                </div>
                <p className="relative z-10 text-sm text-brand-200">© 2026 JobHub · Hong Kong</p>
            </aside>

            <main className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
                <div className="absolute right-5 top-5 lg:hidden"><LanguageSwitcher compact /></div>
                <div className="w-full max-w-xl">
                    <div className="mb-10 lg:hidden"><BrandMark subtitle="Hospitality staffing" /></div>
                    <div className="mb-8">
                        <p className="jh-eyebrow inline-flex items-center gap-2"><Sparkles size={15} aria-hidden="true" />{eyebrow}</p>
                        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{title}</h1>
                        <p className="mt-4 leading-7 text-gray-600">{description}</p>
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}

export default AuthShell;
