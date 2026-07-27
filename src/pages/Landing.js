import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    BadgeCheck,
    BriefcaseBusiness,
    CalendarCheck2,
    Check,
    Clock3,
    MapPin,
    ShieldCheck,
    Sparkles,
    Star,
    UsersRound,
    WalletCards,
} from "lucide-react";
import BrandMark from "../components/BrandMark";
import Button from "../components/ui/Button";

const benefits = [
    {
        icon: CalendarCheck2,
        title: "Fill shifts without the scramble",
        copy: "Publish complete shift details in minutes and reach workers who are ready to step in.",
    },
    {
        icon: Sparkles,
        title: "Match on more than availability",
        copy: "JobHub surfaces relevant people and roles using skills, location, experience, and timing.",
    },
    {
        icon: ShieldCheck,
        title: "Run every shift with confidence",
        copy: "Applications, messages, ratings, payments, and issue reporting stay together from start to finish.",
    },
];

const steps = [
    { number: "01", title: "Create your profile", copy: "Tell JobHub what you need—or what kind of work fits you best." },
    { number: "02", title: "Connect with the right people", copy: "Post a shift or discover openings matched to your experience." },
    { number: "03", title: "Get the shift covered", copy: "Confirm details, stay in touch, and manage the work in one place." },
];

function Landing() {
    const navigate = useNavigate();

    return (
        <div className="jh-page overflow-hidden">
            <header className="relative z-20 border-b border-brand-100/80 bg-canvas/90 backdrop-blur-xl">
                <nav className="jh-container flex min-h-20 items-center justify-between" aria-label="Main navigation">
                    <BrandMark subtitle="Hospitality staffing" />
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Button variant="ghost" onClick={() => navigate("/login")}>Log in</Button>
                        <Button onClick={() => navigate("/register")} className="hidden sm:inline-flex">Join JobHub</Button>
                        <Button onClick={() => navigate("/register")} className="sm:hidden" aria-label="Join JobHub">
                            Join
                        </Button>
                    </div>
                </nav>
            </header>

            <main>
                <section className="relative">
                    <div className="jh-container grid min-h-[720px] items-center gap-14 py-16 lg:grid-cols-[1.04fr_0.96fr] lg:py-24">
                        <div className="relative z-10 max-w-2xl">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-4 py-2 text-sm font-bold text-brand-700 shadow-card">
                                <Sparkles size={16} aria-hidden="true" />
                                Smarter hospitality staffing, shift by shift
                            </div>
                            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-[-0.045em] text-ink sm:text-6xl lg:text-7xl">
                                Great shifts start with the <span className="text-brand-600">right people.</span>
                            </h1>
                            <p className="mt-7 max-w-xl text-lg leading-8 text-gray-600 sm:text-xl">
                                JobHub helps restaurants find dependable staff quickly—and helps hospitality professionals discover flexible work that fits their lives.
                            </p>
                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <Button size="lg" icon={BriefcaseBusiness} onClick={() => navigate("/register")}>Start hiring</Button>
                                <Button size="lg" variant="secondary" icon={UsersRound} onClick={() => navigate("/register")}>Find flexible work</Button>
                            </div>
                            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-gray-600">
                                {["Fast onboarding", "AI-assisted matching", "Clear shift management"].map((item) => (
                                    <span key={item} className="inline-flex items-center gap-2">
                                        <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-100 text-brand-700">
                                            <Check size={13} strokeWidth={3} aria-hidden="true" />
                                        </span>
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
                            <div className="absolute -left-16 top-8 h-48 w-48 rounded-full bg-brand-200/50 blur-3xl" aria-hidden="true" />
                            <div className="absolute -right-12 bottom-8 h-44 w-44 rounded-full bg-accent-200/50 blur-3xl" aria-hidden="true" />
                            <div className="relative rounded-[2.5rem] border border-white/80 bg-white/85 p-5 shadow-soft backdrop-blur-xl sm:p-7">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500">Recommended for you</p>
                                        <p className="mt-1 text-xl font-extrabold text-ink">Friday evening shifts</p>
                                    </div>
                                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                                        <Sparkles size={22} aria-hidden="true" />
                                    </span>
                                </div>

                                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                                        <BadgeCheck size={20} aria-hidden="true" />
                                    </span>
                                    <div>
                                        <p className="text-xs font-semibold text-emerald-700">Shift confirmed</p>
                                        <p className="text-sm font-extrabold text-ink">Team ready</p>
                                    </div>
                                    <span className="ml-auto hidden rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 sm:inline-flex">Confirmed</span>
                                </div>

                                <div className="mt-4 rounded-3xl border border-brand-100 bg-canvas p-5 sm:p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-lg font-extrabold text-white">BW</span>
                                            <div>
                                                <h2 className="font-extrabold text-ink">Bartender · Harbour Kitchen</h2>
                                                <p className="mt-1 text-sm text-gray-500">Central, Hong Kong</p>
                                            </div>
                                        </div>
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">94% match</span>
                                    </div>
                                    <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-2xl bg-white p-4">
                                            <Clock3 className="mb-2 text-brand-600" size={18} aria-hidden="true" />
                                            <p className="font-bold text-ink">6:00–11:30 PM</p>
                                            <p className="mt-1 text-gray-500">Friday, 31 July</p>
                                        </div>
                                        <div className="rounded-2xl bg-white p-4">
                                            <WalletCards className="mb-2 text-accent-600" size={18} aria-hidden="true" />
                                            <p className="font-bold text-ink">HK$95 / hour</p>
                                            <p className="mt-1 text-gray-500">Paid after approval</p>
                                        </div>
                                    </div>
                                    <Button className="mt-5 w-full" icon={ArrowRight}>View shift details</Button>
                                </div>

                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-3xl bg-brand-900 p-5 text-white">
                                        <div className="flex -space-x-2">
                                            {["AM", "JL", "RS"].map((initials) => (
                                                <span key={initials} className="grid h-9 w-9 place-items-center rounded-full border-2 border-brand-900 bg-brand-100 text-xs font-extrabold text-brand-800">{initials}</span>
                                            ))}
                                        </div>
                                        <p className="mt-4 text-2xl font-extrabold">Reliable teams</p>
                                        <p className="mt-1 text-sm leading-6 text-brand-100">Build a trusted pool from every completed shift.</p>
                                    </div>
                                    <div className="rounded-3xl border border-accent-100 bg-accent-50 p-5">
                                        <div className="flex items-center gap-1 text-accent-600">
                                            {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={16} fill="currentColor" aria-hidden="true" />)}
                                        </div>
                                        <p className="mt-4 text-2xl font-extrabold text-ink">Better fit</p>
                                        <p className="mt-1 text-sm leading-6 text-gray-600">Clear profiles and ratings help every side choose confidently.</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                <section className="border-y border-brand-100 bg-white py-20 sm:py-24">
                    <div className="jh-container">
                        <div className="mx-auto max-w-2xl text-center">
                            <p className="jh-eyebrow">Everything in one place</p>
                            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">Less staffing friction. More great service.</h2>
                            <p className="mt-5 text-lg leading-8 text-gray-600">Built for the real pace of hospitality, from last-minute coverage to long-term team building.</p>
                        </div>
                        <div className="mt-12 grid gap-5 md:grid-cols-3">
                            {benefits.map(({ icon: Icon, title, copy }) => (
                                <article key={title} className="group rounded-3xl border border-gray-100 bg-white p-7 shadow-card transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft">
                                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
                                        <Icon size={22} aria-hidden="true" />
                                    </span>
                                    <h3 className="mt-6 text-xl font-extrabold text-ink">{title}</h3>
                                    <p className="mt-3 leading-7 text-gray-600">{copy}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-20 sm:py-24">
                    <div className="jh-container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
                        <div className="lg:sticky lg:top-28">
                            <p className="jh-eyebrow">Simple by design</p>
                            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">From open shift to ready team in three steps.</h2>
                            <p className="mt-5 text-lg leading-8 text-gray-600">JobHub keeps the details clear so workers and restaurants can make faster, more confident decisions.</p>
                            <Button className="mt-8" icon={ArrowRight} onClick={() => navigate("/register")}>Create an account</Button>
                        </div>
                        <div className="space-y-4">
                            {steps.map((step) => (
                                <article key={step.number} className="jh-panel flex gap-5 p-6 sm:gap-7 sm:p-8">
                                    <span className="text-3xl font-extrabold text-brand-300 sm:text-4xl">{step.number}</span>
                                    <div>
                                        <h3 className="text-xl font-extrabold text-ink sm:text-2xl">{step.title}</h3>
                                        <p className="mt-2 leading-7 text-gray-600">{step.copy}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="pb-20 sm:pb-24">
                    <div className="jh-container">
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-brand-900 px-6 py-14 text-center text-white shadow-soft sm:px-12 sm:py-16">
                            <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-brand-600/40 blur-3xl" aria-hidden="true" />
                            <div className="absolute -bottom-28 -right-20 h-64 w-64 rounded-full bg-accent-500/30 blur-3xl" aria-hidden="true" />
                            <div className="relative mx-auto max-w-3xl">
                                <MapPin className="mx-auto text-brand-200" size={34} aria-hidden="true" />
                                <h2 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">Your next great shift is closer than you think.</h2>
                                <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-brand-100">Join JobHub and bring dependable people and better opportunities together.</p>
                                <Button size="lg" variant="accent" className="mt-8" icon={ArrowRight} onClick={() => navigate("/register")}>Get started today</Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-brand-100 bg-white py-8">
                <div className="jh-container flex flex-col gap-4 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                    <BrandMark />
                    <p>© 2026 JobHub. Better hospitality staffing, together.</p>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
