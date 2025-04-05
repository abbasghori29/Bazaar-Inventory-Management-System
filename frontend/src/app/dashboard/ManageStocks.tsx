import { useState, useEffect } from 'react';
import { FaEdit, FaHistory, FaArrowUp, FaArrowDown, FaTimes, FaPlusCircle } from 'react-icons/fa';
import { API_URL } from '@/lib/config';
import { getLogs, getStocks, getStockData, addStockMovement } from '@/lib/api';

// Define types for our data
interface Product {
  id: string | number;
  name: string;
  sku: string;
}

interface Store {
  id: string | number;
  name: string;
  location?: string;
}

interface Supplier {
  id: string;
  name: string;
  contact_info?: string;
}

interface Stock {
  id: number;
  product: {
    id: number | string;
    name: string;
    sku: string;
  };
  store: {
    id: number | string;
    name: string;
    location?: string;
  };
  location: string;
  quantity: number;
  updated_at: string;
}

// Separate interface for stock editing
interface EditingStock {
  id: number;
  product: number | string;
  store: number | string;
  location: string;
  quantity: number;
}

// interface for logs
interface LogEntry {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  details: string;
}

interface ManageStocksProps {
  products: Product[];
  stores: Store[];
  suppliers: Supplier[];
  onSetActiveTab: (tab: string) => void;
  stockToEdit: Stock | null;
  clearStockToEdit: () => void;
}

