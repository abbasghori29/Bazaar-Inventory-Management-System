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

interface OutOfStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: Stock[];
}

const OutOfStockModal: React.FC<OutOfStockModalProps> = ({ isOpen, onClose, stocks }) => {
  const [outOfStockItems, setOutOfStockItems] = useState<Stock[]>([]);

  useEffect(() => {
    // Filter stocks to find out of stock items (quantity is 0)
    const outItems = stocks.filter(stock => stock.quantity === 0);
    setOutOfStockItems(outItems);
  }, [stocks]);

  if (!isOpen) return null;

  return (
    <div className="modal show modal-backdrop">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Out of Stock Items</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {outOfStockItems.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-zebra table-hover">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Store</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outOfStockItems.map(item => (
                      <tr key={`${item.product.id}-${item.store.id}`}>
                        <td className="fw-medium">{item.product.name}</td>
                        <td><span className="text-muted">{item.product.sku}</span></td>
                        <td>{item.store.name}</td>
                        <td>
                          <span className="badge badge-gradient-danger">Out of Stock</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">No out of stock items found.</div>
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

export default OutOfStockModal; 