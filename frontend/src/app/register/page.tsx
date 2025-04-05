'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/lib/api';
import { setUserData, isAuthenticated } from '@/lib/auth';
import '@/styles/components/AuthPages.css';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('All required fields must be filled in');
      return;
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      const data = await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
        phone_number: phoneNumber
      });
      
      // Save user data and token
      setUserData(data);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container register-container">
      <h2>Register for Bazaar's Inventory Management</h2>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label htmlFor="firstName">First Name: <span className="text-danger">*</span></label>
              <input 
                type="text" 
                id="firstName" 
                className="form-control"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required 
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label htmlFor="lastName">Last Name: <span className="text-danger">*</span></label>
              <input 
                type="text" 
                id="lastName" 
                className="form-control"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required 
              />
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email: <span className="text-danger">*</span></label>
          <input 
            type="email" 
            id="email" 
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            autoComplete="email"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="role">Role:</label>
          <select
            id="role"
            className="form-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input 
            type="tel" 
            id="phoneNumber" 
            className="form-control"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Optional"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password: <span className="text-danger">*</span></label>
          <input 
            type="password" 
            id="password" 
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            autoComplete="new-password"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password: <span className="text-danger">*</span></label>
          <input 
            type="password" 
            id="confirmPassword" 
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required 
            autoComplete="new-password"
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="auth-link">
          Already have an account? <Link href="/login">Login here</Link>
        </div>
      </form>
    </div>
  );
} 