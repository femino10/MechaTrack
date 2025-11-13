// src/pages/JobCards.js
import React, { useEffect, useState, useCallback } from "react";
import "../styles/Inventory.css";

const JobCards = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [formData, setFormData] = useState({
    customer_name: "",
    vehicle_reg: "",
    service: "",
    status: "Pending",
    cost: ""
  });
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const getToken = () => localStorage.getItem("token");

  const fetchJobs = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch("http://127.0.0.1:5000/jobs", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items = Array.isArray(data) ? data : [];
      setJobs(items);
      setFilteredJobs(items);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    let filtered = jobs;
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.vehicle_reg.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedStatus !== "All") {
      filtered = filtered.filter(j => j.status === selectedStatus);
    }
    setFilteredJobs(filtered);
  }, [searchTerm, selectedStatus, jobs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return alert("Login required");

    const payload = {
      customer_name: formData.customer_name.trim(),
      vehicle_reg: formData.vehicle_reg.trim(),
      service: formData.service.trim(),
      cost: parseFloat(formData.cost),
      status: formData.status
    };

    if (!payload.customer_name || !payload.vehicle_reg || !payload.service || payload.cost <= 0) {
      return alert("Fill all fields");
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error();
      setFormData({ customer_name: "", vehicle_reg: "", service: "", status: "Pending", cost: "" });
      fetchJobs();
      alert("Job added!");
    } catch (err) {
      alert("Add failed");
    }
  };

  // MARK AS COMPLETE
  const markComplete = async (id) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`http://127.0.0.1:5000/jobs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "Completed" })
      });
      if (!res.ok) throw new Error();
      fetchJobs();
      alert("Job marked complete!");
    } catch (err) {
      alert("Update failed");
    }
  };

  // ARCHIVE (SOFT DELETE)
  const archiveJob = async (id) => {
    if (!window.confirm("Archive this job?")) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`http://127.0.0.1:5000/jobs/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      fetchJobs();
      alert("Job archived!");
    } catch (err) {
      alert("Archive failed");
    }
  };

  const statuses = ["All", "Pending", "In Progress", "Completed"];

  return (
    <div className="inventory-container">
      <h1 className="inventory-title">Job Cards</h1>

      <form onSubmit={handleSubmit} className="add-part-form">
        <input name="customer_name" placeholder="Customer Name" value={formData.customer_name} onChange={handleChange} required />
        <input name="vehicle_reg" placeholder="Vehicle Reg" value={formData.vehicle_reg} onChange={handleChange} required />
        <input name="service" placeholder="Service" value={formData.service} onChange={handleChange} required />
        <input name="cost" type="number" placeholder="Cost (KSh)" value={formData.cost} onChange={handleChange} required />
        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <button type="submit" className="add-part-btn">Add Job</button>
      </form>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-bar flex-1">
          <input
            placeholder="Search by customer or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-bar">
          <label>Filter:</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Vehicle</th>
            <th>Service</th>
            <th>Cost</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredJobs.length === 0 ? (
            <tr><td colSpan="6" className="no-parts">No jobs</td></tr>
          ) : (
            filteredJobs.map(job => (
              <tr key={job.id}>
                <td>{job.customer_name}</td>
                <td>{job.vehicle_reg}</td>
                <td>{job.service}</td>
                <td>KSh {job.cost}</td>
                <td className={`status-cell ${
                  job.status === "Completed" ? 'available' :
                  job.status === "In Progress" ? 'borrowed' : 'low-stock'
                }`}>
                  {job.status}
                </td>
                <td>
                  {job.status !== "Completed" && (
                    <button
                      onClick={() => markComplete(job.id)}
                      className="edit-btn"
                      style={{ background: '#10b981', fontSize: '0.8rem' }}
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => archiveJob(job.id)}
                    className="delete-btn"
                    style={{ fontSize: '0.8rem', marginLeft: '4px' }}
                  >
                    Archive
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default JobCards;