import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import PartsInventory from "./pages/PartsInventory";
import Tools from "./pages/Tools";
import JobCards from "./pages/JobCards";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import "./App.css";

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Public Route
const PublicRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (user) return <Navigate to="/" replace />;  // ← Redirect to Dashboard
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex">
          <AuthContext.Consumer>
            {({ user }) => (
              <>
                {user && <Sidebar />}
                <div className="flex-grow-1">
                  {user && <Navbar />}
                  <div className={user ? "p-4" : ""}>
                    <Routes>
                      {/* PUBLIC */}
                      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

                      {/* PROTECTED */}
                      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/inventory" element={<ProtectedRoute><PartsInventory /></ProtectedRoute>} />
                      <Route path="/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
                      <Route path="/jobs" element={<ProtectedRoute><JobCards /></ProtectedRoute>} />
                      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

                      {/* FALLBACK */}
                      <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                  </div>
                </div>
              </>
            )}
          </AuthContext.Consumer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;