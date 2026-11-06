import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import type { Product, ProductUnit, Category, Brand } from '@/types';
import Swal from 'sweetalert2';
import {
  Boxes,
  QrCode,
  Barcode,
  Plus,
  Pen,
  Trash2,
  RotateCcw,
  Skull,
  ShieldAlert,
  X,
  Layers,
  Search
} from 'lucide-react';

export const Products: React.FC = () => {
  // Sub-tab: 'products' (Katalog) atau 'units' (Unit Fisik)
  const [activeTab, setActiveTab] = useState<'products' | 'units'>('products');

  // State Data
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);

  // Trash Mode State per Resource
  const [isProductTrash, setIsProductTrash] = useState(false);
  const [isUnitTrash, setIsUnitTrash] = useState(false);

  // Scan Barcode Simulator State
  const [scanCode, setScanCode] = useState('');

  // Modal State: Produk
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCatId, setProdCatId] = useState<number | ''>('');
  const [prodBrandId, setProdBrandId] = useState<number | ''>('');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [prodDeposit, setProdDeposit] = useState<number | ''>('');
  const [prodLateFee, setProdLateFee] = useState<number | ''>('');
  const [prodLostFee, setProdLostFee] = useState<number | ''>('');

  // Modal State: Unit Fisik
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editUnitId, setEditUnitId] = useState<number | null>(null);
  const [unitProductId, setUnitProductId] = useState<number | ''>('');
  const [unitCode, setUnitCode] = useState('');
  const [unitSerial, setUnitSerial] = useState('');
  const [unitCondition, setUnitCondition] = useState<'good' | 'damaged' | 'lost'>('good');
  const [unitNotes, setUnitNotes] = useState('');

  const formatRupiah = (val?: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Fetch Master Lookup (Kategori & Brand)
  const fetchLookups = async () => {
    try {
      const [cRes, bRes] = await Promise.all([
        api.get('/categories'),
        api.get('/brands'),
      ]);
      setCategories(cRes.data.data || []);
      setBrands(bRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Produk Master
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = isProductTrash ? '/products/deleted' : '/products';
      const res = await api.get(url);
      setProducts(res.data.data || []);
    } catch {
      Swal.fire('Error', 'Gagal memuat katalog produk', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Unit Fisik
  const fetchUnits = async () => {
    setLoading(true);
    try {
      const url = isUnitTrash ? '/product-units/deleted' : '/product-units';
      const res = await api.get(url);
      setUnits(res.data.data || []);
    } catch {
      Swal.fire('Error', 'Gagal memuat unit fisik', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    else fetchUnits();
  }, [activeTab, isProductTrash, isUnitTrash]);

  // Simulator Scan Barcode
  const handleScanBarcode = async () => {
    if (!scanCode.trim()) {
      return Swal.fire('Peringatan', 'Masukkan kode barcode unit (misal: TND-EIG-001)', 'warning');
    }

    try {
      const res = await api.get(`/product-units/scan/${scanCode.trim()}`);
      const u: ProductUnit = res.data.data;
      const isAvail = u.status === 'available';

      Swal.fire({
        title: `<strong>${u.unit_code}</strong>`,
        icon: isAvail ? 'success' : 'info',
        html: `
          <div class="text-xs text-left space-y-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
            <p><b>Produk:</b> ${u.product_name}</p>
            <p><b>Status Fisik:</b> <span class="uppercase font-bold ${isAvail ? 'text-green-600' : 'text-rose-600'}">${u.status}</span></p>
            <p><b>Kondisi:</b> <span class="uppercase font-semibold">${u.condition}</span></p>
            <p><b>Nomor Seri:</b> ${u.serial_number || '-'}</p>
            <p><b>Catatan:</b> ${u.notes || '-'}</p>
          </div>
        `,
      });
    } catch (err: any) {
      Swal.fire('Scan Gagal', err.response?.data?.message || 'Unit barcode tidak ditemukan', 'error');
    }
  };

  // ==========================================
  // HANDLER: PRODUK MASTER
  // ==========================================

  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditProductId(product.id);
      setProdName(product.name);
      setProdCatId(product.category_id);
      setProdBrandId(product.brand_id);
      setProdPrice(product.rental_price_per_day);
      setProdDeposit(product.default_deposit);
      setProdLateFee(product.late_fee_per_day);
      setProdLostFee(product.lost_compensation_fee);
    } else {
      setEditProductId(null);
      setProdName('');
      setProdCatId(categories[0]?.id || '');
      setProdBrandId(brands[0]?.id || '');
      setProdPrice('');
      setProdDeposit('');
      setProdLateFee('');
      setProdLostFee('');
    }
    setIsProductModalOpen(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: prodName,
      category_id: Number(prodCatId),
      brand_id: Number(prodBrandId),
      rental_price_per_day: Number(prodPrice),
      default_deposit: Number(prodDeposit) || 0,
      late_fee_per_day: Number(prodLateFee),
      lost_compensation_fee: Number(prodLostFee),
    };

    try {
      if (editProductId) {
        await api.put(`/products/${editProductId}`, payload);
        Swal.fire('Sukses', 'Produk berhasil diperbarui', 'success');
      } else {
        await api.post('/products', payload);
        Swal.fire('Sukses', 'Produk master berhasil ditambahkan', 'success');
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || 'Gagal menyimpan produk', 'error');
    }
  };

  // ==========================================
  // HANDLER: UNIT FISIK SERIALIZED
  // ==========================================

  const handleOpenUnitModal = (unit?: ProductUnit) => {
    if (unit) {
      setEditUnitId(unit.id);
      setUnitProductId(unit.product_id);
      setUnitCode(unit.unit_code);
      setUnitSerial(unit.serial_number || '');
      setUnitCondition(unit.condition);
      setUnitNotes(unit.notes || '');
    } else {
      setEditUnitId(null);
      setUnitProductId(products[0]?.id || '');
      setUnitCode('');
      setUnitSerial('');
      setUnitCondition('good');
      setUnitNotes('');
    }
    setIsUnitModalOpen(true);
  };

  const handleSubmitUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      product_id: Number(unitProductId),
      unit_code: unitCode,
      serial_number: unitSerial || undefined,
      condition: unitCondition,
      notes: unitNotes || undefined,
    };

    try {
      if (editUnitId) {
        await api.put(`/product-units/${editUnitId}`, payload);
        Swal.fire('Sukses', 'Unit fisik berhasil diperbarui', 'success');
      } else {
        await api.post('/product-units', payload);
        Swal.fire('Sukses', 'Unit fisik berhasil didaftarkan', 'success');
      }
      setIsUnitModalOpen(false);
      fetchUnits();
    } catch (err: any) {
      Swal.fire('Gagal', err.response?.data?.message || 'Gagal menyimpan unit fisik', 'error');
    }
  };

  // Generic Action: Delete / Restore / Force Delete
  const handleAction = (resource: 'products' | 'product-units', id: number, action: 'soft' | 'restore' | 'force') => {
    const isForce = action === 'force';
    const isRestore = action === 'restore';

    if (isRestore) {
      api.post(`/${resource}/${id}`).then(() => {
        Swal.fire('Dipulihkan!', 'Data berhasil di-restore kembali aktif.', 'success');
        if (resource === 'products') fetchProducts();
        else fetchUnits();
      }).catch((err) => {
        Swal.fire('Gagal Restore', err.response?.data?.message || 'Error', 'error');
      });
      return;
    }

    Swal.fire({
      title: isForce ? '⚠️ Hapus Permanen?' : 'Pindahkan ke Sampah (Soft Delete)?',
      text: isForce ? 'Data akan dihapus selamanya dari database!' : 'Data dapat dipulihkan kapan saja dari tab sampah.',
      icon: isForce ? 'error' : 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      confirmButtonColor: isForce ? '#e11d48' : '#d97706',
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          await api.delete(`/${resource}/${id}${isForce ? '/force' : ''}`);
          Swal.fire('Berhasil!', 'Aksi selesai diproses.', 'success');
          if (resource === 'products') fetchProducts();
          else fetchUnits();
        } catch (err: any) {
          Swal.fire('Gagal', err.response?.data?.message || 'Gagal memproses aksi', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Simulator Scan Barcode / QR */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-green-400 text-lg">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Simulator Scan Barcode / QR Unit Fisik</h3>
            <p className="text-[11px] text-slate-400">Validasi instan ketersediaan alat sebelum diserahkan</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScanBarcode()}
              placeholder="Contoh: TND-EIG-001"
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={handleScanBarcode}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Scan Unit</span>
          </button>
        </div>
      </div>

      {/* Main Switcher: Produk vs Unit Fisik */}
      <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'products'
                ? 'bg-white text-green-800 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Katalog Produk Master</span>
          </button>

          <button
            onClick={() => setActiveTab('units')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'units'
                ? 'bg-white text-green-800 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Unit Fisik Serialized</span>
          </button>
        </div>

        {/* Action Buttons per Tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'products' ? (
            <>
              <div className="inline-flex rounded-xl border border-slate-300 p-0.5 bg-slate-100 text-xs">
                <button
                  onClick={() => setIsProductTrash(false)}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    !isProductTrash ? 'bg-green-700 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Aktif
                </button>
                <button
                  onClick={() => setIsProductTrash(true)}
                  className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                    isProductTrash ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sampah</span>
                </button>
              </div>

              {!isProductTrash && (
                <button
                  onClick={() => handleOpenProductModal()}
                  className="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Produk</span>
                </button>
              )}
            </>
          ) : (
            <>
              <div className="inline-flex rounded-xl border border-slate-300 p-0.5 bg-slate-100 text-xs">
                <button
                  onClick={() => setIsUnitTrash(false)}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    !isUnitTrash ? 'bg-green-700 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Aktif
                </button>
                <button
                  onClick={() => setIsUnitTrash(true)}
                  className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                    isUnitTrash ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Sampah</span>
                </button>
              </div>

              {!isUnitTrash && (
                <button
                  onClick={() => handleOpenUnitModal()}
                  className="px-3.5 py-1.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Unit Fisik</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* TABEL A: KATALOG PRODUK MASTER */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {isProductTrash && (
            <div className="bg-rose-50 border-b border-rose-200 p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Menampilkan produk yang di-soft delete. Klik Restore untuk mengembalikan atau Hard Delete untuk menghapus permanen.</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Nama Produk</th>
                  <th className="p-3">Kategori / Brand</th>
                  <th className="p-3 text-right">Tarif / Hari</th>
                  <th className="p-3 text-right">Deposit</th>
                  <th className="p-3 text-right">Denda Telat</th>
                  <th className="p-3 text-center">Rekap Stok Real-Time</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="p-6 text-center text-slate-400">Memuat katalog produk...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-slate-400">{isProductTrash ? 'Kotak sampah produk kosong' : 'Belum ada produk terdaftar'}</td></tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className={`hover:bg-slate-50 transition ${isProductTrash ? 'bg-rose-50/20' : ''}`}>
                      <td className="p-3 font-mono font-bold text-slate-700">{p.id}</td>
                      <td className="p-3 font-bold text-slate-800">{p.name}</td>
                      <td className="p-3 text-slate-600">{p.category_name} / <span className="font-semibold">{p.brand_name}</span></td>
                      <td className="p-3 text-right font-bold text-green-700">{formatRupiah(p.rental_price_per_day)}</td>
                      <td className="p-3 text-right text-slate-500">{formatRupiah(p.default_deposit)}</td>
                      <td className="p-3 text-right text-amber-600">{formatRupiah(p.late_fee_per_day)}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full font-bold text-[10px]">
                          {p.available_units} Tersedia
                        </span>{' '}
                        / <span className="text-slate-500 text-[10px]">{p.total_units} Total</span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isProductTrash ? (
                            <>
                              <button
                                onClick={() => handleAction('products', p.id, 'restore')}
                                className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                              <button
                                onClick={() => handleAction('products', p.id, 'force')}
                                className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                              >
                                <Skull className="w-3 h-3" />
                                <span>Hard Delete</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenProductModal(p)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                                title="Edit Produk"
                              >
                                <Pen className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleAction('products', p.id, 'soft')}
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
      )}

      {/* TABEL B: UNIT FISIK SERIALIZED */}
      {activeTab === 'units' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {isUnitTrash && (
            <div className="bg-rose-50 border-b border-rose-200 p-3 text-xs text-rose-800 font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Menampilkan unit fisik yang di-soft delete. Klik Restore untuk mengembalikan atau Hard Delete untuk menghapus permanen.</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Kode Unit (Barcode)</th>
                  <th className="p-3">Produk Induk</th>
                  <th className="p-3">Nomor Seri</th>
                  <th className="p-3 text-center">Kondisi</th>
                  <th className="p-3 text-center">Status Fisik</th>
                  <th className="p-3">Catatan</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="p-6 text-center text-slate-400">Memuat data unit fisik...</td></tr>
                ) : units.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-slate-400">{isUnitTrash ? 'Kotak sampah unit fisik kosong' : 'Belum ada unit fisik terdaftar'}</td></tr>
                ) : (
                  units.map((u) => {
                    let statusBadge = 'bg-slate-100 text-slate-700';
                    if (u.status === 'available') statusBadge = 'bg-green-100 text-green-800';
                    if (u.status === 'booked') statusBadge = 'bg-amber-100 text-amber-800';
                    if (u.status === 'rented') statusBadge = 'bg-blue-100 text-blue-800';
                    if (u.status === 'maintenance') statusBadge = 'bg-rose-100 text-rose-800';
                    if (u.status === 'lost') statusBadge = 'bg-slate-800 text-white';

                    return (
                      <tr key={u.id} className={`hover:bg-slate-50 transition ${isUnitTrash ? 'bg-rose-50/20' : ''}`}>
                        <td className="p-3 font-mono font-bold text-slate-700">{u.id}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{u.unit_code}</td>
                        <td className="p-3 font-medium text-slate-700">{u.product_name}</td>
                        <td className="p-3 font-mono text-slate-500">{u.serial_number || '-'}</td>
                        <td className="p-3 text-center uppercase font-semibold text-[10px]">{u.condition}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${statusBadge}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{u.notes || '-'}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isUnitTrash ? (
                              <>
                                <button
                                  onClick={() => handleAction('product-units', u.id, 'restore')}
                                  className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Restore</span>
                                </button>
                                <button
                                  onClick={() => handleAction('product-units', u.id, 'force')}
                                  className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] flex items-center gap-1"
                                >
                                  <Skull className="w-3 h-3" />
                                  <span>Hard Delete</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOpenUnitModal(u)}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                                  title="Edit Unit"
                                >
                                  <Pen className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleAction('product-units', u.id, 'soft')}
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
      )}

      {/* MODAL FORM: PRODUK MASTER */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-800">
                {editProductId ? `Edit Produk ID: ${editProductId}` : 'Tambah Produk Master'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                  placeholder="Contoh: Tenda Eiger Guardian 4P"
                  className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={prodCatId}
                    onChange={(e) => setProdCatId(Number(e.target.value))}
                    required
                    className="w-full border border-slate-300 p-2 rounded-xl bg-slate-50 outline-none"
                  >
                    <option value="">-- Pilih --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand</label>
                  <select
                    value={prodBrandId}
                    onChange={(e) => setProdBrandId(Number(e.target.value))}
                    required
                    className="w-full border border-slate-300 p-2 rounded-xl bg-slate-50 outline-none"
                  >
                    <option value="">-- Pilih --</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarif Sewa / Hari (Rp)</label>
                  <input
                    type="number"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    required
                    min="0"
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jaminan Deposit (Rp)</label>
                  <input
                    type="number"
                    value={prodDeposit}
                    onChange={(e) => setProdDeposit(Number(e.target.value))}
                    min="0"
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Denda Telat / Hari (Rp)</label>
                  <input
                    type="number"
                    value={prodLateFee}
                    onChange={(e) => setProdLateFee(Number(e.target.value))}
                    required
                    min="0"
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Biaya Hilang (Rp)</label>
                  <input
                    type="number"
                    value={prodLostFee}
                    onChange={(e) => setProdLostFee(Number(e.target.value))}
                    required
                    min="0"
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold shadow-md shadow-green-900/20"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM: UNIT FISIK SERIALIZED */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-800">
                {editUnitId ? `Edit Unit ID: ${editUnitId}` : 'Tambah Unit Fisik Serialized'}
              </h3>
              <button onClick={() => setIsUnitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUnit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Produk Induk</label>
                <select
                  value={unitProductId}
                  onChange={(e) => setUnitProductId(Number(e.target.value))}
                  required
                  className="w-full border border-slate-300 p-2 rounded-xl bg-slate-50 outline-none"
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode Unit (Barcode)</label>
                  <input
                    type="text"
                    value={unitCode}
                    onChange={(e) => setUnitCode(e.target.value)}
                    required
                    placeholder="Contoh: TND-EIG-003"
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Seri Pabrikan</label>
                  <input
                    type="text"
                    value={unitSerial}
                    onChange={(e) => setUnitSerial(e.target.value)}
                    placeholder="SN-2026-..."
                    className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kondisi Fisik Awal</label>
                <select
                  value={unitCondition}
                  onChange={(e) => setUnitCondition(e.target.value as any)}
                  className="w-full border border-slate-300 p-2 rounded-xl bg-slate-50 outline-none"
                >
                  <option value="good">Good (Bagus / Mulus)</option>
                  <option value="damaged">Damaged (Ada Kerusakan)</option>
                  <option value="lost">Lost (Hilang)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Kelengkapan Unit</label>
                <textarea
                  value={unitNotes}
                  onChange={(e) => setUnitNotes(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Pasak lengkap 10 pcs, frame alloy utuh"
                  className="w-full border border-slate-300 p-2 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold shadow-md shadow-green-900/20"
                >
                  Simpan Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};