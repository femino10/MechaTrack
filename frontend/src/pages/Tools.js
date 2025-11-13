// src/pages/Tools.js
import React, { useEffect, useState, useCallback } from "react";
import "../styles/Inventory.css";

const Tools = () => {
  const [tools, setTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    status: "Available",
    borrower: "",
  });
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // GET TOKEN FROM LOCALSTORAGE
  const getToken = () => localStorage.getItem("token");

  // FETCH TOOLS WITH TOKEN
  const fetchTools = useCallback(async () => {
    const token = getToken();
    if (!token) {
      alert("Please log in");
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/tools", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (res.status === 401) {
        alert("Session expired. Logging out...");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTools(data);
      setFilteredTools(data);
    } catch (err) {
      console.error("Fetch tools failed:", err);
      alert("Failed to load tools");
    }
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  // FILTERING
  useEffect(() => {
    let filtered = tools;

    if (searchTerm) {
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter(t =>
        (t.category || "Uncategorized") === selectedCategory
      );
    }

    setFilteredTools(filtered);
  }, [searchTerm, selectedCategory, tools]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ADD TOOL WITH TOKEN
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return alert("Login required");

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      status: formData.status,
      borrower: formData.borrower.trim() || null
    };

    if (!payload.name || !payload.category) {
      return alert("Name and category required");
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/tools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        alert("Session expired. Logging out...");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Add failed");
      }

      setFormData({ name: "", category: "", status: "Available", borrower: "" });
      fetchTools();
      alert("Tool added!");
    } catch (err) {
      console.error("Add failed:", err);
      alert(`Add failed: ${err.message}`);
    }
  };

  // ARCHIVE TOOL (DELETE)
  const archiveTool = async (id) => {
    if (!window.confirm("Archive this tool?")) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`http://127.0.0.1:5000/tools/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.status === 401) {
        alert("Session expired. Logging out...");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!res.ok) throw new Error("Delete failed");
      fetchTools();
      alert("Tool archived!");
    } catch (err) {
      alert("Archive failed");
    }
  };

  const handleFilterChange = (e) => setSelectedCategory(e.target.value);

  const categories = ["All", ...new Set(tools.map(t => t.category || "Uncategorized"))];

  return (
    <div className="inventory-container">
      <h1 className="inventory-title">Tools Inventory</h1>

      <form onSubmit={handleSubmit} className="add-part-form">
        <input name="name" placeholder="Tool Name" value={formData.name} onChange={handleChange} required />
        <input name="category" placeholder="Category" value={formData.category} onChange={handleChange} required />
        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="Available">Available</option>
          <option value="Borrowed">Borrowed</option>
        </select>
        <input name="borrower" placeholder="Borrower Name (if borrowed)" value={formData.borrower} onChange={handleChange} />
        <button type="submit" className="add-part-btn">Add Tool</button>
      </form>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-bar flex-1">
          <input
            placeholder="Search tools by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-bar">
          <label>Filter by Category:</label>
          <select value={selectedCategory} onChange={handleFilterChange}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Tool Name</th>
            <th>Category</th>
            <th>Status</th>
            <th>Borrower</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredTools.length === 0 ? (
            <tr><td colSpan="5" className="no-parts">No tools found.</td></tr>
          ) : (
            filteredTools.map(tool => (
              <tr key={tool.id}>
                <td>{tool.name}</td>
                <td>{tool.category || "Uncategorized"}</td>
                <td className={`status-cell ${tool.status === "Borrowed" ? 'borrowed' : 'available'}`}>
                  {tool.status}
                </td>
                <td>{tool.borrower || "—"}</td>
                <td>
                  <button
                    onClick={() => archiveTool(tool.id)}
                    className="delete-btn"
                    style={{ fontSize: '0.8rem' }}
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

export default Tools;