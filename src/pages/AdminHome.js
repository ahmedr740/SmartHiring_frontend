import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, CalendarDays, FileCheck2, LayoutDashboard, LogOut, ShieldAlert, UserCog, UserRound, Users } from "lucide-react";
import api from "../api/axios";
import BrandMark from "../components/BrandMark";
import NotificationBell from "../components/NotificationBell";
import { getApiErrorMessage, issueStatusClasses } from "./workerUtils";

const sections = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "approvals", label: "Manager approvals", icon: BadgeCheck },
    { id: "users", label: "Users", icon: Users },
    { id: "managers", label: "Managers", icon: UserCog },
    { id: "workers", label: "Workers", icon: UserRound },
    { id: "shifts", label: "Shifts", icon: CalendarDays },
    { id: "applications", label: "Applications", icon: FileCheck2 },
    { id: "issues", label: "Issue reports", icon: ShieldAlert },
];

const getSavedUser = () => JSON.parse(localStorage.getItem("user") || "null");

const normalizeSearch = (value) => (value || "").toLowerCase();

const buildStatCards = (overview) => [
    { label: "Total Users", value: overview.totalUsers },
    { label: "Active Managers", value: overview.activeManagers },
    { label: "Pending Managers", value: overview.pendingManagers },
    { label: "Workers", value: overview.totalWorkers },
    { label: "Open Shifts", value: overview.openShifts },
    { label: "Filled Shifts", value: overview.filledShifts },
    { label: "Completed Shifts", value: overview.completedShifts },
    { label: "Pending Applications", value: overview.pendingApplications },
    { label: "Accepted Applications", value: overview.acceptedApplications },
    { label: "Open Issues", value: overview.openIssues },
];

