/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WorkerHeader from "../components/WorkerHeader";
import PageHeader from "../components/ui/PageHeader";
import api from "../api/axios";
import {
    getNotificationButtonLabel,
    getNotificationPermission,
    getNotificationPreference,
    toggleNotificationPreference,
} from "../api/browserNotifications";
import { buildProfileDraft, getApiErrorMessage, getSavedUser, isActiveWorkerSession } from "./workerUtils";

function WorkerProfile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [user] = useState(getSavedUser);
    const [profile, setProfile] = useState(null);
    const [profileDraft, setProfileDraft] = useState(buildProfileDraft(null));
    const [selectedCv, setSelectedCv] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => getNotificationPreference(user?.id));
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        if (!isActiveWorkerSession(user)) {
            localStorage.removeItem("user");
            navigate("/login");
            return;
        }

        const loadProfile = async () => {
            try {
                const response = await api.get("/users/me");
                setProfile(response.data);
                setProfileDraft(buildProfileDraft(response.data));
            } catch (error) {
                console.error(error);
                setFeedback(getApiErrorMessage(error, "We couldn't load your profile right now."));
            }
        };

        loadProfile();
    }, [navigate, user]);

    const handleProfileDraftChange = (field, value) => {
        setProfileDraft((current) => ({ ...current, [field]: value }));
    };

    const handleSaveProfile = async () => {
        try {
            setFeedback("");
            setIsSaving(true);
            const response = await api.put("/users/me", profileDraft);
            setProfile(response.data);
            setProfileDraft(buildProfileDraft(response.data));
            const savedUser = getSavedUser();
            if (savedUser) {
                localStorage.setItem("user", JSON.stringify({ ...savedUser, name: response.data.name }));
            }
            setFeedback("Profile updated. Your next AI matches will use these details.");
        } catch (error) {
            console.error(error);
            setFeedback(getApiErrorMessage(error, "We couldn't update your profile."));
        } finally {
            setIsSaving(false);
        }
    };

    const handleCvUpload = async () => {
        if (!selectedCv) {
            fileInputRef.current?.click();
            return;
        }

        try {
            setFeedback("");
            setIsUploading(true);
            const formData = new FormData();
            formData.append("file", selectedCv);
            const response = await api.post("/users/me/cv", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setProfile(response.data);
            setSelectedCv(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setFeedback("CV uploaded. Your next AI matches will include its skills and experience.");
        } catch (error) {
            console.error(error);
            setFeedback(getApiErrorMessage(error, "We couldn't upload this CV."));
        } finally {
            setIsUploading(false);
        }
    };

    const handleToggleNotifications = async () => {
        const result = await toggleNotificationPreference(user?.id);
        setNotificationPermission(result.permission);
        setNotificationsEnabled(result.enabled);
    };

    return (
        <div className="jh-page">
            <WorkerHeader
                userName={profile?.name || user?.name}
                notificationLabel={getNotificationButtonLabel(notificationPermission, notificationsEnabled)}
                notificationsEnabled={notificationsEnabled}
                onToggleNotifications={handleToggleNotifications}
            />

            <div className="jh-container py-8 sm:py-10 lg:py-12">
                <section className="max-w-5xl rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8">
                    <PageHeader eyebrow="Profile" title="Build your matching profile" description="Your skills, experience, location, availability, and CV help AI rank the most relevant shifts for you." />

                    {feedback && (
                        <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700" role="status">
                            {feedback}
                        </div>
                    )}

                    <div className="grid gap-5 md:grid-cols-2">
                        <label><span className="jh-label">Full name</span><input type="text" value={profileDraft.name} onChange={(event) => handleProfileDraftChange("name", event.target.value)} placeholder="Your name" className="jh-field" /></label>
                        <label><span className="jh-label">Preferred location</span><input type="text" value={profileDraft.location} onChange={(event) => handleProfileDraftChange("location", event.target.value)} placeholder="Area or district" className="jh-field" /></label>
                        <label><span className="jh-label">Skills</span><textarea value={profileDraft.skills} onChange={(event) => handleProfileDraftChange("skills", event.target.value)} placeholder="For example: waiter, barista, cashier" className="jh-field min-h-[120px] resize-y" /></label>
                        <label><span className="jh-label">Availability</span><textarea value={profileDraft.availability} onChange={(event) => handleProfileDraftChange("availability", event.target.value)} placeholder="For example: weeknights after 6pm, Saturdays" className="jh-field min-h-[120px] resize-y" /></label>
                        <label className="md:col-span-2"><span className="jh-label">Work experience</span><textarea value={profileDraft.experience} onChange={(event) => handleProfileDraftChange("experience", event.target.value)} placeholder="Describe your previous roles, responsibilities, and years of experience" className="jh-field min-h-[150px] resize-y" maxLength={4000} /><span className="mt-2 block text-xs text-gray-500">Focus on relevant duties, equipment, cuisines, and service environments.</span></label>
                    </div>

                    <button type="button" onClick={handleSaveProfile} disabled={isSaving} className="mt-6 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300">
                        {isSaving ? "Saving..." : "Save profile"}
                    </button>
                </section>

                <section className="mt-8 max-w-5xl rounded-3xl border border-gray-100 bg-white p-6 shadow-card sm:p-8">
                    <div className="flex items-start gap-4">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700"><FileText size={24} aria-hidden="true" /></div>
                        <div>
                            <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-500">CV for AI matching</p>
                            <h2 className="mt-2 text-2xl font-bold text-gray-900">Add more detail with your CV</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">We extract the text from your CV so matching can consider relevant roles, responsibilities, and qualifications. Contact details and protected personal information are not matching factors.</p>
                        </div>
                    </div>

                    {profile?.cvFileName && (
                        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            <CheckCircle2 size={18} aria-hidden="true" />
                            <span><strong>Current CV:</strong> {profile.cvFileName}</span>
                        </div>
                    )}

                    <div className="mt-6 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-5">
                        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(event) => setSelectedCv(event.target.files?.[0] || null)} className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-white file:px-4 file:py-2.5 file:font-semibold file:text-brand-700 file:shadow-sm hover:file:bg-brand-50" aria-describedby="cv-help" />
                        <p id="cv-help" className="mt-3 text-xs text-gray-500">PDF, DOCX, or TXT · maximum 5 MB · uploading a new file replaces the current CV</p>
                        <button type="button" onClick={handleCvUpload} disabled={isUploading} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300">
                            <Upload size={18} aria-hidden="true" />
                            {isUploading ? "Uploading..." : selectedCv ? "Submit CV for matching" : "Choose a CV"}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default WorkerProfile;
