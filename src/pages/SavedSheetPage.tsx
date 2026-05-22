import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useState } from 'react';

const fmt = (v: any) => { if (v == null) return '-'; const n = typeof v === 'string' ? parseFloat(v) : v; if (isNaN(n)) return '-'; return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n); };

export default function SavedSheetPage() {
  const queryClient = useQueryClient();
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const { data: sheets, isLoading } = useQuery({
    queryKey: ['saved-sheets'],
    queryFn: () => api.get('/saved_sheets/').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/saved_sheets/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-sheets'] }),
  });

  const handleShare = async (id: number) => {
    try {
      const res = await api.post(`/saved_sheets/${id}/share`);
      const url = res.data.share_url || `${window.location.origin}/shared/${res.data.share_token}`;
      setShareUrl(url);
      navigator.clipboard.writeText(url).catch(() => {});
    } catch (e: any) { alert('Share failed: ' + (e.response?.data?.detail || e.message)); }
  };

  const handlePdf = async (id: number) => {
    try {
      const res = await api.get(`/saved_sheets_export/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `sheet_${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) { alert('PDF failed: ' + (e.response?.data?.detail || e.message)); }
  };

  const list = Array.isArray(sheets) ? sheets : sheets?.items ?? [];

  if (isLoading) return <div className="p-6 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">My Sheets</h1>
      <p className="text-gray-500 mb-6">{list.length} saved sheet{list.length !== 1 ? 's' : ''}</p>

      {shareUrl && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-800 font-medium">Share link copied to clipboard!</p>
            <a href={shareUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline break-all">{shareUrl}</a>
          </div>
          <button onClick={() => setShareUrl(null)} className="text-blue-400 hover:text-blue-600">&times;</button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-lg border">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-gray-500">No saved sheets yet</p>
          <p className="text-gray-400 text-sm mt-1">Calculate a net sheet or buyer estimate, then click Save</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {list.map((s: any) => {
                const amount = s.output_data?.net_proceeds || s.output_data?.cash_to_close || s.output_data?.total_closing_costs;
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.sheet_type === 'seller' ? 'bg-emerald-100 text-emerald-800' :
                        s.sheet_type === 'buyer' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{s.sheet_type || 'Sheet'}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{s.property_address || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.client_name || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{fmt(amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.created_at ? new Date(s.created_at).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleShare(s.id)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200" title="Share">🔗</button>
                        <button onClick={() => handlePdf(s.id)} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200" title="PDF">📄</button>
                        <button onClick={() => { if (confirm('Delete this sheet?')) deleteMutation.mutate(s.id); }} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
