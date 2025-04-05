import axios from 'axios';
import { API_URL } from './config';

// Create axios instance with the baseURL pointing to the Django backend
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token in API requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = async (email: string, password: string) => {
  try {
    // Create a dedicated axios instance just for login
    const loginApi = axios.create({
      baseURL: 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const response = await loginApi.post('/login/', { email, password });
    // Store token immediately after login
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error('Login error details:', error);
    throw error;
  }
};

export const register = async (userData: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  phone_number?: string;
}) => {
  try {
    const response = await api.post('/register/', userData);
    // Store token immediately after registration
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await api.post('/api/logout/');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Products API
export const getProducts = async () => {
  const response = await api.get('/products/');
  return response.data;
};

// Stores API
export const getStores = async () => {
  const response = await api.get('/stores/');
  return response.data;
};

// Suppliers API
export const getSuppliers = async () => {
  const response = await api.get('/suppliers/');
  return response.data;
};

// Stocks API
export const getStocks = async (params?: any) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Format date parameters if they exist
    const formattedParams = { ...params };
    if (formattedParams.start_date) {
      const startDate = new Date(formattedParams.start_date);
      if (!isNaN(startDate.getTime())) {
        formattedParams.start_date = startDate.toISOString().split('T')[0];
      } else {
        delete formattedParams.start_date;
      }
    }
    
    if (formattedParams.end_date) {
      const endDate = new Date(formattedParams.end_date);
      if (!isNaN(endDate.getTime())) {
        formattedParams.end_date = endDate.toISOString().split('T')[0];
      } else {
        delete formattedParams.end_date;
      }
    }

    // Remove empty params before sending request
    const cleanParams = formattedParams ? Object.fromEntries(
      Object.entries(formattedParams).filter(([_, value]) => value !== '' && value !== undefined)
    ) : {};
    
    // Construct URL with query params
    const queryString = cleanParams ? 
      '?' + new URLSearchParams(
        Object.entries(cleanParams).reduce((acc, [key, value]) => {
          acc[key] = String(value); // Convert all values to strings
          return acc;
        }, {} as Record<string, string>)
      ).toString() : '';
      
    console.log(`Fetching stocks with query: ${queryString}`);
    
    const response = await fetch(`${API_URL}/api/stocks/${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch stocks');
    }

    const data = await response.json();
    console.log(`Got ${data.length} stocks in response`);
    
    // If the data is empty, return an empty array
    if (!data || data.length === 0) {
      return [];
    }
    
    // Ensure the response is properly formatted and ID is a number
    return data.map((stock: any) => ({
      ...stock,
      id: stock.id ? Number(stock.id) : stock.product.id + '-' + stock.store.id,
      product: {
        ...stock.product,
        id: Number(stock.product.id)
      },
      store: {
        ...stock.store,
        id: Number(stock.store.id)
      },
      quantity: Number(stock.quantity)
    }));
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return [];
  }
};

export const getStock = async (id: string) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Token ${token}` } : {};
    
    const response = await axios.get(`http://localhost:8000/stocks/${id}/`, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching stock ${id}:`, error);
    return null;
  }
};

export const getStockData = async (params = {}) => {
  try {
    console.log('Fetching stock data with params:', params);
    // Ensure the token is in the headers for this specific request
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Remove empty params before sending request
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== '')
    );
    
    // Construct URL with query params
    const queryString = cleanParams ? 
      '?' + new URLSearchParams(
        Object.entries(cleanParams).reduce((acc, [key, value]) => {
          acc[key] = String(value); // Convert all values to strings
          return acc;
        }, {} as Record<string, string>)
      ).toString() : '';
    
    const response = await fetch(`${API_URL}/api/stock/${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stock data');
    }

    const data = await response.json();
    console.log('Stock data response:', data);
    
    // Check if data is an array, otherwise use the stocks property if available
    let stocksArray = Array.isArray(data) ? data : [];
    
    // If data has a stocks property that is an array, use that instead
    if (!Array.isArray(data) && data && Array.isArray(data.stocks)) {
      stocksArray = data.stocks;
    }
    
    // Calculate summary data from the stock results
    const total_items = stocksArray.length;
    const low_stock_count = stocksArray.filter((stock: any) => 
      stock && stock.quantity > 0 && stock.quantity < 20
    ).length;
    const out_of_stock_count = stocksArray.filter((stock: any) => 
      stock && stock.quantity === 0
    ).length;
    
    return {
      stocks: stocksArray,
      total_items,
      low_stock_count,
      out_of_stock_count,
      growth_percentage: data.growth_percentage || 0 // Use from response if available
    };
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return {
      stocks: [],
      total_items: 0,
      low_stock_count: 0,
      out_of_stock_count: 0,
      growth_percentage: 0
    };
  }
};

// Stock Movements API
export const addStockMovement = async (data: any) => {
  try {
    console.log('Sending stock movement data:', data);
    
    // Enable axios to respond with detailed error information (this won't affect the response)
    const response = await api.post('/stock-movements/', data, {
      validateStatus: (status) => {
        // Return true for any status code to prevent axios from rejecting the promise
        // This allows us to see the actual error response
        return true;
      }
    });
    
    if (response.status >= 400) {
      console.error('Error details from server:', response.data);
      throw new Error(`Server returned ${response.status} with message: ${JSON.stringify(response.data)}`);
    }
    
    console.log('Stock movement response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error in addStockMovement:', error);
    
    // Log more details about the error
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      
      // If DRF returns field validation errors (common with 400 errors)
      if (error.response.data && typeof error.response.data === 'object') {
        Object.entries(error.response.data).forEach(([field, errors]) => {
          console.error(`Field '${field}' errors:`, errors);
        });
      }
    }
    
    throw error;
  }
};

// Logs API
export const getLogs = async (params = {}) => {
  try {
    console.log('Fetching logs with params:', params);
    // Remove empty parameters before sending the request
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== null && value !== undefined && value !== '')
    );
    
    // Ensure the token is in the headers for this specific request
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Token ${token}` } : {};
    
    const response = await axios.get('http://localhost:8000/api/logs/', { 
      params: cleanParams,
      headers
    });
    
    console.log('Logs response:', response.data);
    
    // Transform the data to match the expected interface if needed
    const formattedLogs = response.data.map((log: any) => ({
      id: log.id,
      action: log.action,
      timestamp: log.timestamp,
      user: log.user_email,
      details: typeof log.details === 'object' ? JSON.stringify(log.details) : log.details
    }));
    
    return formattedLogs;
  } catch (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
};

// Generate dummy data (for testing)
export const generateDummyData = async () => {
  try {
    // Explicitly include the token in the headers
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Token ${token}` } : {};
    
    const response = await axios.get('http://localhost:8000/api/generate-dummy-data/', { headers });
    return response.data;
  } catch (error) {
    console.error('Error generating dummy data:', error);
    throw error;
  }
};

// Helper function to check if the user is authenticated via token
export const checkAuthStatus = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return false;
  }

  try {
    // Make a request to a simple endpoint that won't cause a redirect
    const response = await fetch(`${API_URL}/login/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`
      }
    });
    return response.ok;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
};

export default api; 