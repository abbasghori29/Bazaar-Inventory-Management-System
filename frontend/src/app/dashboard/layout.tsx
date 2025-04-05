'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { isAuthenticated } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import '@/styles/components/Dashboard.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      require('bootstrap/dist/js/bootstrap.bundle.min.js');
    }
    
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router, pathname]);

  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="container main-container">
        {children}
      </main>
      <Footer />
    </div>
  );
} 