const ManageStocks: React.FC<ManageStocksProps> = ({
  products,
  stores,
  suppliers,
  onSetActiveTab,
  stockToEdit,
  clearStockToEdit
}) => {
  // Form state
  const [selectedProduct, setSelectedProduct] = useState<string | number>('');
  const [selectedStore, setSelectedStore] = useState<string | number>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [movementType, setMovementType] = useState<string>('IN');
  const [recentActivities, setRecentActivities] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(true);
  const [message, setMessage] = useState<{ text: string; type: string }>({ text: '', type: '' });

  useEffect(() => {
    if (stockToEdit) {
      setSelectedProduct(stockToEdit.product.id);
      setSelectedStore(stockToEdit.store.id);
      // Set quantity to current quantity by default
      setQuantity(stockToEdit.quantity);
      // Default movement type to OUT when editing
      setMovementType('OUT');
    }
  }, [stockToEdit]);

  // Fetch recent activities
  useEffect(() => {
    fetchRecentActivities();
  }, []);

  const fetchRecentActivities = async () => {
    try {
      setIsLoadingLogs(true);
      const logsData = await getLogs({ limit: 5, action: 'STOCK' });
      setRecentActivities(logsData || []);
      setIsLoadingLogs(false);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setIsLoadingLogs(false);
    }
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !selectedStore || !quantity) {
      setMessage({
        text: 'Please fill in all required fields',
        type: 'danger'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Convert all string IDs to integers 
      const productId = typeof selectedProduct === 'string' ? parseInt(selectedProduct) : selectedProduct;
      const storeId = typeof selectedStore === 'string' ? parseInt(selectedStore) : selectedStore;
      const quantityValue = typeof quantity === 'string' ? parseInt(quantity) : quantity;
      
      let movementData: any = {
        product_id: productId,
        store_id: storeId,
        movement_type: movementType,
        quantity: quantityValue,
      };
      
      if (movementType === 'IN' && selectedSupplier && selectedSupplier !== '') {
        movementData.supplier_id = parseInt(selectedSupplier.toString());
      }
      
      console.log('Submitting movement data:', movementData);
      
      // Call API to add stock movement
      const result = await addStockMovement(movementData);
      
      console.log('Movement result:', result);
      
      // Show success message
      setMessage({
        text: `Successfully ${movementType === 'IN' ? 'added' : 'removed'} ${quantity} units of product to the inventory`,
        type: 'success'
      });
      
      clearForm();
      
      // Refresh recent activities
      fetchRecentActivities();
      
      if (stockToEdit) {
        clearStockToEdit();
      }
    } catch (error: any) {
      console.error('Error creating movement:', error);
      
      const errorMessage = error.response && error.response.data 
        ? Object.entries(error.response.data)
            .map(([field, errors]: [string, any]) => `${field}: ${errors}`)
            .join(', ')
        : 'Failed to process inventory movement. Please check the console for details.';
            
      setMessage({
        text: errorMessage,
        type: 'danger'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStocks = async () => {
    try {
      const stocksData = await getStocks();
      console.log('Stocks:', stocksData);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  };

  const clearForm = () => {
    setSelectedProduct('');
    setSelectedStore('');
    setSelectedSupplier('');
    setQuantity(0);
    setMovementType('IN');
    
    if (stockToEdit) {
      clearStockToEdit();
    }
  };

  const formatLogDetails = (details: string) => {
    try {
      const parsedDetails = JSON.parse(details);
      
      // Format each key-value pair
      return Object.entries(parsedDetails)
        .map(([key, value]) => {
          const formattedKey = key.replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
          
          return `${formattedKey}: ${value}`;
        })
        .join(', ');
    } catch (e) {
      return details;
    }
  };

  return (
    <div className="row mt-4">
      <div className="col-lg-7">
        <div className="card h-100 hover-card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="card-title mb-0">
                <FaEdit className="me-2 text-primary" />
                {stockToEdit ? `Edit Stock: ${stockToEdit.product.name} at ${stockToEdit.store.name}` : 'Add Stock Movement'}
              </h5>
              {stockToEdit && (
                <button 
                  className="btn btn-outline-secondary btn-sm btn-glow"
                  onClick={clearForm}
                >
                  <FaTimes className="me-1" />Clear Form
                </button>
              )}
            </div>
            
            {message.text && (
              <div className={`alert alert-${message.type}`}>
                <i className="fa fa-check-circle me-2"></i>{message.text}
              </div>
            )}
            <form onSubmit={handleMovementSubmit} className="animate-slide-in">
              <div className="mb-4">
                <label className="form-label fw-medium">Movement Type</label>
                <div className="btn-group w-100" role="group">
                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="movement_type" 
                    id="type-in" 
                    value="IN"
                    checked={movementType === 'IN'}
                    onChange={() => setMovementType('IN')}
                  />
                  <label className="btn btn-outline-success" htmlFor="type-in">
                    <FaArrowUp className="me-1" />Stock In
                  </label>
                  
                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="movement_type" 
                    id="type-out" 
                    value="OUT"
                    checked={movementType === 'OUT'}
                    onChange={() => setMovementType('OUT')}
                  />
                  <label className="btn btn-outline-danger" htmlFor="type-out">
                    <FaArrowDown className="me-1" />Stock Out
                  </label>
                  
                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="movement_type" 
                    id="type-rem" 
                    value="REM"
                    checked={movementType === 'REM'}
                    onChange={() => setMovementType('REM')}
                  />
                  <label className="btn btn-outline-warning" htmlFor="type-rem">
                    <FaTimes className="me-1" />Manual Removal
                  </label>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label className="form-label fw-medium">Product</label>
                  <select 
                    className="form-select"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    required
                    disabled={stockToEdit !== null}
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium">Store</label>
                  <select 
                    className="form-select"
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    required
                    disabled={stockToEdit !== null}
                  >
                    <option value="">Select Store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {movementType === 'IN' && (
                <div className="mb-3">
                  <label className="form-label fw-medium">Supplier (for Stock In)</label>
                  <select 
                    className="form-select"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                  >
                    <option value="">Select Supplier (Optional)</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mb-4">
                <label className="form-label fw-medium">Quantity</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={quantity}
                  onChange={(e) => {
                    // Ensure quantity is always a positive integer
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      setQuantity(value);
                    } else if (e.target.value === '') {
                      // Allow clearing the field
                      setQuantity(0);
                    }
                  }}
                  required 
                  min="1"
                />
                {stockToEdit && (
                  <small className="form-text text-muted">
                    Current quantity: {stockToEdit.quantity}
                  </small>
                )}
              </div>
              <button 
                type="submit" 
                className="btn btn-primary btn-glow w-100" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaPlusCircle className="me-2" />{stockToEdit ? 'Update Stock' : 'Add Movement'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="col-lg-5">
        <div className="card h-100 hover-card">
          <div className="card-body">
            <h5 className="card-title">
              <FaHistory className="me-2 text-primary" />
              Recent Activities
            </h5>
            
            {isLoadingLogs ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-2">Loading recent activities...</p>
              </div>
            ) : recentActivities.length > 0 ? (
              <ul className="activity-list mt-4">
                {recentActivities.map((activity, index) => (
                  <li key={activity.id} className="activity-item staggered-item">
                    <div className="time">{new Date(activity.timestamp).toLocaleString()}</div>
                    <div className="title">
                      <span className={`badge ${
                        activity.action === 'LOGIN' || activity.action === 'LOGOUT' ? 'badge-gradient-primary' : 
                        activity.action === 'CREATE' ? 'badge-gradient-success' : 
                        activity.action === 'UPDATE' ? 'badge-gradient-warning' : 
                        activity.action === 'DELETE' ? 'badge-gradient-danger' : 
                        'badge-gradient-primary'
                      } me-2`}>
                        {activity.action}
                      </span>
                      <span className="fw-medium">{activity.user}</span>
                    </div>
                    <div className="activity-description">
                      {formatLogDetails(activity.details).length > 60 ? 
                        formatLogDetails(activity.details).substring(0, 60) + '...' : 
                        formatLogDetails(activity.details)
                      }
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4 mt-3">
                <div className="empty-state-icon">
                  <FaHistory className="text-muted" />
                </div>
                <p className="empty-state-text mt-3">No recent activities found.</p>
              </div>
            )}
            
            <div className="text-center mt-4">
              <button className="btn btn-outline-primary btn-sm btn-glow" onClick={() => onSetActiveTab('logs')}>
                <FaHistory className="me-1" />View All Activities
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageStocks; 