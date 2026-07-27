import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, Building2, Mail, MapPin, Phone, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import api from "../api/axios";
import AuthShell from "../components/AuthShell";
import Button from "../components/ui/Button";

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        skills: "",
        role: "WORKER",
        restaurantName: "",
        phone: "",
        location: "",
    });
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    const handleRegister = async (event) => {
        event.preventDefault();

        try {
            setFeedback("");
            setIsSubmitting(true);
            await api.post("/auth/register", formData);

            if (formData.role === "MANAGER") {
                setFeedback("Manager account created. It will stay pending until an admin approves it.");
            } else {
                setFeedback("Registration successful. You can now log in.");
            }

            setTimeout(() => navigate("/login"), 1200);
        } catch (error) {
            console.error(error);
            setFeedback(error.response?.data?.message || "Registration failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isManager = formData.role === "MANAGER";

    return (
        <AuthShell eyebrow="Join the marketplace" title="Create your JobHub account" description="Choose how you will use JobHub, then add the details people need to work with you confidently.">
            {feedback && (
                <div role="status" className="mb-5 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
                    {feedback}
                </div>
            )}

            <form onSubmit={handleRegister} className="jh-panel space-y-5 p-6 sm:p-8">
                <fieldset>
                    <legend className="jh-label">I want to use JobHub as a</legend>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { value: "WORKER", title: "Worker", copy: "Find flexible shifts", icon: UsersRound },
                            { value: "MANAGER", title: "Manager", copy: "Build reliable teams", icon: BriefcaseBusiness },
                        ].map(({ value, title, copy, icon: Icon }) => (
                            <label key={value} className={`cursor-pointer rounded-2xl border p-4 transition ${formData.role === value ? "border-brand-500 bg-brand-50 shadow-sm" : "border-gray-200 bg-white hover:border-brand-200"}`}>
                                <input type="radio" className="sr-only" name="role" value={value} checked={formData.role === value} onChange={handleChange} />
                                <Icon size={20} className={formData.role === value ? "text-brand-700" : "text-gray-400"} aria-hidden="true" />
                                <span className="mt-3 block text-sm font-extrabold text-ink">{title}</span>
                                <span className="mt-1 block text-xs text-gray-500">{copy}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label htmlFor="register-name" className="jh-label">Full name</label>
                        <div className="relative"><UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" /><input id="register-name" type="text" name="name" autoComplete="name" placeholder="Your full name" value={formData.name} onChange={handleChange} required className="jh-field pl-11" /></div>
                    </div>
                    <div>
                        <label htmlFor="register-email" className="jh-label">Email address</label>
                        <div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" /><input id="register-email" type="email" name="email" autoComplete="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required className="jh-field pl-11" /></div>
                    </div>
                </div>

                <div>
                    <label htmlFor="register-password" className="jh-label">Password</label>
                    <div className="relative"><ShieldCheck className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" /><input id="register-password" type="password" name="password" autoComplete="new-password" placeholder="Create a secure password" value={formData.password} onChange={handleChange} required className="jh-field pl-11" /></div>
                </div>

                {isManager ? (
                    <div className="space-y-5 border-t border-gray-100 pt-5">
                        <div>
                            <label htmlFor="restaurant-name" className="jh-label">Restaurant name</label>
                            <div className="relative"><Building2 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" /><input id="restaurant-name" type="text" name="restaurantName" placeholder="Harbour Kitchen" value={formData.restaurantName} onChange={handleChange} required className="jh-field pl-11" /></div>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label htmlFor="manager-phone" className="jh-label">Phone number</label>
                                <div className="relative"><Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" /><input id="manager-phone" type="tel" name="phone" autoComplete="tel" placeholder="+852 2345 6789" value={formData.phone} onChange={handleChange} required className="jh-field pl-11" /></div>
                            </div>
                            <div>
                                <label htmlFor="manager-location" className="jh-label">Restaurant location</label>
                                <div className="relative"><MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" /><input id="manager-location" type="text" name="location" placeholder="Central, Hong Kong" value={formData.location} onChange={handleChange} required className="jh-field pl-11" /></div>
                            </div>
                        </div>
                        <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium leading-5 text-amber-800">Manager accounts are reviewed by an administrator before shift-posting access is enabled.</p>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="worker-skills" className="jh-label">Hospitality skills <span className="font-normal text-gray-400">(optional)</span></label>
                        <input id="worker-skills" type="text" name="skills" placeholder="Serving, bartending, cooking" value={formData.skills} onChange={handleChange} className="jh-field" />
                        <p className="mt-2 text-xs text-gray-500">Separate skills with commas to improve your job matches.</p>
                    </div>
                )}

                <Button type="submit" size="lg" icon={ArrowRight} disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Creating account…" : "Create my account"}
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <button type="button" onClick={() => navigate("/login")} className="min-h-11 font-bold text-brand-700 hover:text-brand-800 hover:underline">Log in</button>
            </p>
        </AuthShell>
    );
}

export default Register;
