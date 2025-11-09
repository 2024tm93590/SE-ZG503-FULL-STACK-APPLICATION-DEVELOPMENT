import React, { useEffect, useState, useContext } from 'react';
import API, { setAuthToken } from '../api/api';
import { AuthContext } from '../context/AuthContext';
import './Analytics.css';

export default function Analytics() {
  const { user } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState({
    statusDistribution: [],
    popularEquipment: [],
    activeUsers: []
  });
  const [overdueRequests, setOverdueRequests] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setAuthToken(user.token);
      fetchAnalytics();
      fetchOverdueRequests();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(dateRange);
      const res = await API.get(`/requests/analytics?${params}`);
      setAnalytics(res.data);
    } catch (error) {
      // Handle analytics fetch error silently
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdueRequests = async () => {
    try {
      const res = await API.get('/requests/overdue');
      setOverdueRequests(res.data);
    } catch (error) {
      // Handle overdue requests fetch error silently
    }
  };

  const handleDateRangeChange = () => {
    fetchAnalytics();
  };

  const clearFilters = () => {
    setDateRange({
      startDate: '',
      endDate: ''
    });
    // Fetch analytics without date filters
    setTimeout(() => fetchAnalytics(), 100);
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

  if (user.role !== 'admin') {
    return (
      <div className="analytics">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>Only administrators can view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h2>Equipment Lending Analytics</h2>
        <div className="date-filter">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={e => setDateRange({...dateRange, startDate: e.target.value})}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={e => setDateRange({...dateRange, endDate: e.target.value})}
            placeholder="End Date"
          />
          <button className="btn btn-primary" onClick={handleDateRangeChange}>
            Apply Filter
          </button>
          <button className="btn btn-secondary" onClick={clearFilters}>
            Clear Filter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading analytics...</div>
      ) : (
        <div className="analytics-grid">
          {/* Status Distribution */}
          <div className="analytics-card">
            <h3>Request Status Distribution</h3>
            <div className="status-chart">
              {analytics.statusDistribution.map(item => (
                <div key={item.Status} className="status-item">
                  <div 
                    className="status-bar" 
                    style={{
                      backgroundColor: getStatusColor(item.Status),
                      width: `${(item.count / Math.max(...analytics.statusDistribution.map(s => s.count))) * 100}%`
                    }}
                  ></div>
                  <span className="status-label">{item.Status}: {item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Equipment */}
          <div className="analytics-card">
            <h3>Most Borrowed Equipment</h3>
            <div className="equipment-list">
              {analytics.popularEquipment.slice(0, 5).map((item, index) => (
                <div key={index} className="equipment-item">
                  <div className="equipment-rank">#{index + 1}</div>
                  <div className="equipment-details">
                    <strong>{item.equipmentName || item['Equipment.name'] || 'Unknown Equipment'}</strong>
                    <span className="equipment-category">{item.equipmentCategory || item['Equipment.category'] || 'Unknown Category'}</span>
                  </div>
                  <div className="equipment-count">{item.borrowCount} borrows</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Users */}
          <div className="analytics-card">
            <h3>Most Active Users</h3>
            <div className="user-list">
              {analytics.activeUsers.slice(0, 5).map((item, index) => (
                <div key={index} className="user-item">
                  <div className="user-rank">#{index + 1}</div>
                  <div className="user-details">
                    <strong>{item.userName || item['User.name'] || 'Unknown User'}</strong>
                    <span className="user-email">{item.userEmail || item['User.email'] || 'No email'}</span>
                  </div>
                  <div className="user-count">{item.requestCount} requests</div>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue Requests */}
          <div className="analytics-card overdue-card">
            <h3>Overdue Equipment ({overdueRequests.length})</h3>
            {overdueRequests.length === 0 ? (
              <p className="no-overdue">No overdue equipment! 🎉</p>
            ) : (
              <div className="overdue-list">
                {overdueRequests.map(request => (
                  <div key={request.id} className="overdue-item">
                    <div className="overdue-equipment">
                      <strong>{request.Equipment?.name}</strong>
                      <span className="overdue-user">by {request.User?.name}</span>
                    </div>
                    <div className="overdue-date">
                      Due: {new Date(request.DueDate).toLocaleDateString()}
                      <span className="days-overdue">
                        ({Math.ceil((new Date() - new Date(request.DueDate)) / (1000 * 60 * 60 * 24))} days overdue)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}