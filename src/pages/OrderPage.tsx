import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const fmt = (v: any) => { if (v == null) return '-'; const n = typeof v === 'string' ? parseFloat(v) : v; if (isNaN(n)) return '-'; return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n); };

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

function OrderDetail({ order, onBack, onDelete }: { order: any; onBack: () => void; onDelete: (id: number) => void }) {
  const navigate = useNavigate();
  const out = order.saved_sheet_output || {};
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={onBack} className="text-sm text-indigo-600 hover:text-indigo-800 mb-4">&larr; Back to Orders</button>
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>{order.status || 'pending'}</span>
            <h2 className="text-xl font-bold text-gray-900 mt-2">Order #{order.id}</h2>
            <p className="text-gray-500 text-sm">{order.order_type || 'purchase'} &bull; {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg border p-4">
            <h3 className="font-semibold text-gray-700 text-sm uppercase mb-3">Property</h3>
            <p className="text-gray-900 font-medium">{order.property_address || '-'}</p>
            {order.estimated_closing_date && <p className="text-sm text-gray-500 mt-1">Est. closing: {order.estimated_closing_date}</p>}
          </div>
          <div className="bg-gray-50 rounded-lg border p-4">
            <h3 className="font-semibold text-gray-700 text-sm uppercase mb-3">Parties</h3>
            {order.seller_name && <p className="text-sm"><span className="text-gray-500">Seller:</span> <span className="font-medium">{order.seller_name}</span> {order.seller_phone && <span className="text-gray-400 ml-1">{order.seller_phone}</span>}</p>}
            {order.buyer_name && <p className="text-sm mt-1"><span className="text-gray-500">Buyer:</span> <span className="font-medium">{order.buyer_name}</span> {order.buyer_phone && <span className="text-gray-400 ml-1">{order.buyer_phone}</span>}</p>}
            {order.lender_name && <p className="text-sm mt-1"><span className="text-gray-500">Lender:</span> <span className="font-medium">{order.lender_name}</span></p>}
            {order.loan_officer_name && <p className="text-sm mt-1"><span className="text-gray-500">Loan Officer:</span> <span className="font-medium">{order.loan_officer_name}</span></p>}
          </div>
        </div>

        {order.notes && (
          <div className="bg-gray-50 rounded-lg border p-4 mb-6">
            <h3 className="font-semibold text-gray-700 text-sm uppercase mb-2">Notes</h3>
            <p className="text-sm text-gray-700">{order.notes}</p>
          </div>
        )}

        {order.saved_sheet_id && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <button onClick={() => navigate('/saved-sheets', { state: { viewSheetId: order.saved_sheet_id } })} className="text-sm text-indigo-700 hover:text-indigo-900 underline cursor-pointer">Linked to Saved Sheet #{order.saved_sheet_id}</button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t flex justify-end">
          <button onClick={() => { if (confirm(`Delete Order #${order.id}? This cannot be undone.`)) onDelete(order.id); }}
            className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium">Delete Order</button>
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [viewing, setViewing] = useState<any>(null);

  // Reset to list when nav link is clicked (same-route re-navigation)
  useEffect(() => { setViewing(null); }, [location.key]);
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders/').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/orders/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); setViewing(null); },
  });

  const list = Array.isArray(orders) ? orders : orders?.items ?? [];

  if (viewing) return <OrderDetail order={viewing} onBack={() => setViewing(null)} onDelete={(id) => deleteMutation.mutate(id)} />;
  if (isLoading) return <div className="p-6 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Orders</h1>
      <p className="text-gray-500 mb-6">{list.length} title order{list.length !== 1 ? 's' : ''}</p>

      {list.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg border">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500">No orders yet</p>
          <p className="text-gray-400 text-sm mt-1">Submit a net sheet from My Sheets to create a title order</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {list.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setViewing(o)}>
                  <td className="px-4 py-3 text-sm font-semibold text-indigo-600">#{o.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{o.property_address || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{o.seller_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{o.buyer_name || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-800'}`}>{o.status || 'pending'}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { if (confirm(`Delete Order #${o.id}?`)) deleteMutation.mutate(o.id); }}
                      className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
