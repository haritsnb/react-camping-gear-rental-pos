import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import type { RevenueReport, RentalSummaryReport, InventoryReport, TopProductReport } from '@/types';
import {
  Wallet,
  AlertTriangle,
  Wrench,
  Boxes,
  TrendingUp,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  Flame
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(true);

  // States Laporan
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [rentalSummary, setRentalSummary] = useState<RentalSummaryReport | null>(null);
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductReport[]>([]);

  const formatRupiah = (val?: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [revRes, rentRes, invRes, topRes] = await Promise.all([
        api.get(`/reports/revenue?start_date=${startDate}&end_date=${endDate}`),
        api.get(`/reports/rentals?start_date=${startDate}&end_date=${endDate}`),
        api.get('/reports/inventory'),
        api.get(`/reports/top-products?start_date=${startDate}&end_date=${endDate}&limit=5`),
      ]);

      setRevenue(revRes.data.data);
      setRentalSummary(rentRes.data.data);
      setInventory(invRes.data.data);
      setTopProducts(topRes.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data laporan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-extrabold text-slate-800">Ringkasan Laporan & Metrik Finansial</h1>
          <p className="text-xs text-slate-500">Omset sewa riil, denda keterlambatan/kerusakan, beban servis, dan valuasi aset</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-300 px-3 py-1.5 rounded-xl text-xs bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
          />
          <span className="text-xs text-slate-400 font-medium">s/d</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-300 px-3 py-1.5 rounded-xl text-xs bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{loading ? 'Memuat...' : 'Filter'}</span>
          </button>
        </div>
      </div>

      {/* 4 Top Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Laba Bersih (Net Profit)</p>
            <h3 className="text-xl font-black text-green-600 mt-1">{formatRupiah(revenue?.total_net_profit)}</h3>
            <span className="text-[10px] text-slate-400 font-medium">{revenue?.total_transactions || 0} transaksi rampung</span>
          </div>
          <div className="w-11 h-11 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Penerimaan Denda</p>
            <h3 className="text-xl font-black text-amber-600 mt-1">{formatRupiah(revenue?.total_penalty_revenue)}</h3>
            <span className="text-[10px] text-slate-400 font-medium">Telat kembali & fisik rusak</span>
          </div>
          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Beban Biaya Servis</p>
            <h3 className="text-xl font-black text-rose-600 mt-1">{formatRupiah(revenue?.total_maintenance_cost)}</h3>
            <span className="text-[10px] text-slate-400 font-medium">Pengeluaran reparasi alat</span>
          </div>
          <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Valuasi Aset</p>
            <h3 className="text-xl font-black text-slate-800 mt-1">{formatRupiah(inventory?.total_assets_value)}</h3>
            <span className="text-[10px] text-slate-400 font-medium">
              {inventory?.total_units || 0} unit ({inventory?.available_units || 0} siap sewa)
            </span>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 5 Status Transaksi Sewa */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <span>Status Transaksi Sewa Periode Ini</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-amber-700 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">BOOKED</span>
            </div>
            <p className="text-xl font-black text-amber-800">{rentalSummary?.total_booked || 0}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-blue-700 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">ACTIVE</span>
            </div>
            <p className="text-xl font-black text-blue-800">{rentalSummary?.total_active || 0}</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-purple-700 mb-1">
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">RETURNED</span>
            </div>
            <p className="text-xl font-black text-purple-800">{rentalSummary?.total_returned || 0}</p>
          </div>

          <div className="bg-green-50 border border-green-200 p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1.5 text-green-700 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">COMPLETED</span>
            </div>
            <p className="text-xl font-black text-green-800">{rentalSummary?.total_completed || 0}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center col-span-2 sm:col-span-1">
            <div className="flex items-center justify-center gap-1.5 text-slate-600 mb-1">
              <XCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">CANCELLED</span>
            </div>
            <p className="text-xl font-black text-slate-700">{rentalSummary?.total_cancelled || 0}</p>
          </div>
        </div>
      </div>

      {/* Top Rented Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Peringkat 5 Perlengkapan Paling Banyak Disewa</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200/60">
              <tr>
                <th className="p-3">Nama Produk</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Brand</th>
                <th className="p-3 text-center">Total Frekuensi Sewa</th>
                <th className="p-3 text-right">Kontribusi Omset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    Belum ada data transaksi sewa pada rentang tanggal ini
                  </td>
                </tr>
              ) : (
                topProducts.map((p) => (
                  <tr key={p.product_id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-800">{p.product_name}</td>
                    <td className="p-3 text-slate-600">{p.category_name}</td>
                    <td className="p-3 text-slate-600">{p.brand_name}</td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-green-100 text-green-800">
                        {p.total_rented}x
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-slate-800">{formatRupiah(p.total_revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};