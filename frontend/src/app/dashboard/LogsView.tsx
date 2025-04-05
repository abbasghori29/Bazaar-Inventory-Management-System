'use client';

import { useState, useEffect } from 'react';
import { FaFilter, FaUndo, FaSearch, FaListAlt, FaUser, FaCalendarAlt, FaClipboardList } from 'react-icons/fa';
import { getLogs } from '@/lib/api';

interface Log {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  details: string;
  timestamp: string;
  module: string;
}

export default function LogsView() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [user, setUser] = useState('');
  const [timeframe, setTimeframe] = useState('');

  useEffect(() => {
    // Fetch logs
    fetchLogs();
  }, []);

  const fetchLogs = async (filters?: any) => {
    setLoading(true);
    try {
      const logsData = await getLogs(filters);
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const filters: any = {};
    if (module) filters.module = module;
    if (action) filters.action = action;
    if (user) filters.user = user;
    if (timeframe) filters.timeframe = timeframe;
    
    fetchLogs(filters);
  };

  const resetFilters = () => {
    setModule('');
    setAction('');
    setUser('');
    setTimeframe('');
    
    // Fetch all logs without filters
    fetchLogs();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const getModuleIcon = (module: string) => {
    switch (module.toLowerCase()) {
      case 'inventory':
        return <FaClipboardList />;
      case 'user':
        return <FaUser />;
      default:
        return <FaListAlt />;
    }
  };

  return (
    <>
      <div className="card logs-card">
        <div className="card-body">
          <h5 className="card-title">Activity Filters</h5>
          
          <form onSubmit={handleFilterSubmit} className="mt-3">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label logs-filter-label">Module</label>
                <select 
                  className="form-select logs-filter-control"
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                >
                  <option value="">All Modules</option>
                  <option value="inventory">Inventory</option>
                  <option value="user">User</option>
                  <option value="order">Orders</option>
                </select>
              </div>
              
              <div className="col-md-3">
                <label className="form-label logs-filter-label">Action</label>
                <select 
                  className="form-select logs-filter-control"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                >
                  <option value="">All Actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="login">Login</option>
                </select>
              </div>
              
              <div className="col-md-3">
                <label className="form-label logs-filter-label">Timeframe</label>
                <select 
                  className="form-select logs-filter-control"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              
              <div className="col-md-3">
                <label className="form-label logs-filter-label">User</label>
                <input 
                  type="text" 
                  className="form-control logs-filter-control"
                  placeholder="Filter by user..." 
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                />
              </div>
            </div>
            
            <div className="d-flex mt-3">
              <button 
                type="button" 
                className="btn logs-clear-btn me-2"
                onClick={resetFilters}
              >
                <FaUndo className="me-2" /> Reset
              </button>
              <button 
                type="submit" 
                className="btn logs-search-btn"
              >
                <FaSearch className="me-2" /> Search Logs
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="card logs-card animate-slide-in">
        <div className="logs-card-header">
          <h5 className="logs-card-title">
            <FaListAlt className="me-2" /> Activity Logs
          </h5>
        </div>
        
        <div className="logs-card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border mb-3 spinner" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="loading-text">Loading activity logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5">
              <div className="empty-state-icon">
                <FaListAlt />
              </div>
              <h5 className="empty-state-heading">No log entries found</h5>
              <p className="empty-state-text">
                Try adjusting your filters to see more log entries or check back later for new activity.
              </p>
            </div>
          ) : (
            <div className="logs-table-container">
              <table className="table table-hover logs-table">
                <thead className="logs-table-header">
                  <tr>
                    <th className="logs-table-cell">
                      <FaCalendarAlt className="me-2" /> Timestamp
                    </th>
                    <th className="logs-table-cell">
                      <FaUser className="me-2" /> User
                    </th>
                    <th className="logs-table-cell">
                      <FaListAlt className="me-2" /> Module / Action
                    </th>
                    <th className="logs-table-cell">
                      <FaClipboardList className="me-2" /> Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log.id} className="log-entry">
                      <td className="logs-table-data">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="logs-table-data">
                        <div className="d-flex align-items-center">
                          <div className="user-badge me-2">
                            {log.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="log-user-name">
                              {log.user.name}
                            </span>
                            <br />
                            <small>{log.user.role}</small>
                          </div>
                        </div>
                      </td>
                      <td className="logs-table-data">
                        <div className="d-flex align-items-center">
                          {getModuleIcon(log.module)}
                          <span className="ms-2">
                            {log.module} / <strong>{log.action}</strong>
                          </span>
                        </div>
                      </td>
                      <td className="logs-table-data">
                        <div className="log-details">
                          {log.details}
                          <br />
                          <small className="log-time">
                            ID: {log.id}
                          </small>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 