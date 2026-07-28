import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, CheckCircle2, LogOut, Mail, MapPin, Phone, Save, Star, UserRound } from "lucide-react";
import api from "../api/axios";
import BrandMark from "../components/BrandMark";
import NotificationBell from "../components/NotificationBell";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import { getApiErrorMessage, getSavedUser } from "./workerUtils";

const buildDraft = (profile) => ({
    name: profile?.name || "",
    restaurantName: profile?.restaurantName || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
});

function ManagerProfile() {
    const navigate = useNavigate();
    const user = getSavedUser();
    const [profile, setProfile] = useState(null);
    const [draft, setDraft] = useState(buildDraft(user));
    const [feedback, setFeedback] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!user?.id || user?.role !== "MANAGER" || user?.status !== "ACTIVE") {
            navigate("/login");
            return;
        }

        const loadProfile = async () => {
            try {
                const response = await api.get("/users/me");
                setProfile(response.data);
                setDraft(buildDraft(response.data));
            } catch (error) {
                console.error(error);
                setFeedback({ type: "error", message: getApiErrorMessage(error, "We couldn't load the restaurant profile right now.") });
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (field, value) => {
        setDraft((current) => ({ ...current, [field]: value }));
        setFeedback(null);
    };

    const handleSave = async (event) => {
        event.preventDefault();

        try {
            setIsSaving(true);
            setFeedback(null);
            const response = await api.put("/users/me", draft);
            setProfile(response.data);
            setDraft(buildDraft(response.data));

            const savedUser = getSavedUser();
            localStorage.setItem("user", JSON.stringify({
                ...savedUser,
                name: response.data.name,
                restaurantName: response.data.restaurantName,
                phone: response.data.phone,
                location: response.data.location,
            }));
            setFeedback({ type: "success", message: "Restaurant profile updated successfully." });
        } catch (error) {
            console.error(error);
            setFeedback({ type: "error", message: getApiErrorMessage(error, "We couldn't save those changes. Please try again.") });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    const initials = (draft.restaurantName || draft.name || "JH")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");

    return (
        <div className="jh-page">
            <header className="sticky top-0 z-30 border-b border-brand-100/80 bg-white/95 shadow-sm backdrop-blur-xl">
                <div className="jh-container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <BrandMark subtitle={`Manager · ${profile?.restaurantName || user?.restaurantName || "Restaurant profile"}`} />
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher compact />
                        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate("/manager-home")}>Dashboard</Button>
                        <NotificationBell />
                        <button type="button" onClick={handleLogout} className="grid h-11 w-11 place-items-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700" aria-label="Log out">
                            <LogOut size={18} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="jh-container py-8 sm:py-10 lg:py-12">
                <PageHeader eyebrow="Manager account" title="Restaurant profile" description="Keep your business and contact details accurate so workers know who they are applying to work with." />

                {feedback && (
                    <div role={feedback.type === "error" ? "alert" : "status"} className={`mb-6 max-w-5xl rounded-2xl border px-4 py-3 text-sm font-semibold ${feedback.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
                        {feedback.message}
                    </div>
                )}

                <div className="grid max-w-6xl gap-6 lg:grid-cols-[0.34fr_0.66fr]">
                    <aside className="h-fit rounded-3xl bg-brand-950 p-6 text-white shadow-soft sm:p-8">
                        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-brand-600 text-2xl font-extrabold text-white shadow-card">{initials}</div>
                        <h2 className="mt-6 text-2xl font-extrabold">{draft.restaurantName || "Your restaurant"}</h2>
                        <p className="mt-2 flex items-center gap-2 text-sm text-brand-100"><MapPin size={16} aria-hidden="true" />{draft.location || "Add your location"}</p>
                        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-200">
                            <CheckCircle2 size={14} aria-hidden="true" /> Active manager
                        </span>

                        <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6">
                            <div className="rounded-2xl bg-white/10 p-4">
                                <Star size={18} className="text-amber-300" fill="currentColor" aria-hidden="true" />
                                <p className="mt-3 text-2xl font-extrabold">{Number(profile?.rating || 0).toFixed(1)}</p>
                                <p className="mt-1 text-xs text-brand-100">{profile?.ratingCount || 0} ratings</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 p-4">
                                <CheckCircle2 size={18} className="text-brand-200" aria-hidden="true" />
                                <p className="mt-3 text-2xl font-extrabold">{profile?.completedShiftsCount || 0}</p>
                                <p className="mt-1 text-xs text-brand-100">completed shifts</p>
                            </div>
                        </div>
                    </aside>

                    <form onSubmit={handleSave} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8">
                        <div className="mb-7">
                            <p className="jh-eyebrow">Business details</p>
                            <h2 className="mt-2 text-2xl font-extrabold text-ink">Profile information</h2>
                            <p className="mt-2 text-sm leading-6 text-gray-500">These details are used throughout your manager workspace and shift listings.</p>
                        </div>

                        {isLoading ? (
                            <div className="rounded-2xl bg-brand-50 px-5 py-10 text-center text-sm font-medium text-brand-700">Loading restaurant profile…</div>
                        ) : (
                            <div className="grid gap-5 sm:grid-cols-2">
                                <label><span className="jh-label">Manager name</span><span className="relative block"><UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" /><input type="text" value={draft.name} onChange={(event) => handleChange("name", event.target.value)} className="jh-field pl-11" required /></span></label>
                                <label><span className="jh-label">Restaurant name</span><span className="relative block"><Building2 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" /><input type="text" value={draft.restaurantName} onChange={(event) => handleChange("restaurantName", event.target.value)} className="jh-field pl-11" required /></span></label>
                                <label><span className="jh-label">Phone number</span><span className="relative block"><Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" /><input type="tel" value={draft.phone} onChange={(event) => handleChange("phone", event.target.value)} className="jh-field pl-11" required /></span></label>
                                <label><span className="jh-label">Restaurant location</span><span className="relative block"><MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" /><input type="text" value={draft.location} onChange={(event) => handleChange("location", event.target.value)} className="jh-field pl-11" required /></span></label>

                                <div className="rounded-2xl border border-gray-100 bg-canvas p-4 sm:col-span-2">
                                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-500"><Mail size={15} aria-hidden="true" /> Account email</p>
                                    <p className="mt-2 break-all font-semibold text-ink">{profile?.email || user?.email}</p>
                                    <p className="mt-1 text-xs text-gray-500">Your login email cannot be changed from this page.</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-7 flex justify-end border-t border-gray-100 pt-6">
                            <Button type="submit" icon={Save} disabled={isLoading || isSaving}>
                                {isSaving ? "Saving changes…" : "Save profile"}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

export default ManagerProfile;
