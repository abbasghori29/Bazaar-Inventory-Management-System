'use client';

import { useState, useEffect } from 'react';
import { FaFilter, FaUndo, FaEdit, FaTimes, FaBox, FaPlusCircle, FaSearch, FaBarcode } from 'react-icons/fa';
import { getProducts, getSuppliers } from '@/lib/api';

// Define types
interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  supplier_id: string;
  supplier_name?: string;
}

interface Supplier {
  id: string;
  name: string;
}

export default function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, suppliersData] = await Promise.all([
          getProducts(),
          getSuppliers()
        ]);
        
        // Map supplier names to products
        const enhancedProducts = productsData.map((product: Product) => {
          const supplier = suppliersData.find((s: Supplier) => s.id === product.supplier_id);
          return {
            ...product,
            supplier_name: supplier ? supplier.name : 'Unknown'
          };
        });
        
        setProducts(enhancedProducts);
        setSuppliers(suppliersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let filteredProducts = [...products];
    
    // Apply supplier filter
    if (selectedSupplier) {
      filteredProducts = filteredProducts.filter(product => 
        product.supplier_id === selectedSupplier
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.sku.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    filteredProducts.sort((a, b) => {
      const aValue = a[sortField as keyof Product];
      const bValue = b[sortField as keyof Product];
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      // Handle number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    setProducts(filteredProducts);
  };

  const resetFilters = async () => {
    setSelectedSupplier('');
    setSearchQuery('');
    setSortField('name');
    setSortOrder('asc');
    
    // Reload original data
    setLoading(true);
    try {
      const [productsData, suppliersData] = await Promise.all([
        getProducts(),
        getSuppliers()
      ]);
      
      const enhancedProducts = productsData.map((product: Product) => {
        const supplier = suppliersData.find((s: Supplier) => s.id === product.supplier_id);
        return {
          ...product,
          supplier_name: supplier ? supplier.name : 'Unknown'
        };
      });
      
      setProducts(enhancedProducts);
    } catch (error) {
      console.error('Error resetting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    // If clicking on the same field, toggle order
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If new field, set as ascending
      setSortField(field);
      setSortOrder('asc');
    }
    
    // Apply sort
    const sortedProducts = [...products].sort((a, b) => {
      const aValue = a[field as keyof Product];
      const bValue = b[field as keyof Product];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    setProducts(sortedProducts);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="page-heading">Products Management</h2>
          <p className="text-muted">
            Manage your product catalog and supplier information
          </p>
        </div>
        <button className="btn add-button">
          <FaPlusCircle className="me-2" /> Add Product
        </button>
      </div>
      
      {/* Filter Card */}
      <div className="card mb-4 filter-card">
        <div className="card-body p-4">
          <h5 className="mb-3 filter-heading">
            <FaFilter className="me-2" /> Filter Products
          </h5>
          <form onSubmit={handleFilterSubmit}>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="supplier-filter" className="form-label filter-label">Supplier</label>
                  <select 
                    className="form-select filter-select" 
                    id="supplier-filter"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label htmlFor="search-query" className="form-label filter-label">Search</label>
                  <div className="input-group search-input-group">
                    <span className="input-group-text search-icon-container">
                      <FaSearch className="search-icon" />
                    </span>
                    <input 
                      type="text" 
                      className="form-control search-input" 
                      id="search-query" 
                      placeholder="Search by name, SKU, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex">
              <button 
                type="button" 
                className="btn btn-sm me-2 clear-button"
                onClick={resetFilters}
              >
                <FaUndo className="me-2" /> Reset
              </button>
              <button type="submit" className="btn btn-sm filter-button">
                <FaFilter className="me-2" /> Apply Filters
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Products Table */}
      <div className="card content-card">
        <div className="card-body">
          <h5 className="card-title mb-3 content-heading">Product Inventory</h5>
          
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border mb-3 spinner" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="loading-text">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <FaBox size={48} className="empty-icon" />
              <h5 className="empty-heading">No products found</h5>
              <p className="empty-description">
                Try adjusting your filters to see more results or add new products.
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table table-hover products-table">
                <thead className="table-header">
                  <tr>
                    <th 
                      className="th-cell"
                      onClick={() => handleSort('name')}
                    >
                      Product Name
                      {sortField === 'name' && (
                        <span className="ms-2">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className="th-cell"
                      onClick={() => handleSort('sku')}
                    >
                      SKU
                      {sortField === 'sku' && (
                        <span className="ms-2">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className="th-cell"
                      onClick={() => handleSort('price')}
                    >
                      Price
                      {sortField === 'price' && (
                        <span className="ms-2">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th className="th-cell">
                      Supplier
                    </th>
                    <th className="th-cell">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="staggered-item">
                      <td className="product-name-cell">{product.name}</td>
                      <td className="product-sku-cell">
                        <div className="d-flex align-items-center">
                          <FaBarcode className="me-2 sku-icon" />
                          <span className="sku-text">{product.sku}</span>
                        </div>
                      </td>
                      <td className="price-cell">${product.price?.toFixed(2) || '0.00'}</td>
                      <td className="supplier-cell">{product.supplier_name || 'Unknown'}</td>
                      <td className="actions-cell">
                        <button className="btn btn-sm me-1 edit-button" title="Edit Product">
                          <FaEdit />
                        </button>
                        <button className="btn btn-sm remove-button" title="Remove Product">
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