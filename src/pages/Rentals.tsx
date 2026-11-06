import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import type { Rental, Customer, Product, ProductUnit } from '@/types';
import Swal from 'sweetalert2';
import {
  Plus,
  Handshake,
  RotateCcw,
  Calculator,
  Ban,
  Eye,
  Trash2,
  Skull,
  ShieldAlert,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  X,
  Receipt
} from 'lucide-react';

export const Rentals: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [isTrashView, setIsTrashView] = useState(false);

  // Modal States
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);

  // Data Lookup untuk Booking
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableUnits, setAvailableUnits] = useState<ProductUnit[]>([]);

  // Booking Form State
  const [bookCustomerId, setBookCustomerId] = useState<number | ''>('');
  const [bookStartDate, setBookStartDate] = useState('');
  const [bookEndDate, setBookEndDate] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);
  const [bookDownPayment, setBookDownPayment] = useState<number>(0);
  const [bookPaymentMethod, setBookPaymentMethod] = useState('cash');

  // Real-time Estimation States
  const [estDuration, setEstDuration] = useState(1);
  const [estRentalFee, setEstRentalFee] = useState(0);
  const [estMinDeposit, setEstMinDeposit] = useState(0);
  const [estGrandTotal, setEstGrandTotal] = useState(0);

  // Return Form State
  const [returnActualDate, setReturnActualDate] = useState('');
  const [returnConditions, setReturnConditions] = useState<{
    [key: number]: { condition: 'good' | 'damaged' | 'lost'; penalty: number };
  }>({});

  const formatRupiah = (val?: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Fetch Data Rentals
  const fetchRentals = async () => {
    setLoading(true);
    try {
      const url = isTrashView ? '/rentals/deleted' : `/rentals?status=${statusFilter}`;
      const res = await api.get(url);
      setRentals(res.data.data || []);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Gagal memuat daftar rental', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, [statusFilter, isTrashView]);

  // Kalkulasi Estimasi Real-Time Booking
  useEffect(() => {
    let days = 1;
    if (bookStartDate && bookEndDate) {
      const start = new Date(bookStartDate);
      const end = new Date(bookEndDate);
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (diffHours > 0) {
        days = Math.ceil(diffHours / 24);
      }
    }
    setEstDuration(days);

    const prodMap = new Map<number, Product>();
    products.forEach((p) => prodMap.set(p.id, p));

    let dailyRateTotal = 0;
    let depositTotal = 0;

    selectedUnitIds.forEach((uId) => {
      const unit = availableUnits.find((u) => u.id === uId);
      if (unit) {
        const prod = prodMap.get(unit.product_id);
        if (prod) {
          dailyRateTotal += prod.rental_price_per_day;
          depositTotal += prod.default_deposit;
        }
      }
    });

    const rentFee = dailyRateTotal * days;
    setEstRentalFee(rentFee);
    setEstMinDeposit(depositTotal);
    setEstGrandTotal(rentFee + depositTotal);
  }, [bookStartDate, bookEndDate, selectedUnitIds, products, availableUnits]);

  // Buka Modal Booking
  const handleOpenBooking = async () => {
    try {
      const [cRes, pRes, uRes] = await Promise.all([
        api.get('/customers'),
        api.get('/products'),
        api.get('/product-units'),
      ]);

      const activeCusts = (cRes.data.data || []).filter((c: Customer) => !c.is_blacklisted);
      const unitsAvail = (uRes.data.data || []).filter((u: ProductUnit) => u.status === 'available');

      setCustomers(activeCusts);
      setProducts(pRes.data.data || []);
      setAvailableUnits(unitsAvail);

      // Inisialisasi Tanggal Default
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0).toISOString().substring(0, 16);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 18, 0).toISOString().substring(0, 16);
      setBookStartDate(start);
      setBookEndDate(end);
      setSelectedUnitIds([]);
      setBookCustomerId(activeCusts[0]?.id || '');
      setBookDownPayment(0);

      setIsBookingOpen(true);
    } catch {
      Swal.fire('Error', 'Gagal memuat master data untuk booking', 'error');
    }
  };

  // Submit Booking (Fase 1)
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUnitIds.length === 0) {
      return Swal.fire('Peringatan', 'Pilih minimal 1 unit alat camping', 'warning');
    }

    const payload = {
      customer_id: Number(bookCustomerId),
      start_date: bookStartDate.replace('T', ' ') + ':00',
      expected_return_date: bookEndDate.replace('T', ' ') + ':00',
      items: selectedUnitIds.map((id) => ({ product_unit_id: id })),
      down_payment: Number(bookDownPayment) || 0,
      payment_method: bookPaymentMethod,
    };

    try {
      const res = await api.post('/rentals/booking', payload);
      setIsBookingOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Booking Berhasil!',
        html: `Invoice: <b>${res.data.data.invoice_number}</b><br>Grand Total: <b>${formatRupiah(res.data.data.grand_total)}</b>`,
      });
      fetchRentals();
    } catch (err: any) {
      Swal.fire('Gagal Booking', err.response?.data?.message || 'Terjadi kesalahan sistem', 'error');
    }
  };

  // Handover (Fase 2)
  const handleHandover = (rental: Rental) => {
    Swal.fire({
      title: 'Konfirmasi Handover?',
      text: `Serahkan unit alat fisik untuk invoice ${rental.invoice_number} kepada ${rental.customer_name}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Serahkan Alat',
      confirmButtonColor: '#2563eb',
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await api.post(`/rentals/${rental.id}/handover`);
          Swal.fire('Handover Selesai!', 'Status transaksi kini AKTIF dan unit RENTED.', 'success');
          fetchRentals();
        } catch (err: any) {
          Swal.fire('Gagal', err.response?.data?.message || 'Gagal serah terima alat', 'error');
        }
      }
    });
  };

  // Buka Modal Return (Fase 3)
  const handleOpenReturn = async (rentalId: number) => {
    try {
      const res = await api.get(`/rentals/${rentalId}`);
      const rentalData: Rental = res.data.data;
      setSelectedRental(rentalData);

      const initConditions: { [key: number]: { condition: 'good' | 'damaged' | 'lost'; penalty: number } } = {};
      (rentalData.items || []).forEach((item) => {
        initConditions[item.id] = { condition: 'good', penalty: 0 };
      });

      setReturnConditions(initConditions);
      setReturnActualDate(new Date().toISOString().substring(0, 16));
      setIsReturnOpen(true);
    } catch {
      Swal.fire('Error', 'Gagal memuat detail item sewa', 'error');
    }
  };

  // Submit Return (Fase 3)
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRental) return;

    const payload = {
      actual_return_date: returnActualDate.replace('T', ' ') + ':00',
      items: (selectedRental.items || []).map((it) => ({
        rental_item_id: it.id,
        condition_in: returnConditions[it.id]?.condition || 'good',
        item_penalty_fee: Number(returnConditions[it.id]?.penalty) || 0,
        return_notes: 'Evaluasi pengembalian kasir POS',
      })),
    };

    try {
      const res = await api.post(`/rentals/${selectedRental.id}/return`, payload);
      setIsReturnOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Pengembalian Selesai!',
        html: `Total Denda: <b>${formatRupiah(res.data.data.total_penalty_fee)}</b><br>Silakan lanjutkan ke tahap <b>Settlement</b>.`,
      });
      fetchRentals();
    } catch (err: any) {
      Swal.fire('Gagal Return', err.response?.data?.message || 'Terjadi kesalahan sistem', 'error');
    }
  };

  // Settlement (Fase 4)
  const handleSettlement = (rental: Rental) => {
    Swal.fire({
      title: 'Fase 4: Settlement Deposit',
      text: `Rekonsiliasi uang deposit vs denda pada invoice ${rental.invoice_number}. Unit alat otomatis dirilis kembali ke available/maintenance.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Proses Settlement',
      confirmButtonColor: '#16a34a',
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await api.post(`/rentals/${rental.id}/settlement`, {
            payment_method: 'cash',
            notes: 'Settlement pelunasan kasir POS',
          });
          Swal.fire('Settlement Berhasil!', 'Transaksi rental rampung (Completed).', 'success');
          fetchRentals();
        } catch (err: any) {
          Swal.fire('Gagal Settlement', err.response?.data?.message || 'Gagal menyelesaikan rental', 'error');
        }
      }
    });
  };

  // Batal Booking (Cancel)
  const handleCancelBooking = (rentalId: number) => {
    Swal.fire({
      title: 'Batalkan Booking?',
      text: 'Kunci unit fisik akan dilepaskan kembali menjadi Available.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Batalkan',
      confirmButtonColor: '#e11d48',
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await api.post(`/rentals/${rentalId}/cancel`);
          Swal.fire('Dibatalkan!', 'Booking rental berhasil dibatalkan.', 'success');
          fetchRentals();
        } catch (err: any) {
          Swal.fire('Gagal', err.response?.data?.message || 'Gagal membatalkan rental', 'error');
        }
      }
    });
  };

  // Detail Modal
  const handleViewDetail = async (rentalId: number) => {
    try {
      const res = await api.get(`/rentals/${rentalId}`);
      setSelectedRental(res.data.data);
      setIsDetailOpen(true);
    } catch {
      Swal.fire('Error', 'Gagal memuat detail invoice', 'error');
    }
  };

  // Soft Delete & Force Delete
  const handleDelete = (rentalId: number, isForce: boolean) => {
    Swal.fire({
      title: isForce ? '⚠️ Hapus Permanen Rental?' : 'Soft Delete Transaksi Rental?',
      text: isForce
        ? 'Data invoice dan rincian item akan dihapus selamanya dari database!'
        : 'Data akan dipindahkan ke kotak sampah (Trash).',
      icon: isForce ? 'error' : 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      confirmButtonColor: isForce ? '#e11d48' : '#d97706',
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await api.delete(`/rentals/${rentalId}${isForce ? '/force' : ''}`);
          Swal.fire('Berhasil!', 'Data rental telah dihapus.', 'success');
          fetchRentals();
        } catch (err: any) {
          Swal.fire('Gagal Hapus', err.response?.data?.message || 'Terjadi kesalahan sistem', 'error');
        }
      }
    });
  };

  // 1-Klik Restore
  const handleRestore = async (rentalId: number) => {
    try {
      await api.post(`/rentals/${rentalId}`);
      Swal.fire('Dipulihkan!', `Rental ID ${rentalId} berhasil di-restore.`, 'success');
      fetchRentals();
    } catch (err: any) {
      Swal.fire('Gagal Restore', err.response?.data?.message || 'Gagal memulihkan rental', 'error');
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'booked':
        return <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-200">BOOKED</span>;
      case 'active':
        return <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-blue-100 text-blue-800 border border-blue-200">ACTIVE</span>;
      case 'returned':
        return <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-purple-100 text-purple-800 border border-purple-200">RETURNED</span>;
      case 'completed':
        return <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-green-100 text-green-800 border border-green-200">COMPLETED</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600 border border-slate-300">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-green-700" />
            <span>Kasir & Transaksi Sewa (POS 4-Fase)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Fase 1: Booking $\rightarrow$ Fase 2: Handover $\rightarrow$ Fase 3: Return $\rightarrow$ Fase 4: Settlement
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Active vs Trash View Toggle */}
          <div className="inline-flex rounded-xl border border-slate-300 p-0.5 bg-slate-100 text-xs">
            <button
              onClick={() => setIsTrashView(false)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                !isTrashView ? 'bg-green-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setIsTrashView(true)}
              className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                isTrashView ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sampah</span>
            </button>
          </div>

          {!isTrashView && (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-300 text-xs px-3 py-1.5 rounded-xl outline-none bg-slate-50 focus:ring-2 focus:ring-green-500"
              >
                <option value="">Semua Status</option>
                <option value="booked">Booked (Terkunci)</option>
                <option value="active">Active (Sedang Disewa)</option>
                <option value="returned">Returned (Evaluasi Denda)</option>
                <option value="completed">Completed (Selesai)</option>
                <option value="cancelled">Cancelled (Dibatalkan)</option>
              </select>

              <button
                onClick={handleOpenBooking}
                className="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Booking Baru</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabel Data Rental */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isTrashView && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Menampilkan data rental yang di-soft delete. Klik tombol Restore untuk memulihkan atau Hard Delete untuk menghapus permanen.</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">No. Invoice</th>
                <th className="p-3">Pelanggan</th>
                <th className="p-3">Rentang Sewa</th>
                <th className="p-3 text-right">Biaya Sewa</th>
                <th className="p-3 text-right">Deposit</th>
                <th className="p-3 text-right">Denda</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi / Alur Operasional POS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    Memuat data transaksi sewa...
                  </td>
                </tr>
              ) : rentals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    {isTrashView ? 'Kotak sampah rental kosong' : 'Tidak ada transaksi rental ditemukan'}
                  </td>
                </tr>
              ) : (
                rentals.map((r) => (
                  <tr key={r.id} className={`hover:bg-slate-50 transition ${isTrashView ? 'bg-rose-50/20' : ''}`}>
                    <td className="p-3 font-mono font-bold text-slate-800">{r.invoice_number}</td>
                    <td className="p-3 font-medium">{r.customer_name}</td>
                    <td className="p-3 text-[11px] text-slate-500">
                      {r.start_date.substring(0, 10)} s/d {r.expected_return_date.substring(0, 10)}
                    </td>
                    <td className="p-3 text-right font-semibold">{formatRupiah(r.total_rental_fee)}</td>
                    <td className="p-3 text-right text-slate-500">{formatRupiah(r.total_deposit)}</td>
                    <td className="p-3 text-right font-bold text-amber-600">{formatRupiah(r.total_penalty_fee)}</td>
                    <td className="p-3 text-center">{renderStatusBadge(r.status)}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {isTrashView ? (
                          <>
                            <button
                              onClick={() => handleRestore(r.id)}
                              className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore</span>
                            </button>
                            <button
                              onClick={() => handleDelete(r.id, true)}
                              className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition"
                            >
                              <Skull className="w-3 h-3" />
                              <span>Hard Delete</span>
                            </button>
                          </>
                        ) : (
                          <>
                            {r.status === 'booked' && (
                              <>
                                <button
                                  onClick={() => handleHandover(r)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                                  title="Fase 2: Serahkan Alat"
                                >
                                  <Handshake className="w-3 h-3" />
                                  <span>Handover</span>
                                </button>
                                <button
                                  onClick={() => handleCancelBooking(r.id)}
                                  className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs transition"
                                  title="Batalkan Booking"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {r.status === 'active' && (
                              <button
                                onClick={() => handleOpenReturn(r.id)}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                                title="Fase 3: Pengembalian Alat"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Return</span>
                              </button>
                            )}

                            {r.status === 'returned' && (
                              <button
                                onClick={() => handleSettlement(r)}
                                className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-xs"
                                title="Fase 4: Settlement Deposit"
                              >
                                <Calculator className="w-3 h-3" />
                                <span>Settlement</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleViewDetail(r.id)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                              title="Lihat Detail Invoice"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDelete(r.id, false)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                              title="Soft Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL FASE 1: BOOKING SEWA ALAT (REAL-TIME ESTIMASI)     */}
      {/* ======================================================== */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Fase 1: Form Booking Sewa Alat</h3>
                <p className="text-[11px] text-slate-500">Kalkulasi durasi, jaminan deposit, dan biaya sewa real-time</p>
              </div>
              <button onClick={() => setIsBookingOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Pelanggan Terverifikasi (KYC)</label>
                <select
                  value={bookCustomerId}
                  onChange={(e) => setBookCustomerId(Number(e.target.value))}
                  required
                  className="w-full border border-slate-300 p-2 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">-- Pilih Pelanggan --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.identity_type}: {c.identity_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai Sewa</label>
                  <input
                    type="datetime-local"
                    value={bookStartDate}
                    onChange={(e) => setBookStartDate(e.target.value)}
                    required
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rencana Kembali</label>
                  <input
                    type="datetime-local"
                    value={bookEndDate}
                    onChange={(e) => setBookEndDate(e.target.value)}
                    required
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-slate-700">Pilih Unit Fisik Alat (Status: Available)</label>
                  <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">
                    {selectedUnitIds.length} Unit Dipilih
                  </span>
                </div>
                <div className="border border-slate-200 p-2 rounded-xl max-h-44 overflow-y-auto space-y-1.5 bg-slate-50">
                  {availableUnits.length === 0 ? (
                    <p className="text-rose-500 text-center py-4 font-medium">Tidak ada unit alat berstatus available!</p>
                  ) : (
                    availableUnits.map((u) => {
                      const prod = products.find((p) => p.id === u.product_id);
                      return (
                        <label
                          key={u.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 hover:border-green-400 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedUnitIds.includes(u.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedUnitIds([...selectedUnitIds, u.id]);
                                else setSelectedUnitIds(selectedUnitIds.filter((id) => id !== u.id));
                              }}
                              className="rounded text-green-600 focus:ring-green-500 w-4 h-4"
                            />
                            <div>
                              <span className="font-mono font-bold text-slate-800">{u.unit_code}</span>
                              <span className="text-slate-600 font-medium ml-1.5">{u.product_name}</span>
                            </div>
                          </div>
                          <div className="text-right text-[11px]">
                            <span className="font-bold text-green-700">{formatRupiah(prod?.rental_price_per_day)}/hr</span>
                            <span className="block text-[10px] text-slate-400">Dep: {formatRupiah(prod?.default_deposit)}</span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* BOX KALKULASI REAL-TIME & MINIMAL DEPOSIT */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-3.5 space-y-1.5 shadow-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Durasi Sewa:</span>
                  <span className="font-bold text-slate-800">{estDuration} Hari</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Estimasi Biaya Sewa:</span>
                  <span className="font-bold text-green-700">{formatRupiah(estRentalFee)}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-medium">
                  <span className="flex items-center gap-1 font-bold text-amber-800">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Minimal Jaminan Deposit:</span>
                  </span>
                  <span className="font-black text-amber-700">{formatRupiah(estMinDeposit)}</span>
                </div>
                <hr className="border-green-200 my-1" />
                <div className="flex justify-between text-slate-900 font-bold text-sm">
                  <span>Estimasi Grand Total:</span>
                  <span className="text-green-700">{formatRupiah(estGrandTotal)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Uang Muka / DP (Rp)
                    {estRentalFee > 0 && bookDownPayment === 0 && (
                      <span className="text-[10px] text-green-700 font-normal ml-1">
                        (Saran min 30%: {formatRupiah(Math.round(estRentalFee * 0.3))})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={bookDownPayment}
                    onChange={(e) => setBookDownPayment(Number(e.target.value))}
                    min="0"
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran DP</label>
                  <select
                    value={bookPaymentMethod}
                    onChange={(e) => setBookPaymentMethod(e.target.value)}
                    className="w-full border border-slate-300 p-2 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="cash">Cash (Tunai)</option>
                    <option value="qris">QRIS</option>
                    <option value="transfer_bca">Transfer Bank BCA</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold shadow-md shadow-green-900/20"
                >
                  Simpan Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL FASE 3: RETURN ALAT & EVALUASI FISIK / DENDA       */}
      {/* ======================================================== */}
      {isReturnOpen && selectedRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Fase 3: Pengembalian Alat (Return)</h3>
                <p className="text-[11px] text-slate-500">Invoice: {selectedRental.invoice_number}</p>
              </div>
              <button onClick={() => setIsReturnOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal & Waktu Kembali Aktual</label>
                <input
                  type="datetime-local"
                  value={returnActualDate}
                  onChange={(e) => setReturnActualDate(e.target.value)}
                  required
                  className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Evaluasi Kondisi Fisik Tiap Unit</label>
                <div className="border border-slate-200 rounded-xl p-2.5 max-h-52 overflow-y-auto space-y-3 bg-slate-50">
                  {(selectedRental.items || []).map((item) => (
                    <div key={item.id} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                      <p className="font-bold text-slate-800">
                        {item.unit_code} - <span className="font-medium text-slate-600">{item.product_name}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Kondisi Fisik</label>
                          <select
                            value={returnConditions[item.id]?.condition || 'good'}
                            onChange={(e) =>
                              setReturnConditions({
                                ...returnConditions,
                                [item.id]: {
                                  ...returnConditions[item.id],
                                  condition: e.target.value as any,
                                },
                              })
                            }
                            className="w-full border border-slate-200 p-1.5 rounded-lg bg-slate-50 text-[11px] outline-none"
                          >
                            <option value="good">Good (Normal/Baik)</option>
                            <option value="damaged">Damaged (Rusak/Patah)</option>
                            <option value="lost">Lost (Hilang)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Denda Kerusakan (Rp)</label>
                          <input
                            type="number"
                            value={returnConditions[item.id]?.penalty || 0}
                            onChange={(e) =>
                              setReturnConditions({
                                ...returnConditions,
                                [item.id]: {
                                  ...returnConditions[item.id],
                                  penalty: Number(e.target.value) || 0,
                                },
                              })
                            }
                            min="0"
                            className="w-full border border-slate-200 p-1.5 rounded-lg text-[11px] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReturnOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-md shadow-purple-900/20"
                >
                  Proses Pengembalian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETAIL INVOICE TRANSAKSI SEWA                      */}
      {/* ======================================================== */}
      {isDetailOpen && selectedRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Invoice: {selectedRental.invoice_number}</h3>
                <p className="text-[11px] text-slate-500">Rincian Sewa & Status Unit Fisik</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[10px]">Pelanggan:</span>
                  <span className="font-bold text-slate-800">{selectedRental.customer_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Kasir Penanggung Jawab:</span>
                  <span className="font-bold text-slate-800">{selectedRental.user_name}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-400 block text-[10px]">Tanggal Mulai:</span>
                  <span className="font-medium text-slate-700">{selectedRental.start_date.substring(0, 19).replace('T', ' ')}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-400 block text-[10px]">Rencana Kembali:</span>
                  <span className="font-medium text-slate-700">{selectedRental.expected_return_date.substring(0, 19).replace('T', ' ')}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-1.5">Unit Fisik yang Disewa:</h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {(selectedRental.items || []).map((it) => (
                    <div key={it.id} className="p-2.5 flex justify-between items-center bg-white">
                      <div>
                        <span className="font-mono font-bold text-slate-800 mr-2">{it.unit_code}</span>
                        <span className="text-slate-700 font-medium">{it.product_name}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          @{formatRupiah(it.daily_rate)} x {it.duration_days} hari
                          {it.condition_in && <span className="ml-2 font-semibold text-amber-700">| Kembali: {it.condition_in}</span>}
                        </div>
                      </div>
                      <span className="font-black text-slate-800">{formatRupiah(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Total Biaya Sewa:</span>
                  <span className="font-bold">{formatRupiah(selectedRental.total_rental_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Jaminan Deposit:</span>
                  <span className="font-bold">{formatRupiah(selectedRental.total_deposit)}</span>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span className="font-semibold">Total Denda (Telat & Rusak):</span>
                  <span className="font-black">{formatRupiah(selectedRental.total_penalty_fee)}</span>
                </div>
                <hr className="border-slate-200 my-1" />
                <div className="flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-green-700">{formatRupiah(selectedRental.grand_total)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};