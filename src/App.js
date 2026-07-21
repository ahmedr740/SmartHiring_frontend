import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import WorkerHome from "./pages/WorkerHome";
import WorkerMatches from "./pages/WorkerMatches";
import WorkerProfile from "./pages/WorkerProfile";
import WorkerJobs from "./pages/WorkerJobs";
import ManagerHome from "./pages/ManagerHome";
import ManagerPostShift from "./pages/ManagerPostShift";
import ShiftChat from "./pages/ShiftChat";
import AdminHome from "./pages/AdminHome";
import Notifications from "./pages/Notifications";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/worker-home" element={<WorkerHome />} />
                <Route path="/worker-matches" element={<WorkerMatches />} />
                <Route path="/worker-profile" element={<WorkerProfile />} />
                <Route path="/worker-jobs" element={<WorkerJobs />} />
                <Route path="/manager-home" element={<ManagerHome />} />
                <Route path="/manager-post-shift" element={<ManagerPostShift />} />
                <Route path="/shift-chat/:shiftId" element={<ShiftChat />} />
                <Route path="/admin-home" element={<AdminHome />} />
                <Route path="/notifications" element={<Notifications />} />
            </Routes>
        </Router>
    );
}

export default App;
