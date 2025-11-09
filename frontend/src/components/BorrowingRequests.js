import React, { useEffect, useState, useContext } from 'react';
import API, { setAuthToken } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import './BorrowingRequests.css';

export default function BorrowingRequests() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [form, setForm] = useState({ 
    equipmentId: '', 
    purpose: '',
    requestedDate: '',
    dueDate: ''
  });
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [showRequestForm, setShowRequestForm] = useState(false);

  useEffect(() => {
    if (user) setAuthToken(user.token);
    fetchRequests();
    fetchEquipment();
  }, [user, filters]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const res = await API.get(`/requests?${params}`);
      const requestsData = res.data.requests || res.data;
      setRequests(requestsData);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      alert('Error fetching requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const res = await API.get('/equipment?availability=true');
      setEquipment(res.data.equipment || res.data);
    } catch (error) {
      // Equipment fetch is optional
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Transform form data to match backend field names
      const requestData = {
        UserId: user.id,
        EquipmentId: form.equipmentId,
        Purpose: form.purpose,
        RequestedDate: form.requestedDate,
        DueDate: form.dueDate
      };
      
      await API.post('/requests', requestData);
      setForm({ equipmentId:'', purpose:'', requestedDate:'', dueDate:'' });
      setShowRequestForm(false);
      fetchRequests();
      alert('Request submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating request');
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await API.put(`/requests/${requestId}/status`, {
        Status: 'APPROVED',
        ApprovedBy: user.id
      });
      
      fetchRequests();
      alert('Request approved!');
    } catch (error) {
      alert('Error approving request');
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('Reason for rejection:');
    try {
      await API.put(`/requests/${requestId}/status`, {
        Status: 'REJECTED',
        Notes: reason,
        ApprovedBy: user.id
      });
      fetchRequests();
      alert('Request rejected!');
    } catch (error) {
      alert('Error rejecting request');
    }
  };

  const handleReturn = async (requestId) => {
    try {
      await API.put(`/requests/${requestId}/return`, {
        Status: 'RETURNED'
      });
      fetchRequests();
      alert('Equipment returned!');
    } catch (error) {
      alert('Error returning equipment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#ff9800';
      case 'APPROVED': return '#4caf50';
      case 'REJECTED': return '#f44336';
      case 'RETURNED': return '#9c27b0';
      default: return '#757575';
    }
  };

  const isOverdue = (dueDate, status) => {
    return status === 'APPROVED' && new Date(dueDate) < new Date();
  };

  return (
    <div className="borrowing-requests">
      <div className="header">
        <h2>Borrowing Requests Management</h2>
        {user.role === 'student' && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowRequestForm(!showRequestForm)}
          >
            {showRequestForm ? 'Cancel' : 'New Request'}
          </button>
        )}
      </div>

      {/* Request Form */}
      {showRequestForm && user.role === 'student' && (
        <div className="request-form-modal">
          <form onSubmit={handleCreate} className="request-form">
            <h3>Create New Borrow Request</h3>
            
            <div className="form-group">
              <label>Equipment:</label>
              <select 
                value={form.equipmentId} 
                onChange={e=>setForm({...form,equipmentId:e.target.value})}
                required
              >
                <option value="">Select Equipment</option>
                {equipment.map(eq => (
                  <option key={eq.Id || eq.id} value={eq.Id || eq.id}>
                    {eq.Name || eq.name} - {eq.Category || eq.category} (Qty: {eq.Quantity || eq.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Purpose:</label>
              <textarea 
                placeholder="Purpose of borrowing" 
                value={form.purpose} 
                onChange={e=>setForm({...form,purpose:e.target.value})}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Requested Date:</label>
                <input 
                  type="date"
                  value={form.requestedDate} 
                  onChange={e=>setForm({...form,requestedDate:e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>Due Date:</label>
                <input 
                  type="date"
                  value={form.dueDate} 
                  onChange={e=>setForm({...form,dueDate:e.target.value})}
                  min={form.requestedDate}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Submit Request</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowRequestForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <select 
          value={filters.status} 
          onChange={e => setFilters({...filters, status: e.target.value, page: 1})}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="RETURNED">Returned</option>
        </select>

        <select 
          value={filters.limit} 
          onChange={e => setFilters({...filters, limit: e.target.value, page: 1})}
        >
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>

      {/* Requests List */}
      <div className="requests-container">
        {loading ? (
          <div className="loading">Loading requests...</div>
        ) : (
          <>
            <div className="requests-grid">
              {requests.map(request => (
                <div key={request.Id || request.id} className={`request-card ${isOverdue(request.DueDate, request.Status) ? 'overdue' : ''}`}>
                  <div className="request-header">
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(request.Status) }}
                    >
                      {request.Status}
                    </span>
                    <span className="request-id">#{request.Id || request.id}</span>
                  </div>
                  
                  <div className="request-body">
                    <h4>{request.Equipment?.Name || request.Equipment?.name || `Equipment ID: ${request.EquipmentId}`}</h4>
                    <p><strong>Category:</strong> {request.Equipment?.Category || request.Equipment?.category}</p>
                    <p><strong>Purpose:</strong> {request.Purpose}</p>
                    <p><strong>Requested by:</strong> {request.User?.Name || request.User?.name || `User ID: ${request.UserId}`}</p>
                    
                    {request.RequestedDate && (
                      <p><strong>Requested Date:</strong> {new Date(request.RequestedDate).toLocaleDateString()}</p>
                    )}
                    
                    {request.DueDate && (
                      <p><strong>Due Date:</strong> {new Date(request.DueDate).toLocaleDateString()}</p>
                    )}
                    
                    {isOverdue(request.DueDate, request.Status) && (
                      <p className="overdue-warning"><strong>⚠️ OVERDUE</strong></p>
                    )}
                    
                    {request.Notes && (
                      <p><strong>Notes:</strong> {request.Notes}</p>
                    )}
                  </div>

                  <div className="request-actions">
                    {(user.role === 'admin' || user.role === 'staff') && request.Status === 'PENDING' && (
                      <>
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove(request.Id || request.id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(request.Id || request.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    
                    {request.Status === 'APPROVED' && (
                      <button 
                        className="btn btn-purple btn-sm"
                        onClick={() => handleReturn(request.Id || request.id)}
                      >
                        Mark as Returned
                      </button>
                    )}
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
