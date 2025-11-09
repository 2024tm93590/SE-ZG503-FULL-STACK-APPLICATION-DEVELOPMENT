import React, { useEffect, useState, useContext } from 'react';
import API, { setAuthToken } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import './EquipmentManagement.css';

export default function EquipmentManagement() {
  const { user } = useContext(AuthContext);
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ 
    name: '', 
    category: '', 
    condition: 'Good', 
    quantity: 1,
    availability: true 
  });
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    availability: '',
    page: 1,
    limit: 12
  });
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user && user.token) {
      setAuthToken(user.token);
      fetchEquipment();
      fetchCategories();
    }
  }, [user]);

  useEffect(() => {
    if (user && user.token) {
      fetchEquipment();
    }
  }, [filters]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const res = await API.get(`/equipment?${params}`);
      const equipmentData = res.data.equipment || res.data;
      setEquipment(equipmentData);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      alert('Error fetching equipment');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get('/equipment/categories');
      setCategories(res.data);
    } catch (error) {
      // Categories are optional, don't show error to user
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Transform form data to match backend field names
      const formData = {
        Name: form.name,
        Category: form.category,
        Condition: form.condition,
        Quantity: form.quantity,
        Availability: form.availability
      };

      if (editingId) {
        await API.put(`/equipment/${editingId}`, formData);
        setEditingId(null);
      } else {
        await API.post('/equipment', formData);
      }
      setForm({ name:'', category:'', condition:'Good', quantity:1, availability:true });
      setShowForm(false);
      fetchEquipment();
      fetchCategories();
      alert(editingId ? 'Equipment updated!' : 'Equipment added!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving equipment');
    }
  };

  const handleEdit = (item) => {
    // Map backend field names to form field names
    setForm({
      name: item.Name || item.name,
      category: item.Category || item.category,
      condition: item.Condition || item.condition,
      quantity: item.Quantity || item.quantity,
      availability: item.Availability !== undefined ? item.Availability : item.availability
    });
    setEditingId(item.Id || item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const equipmentItem = equipment.find(item => (item.Id || item.id) === id);
    const equipmentName = equipmentItem ? (equipmentItem.Name || equipmentItem.name) : 'this equipment';
    
    if (!window.confirm(`⚠️ Delete Equipment\n\nAre you sure you want to permanently delete "${equipmentName}"?\n\nThis action cannot be undone.`)) return;
    
    try {
      await API.delete(`/equipment/${id}`);
      fetchEquipment();
      alert('✅ Equipment deleted successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error deleting equipment';
      // Display multi-line error messages properly
      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setForm({ name:'', category:'', condition:'Good', quantity:1, availability:true });
    setEditingId(null);
    setShowForm(false);
  };

  const getConditionColor = (condition) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return '#4caf50';
      case 'good': return '#8bc34a';
      case 'fair': return '#ff9800';
      case 'poor': return '#f44336';
      default: return '#757575';
    }
  };

  if (user.role !== 'admin') {
    return (
      <div className="equipment-management">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>Only administrators can manage equipment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="equipment-management">
      <div className="header">
        <h2>Equipment Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add Equipment'}
        </button>
      </div>

      {/* Equipment Form */}
      {showForm && (
        <div className="form-modal">
          <form onSubmit={handleSubmit} className="equipment-form">
            <h3>{editingId ? 'Edit Equipment' : 'Add New Equipment'}</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Name:</label>
                <input 
                  placeholder="Equipment Name" 
                  value={form.name} 
                  onChange={e=>setForm({...form, name:e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category:</label>
                <input 
                  list="categories"
                  placeholder="Equipment Category" 
                  value={form.category} 
                  onChange={e=>setForm({...form, category:e.target.value})}
                  required
                />
                <datalist id="categories">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Condition:</label>
                <select 
                  value={form.condition} 
                  onChange={e=>setForm({...form, condition:e.target.value})}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              <div className="form-group">
                <label>Quantity:</label>
                <input 
                  type="number" 
                  min="1"
                  placeholder="Quantity" 
                  value={form.quantity} 
                  onChange={e=>setForm({...form, quantity:parseInt(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={form.availability} 
                  onChange={e=>setForm({...form, availability:e.target.checked})}
                />
                Available for borrowing
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update' : 'Add'} Equipment
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search equipment..."
          value={filters.search}
          onChange={e => setFilters({...filters, search: e.target.value, page: 1})}
        />

        <select 
          value={filters.category} 
          onChange={e => setFilters({...filters, category: e.target.value, page: 1})}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select 
          value={filters.availability} 
          onChange={e => setFilters({...filters, availability: e.target.value, page: 1})}
        >
          <option value="">All Items</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
      </div>

      {/* Equipment Grid */}
      <div className="equipment-container">
        {loading ? (
          <div className="loading">Loading equipment...</div>
        ) : (
          <>
            <div className="equipment-grid">
              {equipment.map(item => (
                <div key={item.Id || item.id} className={`equipment-card ${!(item.Availability !== undefined ? item.Availability : item.availability) ? 'unavailable' : ''}`}>
                  <div className="equipment-header">
                    <h4>{item.Name || item.name}</h4>
                    <div className="equipment-status">
                      {(item.Availability !== undefined ? item.Availability : item.availability) ? (
                        <span className="status-available">Available</span>
                      ) : (
                        <span className="status-unavailable">Unavailable</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="equipment-body">
                    <div className="equipment-info">
                      <span className="category-badge">{item.Category || item.category}</span>
                      <span 
                        className="condition-badge"
                        style={{ backgroundColor: getConditionColor(item.Condition || item.condition) }}
                      >
                        {item.Condition || item.condition}
                      </span>
                    </div>
                    
                    <div className="equipment-quantity">
                      <span>Quantity: {item.Quantity || item.quantity}</span>
                    </div>
                  </div>

                  <div className="equipment-actions">
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(item.Id || item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button 
                disabled={filters.page <= 1}
                onClick={() => setFilters({...filters, page: filters.page - 1})}
              >
                Previous
              </button>
              
              <span>Page {filters.page} of {totalPages}</span>
              
              <button 
                disabled={filters.page >= totalPages}
                onClick={() => setFilters({...filters, page: filters.page + 1})}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
