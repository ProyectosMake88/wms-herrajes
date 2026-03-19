import { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, Package, User, AlertTriangle } from 'lucide-react';
import Header from '../components/Layout/Header';
import Modal from '../components/ui/Modal';
import { pendingEntryApi } from '../services/api';

interface PendingEntry {
  id: number;
  quantity: number;
  reason: string;
  notes: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  product: { id: number; name: string; sku: string; imageUrl: string | null; currentStock: number };
  user: { id: number; name: string; email: string };
  reviewer: { id: number; name: string } | null;
}

export default function Approvals() {
  const [entries, setEntries] = useState<PendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PENDING');
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectModal, setRejectModal] = useState<PendingEntry | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadData(); }, [filter]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await pendingEntryApi.getAll(filter || undefined);
      setEntries(res.data.entries);
      setPendingCount(res.data.pendingCount);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: number) {
    if (!confirm('¿Aprobar esta solicitud de entrada? Se actualizará el inventario automáticamente.')) return;
    try {
      await pendingEntryApi.approve(id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectModal) return;
    try {
      await pendingEntryApi.reject(rejectModal.id, rejectReason);
      setRejectModal(null);
      setRejectReason('');
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  }

  const statusConfig = {
    PENDING: { label: 'Pendiente', color: 'bg-orange-50 text-orange-600', icon: Clock },
    APPROVED: { label: 'Aprobada', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle },
    REJECTED: { label: 'Rechazada', color: 'bg-red-50 text-red-600', icon: XCircle },
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <Header title="Aprobaciones" subtitle={`${pendingCount} solicitudes pendientes`} />

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {[
          { value: 'PENDING', label: 'Pendientes', count: pendingCount },
          { value: 'APPROVED', label: 'Aprobadas' },
          { value: 'REJECTED', label: 'Rechazadas' },
          { value: '', label: 'Todas' },
        ].map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === f.value ? 'bg-primary-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {f.label} {f.count !== undefined && f.count > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-[10px]">{f.count}</span>}
          </button>
        ))}
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay solicitudes {filter === 'PENDING' ? 'pendientes' : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const config = statusConfig[entry.status];
            const StatusIcon = config.icon;
            return (
              <div key={entry.id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-shadow hover:shadow-md ${entry.status === 'PENDING' ? 'border-orange-200 border-l-4 border-l-orange-400' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between">
                  {/* Left: Product + User info */}
                  <div className="flex items-start gap-4">
                    {entry.product.imageUrl ? (
                      <img src={entry.product.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                    ) : (
                      <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center">
                        <Package className="w-7 h-7 text-gray-300" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-gray-800">{entry.product.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{entry.product.sku} · Stock actual: {entry.product.currentStock}</p>

                      <div className="flex items-center gap-4 mt-2">
                        <div className="bg-emerald-50 rounded-lg px-3 py-1.5">
                          <p className="text-[10px] text-emerald-500 font-medium uppercase">Cantidad solicitada</p>
                          <p className="text-lg font-bold text-emerald-700">{entry.quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500"><span className="font-medium">Motivo:</span> {entry.reason}</p>
                          {entry.notes && <p className="text-xs text-gray-400 mt-0.5"><span className="font-medium">Notas:</span> {entry.notes}</p>}
                        </div>
                      </div>

                      {/* Solicitante */}
                      <div className="flex items-center gap-2 mt-3 p-2 bg-gray-50 rounded-lg">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs font-semibold text-gray-700">Solicitado por: {entry.user.name}</p>
                          <p className="text-[10px] text-gray-400">{entry.user.email} · {new Date(entry.createdAt).toLocaleString('es-CO')}</p>
                        </div>
                      </div>

                      {/* Reject reason */}
                      {entry.status === 'REJECTED' && entry.rejectReason && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 rounded-lg">
                          <XCircle className="w-4 h-4 text-red-400" />
                          <p className="text-xs text-red-600"><span className="font-medium">Motivo rechazo:</span> {entry.rejectReason}</p>
                        </div>
                      )}

                      {entry.reviewer && (
                        <p className="text-[10px] text-gray-400 mt-1">Revisado por: {entry.reviewer.name} · {entry.reviewedAt ? new Date(entry.reviewedAt).toLocaleString('es-CO') : ''}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status + Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" /> {config.label}
                    </span>

                    {entry.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(entry.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 transition shadow-sm"
                        >
                          <CheckCircle className="w-4 h-4" /> Aprobar
                        </button>
                        <button
                          onClick={() => { setRejectModal(entry); setRejectReason(''); }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition shadow-sm"
                        >
                          <XCircle className="w-4 h-4" /> Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Rechazar Solicitud">
        {rejectModal && (
          <form onSubmit={handleReject} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-800">{rejectModal.product.name} ({rejectModal.product.sku})</p>
              <p className="text-xs text-gray-500">Cantidad: {rejectModal.quantity} · Solicitado por: {rejectModal.user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo del rechazo *</label>
              <textarea required rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explica por qué se rechaza esta entrada..."
                className="w-full px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none resize-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setRejectModal(null)} className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition">Cancelar</button>
              <button type="submit" className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition">Rechazar</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
