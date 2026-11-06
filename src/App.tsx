import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Rentals } from '@/pages/Rentals';
import { Products } from '@/pages/Products';
import { Customers } from '@/pages/Customers';
import { MaintenancePage } from '@/pages/Maintenance';
import { Payments } from '@/pages/Payments';
import { MasterData } from '@/pages/MasterData';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rute Publik */}
          <Route path="/login" element={<Login />} />

          {/* Rute Terproteksi dengan Dashboard Layout Shell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/rentals" element={<Rentals />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/payments" element={<Payments />} />
              
              {/* Rute Master Data & User (Khusus Role Admin) */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/master" element={<MasterData />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback Rute Tidak Dikenal */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}