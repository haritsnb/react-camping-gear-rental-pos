import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import type { Maintenance, ProductUnit } from '@/types';
import Swal from 'sweetalert2';
import {
  Wrench,
  Plus,
  Pen,
  Trash2,
  RotateCcw,
  Skull,
  ShieldAlert,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const [tickets, setTickets] = useState<Maintenance[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTrashView, setIsTrashView] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTicketId, setEditTicketId] = useState<number | null>(null);

  // Form State
  const [unitId, setUnitId] = useState<number | ''>('');
  const [issueDesc, setIssueDesc] = useState('');
  const [cost, setCost] = useState<number | ''>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const formatRupiah = (val?: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const fetchUnits = async () => {
    try {
      const res = await api.get('/product-units');
      setUnits(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const url = isTrashView ? '/maintenance/deleted' : '/maintenance';
      const res = await api.get(url);
      setTickets(res.data.data || []);
    } catch {
      Swal.fire('Error', 'Gagal memuat daftar servis', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [isTrashView]);

  const handleOpenModal = (ticket?: Maintenance) => {
    if (ticket) {
      setEditTicketId(ticket.id);
      setUnitId(ticket.product_unit_id);
      setIssueDesc(ticket.issue_description);
      setCost(ticket.cost);
      setStartDate(ticket.start_date.substring(0, 10));
    } else {
      setEditTicketId(null);
      setUnitId(units[0]?.id || '');
      setIssueDesc('');
      setCost(0);
      setStartDate(new Date().toISOString().split('T')[0]);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      product_unit_id: Number(unitId),
      issue_description: issueDesc,
      cost: Number(cost) || 0,
      start_date: startDate,
    };

    try {
      if (editTicketId) {
        await api.put(`/maintenance/${editTicketId}`, payload);
        Swal.fire('Sukses', 'Tiket servis berhasil diperbarui', 'success');
      } else {
        await api.post('/maintenance', payload);
        Swal.fire('Sukses', 'Tiket servis berhasil dibuat, unit menjadi maintenance', 'success');
      }
      setIsModalOpen(false);
      fetchTickets();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan sistem', 'error');
    }
  };

  const handleComplete = (ticket: Maintenance) => {
    Swal.fire({
      title: 'Selesaikan Servis?',
      text: `Unit ${ticket.unit_code} otomatis kembali ke status AVAILABLE (siap disewa kembali).`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Selesai Servis',
      confirmButtonColor: '#16a34a',
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await api.patch(`/maintenance/${ticket.id}/complete`);
          Swal.fire('Servis Selesai!', 'Status unit fisik kembali tersedia.', 'success');
          fetchTickets();
        } catch (err: any) {
          Swal.fire('Gagal', err.response?.data?.message || 'Gagal menyelesaikan servis', 'error');
        }
      }
    });
  };

  const handleDelete = (id: number, isForce: boolean) => {
    Swal.fire({
      title: isForce ? '⚠️ Hapus Permanen Tiket Servis?' : 'Soft Delete Tiket Servis?',
      text: isForce ? 'Catatan servis akan dihapus selamanya!' : 'Data akan dipindahkan ke kotak sampah (Trash).',
      icon: isForce ? 'error' : 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      confirmButtonColor: isForce ? '#e11d48' : '#d97706',
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await api.delete(`/maintenance/${id}${isForce ? '/force' : ''}`);
          Swal.fire('Berhasil!', 'Data telah diproses.', 'success');
          fetchTickets();
        } catch (err: any) {
          Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan', 'error');
        }
      }
    });
  };

  const handleRestore = async (id: number) => {
    try {
      await api.post(`/maintenance/${id}`);
      Swal.fire('Dipulihkan!', `Tiket servis ID ${id} kembali aktif.`, 'success');
      fetchTickets();
    } catch (err: any) {
      Swal.fire('Gagal Restore', err.response?.data?.message || 'Gagal restore data', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-green-700" />
            <span>Tiket Pemeliharaan & Servis Alat</span>
          </h1>
          <p className="text-xs text-slate-500">Pencatatan kerusakan alat, pelacakan biaya, dan pemulihan ketersediaan unit</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
              <span>Input Servis Manual</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isTrashView && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Menampilkan data tiket servis yang di-soft delete.</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Kode Unit (Barcode)</th>
                <th className="p-3">Kendala / Deskripsi Servis</th>
                <th className="p-3">Tanggal Masuk</th>
                <th className="p-3">Tanggal Selesai</th>
                <th className="p-3 text-right">Biaya Servis</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="p-6 text-center text-slate-400">Memuat data servis...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-slate-400">{isTrashView ? 'Kotak sampah servis kosong' : 'Tidak ada tiket servis aktif'}</td></tr>
              ) : (
                tickets.map((t) => {
                  const isComp = t.status === 'completed';
                  return (
                    <tr key={t.id} className={`hover:bg-slate-50 transition ${isTrashView ? 'bg-rose-50/20' : ''}`}>
                      <td className="p-3 font-mono font-bold text-slate-700">{t.id}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{t.unit_code}</td>
                      <td className="p-3 text-slate-700 max-w-sm">{t.issue_description}</td>
                      <td className="p-3 text-slate-500">{t.start_date.substring(0, 10)}</td>
                      <td className="p-3 text-slate-500">{t.completed_date ? t.completed_date.substring(0, 10) : '-'}</td>
                      <td className="p-3 text-right font-black text-slate-800">{formatRupiah(t.cost)}</td>
                      <td className="p-3 text-center">
                        {isComp ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>COMPLETED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>IN PROGRESS</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isTrashView ? (
                            <>
                              <button
                                onClick={() => handleRestore(t.id)}
                                className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                              <button
                                onClick={() => handleDelete(t.id, true)}
                                className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                              >
                                <Skull className="w-3 h-3" />
                                <span>Hard Delete</span>
                              </button>
                            </>
                          ) : (
                            <>
                              {!isComp && (
                                <button
                                  onClick={() => handleComplete(t)}
                                  className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-xs"
                                  title="Tandai Servis Selesai"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Selesai</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenModal(t)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                                title="Edit Tiket"
                              >
                                <Pen className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(t.id, false)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM SERVIS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-800">
                {editTicketId ? `Edit Tiket Servis ID: ${editTicketId}` : 'Input Tiket Servis Manual'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Unit Fisik</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(Number(e.target.value))}
                  required
                  className="w-full border border-slate-300 p-2 rounded-xl bg-slate-50 outline-none"
                >
                  <option value="">-- Pilih Unit --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.unit_code} - {u.product_name} ({u.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Kendala / Kerusakan</label>
                <textarea
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  required
                  rows={2}
                  placeholder="Contoh: Frame patah 1 ruas di ujung pasca sewa"
                  className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimasi Biaya Servis (Rp)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    min="0"
                    placeholder="0"
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Masuk</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
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
                  Simpan Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};