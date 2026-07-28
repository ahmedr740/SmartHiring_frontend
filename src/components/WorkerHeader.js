import { BellRing, BriefcaseBusiness, House, LogOut, Sparkles, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BrandMark from "./BrandMark";
import NotificationBell from "./NotificationBell";
import LanguageSwitcher from "./LanguageSwitcher";

const navItems = [
    { to: "/worker-home", label: "Home", icon: House },
    { to: "/worker-matches", label: "AI matches", icon: Sparkles },
    { to: "/worker-jobs", label: "My jobs", icon: BriefcaseBusiness },
    { to: "/worker-profile", label: "Profile", icon: UserRound },
];

function WorkerHeader({ userName, notificationLabel, notificationsEnabled, onToggleNotifications }) {
    const navigate = useNavigate();
    const currentPath = window.location.pathname;

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <header className="sticky top-0 z-30 border-b border-brand-100/80 bg-white/95 shadow-sm backdrop-blur-xl">
            <div className="jh-container flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center justify-between gap-4">
                    <BrandMark subtitle={`Welcome, ${userName || "Worker"}`} />
                    <div className="flex items-center gap-2 lg:hidden">
                        <LanguageSwitcher compact />
                        <NotificationBell />
                        <button type="button" onClick={handleLogout} className="grid h-11 w-11 place-items-center rounded-xl border border-gray-200 text-gray-500 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700" aria-label="Log out">
                            <LogOut size={18} aria-hidden="true" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:overflow-visible lg:pb-0">
                    <nav className="flex shrink-0 items-center gap-1 rounded-2xl bg-gray-50 p-1" aria-label="Worker navigation">
                        {navItems.map(({ to, label, icon: Icon }) => {
                            const isActive = currentPath === to;
                            return (
                                <button key={to} type="button" onClick={() => navigate(to)} aria-current={isActive ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition sm:px-4 ${isActive ? "bg-white text-brand-700 shadow-sm" : "text-gray-500 hover:bg-white hover:text-brand-700"}`}>
                                    <Icon size={16} aria-hidden="true" />
                                    <span className={label === "AI matches" ? "whitespace-nowrap" : "whitespace-nowrap"}>{label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {onToggleNotifications && (
                        <button type="button" onClick={onToggleNotifications} className={`hidden min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold xl:inline-flex ${notificationsEnabled ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border border-gray-200 text-gray-500 hover:bg-brand-50 hover:text-brand-700"}`} aria-pressed={notificationsEnabled}>
                            <BellRing size={16} aria-hidden="true" />
                            {notificationLabel || "Alerts off"}
                        </button>
                    )}

                    <div className="hidden items-center gap-2 lg:flex">
                        <LanguageSwitcher compact />
                        <NotificationBell />
                        <button type="button" onClick={handleLogout} className="grid h-11 w-11 place-items-center rounded-xl border border-gray-200 text-gray-500 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700" aria-label="Log out">
                            <LogOut size={18} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default WorkerHeader;
