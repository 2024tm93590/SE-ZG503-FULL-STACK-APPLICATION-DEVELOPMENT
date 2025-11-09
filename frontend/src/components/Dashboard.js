import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { setAuthToken } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [equipment, setEquipment] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [stats, setStats] = useState({
    totalEquipment: 0,
    availableEquipment: 0,
    totalRequests: 0,
    pendingRequests: 0,
    overdueCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setAuthToken(user.token);
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch equipment
      const equipmentRes = await API.get('/equipment?limit=6');
      const equipment = equipmentRes.data.equipment || equipmentRes.data;
      
      // Fetch recent requests
      const requestsRes = await API.get('/requests?limit=5');
      const requests = requestsRes.data.requests || requestsRes.data;
      
      // Calculate stats
      const totalEquipment = equipment.length;
      const availableEquipment = equipment.filter(eq => eq.Availability || eq.availability).length;
      const totalRequests = requests.length;
      const pendingRequests = requests.filter(req => req.Status === 'PENDING').length;
      
      setEquipment(equipment);
      setRecentRequests(requests);
      setStats({
        totalEquipment,
        availableEquipment,
        totalRequests,
        pendingRequests,
        overdueCount: 0
      });

      // Fetch overdue items if admin/staff
      if (user.role === 'admin' || user.role === 'staff') {
        try {
          const overdueRes = await API.get('/requests/overdue');
          setOverdueItems(overdueRes.data);
          setStats(prev => ({
            ...prev,
            overdueCount: overdueRes.data.length
          }));
        } catch (error) {
          // Handle overdue items fetch error silently
        }
      }

    } catch (error) {
      // Handle dashboard data fetch error silently
    } finally {
      setLoading(false);
    }
  };

  const getQuickActions = () => {
    const actions = [];
    
    if (user.role === 'student') {
      actions.push({ title: 'Request Equipment', path: '/requests', color: '#007bff', icon: '📋' });
    }
    
    if (user.role === 'admin') {
      actions.push(
        { title: 'Manage Equipment', path: '/equipment', color: '#28a745', icon: '🔧' },
        { title: 'View Analytics', path: '/analytics', color: '#17a2b8', icon: '📊' }
      );
    }
    
    if (user.role === 'admin' || user.role === 'staff') {
      actions.push(
        { title: 'Review Requests', path: '/requests', color: '#ffc107', icon: '✅' }
      );
    }
    
    return actions;
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

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user.name}!</h1>
          <p className="user-role">Logged in as {user.role}</p>
        </div>
        <div className="date-section">
          <p>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card equipment">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>{stats.totalEquipment}</h3>
            <p>Total Equipment</p>
            <span className="stat-sub">{stats.availableEquipment} available</span>
          </div>
        </div>

        <div className="stat-card requests">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.totalRequests}</h3>
            <p>Total Requests</p>
            <span className="stat-sub">{stats.pendingRequests} pending</span>
          </div>
        </div>

        {(user.role === 'admin' || user.role === 'staff') && (
          <div className="stat-card overdue">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h3>{stats.overdueCount}</h3>
              <p>Overdue Items</p>
              <span className="stat-sub">Needs attention</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {getQuickActions().map((action, index) => (
            <Link 
              key={index}
              to={action.path}
              className="action-card"
              style={{ borderLeftColor: action.color }}
            >
              <div className="action-icon" style={{ color: action.color }}>
                {action.icon}
              </div>
              <div className="action-content">
                <h4>{action.title}</h4>
                <p>Click to navigate</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recent Equipment */}
        <div className="content-section">
          <h2>Recent Equipment</h2>
          <div className="equipment-grid">
            {equipment.slice(0, 6).map(item => (
              <div key={item.Id || item.id} className="equipment-card-mini">
                <div className="equipment-header">
                  <h4>{item.Name || item.name}</h4>
                  <span className={`availability ${(item.Availability || item.availability) ? 'available' : 'unavailable'}`}>
                    {(item.Availability || item.availability) ? '✓' : '✗'}
                  </span>
                </div>
                <div className="equipment-details">
                  <p><strong>Category:</strong> {item.Category || item.category}</p>
                  <p><strong>Condition:</strong> {item.Condition || item.condition}</p>
                  <p><strong>Quantity:</strong> {item.Quantity || item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Requests */}
        <div className="content-section">
          <h2>Recent Activity</h2>
          <div className="requests-list">
            {recentRequests.length > 0 ? recentRequests.slice(0, 5).map(request => (
              <div key={request.Id || request.id} className="request-item-mini">
                <div className="request-info">
                  <h4>{request.Equipment?.Name || request.Equipment?.name || `Equipment ID: ${request.EquipmentId}`}</h4>
                  <p>{request.Purpose}</p>
                  <small>by {request.User?.Name || request.User?.name || `User ID: ${request.UserId}`}</small>
                </div>
                <div 
                  className="request-status"
                  style={{ backgroundColor: getStatusColor(request.Status) }}
                >
                  {request.Status}
                </div>
              </div>
            )) : (
              <p className="no-data">No recent activity</p>
            )}
          </div>
        </div>

        {/* Overdue Items (Admin/Staff only) */}
        {(user.role === 'admin' || user.role === 'staff') && overdueItems.length > 0 && (
          <div className="content-section overdue-section">
            <h2>⚠️ Overdue Items</h2>
            <div className="overdue-list">
              {overdueItems.slice(0, 5).map(item => (
                <div key={item.Id || item.id} className="overdue-item-mini">
                  <div className="overdue-info">
                    <h4>{item.Equipment?.Name || item.Equipment?.name}</h4>
                    <p>Borrowed by: {item.User?.Name || item.User?.name}</p>
                    <small>Due: {new Date(item.DueDate).toLocaleDateString()}</small>
                  </div>
                  <div className="overdue-days">
                    {Math.ceil((new Date() - new Date(item.DueDate)) / (1000 * 60 * 60 * 24))} days
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
