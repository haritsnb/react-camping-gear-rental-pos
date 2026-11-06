import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Users,
  Wrench,
  CreditCard,
  Sliders,
  LogOut,
  MountainSnow,
  Code2,
  Menu,
  X
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard & Laporan', path: '/', icon: LayoutDashboard },
    { label: 'Kasir Sewa (POS)', path: '/rentals', icon: ShoppingCart },
    { label: 'Produk & Stok Fisik', path: '/products', icon: Boxes },
    { label: 'Pelanggan & KYC', path: '/customers', icon: Users },
    { label: 'Servis / Maintenance', path: '/maintenance', icon: Wrench },
    { label: 'Pembayaran', path: '/payments', icon: CreditCard },
    { label: 'Master Data & User', path: '/master', icon: Sliders, roles: ['admin'] },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex-shrink-0">
        <div className="p-4 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md shadow-green-950/40">
            <MountainSnow className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm tracking-wider">CGR POS</h1>
            <p className="text-[10px] text-green-400 font-medium">Camping Gear Rental</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            if (item.roles && user?.role_name && !item.roles.includes(user.role_name)) {
              return null;
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-green-700 text-white shadow-md shadow-green-950/30 font-bold'
                      : 'hover:bg-slate-800/80 hover:text-white text-slate-400'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Engine: <span className="text-slate-400 font-semibold">Golang + PostgreSQL</span>
        </div>
      </aside>

      {/* MOBILE SIDEBAR DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm">
          <div className="w-64 bg-slate-900 text-slate-300 h-full p-4 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MountainSnow className="w-6 h-6 text-green-500" />
                <span className="font-bold text-white text-sm">CGR POS</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 mt-4 space-y-1.5">
              {navItems.map((item) => {
                if (item.roles && user?.role_name && !item.roles.includes(user.role_name)) return null;
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                        isActive ? 'bg-green-700 text-white' : 'text-slate-400 hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* MAIN WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Point Of Sale System</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
              <span className="inline-block text-[9px] font-bold uppercase bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200">
                {user?.role_name}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Keluar dari sistem"
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};