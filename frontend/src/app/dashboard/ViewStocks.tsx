'use client';

import { useState, useEffect } from 'react';
import { FaBoxOpen, FaChartBar, FaSearch, FaExclamationTriangle, FaBox, FaBoxes, FaInfoCircle, FaFilter, FaUndo, FaEdit, FaTimes } from 'react-icons/fa';
import { getStockData } from '@/lib/api';

interface StockItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  store: {
    id: string;
    name: string;
    location: string;
  };
  quantity: number;
  threshold: number;
  lastUpdated: string;
}

interface StockSummary {
  totalItems: number;
  totalQuantity: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export default function ViewStocks() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [summary, setSummary] = useState<StockSummary>({
    totalItems: 0,
    totalQuantity: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async (filters = {}) => {
    setLoading(true);
    try {
      const data = await getStockData(filters);
      
      if (data && data.stocks) {
        setStocks(data.stocks);
        
        if (data.total_items !== undefined) {
          setSummary({
            totalItems: data.total_items,
            totalQuantity: data.stocks.reduce((sum, item) => sum + item.quantity, 0),
            lowStockItems: data.low_stock_count || 0,
            outOfStockItems: data.out_of_stock_count || 0
          });
        } else {
          // Calculate summary if not provided by API
          const lowStock = data.stocks.filter(s => s.quantity > 0 && s.quantity <= s.threshold).length;
          const outOfStock = data.stocks.filter(s => s.quantity === 0).length;
          const totalQty = data.stocks.reduce((sum, item) => sum + item.quantity, 0);
          
          setSummary({
            totalItems: data.stocks.length,
            totalQuantity: totalQty,
            lowStockItems: lowStock,
            outOfStockItems: outOfStock
          });
        }
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const filters: any = {};
    if (productFilter) filters.product = productFilter;
    if (storeFilter) filters.store = storeFilter;
    if (statusFilter) filters.status = statusFilter;
    
    fetchStockData(filters);
  };

  const resetFilters = () => {
    setProductFilter('');
    setStoreFilter('');
    setStatusFilter('');
    fetchStockData();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
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

  const getStatusClass = (quantity: number, threshold: number) => {
    if (quantity === 0) return 'badge-out-of-stock';
    if (quantity <= threshold) return 'badge-low-stock';
    return 'badge-in-stock';
  };

  const getStatusText = (quantity: number, threshold: number) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= threshold) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <div>
      <div className="row mb-4">
        <div className="col-md-12">
          <h2 className="page-heading">Stock Overview</h2>
          <p className="text-muted">
            Monitor stock levels across all stores and products
          </p>
        </div>
      </div>
      
      {/* Stock Summary Cards */}
      <div className="row mb-4">
        {/* Total Items Card */}
        <div className="col-md-3 mb-4 mb-md-0">
          <div className="hover-card animate-slide-in">
            <div className="row g-0">
              <div className="col-8">
                <div className="mb-1 text-muted small">Total Products</div>
                <h3 className="mb-0">{summary.totalItems.toLocaleString()}</h3>
                <div className="text-muted small">unique stock items</div>
              </div>
              <div className="col-4 text-end">
                <div className="circle-icon-container primary-icon-container rounded-circle p-3">
                  <FaBoxes className="text-primary" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Low Stock Card */}
        <div className="col-md-3 mb-4 mb-md-0">
          <div className="hover-card warning animate-slide-in animate-slide-in-delay-1">
            <div className="row g-0">
              <div className="col-8">
                <div className="mb-1 text-muted small">Low Stock</div>
                <h3 className="mb-0">{summary.lowStockItems.toLocaleString()}</h3>
                <div className="text-muted small">items need attention</div>
              </div>
              <div className="col-4 text-end">
                <div className="circle-icon-container warning-icon-container rounded-circle p-3">
                  <FaExclamationTriangle className="text-warning" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Out of Stock Card */}
        <div className="col-md-3 mb-4 mb-md-0">
          <div className="hover-card danger animate-slide-in animate-slide-in-delay-2">
            <div className="row g-0">
              <div className="col-8">
                <div className="mb-1 text-muted small">Out of Stock</div>
                <h3 className="mb-0">{summary.outOfStockItems.toLocaleString()}</h3>
                <div className="text-muted small">items unavailable</div>
              </div>
              <div className="col-4 text-end">
                <div className="circle-icon-container danger-icon-container rounded-circle p-3">
                  <FaInfoCircle className="text-danger" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Total Stock Card */}
        <div className="col-md-3">
          <div className="hover-card success animate-slide-in animate-slide-in-delay-3">
            <div className="row g-0">
              <div className="col-8">
                <div className="mb-1 text-muted small">Total Inventory</div>
                <h3 className="mb-0">{summary.totalQuantity.toLocaleString()}</h3>
                <div className="text-muted small">items in stock</div>
              </div>
              <div className="col-4 text-end">
                <div className="circle-icon-container success-icon-container rounded-circle p-3">
                  <FaBox className="text-success" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="card mb-4 filter-card">
        <div className="card-body">
          <h5 className="mb-3 filter-heading">
            <FaFilter className="me-2" /> Filter Stock
          </h5>
          <form onSubmit={handleFilterSubmit}>
            <div className="row">
              <div className="col-md-4 mb-3">
                <label htmlFor="product-filter" className="form-label filter-label">
                  Product
                </label>
                <input 
                  type="text" 
                  className="form-control filter-select" 
                  id="product-filter"
                  placeholder="Filter by product name or SKU..." 
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="store-filter" className="form-label filter-label">
                  Store
                </label>
                <input 
                  type="text" 
                  className="form-control filter-select" 
                  id="store-filter"
                  placeholder="Filter by store name or location..." 
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                />
              </div>
              <div className="col-md-4 mb-3">
                <label htmlFor="status-filter" className="form-label filter-label">
                  Status
                </label>
                <select 
                  className="form-select filter-select" 
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="in-stock">In Stock</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
              </div>
            </div>
            <div className="d-flex">
              <button 
                type="button" 
                className="btn btn-sm me-2 clear-button"
                onClick={resetFilters}
              >
                <FaUndo className="me-2" /> Clear Filters
              </button>
              <button type="submit" className="btn btn-sm filter-button">
                <FaFilter className="me-2" /> Apply Filters
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Stock Table */}
      <div className="card content-card">
        <div className="card-body">
          <h5 className="card-title mb-3 content-heading">
            <FaChartBar className="me-2" /> Stock Inventory
          </h5>
          
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border mb-3 spinner" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="loading-text">Loading stock data...</p>
            </div>
          ) : stocks.length === 0 ? (
            <div className="text-center py-5">
              <FaBoxOpen size={48} className="empty-icon" />
              <h5 className="empty-state-heading">No stock data found</h5>
              <p className="empty-state-text">
                Try adjusting your filters or add new stock items.
              </p>
            </div>
          ) : (
            <div className="logs-table-container">
              <table className="table table-hover logs-table">
                <thead className="logs-table-header">
                  <tr>
                    <th className="logs-table-cell">Product</th>
                    <th className="logs-table-cell">SKU</th>
                    <th className="logs-table-cell">Store</th>
                    <th className="logs-table-cell">Quantity</th>
                    <th className="logs-table-cell">Status</th>
                    <th className="logs-table-cell">Last Updated</th>
                    <th className="logs-table-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock, index) => (
                    <tr key={stock.id} className="log-entry">
                      <td className="logs-table-data">{stock.product.name}</td>
                      <td className="logs-table-data"><code>{stock.product.sku}</code></td>
                      <td className="logs-table-data">{stock.store.name}</td>
                      <td className="logs-table-data">{stock.quantity}</td>
                      <td className="logs-table-data">
                        <span className={`badge ${getStatusClass(stock.quantity, stock.threshold)}`}>
                          {getStatusText(stock.quantity, stock.threshold)}
                        </span>
                      </td>
                      <td className="logs-table-data">{formatDate(stock.lastUpdated)}</td>
                      <td className="logs-table-data">
                        <button className="btn btn-sm me-1 edit-button" title="Edit Stock">
                          <FaEdit />
                        </button>
                        <button className="btn btn-sm remove-button" title="Remove Stock">
                          <FaTimes />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}