'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import '@/styles/components/Modal.css';

// Define interfaces
interface Product {
  id: string | number; // Allow both string and number
  name: string;
  sku: string;
}

interface Store {
  id: string | number; // Allow both string and number
  name: string;
  location: string;
}

interface Stock {
  id: number;
  product: Product;
  store: Store;
  quantity: number;
  location?: string;
}

interface LowStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: Stock[];
}

const LowStockModal: React.FC<LowStockModalProps> = ({ isOpen, onClose, stocks }) => {
  const [lowStockItems, setLowStockItems] = useState<Stock[]>([]);

  useEffect(() => {
    // Filter stocks to find low stock items (quantity between 1 and 19)
    const lowItems = stocks.filter(stock => stock.quantity > 0 && stock.quantity < 20);
    setLowStockItems(lowItems);
  }, [stocks]);

  if (!isOpen) return null;

  return (
    <div className="modal show modal-backdrop">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Low Stock Items</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {lowStockItems.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-zebra table-hover">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Store</th>
                      <th>Quantity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map(item => (
                      <tr key={`${item.product.id}-${item.store.id}`}>
                        <td className="fw-medium">{item.product.name}</td>
                        <td><span className="text-muted">{item.product.sku}</span></td>
                        <td>{item.store.name}</td>
                        <td className="fw-medium text-warning">{item.quantity}</td>
                        <td>
                          <span className="badge badge-gradient-warning">Low Stock</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">No low stock items found.</div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              <FaTimes className="me-1" />Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LowStockModal; 