function AdminHome() {
    // The admin panel kept absorbing moderation tasks as we found edge cases,
    // so we only split out a few helper functions instead of a bigger refactor.
    const navigate = useNavigate();
    const user = getSavedUser();
    const userId = user?.id;
    const userRole = user?.role;
    const userToken = user?.token;

    const [activeSection, setActiveSection] = useState("dashboard");
    const [overview, setOverview] = useState(null);
    const [users, setUsers] = useState([]);
    const [pendingManagers, setPendingManagers] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [applications, setApplications] = useState([]);
    const [issues, setIssues] = useState([]);
    const [feedback, setFeedback] = useState("");
    const [busyKey, setBusyKey] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [userStatusFilter, setUserStatusFilter] = useState("ALL");
    const [shiftStatusFilter, setShiftStatusFilter] = useState("ALL");
    const [applicationStatusFilter, setApplicationStatusFilter] = useState("ALL");
    const [issueStatusFilter, setIssueStatusFilter] = useState("ALL");

    const fetchAdminData = async () => {
        try {
            const [
                overviewResponse,
                usersResponse,
                pendingResponse,
                shiftsResponse,
                applicationsResponse,
                issuesResponse,
            ] = await Promise.all([
                api.get("/admin/overview"),
                api.get("/admin/users"),
                api.get("/admin/manager-requests"),
                api.get("/shifts"),
                api.get("/applications"),
                api.get("/issues"),
            ]);

            setOverview(overviewResponse.data);
            setUsers(usersResponse.data);
            setPendingManagers(pendingResponse.data);
            setShifts(shiftsResponse.data);
            setApplications(applicationsResponse.data);
            setIssues(issuesResponse.data);
        } catch (error) {
            console.error(error);
            setFeedback(getApiErrorMessage(error, "We couldn't load the admin dashboard right now."));
        }
    };

    useEffect(() => {
        if (!userId || userRole !== "ADMIN" || !userToken) {
            navigate("/login");
            return;
        }

        fetchAdminData();
    }, [navigate, userId, userRole, userToken]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    const runAdminAction = async (action, successMessage) => {
        try {
            setFeedback("");
            await action();
            await fetchAdminData();
            setFeedback(successMessage);
        } catch (error) {
            console.error(error);
            setFeedback(getApiErrorMessage(error, "We couldn't complete that action right now."));
        } finally {
            setBusyKey("");
        }
    };

    const handleStatusUpdate = async (userId, status) => {
        const key = `user-status-${userId}-${status}`;
        setBusyKey(key);
        await runAdminAction(
            () => api.put(`/admin/users/${userId}/status`, { status }),
            `User status updated to ${status}.`
        );
    };

    const handleRoleUpdate = async (userId, role) => {
        const key = `user-role-${userId}-${role}`;
        setBusyKey(key);
        await runAdminAction(
            () => api.put(`/admin/users/${userId}/role`, { role }),
            `User role updated to ${role}.`
        );
    };

    const handleShiftStatus = async (shiftId, status) => {
        const key = `shift-status-${shiftId}-${status}`;
        setBusyKey(key);
        await runAdminAction(
            () => api.put(`/shifts/${shiftId}/status`, { status }),
            `Shift updated to ${status}.`
        );
    };

    const handleDeleteShift = async (shiftId) => {
        const key = `shift-delete-${shiftId}`;
        setBusyKey(key);
        await runAdminAction(
            () => api.delete(`/shifts/${shiftId}`),
            "Shift deleted successfully."
        );
    };

    const handleApplicationStatus = async (applicationId, status) => {
        const key = `application-status-${applicationId}-${status}`;
        setBusyKey(key);
        await runAdminAction(
            () => api.put(`/applications/${applicationId}/status`, { status }),
            `Application updated to ${status}.`
        );
    };

    const handleIssueStatus = async (issueId, status) => {
        const key = `issue-status-${issueId}-${status}`;
        setBusyKey(key);
        await runAdminAction(
            () => api.put(`/issues/${issueId}/status`, { status }),
            `Issue updated to ${status}.`
        );
    };

    const matchesUserSearch = (currentUser) =>
        normalizeSearch(currentUser.name).includes(normalizeSearch(userSearch)) ||
        normalizeSearch(currentUser.email).includes(normalizeSearch(userSearch)) ||
        normalizeSearch(currentUser.restaurantName).includes(normalizeSearch(userSearch)) ||
        normalizeSearch(currentUser.location).includes(normalizeSearch(userSearch));

    const filterUsers = (list) =>
        list.filter((currentUser) => {
            const matchesStatus =
                userStatusFilter === "ALL" || (currentUser.status || "ACTIVE") === userStatusFilter;

            return matchesUserSearch(currentUser) && matchesStatus;
        });

    const filteredUsers = filterUsers(users);
    const filteredManagers = filterUsers(users.filter((currentUser) => currentUser.role === "MANAGER"));
    const filteredWorkers = filterUsers(users.filter((currentUser) => currentUser.role === "WORKER"));

    const filteredShifts = shifts.filter((shift) =>
        (shiftStatusFilter === "ALL" || (shift.status || "OPEN") === shiftStatusFilter) &&
        (
            normalizeSearch(shift.title).includes(normalizeSearch(userSearch)) ||
            normalizeSearch(shift.location).includes(normalizeSearch(userSearch)) ||
            normalizeSearch(shift.manager?.name).includes(normalizeSearch(userSearch)) ||
            normalizeSearch(shift.manager?.restaurantName).includes(normalizeSearch(userSearch))
        )
    );

    const filteredApplications = applications.filter((application) =>
        (applicationStatusFilter === "ALL" || application.status === applicationStatusFilter) &&
        (
            normalizeSearch(application.worker?.name).includes(normalizeSearch(userSearch)) ||
            normalizeSearch(application.worker?.email).includes(normalizeSearch(userSearch)) ||
            normalizeSearch(application.shift?.title).includes(normalizeSearch(userSearch)) ||
            normalizeSearch(application.shift?.manager?.name).includes(normalizeSearch(userSearch)) ||
            normalizeSearch(application.shift?.manager?.restaurantName).includes(normalizeSearch(userSearch))
        )
    );

    const filteredIssues = issues.filter((issue) =>
        (issueStatusFilter === "ALL" || issue.status === issueStatusFilter) &&
        (
            normalizeSearch(issue.reportedBy?.name).includes(normalizeSearch(userSearch)) ||
            normalizeSearch(issue.reportedBy?.email).includes(normalizeSearch(userSearch)) ||
            normalizeSearch(issue.shift?.title).includes(normalizeSearch(userSearch)) ||
            normalizeSearch(issue.shift?.manager?.restaurantName).includes(normalizeSearch(userSearch)) ||
            normalizeSearch(issue.description).includes(normalizeSearch(userSearch))
        )
    );

    const statCards = overview ? buildStatCards(overview) : [];

    const formatDate = (value) => {
        if (!value) {
            return "N/A";
        }

        return new Date(value).toLocaleString();
    };

    const renderFilters = (showShiftFilters = false, showApplicationFilters = false) => (
        <div className="flex flex-col gap-3 rounded-3xl bg-white p-5 shadow-card lg:flex-row lg:items-center">
            <input
                type="text"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search by name, email, restaurant, or location"
                className="w-full rounded-2xl border border-brand-200 px-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            />
            <select
                value={userStatusFilter}
                onChange={(event) => setUserStatusFilter(event.target.value)}
                className="rounded-2xl border border-brand-200 px-4 py-3"
            >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
            </select>
            {showShiftFilters && (
                <select
                    value={shiftStatusFilter}
                    onChange={(event) => setShiftStatusFilter(event.target.value)}
                    className="rounded-2xl border border-brand-200 px-4 py-3"
                >
                    <option value="ALL">All Shift Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="FILLED">Filled</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            )}
            {showApplicationFilters === true && (
                <select
                    value={applicationStatusFilter}
                    onChange={(event) => setApplicationStatusFilter(event.target.value)}
                    className="rounded-2xl border border-brand-200 px-4 py-3"
                >
                    <option value="ALL">All Application Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            )}
            {showApplicationFilters === "issues" && (
                <select
                    value={issueStatusFilter}
                    onChange={(event) => setIssueStatusFilter(event.target.value)}
                    className="rounded-2xl border border-brand-200 px-4 py-3"
                >
                    <option value="ALL">All Issue Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="REVIEWING">Reviewing</option>
                    <option value="RESOLVED">Resolved</option>
                </select>
            )}
        </div>
    );

    const renderUserTable = (list) => (
        <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-card">
            <table className="min-w-full text-left text-sm">
                <thead className="bg-brand-50 text-gray-600">
                <tr>
                    <th className="px-5 py-4 font-semibold">User</th>
                    <th className="px-5 py-4 font-semibold">Role</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Details</th>
                    <th className="px-5 py-4 font-semibold">Joined</th>
                    <th className="px-5 py-4 font-semibold">Actions</th>
                </tr>
                </thead>
                <tbody>
                {list.map((currentUser) => (
                    <tr key={currentUser.id} className="border-t border-brand-100 align-top">
                        <td className="px-5 py-4">
                            <p className="font-semibold text-gray-900">{currentUser.name}</p>
                            <p className="text-gray-500">{currentUser.email}</p>
                            {currentUser.phone && <p className="text-gray-500">{currentUser.phone}</p>}
                        </td>
                        <td className="px-5 py-4">
                            <select
                                value={currentUser.role}
                                onChange={(event) => handleRoleUpdate(currentUser.id, event.target.value)}
                                className="rounded-xl border border-brand-200 px-3 py-2"
                                disabled={busyKey.startsWith(`user-role-${currentUser.id}`)}
                            >
                                <option value="ADMIN">ADMIN</option>
                                <option value="MANAGER">MANAGER</option>
                                <option value="WORKER">WORKER</option>
                            </select>
                        </td>
                        <td className="px-5 py-4">
                            <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                                {currentUser.status || "ACTIVE"}
                            </span>
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                            <p>{currentUser.restaurantName || currentUser.skills || "No extra details"}</p>
                            <p>{currentUser.location || "N/A"}</p>
                        </td>
                        <td className="px-5 py-4 text-gray-600">{formatDate(currentUser.createdAt)}</td>
                        <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                                {["ACTIVE", "SUSPENDED", "REJECTED"].map((status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => handleStatusUpdate(currentUser.id, status)}
                                        disabled={busyKey === `user-status-${currentUser.id}-${status}`}
                                        className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {busyKey === `user-status-${currentUser.id}-${status}` ? "Updating..." : status}
                                    </button>
                                ))}
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="min-h-screen bg-canvas text-gray-900">
            <div className="flex min-h-screen flex-col lg:flex-row">
                <aside className="bg-brand-950 px-5 py-5 text-white lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:px-6 lg:py-8">
                    <div className="mb-5 lg:mb-10">
                        <BrandMark light subtitle="Admin operations" />
                    </div>

                    <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Admin navigation">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            return (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => setActiveSection(section.id)}
                                aria-current={activeSection === section.id ? "page" : undefined}
                                className={`inline-flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition lg:w-full ${
                                    activeSection === section.id
                                        ? "bg-brand-600 text-white shadow-card"
                                        : "text-brand-100 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                <Icon size={18} aria-hidden="true" />
                                {section.label}
                            </button>
                            );
                        })}
                    </nav>
                </aside>

                <main className="flex-1 px-6 py-8 md:px-10">
                    <div className="mb-8 flex items-start justify-between gap-4">
                        <div>
                            <p className="jh-eyebrow">Admin workspace</p>
                            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{sections.find((section) => section.id === activeSection)?.label}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                        <NotificationBell />
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="grid h-11 w-11 place-items-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                            aria-label="Log out"
                        >
                            <LogOut size={18} aria-hidden="true" />
                        </button>
                        </div>
                    </div>

                    {feedback && (
                        <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                            {feedback}
                        </div>
                    )}

                    {activeSection === "dashboard" && (
                        <div className="space-y-8">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {statCards.map((card) => (
                                    <div key={card.label} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                                        <p className="text-sm uppercase tracking-[0.25em] text-brand-500">{card.label}</p>
                                        <p className="mt-4 text-4xl font-bold text-gray-900">{card.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid gap-8 xl:grid-cols-3">
                                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                                    <h3 className="text-2xl font-bold">Approval Queue</h3>
                                    <p className="mt-2 text-sm text-gray-500">Managers waiting for review.</p>
                                    <div className="mt-5 space-y-4">
                                        {pendingManagers.length > 0 ? (
                                            pendingManagers.slice(0, 4).map((manager) => (
                                                <div key={manager.id} className="rounded-3xl border border-brand-100 bg-brand-50/60 p-4">
                                                    <p className="font-semibold text-gray-900">{manager.name}</p>
                                                    <p className="text-sm text-gray-600">{manager.restaurantName}</p>
                                                    <p className="text-sm text-gray-500">{manager.location}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="mt-5 text-gray-600">No pending manager approvals right now.</p>
                                        )}
                                    </div>
                                </section>

                                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                                    <h3 className="text-2xl font-bold">Shift Health</h3>
                                    <div className="mt-5 space-y-4">
                                        <div className="rounded-3xl border border-brand-100 p-4">
                                            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Open</p>
                                            <p className="mt-2 text-3xl font-bold">{overview?.openShifts || 0}</p>
                                        </div>
                                        <div className="rounded-3xl border border-brand-100 p-4">
                                            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Filled</p>
                                            <p className="mt-2 text-3xl font-bold">{overview?.filledShifts || 0}</p>
                                        </div>
                                        <div className="rounded-3xl border border-brand-100 p-4">
                                            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Cancelled</p>
                                            <p className="mt-2 text-3xl font-bold">{overview?.cancelledShifts || 0}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                                    <h3 className="text-2xl font-bold">Application Pipeline</h3>
                                    <div className="mt-5 space-y-4">
                                        <div className="rounded-3xl border border-brand-100 p-4">
                                            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Pending</p>
                                            <p className="mt-2 text-3xl font-bold">{overview?.pendingApplications || 0}</p>
                                        </div>
                                        <div className="rounded-3xl border border-brand-100 p-4">
                                            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Accepted</p>
                                            <p className="mt-2 text-3xl font-bold">{overview?.acceptedApplications || 0}</p>
                                        </div>
                                        <div className="rounded-3xl border border-brand-100 p-4">
                                            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Rejected</p>
                                            <p className="mt-2 text-3xl font-bold">{overview?.rejectedApplications || 0}</p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="grid gap-8 xl:grid-cols-3">
                                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                                    <h3 className="text-2xl font-bold">Payments</h3>
                                    <div className="mt-5 space-y-4">
                                        <div className="rounded-3xl border border-brand-100 p-4">
                                            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Paid Completed</p>
                                            <p className="mt-2 text-3xl font-bold">{overview?.paidCompletedShifts || 0}</p>
                                        </div>
                                        <div className="rounded-3xl border border-brand-100 p-4">
                                            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Unpaid Completed</p>
                                            <p className="mt-2 text-3xl font-bold">{overview?.unpaidCompletedShifts || 0}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                                    <h3 className="text-2xl font-bold">Average Ratings</h3>
                                    <div className="mt-5 space-y-4">
                                        <div className="rounded-3xl border border-brand-100 p-4">
                                            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Managers</p>
                                            <p className="mt-2 text-3xl font-bold">{Number(overview?.averageManagerRating || 0).toFixed(1)}</p>
                                        </div>
                                        <div className="rounded-3xl border border-brand-100 p-4">
                                            <p className="text-sm uppercase tracking-[0.2em] text-brand-500">Workers</p>
                                            <p className="mt-2 text-3xl font-bold">{Number(overview?.averageWorkerRating || 0).toFixed(1)}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                                    <h3 className="text-2xl font-bold">Recent Completed Shifts</h3>
                                    <div className="mt-5 space-y-4">
                                        {overview?.recentCompletedShifts?.length > 0 ? (
                                            overview.recentCompletedShifts.map((shift) => (
                                                <div key={shift.id} className="rounded-3xl border border-brand-100 bg-brand-50/50 p-4">
                                                    <p className="font-semibold text-gray-900">{shift.title}</p>
                                                    <p className="text-sm text-gray-600">{shift.manager?.restaurantName || shift.manager?.name}</p>
                                                    <p className="text-sm text-gray-500">{shift.location}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-600">No completed shifts yet.</p>
                                        )}
                                    </div>
                                </section>
                            </div>

                            <div className="grid gap-8 xl:grid-cols-3">
                                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                                    <h3 className="text-2xl font-bold">Top Managers</h3>
                                    <div className="mt-5 space-y-4">
                                        {overview?.topManagers?.length > 0 ? (
                                            overview.topManagers.map((manager) => (
                                                <div key={manager.id} className="rounded-3xl border border-brand-100 p-4">
                                                    <p className="font-semibold text-gray-900">{manager.name}</p>
                                                    <p className="text-sm text-gray-600">{manager.restaurantName || manager.email}</p>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Rating {Number(manager.rating || 0).toFixed(1)} · {manager.completedShiftsCount || 0} completed
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-600">No manager performance data yet.</p>
                                        )}
                                    </div>
                                </section>

                                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                                    <h3 className="text-2xl font-bold">Top Workers</h3>
                                    <div className="mt-5 space-y-4">
                                        {overview?.topWorkers?.length > 0 ? (
                                            overview.topWorkers.map((worker) => (
                                                <div key={worker.id} className="rounded-3xl border border-brand-100 p-4">
                                                    <p className="font-semibold text-gray-900">{worker.name}</p>
                                                    <p className="text-sm text-gray-600">{worker.location || worker.email}</p>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Rating {Number(worker.rating || 0).toFixed(1)} · {worker.completedShiftsCount || 0} completed
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-600">No worker performance data yet.</p>
                                        )}
                                    </div>
                                </section>

                                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                                    <h3 className="text-2xl font-bold">Recent Ratings</h3>
                                    <div className="mt-5 space-y-4">
                                        {overview?.recentRatings?.length > 0 ? (
                                            overview.recentRatings.map((application) => (
                                                <div key={application.id} className="rounded-3xl border border-brand-100 p-4">
                                                    <p className="font-semibold text-gray-900">{application.shift?.title || "Completed shift"}</p>
                                                    <p className="text-sm text-gray-600">{application.worker?.name || "Worker"}</p>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Worker rated: {application.workerRating || "-"} · Manager rated: {application.managerRating || "-"}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-600">No rating activity yet.</p>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeSection === "approvals" && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-3xl font-bold">Pending Manager Approvals</h3>
                                <p className="mt-2 text-gray-600">Only approved managers can access posting and moderation tools.</p>
                            </div>

                            <div className="grid gap-6 xl:grid-cols-2">
                                {pendingManagers.length > 0 ? (
                                    pendingManagers.map((manager) => (
                                        <article key={manager.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-card">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h4 className="text-xl font-bold text-gray-900">{manager.name}</h4>
                                                    <p className="text-gray-500">{manager.email}</p>
                                                </div>
                                                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                                                    {manager.status}
                                                </span>
                                            </div>

                                            <div className="mt-5 space-y-2 text-sm text-gray-600">
                                                <p><span className="font-semibold text-gray-800">Restaurant:</span> {manager.restaurantName}</p>
                                                <p><span className="font-semibold text-gray-800">Phone:</span> {manager.phone}</p>
                                                <p><span className="font-semibold text-gray-800">Location:</span> {manager.location}</p>
                                                <p><span className="font-semibold text-gray-800">Joined:</span> {formatDate(manager.createdAt)}</p>
                                            </div>

                                            <div className="mt-6 flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusUpdate(manager.id, "ACTIVE")}
                                                    disabled={busyKey === `user-status-${manager.id}-ACTIVE`}
                                                    className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                                                >
                                                    {busyKey === `user-status-${manager.id}-ACTIVE` ? "Approving..." : "Approve"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusUpdate(manager.id, "REJECTED")}
                                                    disabled={busyKey === `user-status-${manager.id}-REJECTED`}
                                                    className="rounded-2xl border border-brand-300 px-4 py-3 font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
                                                >
                                                    {busyKey === `user-status-${manager.id}-REJECTED` ? "Rejecting..." : "Reject"}
                                                </button>
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <div className="rounded-3xl bg-white p-6 text-gray-600 shadow-card">
                                        No pending manager accounts right now.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === "users" && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-3xl font-bold">All Users</h3>
                                <p className="mt-2 text-gray-600">Search, promote, suspend, or reject accounts from one place.</p>
                            </div>
                            {renderFilters()}
                            {renderUserTable(filteredUsers)}
                        </div>
                    )}

                    {activeSection === "managers" && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-3xl font-bold">Managers</h3>
                                <p className="mt-2 text-gray-600">Review active, pending, and suspended restaurant accounts.</p>
                            </div>
                            {renderFilters()}
                            {renderUserTable(filteredManagers)}
                        </div>
                    )}

                    {activeSection === "workers" && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-3xl font-bold">Workers</h3>
                                <p className="mt-2 text-gray-600">Track worker access and platform participation.</p>
                            </div>
                            {renderFilters()}
                            {renderUserTable(filteredWorkers)}
                        </div>
                    )}

                    {activeSection === "shifts" && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-3xl font-bold">Shift Moderation</h3>
                                <p className="mt-2 text-gray-600">Change shift status or remove listings that should no longer be live.</p>
                            </div>
                            {renderFilters(true, false)}
                            <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-card">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-brand-50 text-gray-600">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">Shift</th>
                                        <th className="px-5 py-4 font-semibold">Manager</th>
                                        <th className="px-5 py-4 font-semibold">Status</th>
                                        <th className="px-5 py-4 font-semibold">Schedule</th>
                                        <th className="px-5 py-4 font-semibold">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredShifts.map((shift) => (
                                        <tr key={shift.id} className="border-t border-brand-100 align-top">
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-gray-900">{shift.title}</p>
                                                <p className="text-gray-500">{shift.roleNeeded}</p>
                                                <p className="text-gray-500">{shift.location}</p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                <p>{shift.manager?.name || "N/A"}</p>
                                                <p>{shift.manager?.restaurantName || "N/A"}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                                                    {shift.status || "OPEN"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600">
                                                <p>{shift.date}</p>
                                                <p>{shift.startTime} - {shift.endTime}</p>
                                                <p>${shift.pay}/hr</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {["OPEN", "FILLED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((status) => (
                                                        <button
                                                            key={status}
                                                            type="button"
                                                            onClick={() => handleShiftStatus(shift.id, status)}
                                                            disabled={busyKey === `shift-status-${shift.id}-${status}`}
                                                            className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {busyKey === `shift-status-${shift.id}-${status}` ? "Updating..." : status}
                                                        </button>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteShift(shift.id)}
                                                        disabled={busyKey === `shift-delete-${shift.id}`}
                                                        className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {busyKey === `shift-delete-${shift.id}` ? "Deleting..." : "Delete"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSection === "applications" && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-3xl font-bold">Application Moderation</h3>
                                <p className="mt-2 text-gray-600">Resolve applications directly from the admin panel.</p>
                            </div>
                            {renderFilters(false, true)}
                            <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-card">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-brand-50 text-gray-600">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">Worker</th>
                                        <th className="px-5 py-4 font-semibold">Shift</th>
                                        <th className="px-5 py-4 font-semibold">Manager</th>
                                        <th className="px-5 py-4 font-semibold">Status</th>
                                        <th className="px-5 py-4 font-semibold">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredApplications.map((application) => (
                                        <tr key={application.id} className="border-t border-brand-100 align-top">
                                            <td className="px-5 py-4 text-gray-700">
                                                <p className="font-semibold">{application.worker?.name || "N/A"}</p>
                                                <p>{application.worker?.email || "N/A"}</p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-700">
                                                <p className="font-semibold">{application.shift?.title || "N/A"}</p>
                                                <p>{application.shift?.location || "N/A"}</p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-700">
                                                <p>{application.shift?.manager?.name || "N/A"}</p>
                                                <p>{application.shift?.manager?.restaurantName || "N/A"}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                                                    {application.status}
                                                </span>
                                                <p className="mt-2 text-xs text-gray-500">{formatDate(application.createdAt)}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {["PENDING", "ACCEPTED", "REJECTED"].map((status) => (
                                                        <button
                                                            key={status}
                                                            type="button"
                                                            onClick={() => handleApplicationStatus(application.id, status)}
                                                            disabled={busyKey === `application-status-${application.id}-${status}`}
                                                            className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {busyKey === `application-status-${application.id}-${status}` ? "Updating..." : status}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSection === "issues" && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-3xl font-bold">Issue Reports</h3>
                                <p className="mt-2 text-gray-600">Track worker and manager reports for disputes, payment questions, and shift problems.</p>
                            </div>
                            {renderFilters(false, "issues")}
                            <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-card">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-brand-50 text-gray-600">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold">Reporter</th>
                                        <th className="px-5 py-4 font-semibold">Shift</th>
                                        <th className="px-5 py-4 font-semibold">Issue</th>
                                        <th className="px-5 py-4 font-semibold">Status</th>
                                        <th className="px-5 py-4 font-semibold">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredIssues.map((issue) => (
                                        <tr key={issue.id} className="border-t border-brand-100 align-top">
                                            <td className="px-5 py-4 text-gray-700">
                                                <p className="font-semibold">{issue.reportedBy?.name || "N/A"}</p>
                                                <p>{issue.reportedBy?.email || "N/A"}</p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-700">
                                                <p className="font-semibold">{issue.shift?.title || "N/A"}</p>
                                                <p>{issue.shift?.manager?.restaurantName || issue.shift?.manager?.name || "N/A"}</p>
                                            </td>
                                            <td className="px-5 py-4 text-gray-700">
                                                <p className="font-semibold">{issue.category || "GENERAL"}</p>
                                                <p>{issue.description}</p>
                                                <p className="mt-2 text-xs text-gray-500">{formatDate(issue.createdAt)}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${issueStatusClasses[issue.status] || "bg-gray-100 text-gray-700"}`}>
                                                    {issue.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {["OPEN", "REVIEWING", "RESOLVED"].map((status) => (
                                                        <button
                                                            key={status}
                                                            type="button"
                                                            onClick={() => handleIssueStatus(issue.id, status)}
                                                            disabled={busyKey === `issue-status-${issue.id}-${status}`}
                                                            className="rounded-xl border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {busyKey === `issue-status-${issue.id}-${status}` ? "Updating..." : status}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default AdminHome;
