import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import type { Payment } from '@/types';
import Swal from 'sweetalert2';
import {
  CreditCard,
  Plus,
  Pen,
  Trash2,
  RotateCcw,
  Skull,
  ShieldAlert,
  Search,
  X
} from 'lucide-react';

export const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  // Default filter dikosongkan agar pengguna mencari secara spesifik
  const [rentalIdFilter, setRentalIdFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTrashView, setIsTrashView] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState<number | null>(null);

  // Form State
  const [rentalId, setRentalId] = useState<number | ''>('');
  const [paymentType, setPaymentType] = useState<
    'down_payment' | 'full_payment' | 'deposit_in' | 'deposit_refund' | 'penalty_charge'
  >('full_payment');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amount, setAmount] = useState<number | ''>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const formatRupiah = (val?: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Fetch Data Pembayaran
  const fetchPayments = async () => {
    // Mode Kotak Sampah: Ambil semua pembayaran yang di-soft delete
    if (isTrashView) {
      setLoading(true);
      try {
        const res = await api.get('/payments/deleted');
        setPayments(res.data.data || []);
      } catch {
        setPayments([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mode Aktif: Jika input kosong, tidak memanggil API dan reset daftar tabel
    if (!rentalIdFilter.trim()) {
      setPayments([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/payments/rental/${rentalIdFilter.trim()}`);
      setPayments(res.data.data || []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch ulang saat berpindah mode Aktif <-> Sampah
  useEffect(() => {
    fetchPayments();
  }, [isTrashView]);

  // Buka Modal (Tambah / Edit)
  const handleOpenModal = (payment?: Payment) => {
    if (payment) {
      setEditPaymentId(payment.id);
      setRentalId(payment.rental_id);
      setPaymentType(payment.payment_type);
      setPaymentMethod(payment.payment_method);
      setAmount(payment.amount);
      setReferenceNumber(payment.reference_number || '');
      setNotes(payment.notes || '');
    } else {
      setEditPaymentId(null);
      setRentalId(rentalIdFilter ? Number(rentalIdFilter) : '');
      setPaymentType('full_payment');
      setPaymentMethod('cash');
      setAmount('');
      setReferenceNumber('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  // Submit Form Pembayaran (POST / PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentalId) {
      return Swal.fire('Peringatan', 'Nomor Rental ID wajib diisi', 'warning');
    }

    const payload = {
      rental_id: Number(rentalId),
      payment_type: paymentType,
      payment_method: paymentMethod,
      amount: Number(amount),
      reference_number: referenceNumber || undefined,
      notes: notes || undefined,
    };

    try {
      if (editPaymentId) {
        await api.put(`/payments/${editPaymentId}`, payload);
        Swal.fire('Sukses', 'Pembayaran berhasil diperbarui', 'success');
      } else {
        await api.post('/payments', payload);
        Swal.fire('Sukses', 'Pembayaran berhasil dicatat', 'success');
      }
      setIsModalOpen(false);
      // Sinkronkan filter dengan ID yang baru saja diproses jika belum diisi
      if (!rentalIdFilter) {
        setRentalIdFilter(String(rentalId));
      }
      fetchPayments();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan sistem', 'error');
    }
  };

  // Soft Delete & Force Delete
  const handleDelete = (id: number, isForce: boolean) => {
    Swal.fire({
      title: isForce ? '⚠️ Hapus Permanen Pembayaran?' : 'Soft Delete Pembayaran?',
      text: isForce
        ? 'Data riwayat pembayaran ini akan dihapus selamanya dari database!'
        : 'Data pembayaran akan dipindahkan ke kotak sampah (Trash).',
      icon: isForce ? 'error' : 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      confirmButtonColor: isForce ? '#e11d48' : '#d97706',
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await api.delete(`/payments/${id}${isForce ? '/force' : ''}`);
          Swal.fire('Berhasil!', 'Data pembayaran telah diproses.', 'success');
          fetchPayments();
        } catch (err: any) {
          Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan sistem', 'error');
        }
      }
    });
  };

  // 1-Klik Restore Pembayaran
  const handleRestore = async (id: number) => {
    try {
      await api.post(`/payments/${id}`);
      Swal.fire('Dipulihkan!', `Pembayaran ID ${id} kembali aktif.`, 'success');
      fetchPayments();
    } catch (err: any) {
      Swal.fire('Gagal Restore', err.response?.data?.message || 'Gagal memulihkan pembayaran', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-700" />
            <span>Histori & Transaksi Pembayaran</span>
          </h1>
          <p className="text-xs text-slate-500">Pencatatan uang muka, pelunasan, pengembalian deposit, dan denda</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Aktif vs Sampah */}
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
            <button
              onClick={() => handleOpenModal()}
              className="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Pembayaran</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabel Data Pembayaran */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isTrashView ? (
          <div className="bg-rose-50 border-b border-rose-200 p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Menampilkan data pembayaran yang di-soft delete. Klik tombol Restore untuk memulihkan.</span>
          </div>
        ) : (
          <div className="p-3 border-b border-slate-100 flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700">Filter Rental ID:</label>
            <input
              type="number"
              value={rentalIdFilter}
              onChange={(e) => setRentalIdFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchPayments()}
              placeholder="Ketik ID rental..."
              className="border border-slate-300 px-3 py-1.5 rounded-xl text-xs outline-none w-36 focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={fetchPayments}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari</span>
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Rental ID</th>
                <th className="p-3">Tipe Pembayaran</th>
                <th className="p-3">Metode</th>
                <th className="p-3 text-right">Nominal</th>
                <th className="p-3">Ref & Catatan</th>
                <th className="p-3">Waktu Bayar</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    Memuat riwayat bayar...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    {isTrashView
                      ? 'Kotak sampah pembayaran kosong'
                      : !rentalIdFilter.trim()
                      ? 'Silakan masukkan nomor Rental ID pada kolom di atas lalu klik "Cari" untuk menampilkan histori pembayaran invoice.'
                      : `Belum ada riwayat pembayaran untuk Rental ID #${rentalIdFilter}`}
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className={`hover:bg-slate-50 transition ${isTrashView ? 'bg-rose-50/20' : ''}`}>
                    <td className="p-3 font-mono font-bold text-slate-700">{p.id}</td>
                    <td className="p-3 font-bold text-slate-900">{p.rental_id}</td>
                    <td className="p-3 uppercase font-semibold text-green-700">{p.payment_type}</td>
                    <td className="p-3 uppercase font-medium text-slate-700">{p.payment_method}</td>
                    <td className="p-3 text-right font-black text-slate-800">{formatRupiah(p.amount)}</td>
                    <td className="p-3 text-slate-500">
                      {p.reference_number ? (
                        <span className="font-mono text-slate-700 mr-1.5 font-bold">[{p.reference_number}]</span>
                      ) : (
                        ''
                      )}
                      {p.notes || '-'}
                    </td>
                    <td className="p-3 text-[11px] text-slate-500">{p.paid_at.substring(0, 19).replace('T', ' ')}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isTrashView ? (
                          <>
                            <button
                              onClick={() => handleRestore(p.id)}
                              className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore</span>
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, true)}
                              className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                            >
                              <Skull className="w-3 h-3" />
                              <span>Hard Delete</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenModal(p)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                              title="Edit Pembayaran"
                            >
                              <Pen className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, false)}
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

      {/* MODAL FORM PEMBAYARAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-800">
                {editPaymentId ? `Edit Pembayaran ID: ${editPaymentId}` : 'Catat Pembayaran Manual'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Rental ID</label>
                <input
                  type="number"
                  value={rentalId}
                  onChange={(e) => setRentalId(Number(e.target.value))}
                  required
                  placeholder="Contoh: 1"
                  className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Pembayaran</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full border border-slate-300 p-2 rounded-xl bg-slate-50 outline-none"
                  >
                    <option value="full_payment">Pelunasan (Full)</option>
                    <option value="down_payment">Uang Muka (DP)</option>
                    <option value="deposit_in">Deposit Masuk</option>
                    <option value="deposit_refund">Pengembalian Deposit</option>
                    <option value="penalty_charge">Denda Tambahan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Metode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border border-slate-300 p-2 rounded-xl bg-slate-50 outline-none"
                  >
                    <option value="cash">Cash (Tunai)</option>
                    <option value="qris">QRIS</option>
                    <option value="transfer_bca">Transfer BCA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal Pembayaran (Rp)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  min="0"
                  placeholder="Contoh: 50000"
                  className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Referensi Bukti (Opsional)</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="TRX-BCA-..."
                  className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Pelunasan saat serah terima barang"
                  className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold shadow-md shadow-green-900/20"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};