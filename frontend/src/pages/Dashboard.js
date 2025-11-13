// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
  const [summary, setSummary] = useState({
    totalParts: 0,
    lowStock: 0,
    totalTools: 0,
    borrowedTools: 0,
    jobsInProgress: 0
  });
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      const token = getToken();
      if (!token) {
        alert("Please log in");
        window.location.href = "/login";
        return;
      }

      try {
        const partsRes = await fetch("http://127.0.0.1:5000/items", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const parts = partsRes.ok ? await partsRes.json() : [];

        const toolsRes = await fetch("http://127.0.0.1:5000/tools", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const tools = toolsRes.ok ? await toolsRes.json() : [];

        const jobsRes = await fetch("http://127.0.0.1:5000/jobs", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const jobs = jobsRes.ok ? await jobsRes.json() : [];

        const lowStock = parts.filter(p => p.quantity < 5).length;
        const borrowed = tools.filter(t => t.status === "Borrowed").length;
        const jobsInProgress = jobs.filter(j => j.status === "In Progress").length;

        setSummary({
          totalParts: parts.length,
          lowStock,
          totalTools: tools.length,
          borrowedTools: borrowed,
          jobsInProgress
        });

        const categories = [...new Set(parts.map(p => p.category || "Uncategorized"))];
        const lowByCat = categories.map(cat => 
          parts.filter(p => (p.category || "Uncategorized") === cat && p.quantity < 5).length
        );

        // COLOR-BLIND SAFE + SMALL PIE
        setChartData({
          labels: categories,
          datasets: [{
            data: lowByCat,
            backgroundColor: [
              '#1f77b4', // Blue
              '#ff7f0e', // Orange
              '#2ca02c', // Green
              '#d62728', // Red
              '#9467bd', // Purple
              '#8c564b', // Brown
              '#e377c2'  // Pink
            ],
            hoverBackgroundColor: [
              '#1a6699', '#e66f00', '#2a8c2a', '#b91c1c',
              '#7d4fa3', '#70432e', '#c461a8'
            ],
            borderColor: '#fff',
            borderWidth: 2
          }]
        });
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
        alert("Failed to load dashboard");
      }
    };
    fetchData();
  }, []);

  return (
    <div className="inventory-container">
      <h1 className="inventory-title">Dashboard</h1>

      {/* DASHBOARD CARDS */}
      <div className="row g-3">
        {[
          { title: "Total Parts", value: summary.totalParts },
          { title: "Low Stock Items", value: summary.lowStock },
          { title: "Total Tools", value: summary.totalTools },
          { title: "Borrowed Tools", value: summary.borrowedTools },
          { title: "Jobs In Progress", value: summary.jobsInProgress },
        ].map((card, i) => (
          <div className="col-md-4" key={i}>
            <div className="card bg-dark text-light shadow-sm border border-warning">
              <div className="card-body text-center">
                <h5>{card.title}</h5>
                <h3 className="text-warning">{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SMALL PIE CHART */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Low Stock by Category</h2>
        <div className="max-w-xs mx-auto">
          {chartData.labels.length > 0 ? (
            <Pie 
              data={chartData}
              height={300}
              width={300}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    position: 'bottom',
                    labels: { 
                      padding: 15, 
                      font: { size: 12 } 
                    } 
                  },
                  tooltip: { backgroundColor: '#1a1a1a' }
                }
              }}
            />
          ) : (
            <p className="text-center text-gray-500">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;