'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaChartLine, FaBox, FaClipboardList, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { logout } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { clearUserData } from '@/lib/auth';
import '@/styles/components/Navbar.css';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      clearUserData();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <Link href="/dashboard" className="navbar-brand">
          <span className="brand-name">Bazaar</span>
          <span className="brand-subtitle">Inventory</span>
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link 
                href="/dashboard" 
                className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
              >
                <FaChartLine className="nav-icon" />
                <span className="nav-text">Dashboard</span>
              </Link>
            </li>
            
            {/* Direct users to dashboard tabs instead of separate pages */}
            <li className="nav-item">
              <Link 
                href="/dashboard?tab=products" 
                className="nav-link"
              >
                <FaBox className="nav-icon" />
                <span className="nav-text">Products</span>
              </Link>
            </li>
            
            <li className="nav-item">
              <Link 
                href="/dashboard?tab=logs" 
                className="nav-link"
              >
                <FaClipboardList className="nav-icon" />
                <span className="nav-text">Activity Logs</span>
              </Link>
            </li>
            
            <li className="nav-item">
              <button 
                onClick={handleLogout}
                className="nav-link btn btn-link" 
              >
                <FaSignOutAlt className="nav-icon" />
                <span className="nav-text">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
} 