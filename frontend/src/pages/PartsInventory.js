// src/pages/PartsInventory.js
import React, { useEffect, useState, useCallback } from "react";
import "../styles/Inventory.css";

const PartsInventory = () => {
  const [parts, setParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [formData, setFormData] = useState({
    name: "", category: "", quantity: "", price: ""
  });
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPart, setDeletingPart] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "", category: "", quantity: "", price: ""
  });

  const getToken = () => localStorage.getItem("token");

  const fetchParts = useCallback(async () => {
    const token = getToken();
    if (!token) {
      alert("Please log in");
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/items", {
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
      setParts(data);
      setFilteredParts(data);
    } catch (err) {
      console.error("Fetch parts failed:", err);
      alert("Failed to load parts");
    }
  }, []);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // FILTERING
  useEffect(() => {
    let filtered = parts;

    if (searchTerm) {
      filtered = filtered.filter(part =>
        part.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter(p =>
        (p.category || "Uncategorized") === selectedCategory
      );
    }

    setFilteredParts(filtered);
  }, [searchTerm, selectedCategory, parts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ADD PART WITH TOKEN
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return alert("Login required");

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      quantity: parseInt(formData.quantity),
      price: parseFloat(formData.price) || null
    };

    if (!payload.name || payload.quantity < 0) {
      return alert("Name and valid quantity required");
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/items", {
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

      setFormData({ name: "", category: "", quantity: "", price: "" });
      fetchParts();
      alert("Part added!");
    } catch (err) {
      console.error("Add failed:", err);
      alert(`Add failed: ${err.message}`);
    }
  };

  // DELETE WITH TOKEN
  const confirmDelete = async () => {
    if (!deletingPart) return;
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`http://127.0.0.1:5000/items/${deletingPart.id}`, {
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
      fetchParts();
      closeDeleteModal();
      alert("Part deleted!");
    } catch (err) {
      alert("Delete failed");
    }
  };

  // EDIT WITH TOKEN
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingPart) return;
    const token = getToken();
    if (!token) return;

    const payload = {
      name: editFormData.name.trim(),
      category: editFormData.category.trim(),
      quantity: parseInt(editFormData.quantity),
      price: parseFloat(editFormData.price) || null
    };

    try {
      const res = await fetch(`http://127.0.0.1:5000/items/${editingPart.id}`, {
        method: "PUT",
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

      if (!res.ok) throw new Error("Edit failed");
      fetchParts();
      closeEditModal();
      alert("Part updated!");
    } catch (err) {
      alert("Edit failed");
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const openEditModal = (part) => {
    setEditingPart(part);
    setEditFormData({
      name: part.name,
      category: part.category || "",
      quantity: part.quantity,
      price: part.price || ""
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingPart(null);
  };

  const openDeleteModal = (part) => {
    setDeletingPart(part);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingPart(null);
  };

  const handleFilterChange = (e) => setSelectedCategory(e.target.value);

  const categories = ["All", ...new Set(parts.map(p => p.category || "Uncategorized"))];

  return (
    <div className="inventory-container">
      <h1 className="inventory-title">Mechanic Parts Inventory</h1>

      <form onSubmit={handleSubmit} className="add-part-form">
        <input name="name" placeholder="Part Name" value={formData.name} onChange={handleChange} required />
        <input name="category" placeholder="Category" value={formData.category} onChange={handleChange} required />
        <input name="quantity" type="number" placeholder="Quantity" value={formData.quantity} onChange={handleChange} required />
        <input name="price" type="number" step="0.01" placeholder="Price (Ksh)" value={formData.price} onChange={handleChange} />
        <button type="submit" className="add-part-btn">Add Part</button>
      </form>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="search-bar flex-1">
          <input
            type="text"
            placeholder="Search parts by name..."
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
            <th>Part Name</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Price (Ksh)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredParts.length === 0 ? (
            <tr><td colSpan="5" className="no-parts">No parts found.</td></tr>
          ) : (
            filteredParts.map(part => {
              const isLow = part.quantity < 5;
              return (
                <tr key={part.id}>
                  <td>{part.name}</td>
                  <td>{part.category || "Uncategorized"}</td>
                  <td className={`quantity-cell ${isLow ? 'low-stock' : ''}`}>
                    {isLow && <span className="low-stock-badge">LOW</span>}
                    {part.quantity}
                  </td>
                  <td className="price-cell">
                    Ksh {part.price?.toLocaleString() || '—'}
                  </td>
                  <td>
                    <button onClick={() => openEditModal(part)} className="edit-btn" title="Edit part">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => openDeleteModal(part)} className="delete-btn" title="Delete part">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Part?</h3>
            <p>Are you sure you want to delete <strong>{deletingPart?.name}</strong>?</p>
            <div className="modal-buttons">
              <button onClick={closeDeleteModal} className="modal-btn cancel">Cancel</button>
              <button onClick={confirmDelete} className="modal-btn delete">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Part</h3>
            <form onSubmit={handleEditSubmit} className="edit-form">
              <input name="name" value={editFormData.name} onChange={handleEditChange} required />
              <input name="category" value={editFormData.category} onChange={handleEditChange} required />
              <input name="quantity" type="number" value={editFormData.quantity} onChange={handleEditChange} required />
              <input name="price" type="number" step="0.01" value={editFormData.price} onChange={handleEditChange} />
              <div className="modal-buttons">
                <button type="button" onClick={closeEditModal} className="modal-btn cancel">Cancel</button>
                <button type="submit" className="modal-btn" style={{ background: '#3b82f6' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsInventory;