'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaChartLine, FaBox, FaClipboardList, FaExclamationTriangle, FaInfoCircle, FaCog } from 'react-icons/fa';
import { checkAuthStatus } from '@/lib/api';
import ViewStocks from './ViewStocks';
import LogsView from './LogsView';
import ProductsView from './ProductsView';

const ManageStocks = () => {
  return (
    <div>
      <div className="row mb-4">
        <div className="col-md-12">
          <h2 className="page-heading">Manage Inventory</h2>
          <p className="text-muted">
            Create and manage stock movements
          </p>
        </div>
      </div>
      <div className="alert alert-info">
        <FaInfoCircle className="me-2" />
        The Manage Stocks feature is currently being updated.
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [userName, setUserName] = useState('User');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if there's a tab parameter in the URL
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      // Map URL parameter to tab names
      const tabMapping: { [key: string]: string } = {
        'products': 'products',
        'logs': 'logs',
        'manage': 'manage',
        'overview': 'overview'
      };
      
      if (tabMapping[tabParam]) {
        setActiveTab(tabMapping[tabParam]);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const authenticated = await checkAuthStatus();
        
        if (authenticated) {
          // Simulating user data
          setUserName('Admin User');
          setIsAdmin(true);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [router]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Update URL without refreshing the page
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ViewStocks />;
      case 'logs':
        return <LogsView />;
      case 'products':
        return <ProductsView />;
      case 'manage':
        return <ManageStocks />;
      default:
        return <ViewStocks />;
    }
  };

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="dashboard-header">
            <div className="dashboard-welcome-container">
              <h1 className="dashboard-title">
                Welcome back, {isLoading ? '...' : userName}!
              </h1>
              <p className="dashboard-subtitle">
                Here's what's happening with your inventory today.
              </p>
              <div className="alert-banner">
                <FaInfoCircle className="me-2" />
                <strong>Tip:</strong> Use the filters to quickly find specific inventory items.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-12">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabChange('overview')}
              >
                <FaChartLine className="me-2" />
                Stock Overview
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => handleTabChange('products')}
              >
                <FaBox className="me-2" />
                Products
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'manage' ? 'active' : ''}`}
                onClick={() => handleTabChange('manage')}
              >
                <FaBox className="me-2" />
                Manage Inventory
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => handleTabChange('logs')}
              >
                <FaClipboardList className="me-2" />
                Activity Logs
              </button>
            </li>
            {isAdmin && (
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => handleTabChange('settings')}
                >
                  <FaCog className="me-2" />
                  Settings
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
} 