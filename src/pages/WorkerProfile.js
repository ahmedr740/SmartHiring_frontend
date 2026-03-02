/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkerHeader from "../components/WorkerHeader";
import api from "../api/axios";
import { buildProfileDraft, getSavedUser, isActiveWorkerSession } from "./workerUtils";

function WorkerProfile() {
    const navigate = useNavigate();
    const [user] = useState(getSavedUser);
    const [profile, setProfile] = useState(null);
    const [profileDraft, setProfileDraft] = useState(buildProfileDraft(null));
    const [isSaving, setIsSaving] = useState(false);
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
                setFeedback("We couldn't load your profile right now.");
            }
        };

        loadProfile();
    }, [navigate, user]); // eslint-disable-line react-hooks/exhaustive-deps

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
            setFeedback("Profile updated successfully.");
        } catch (error) {
            console.error(error);
            setFeedback(error.response?.data?.message || "We couldn't update your profile.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
            <WorkerHeader userName={profile?.name || user?.name} />

            <div className="px-8 py-12 md:px-20">
                <section className="max-w-5xl rounded-[2rem] bg-white p-8 shadow-xl">
                    <div className="mb-6">
                        <p className="text-sm uppercase tracking-[0.3em] text-orange-500">Profile</p>
                        <h2 className="mt-3 text-4xl font-bold text-gray-900">Update matching profile</h2>
                        <p className="mt-3 text-gray-600">Keep your skills, location, and availability updated so job matches are more accurate.</p>
                    </div>

                    {feedback && (
                        <div className="mb-6 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                            {feedback}
                        </div>
                    )}

                    <div className="grid gap-5 md:grid-cols-2">
                        <input
                            type="text"
                            value={profileDraft.name}
                            onChange={(event) => handleProfileDraftChange("name", event.target.value)}
                            placeholder="Your name"
                            className="rounded-2xl border border-orange-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                        <input
                            type="text"
                            value={profileDraft.location}
                            onChange={(event) => handleProfileDraftChange("location", event.target.value)}
                            placeholder="Preferred area or district"
                            className="rounded-2xl border border-orange-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                        <textarea
                            value={profileDraft.skills}
                            onChange={(event) => handleProfileDraftChange("skills", event.target.value)}
                            placeholder="Skills, separated by commas"
                            className="min-h-[120px] rounded-2xl border border-orange-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                        <textarea
                            value={profileDraft.availability}
                            onChange={(event) => handleProfileDraftChange("availability", event.target.value)}
                            placeholder="Availability, for example: Weeknights after 6pm, Saturdays"
                            className="min-h-[120px] rounded-2xl border border-orange-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="mt-6 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                    >
                        {isSaving ? "Saving..." : "Save profile"}
                    </button>
                </section>
            </div>
        </div>
    );
}

export default WorkerProfile;
