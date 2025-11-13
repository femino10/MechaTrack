import React, { useEffect, useState, useCallback } from "react";
import "../styles/Inventory.css";

const Reports = () => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalRevenue: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });
  const [jobs, setJobs] = useState([]); // ← NEW: Store full job list

  const token = localStorage.getItem("token");

  const fetchStats = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch("http://127.0.0.1:5000/reports", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Reports error:", err);
    }
  }, [token]);

  const fetchJobs = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch("http://127.0.0.1:5000/jobs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Jobs fetch error:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
    fetchJobs();
  }, [fetchStats, fetchJobs]);

  const revenue = stats.totalRevenue.toLocaleString();

  // EXPORT TO CSV FUNCTION
  const exportToCSV = () => {
    if (jobs.length === 0) {
      alert("No jobs to export");
      return;
    }

    const headers = ["ID", "Customer", "Vehicle", "Service", "Cost (KSh)", "Status", "Date"];
    const rows = jobs.map(job => [
      job.id,
      job.customer_name,
      job.vehicle_reg,
      job.service,
      job.cost,
      job.status,
      new Date(job.created_at || Date.now()).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `mechatrack_jobs_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="inventory-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="inventory-title">Job Reports Dashboard</h1>
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow transition"
        >
          Export to CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-100 p-6 rounded-xl shadow">
          <h3 className="text-lg font-bold text-blue-900">Total Revenue</h3>
          <p className="text-3xl font-bold text-blue-700">KSh {revenue}</p>
        </div>
        <div className="bg-green-100 p-6 rounded-xl shadow">
          <h3 className="text-lg font-bold text-green-900">Completed Jobs</h3>
          <p className="text-3xl font-bold text-green-700">{stats.completed}</p>
        </div>
        <div className="bg-yellow-100 p-6 rounded-xl shadow">
          <h3 className="text-lg font-bold text-yellow-900">Pending Jobs</h3>
          <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4">Job Status Breakdown</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Pending</span>
            <span className="font-bold">{stats.pending}</span>
          </div>
          <div className="flex justify-between">
            <span>In Progress</span>
            <span className="font-bold">{stats.inProgress}</span>
          </div>
          <div className="flex justify-between">
            <span>Completed</span>
            <span className="font-bold">{stats.completed}</span>
          </div>
          <div className="h-1 bg-gray-200 rounded mt-4">
            <div 
              className="h-full bg-green-600 rounded transition-all duration-500" 
              style={{ 
                width: `${stats.totalJobs > 0 ? (stats.completed / stats.totalJobs) * 100 : 0}%` 
              }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 text-right">
            {stats.totalJobs > 0 
              ? Math.round((stats.completed / stats.totalJobs) * 100) 
              : 0}% Completion Rate
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;