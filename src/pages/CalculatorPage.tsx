import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

const CALCS = [
  { slug: 'seller-net-sheet', name: 'Seller Net Sheet', icon: '🏠', desc: 'Calculate seller net proceeds', color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
  { slug: 'buyer-estimate', name: 'Buyer Estimate', icon: '🔑', desc: 'Estimate buyer closing costs', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { slug: 'truvalue', name: 'TruValue Analysis', icon: '💎', desc: 'Compare net at 3 listing prices', color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100' },
  { slug: 'scenario-compare', name: 'Scenario Compare', icon: '🔄', desc: 'Side-by-side offer comparison', color: 'bg-pink-50 border-pink-200 hover:bg-pink-100' },
  { slug: 'buyer-compensation', name: 'Buyer Compensation', icon: '🤝', desc: 'Post-NAR compensation scenarios', color: 'bg-rose-50 border-rose-200 hover:bg-rose-100' },
  { slug: 'buy-now-vs-later', name: 'Buy Now vs Later', icon: '⏳', desc: 'Cost of waiting to purchase', color: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { slug: 'price-vs-rate', name: 'Price vs Rate', icon: '📈', desc: 'Price and rate impact', color: 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100' },
  { slug: 'extra-payment', name: 'Extra Payment', icon: '💰', desc: 'Impact of extra payments', color: 'bg-lime-50 border-lime-200 hover:bg-lime-100' },
  { slug: 'sell-vs-rent', name: 'Sell vs Rent', icon: '⚖️', desc: 'Compare selling vs renting', color: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
  { slug: 'holding-cost', name: 'Holding Cost', icon: '📊', desc: 'Monthly and total holding costs', color: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
  { slug: 'buydown', name: 'Buydown', icon: '📉', desc: 'Rate buydown break-even', color: 'bg-teal-50 border-teal-200 hover:bg-teal-100' },
];

const fmt = (v: any) => { if (v == null) return '$0.00'; const n = typeof v === 'string' ? parseFloat(v) : v; return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n); };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>;
}
function Inp({ value, onChange, placeholder, type = 'number', prefix, suffix, ...rest }: any) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-3 top-2 text-gray-500 text-sm">{prefix}</span>}
      <input type={type} value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-8' : 'pr-3'} py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm`} {...rest} />
      {suffix && <span className="absolute right-3 top-2 text-gray-500 text-sm">{suffix}</span>}
    </div>
  );
}

function ActionBar({ result, inputData, sheetType, onBack }: { result: any; inputData: any; sheetType: string; onBack: () => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<any>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.post('/saved_sheets/', {
        sheet_type: sheetType,
        property_address: inputData.property_address || '',
        client_name: inputData.client_name || '',
        county_id: inputData.county_id ? parseInt(inputData.county_id) : null,
        input_data: inputData,
        output_data: result,
      });
      setSaved(res.data);
    } catch (e: any) { alert('Save failed: ' + (e.response?.data?.detail || e.message)); }
    setSaving(false);
  };

  const handleShare = async () => {
    const id = saved?.id || result?.saved_sheet_id;
    if (!id) { alert('Save the sheet first before sharing.'); return; }
    try {
      const res = await api.post(`/saved_sheets/${id}/share`);
      const url = res.data.share_url || `${window.location.origin}/shared/${res.data.share_token}`;
      setShareUrl(url);
      navigator.clipboard.writeText(url).catch(() => {});
    } catch (e: any) { alert('Share failed: ' + (e.response?.data?.detail || e.message)); }
  };

  const handlePdf = async () => {
    const id = saved?.id || result?.saved_sheet_id;
    if (!id) { alert('Save the sheet first before downloading PDF.'); return; }
    setDownloading(true);
    try {
      const res = await api.get(`/saved_sheets/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `net_sheet_${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) { alert('PDF download failed: ' + (e.response?.data?.detail || e.message)); }
    setDownloading(false);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <button onClick={onBack} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">← Back</button>
      <button onClick={handleSave} disabled={saving || !!saved} className={`px-4 py-2 rounded-md text-sm text-white ${saved ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
        {saved ? '✓ Saved' : saving ? 'Saving...' : '💾 Save Sheet'}
      </button>
      <button onClick={handleShare} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">🔗 Share Link</button>
      <button onClick={handlePdf} disabled={downloading} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">
        {downloading ? 'Generating...' : '📄 Download PDF'}
      </button>
      {shareUrl && (
        <div className="w-full mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800 font-medium">Share link copied to clipboard!</p>
          <a href={shareUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline break-all">{shareUrl}</a>
        </div>
      )}
    </div>
  );
}

function ResultPanel({ result, title }: { result: any; title: string }) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg border">
      <h3 className="font-semibold text-gray-700 mb-4">{title}</h3>
      {result.net_proceeds != null && (
        <div className="text-center mb-4 p-4 bg-white rounded-lg border">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Estimated Net Proceeds</p>
          <p className="text-3xl font-bold text-emerald-600">{fmt(result.net_proceeds)}</p>
        </div>
      )}
      {result.cash_to_close != null && (
        <div className="text-center mb-4 p-4 bg-white rounded-lg border">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Estimated Cash to Close</p>
          <p className="text-3xl font-bold text-blue-600">{fmt(result.cash_to_close)}</p>
        </div>
      )}
      {result.reissue_savings && parseFloat(result.reissue_savings) > 0 && (
        <div className="bg-emerald-100 border border-emerald-300 rounded-md p-3 mb-4 text-center">
          <p className="text-emerald-800 text-sm font-semibold">Reissue Rate Saves {fmt(result.reissue_savings)}!</p>
        </div>
      )}
      {result.line_items?.length > 0 && (
        <div className="space-y-0.5">
          {result.line_items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-200">
              <span className="text-gray-700">{item.label}</span>
              <span className="font-medium">{fmt(item.amount)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 pt-3 border-t-2 border-gray-300 space-y-1">
        {result.sale_price != null && <div className="flex justify-between text-sm"><span>Sale Price</span><span className="font-semibold">{fmt(result.sale_price)}</span></div>}
        {result.purchase_price != null && <div className="flex justify-between text-sm"><span>Purchase Price</span><span className="font-semibold">{fmt(result.purchase_price)}</span></div>}
        {result.total_closing_costs != null && <div className="flex justify-between text-sm"><span>Total Closing Costs</span><span className="font-semibold text-red-600">-{fmt(result.total_closing_costs)}</span></div>}
        {result.loan_payoff != null && <div className="flex justify-between text-sm"><span>Loan Payoff</span><span className="font-semibold text-red-600">-{fmt(result.loan_payoff)}</span></div>}
        {result.down_payment != null && <div className="flex justify-between text-sm"><span>Down Payment</span><span className="font-semibold">{fmt(result.down_payment)}</span></div>}
      </div>
    </div>
  );
}

function SellerForm({ counties, onBack }: { counties: any[]; onBack: () => void }) {
  const [f, sF] = useState({ sale_price: '350000', existing_loan_balance: '150000', seller_agent_commission_pct: '3.0', buyer_agent_commission_pct: '3.0', county_id: counties[0]?.id?.toString() || '1', closing_date: '2026-07-15', prior_title_insurance: false, years_since_prior_policy: '0', hoa_payoff: '0', seller_concessions: '0', include_home_warranty: true, include_survey: false, miscellaneous_fees: '0', annual_property_taxes: '2930', property_address: '', client_name: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const s = (k: string, v: any) => sF(p => ({ ...p, [k]: v }));

  const calc = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.post('/calculators/seller-net-sheet', { ...f, sale_price: parseFloat(f.sale_price), existing_loan_balance: parseFloat(f.existing_loan_balance), seller_agent_commission_pct: parseFloat(f.seller_agent_commission_pct), buyer_agent_commission_pct: parseFloat(f.buyer_agent_commission_pct), county_id: parseInt(f.county_id), hoa_payoff: parseFloat(f.hoa_payoff), seller_concessions: parseFloat(f.seller_concessions), miscellaneous_fees: parseFloat(f.miscellaneous_fees), annual_property_taxes: parseFloat(f.annual_property_taxes), years_since_prior_policy: f.prior_title_insurance ? parseInt(f.years_since_prior_policy) : null });
      setResult(res.data);
    } catch (e: any) { setError(e.response?.data?.detail || 'Calculation failed'); }
    setLoading(false);
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-xl font-bold text-gray-900">🏠 Seller Net Sheet</h2><p className="text-sm text-gray-500">Calculate estimated net proceeds for seller</p></div>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 border-b pb-1 text-sm uppercase tracking-wide">Property Info</h3>
          <Field label="Property Address"><Inp type="text" value={f.property_address} onChange={(v: string) => s('property_address', v)} placeholder="123 Main St" /></Field>
          <Field label="Client / Seller Name"><Inp type="text" value={f.client_name} onChange={(v: string) => s('client_name', v)} placeholder="John Smith" /></Field>
          <Field label="County">
            <select value={f.county_id} onChange={e => s('county_id', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              {counties.map((c: any) => <option key={c.id} value={c.id}>{c.county_name}, {c.state}</option>)}
            </select>
          </Field>
          <Field label="Closing Date"><Inp type="date" value={f.closing_date} onChange={(v: string) => s('closing_date', v)} /></Field>

          <h3 className="font-semibold text-gray-700 border-b pb-1 text-sm uppercase tracking-wide pt-2">Price &amp; Loan</h3>
          <Field label="Sale Price"><Inp value={f.sale_price} onChange={(v: string) => s('sale_price', v)} prefix="$" required /></Field>
          <Field label="Existing Loan Balance"><Inp value={f.existing_loan_balance} onChange={(v: string) => s('existing_loan_balance', v)} prefix="$" /></Field>

          <h3 className="font-semibold text-gray-700 border-b pb-1 text-sm uppercase tracking-wide pt-2">Commissions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Seller Agent"><Inp value={f.seller_agent_commission_pct} onChange={(v: string) => s('seller_agent_commission_pct', v)} suffix="%" /></Field>
            <Field label="Buyer Agent"><Inp value={f.buyer_agent_commission_pct} onChange={(v: string) => s('buyer_agent_commission_pct', v)} suffix="%" /></Field>
          </div>

          <h3 className="font-semibold text-gray-700 border-b pb-1 text-sm uppercase tracking-wide pt-2">Tax &amp; Options</h3>
          <Field label="Annual Property Taxes (estimated)"><Inp value={f.annual_property_taxes} onChange={(v: string) => s('annual_property_taxes', v)} prefix="$" /></Field>
          <p className="text-xs text-gray-400 -mt-2">Tip: Look up on your county CAD website for exact amounts</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.include_home_warranty} onChange={e => s('include_home_warranty', e.target.checked)} /> Include Home Warranty</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.include_survey} onChange={e => s('include_survey', e.target.checked)} /> Include Survey</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.prior_title_insurance} onChange={e => s('prior_title_insurance', e.target.checked)} /> Prior Title Insurance (Reissue Rate)</label>
          </div>

          <h3 className="font-semibold text-gray-700 border-b pb-1 text-sm uppercase tracking-wide pt-2">Other Costs</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="HOA Payoff"><Inp value={f.hoa_payoff} onChange={(v: string) => s('hoa_payoff', v)} prefix="$" /></Field>
            <Field label="Seller Concessions"><Inp value={f.seller_concessions} onChange={(v: string) => s('seller_concessions', v)} prefix="$" /></Field>
          </div>
          <Field label="Miscellaneous Fees"><Inp value={f.miscellaneous_fees} onChange={(v: string) => s('miscellaneous_fees', v)} prefix="$" /></Field>

          <button onClick={calc} disabled={loading} className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 transition-colors mt-2">
            {loading ? 'Calculating...' : 'Calculate Net Proceeds'}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        <div>
          {result ? (
            <>
              <ResultPanel result={result} title="Seller Net Sheet Results" />
              <ActionBar result={result} inputData={f} sheetType="seller" onBack={() => setResult(null)} />
            </>
          ) : (
            <div className="bg-gray-50 border rounded-lg p-12 text-center h-full flex flex-col items-center justify-center">
              <p className="text-5xl mb-4">📋</p>
              <p className="text-gray-500">Fill in the details and click Calculate</p>
              <p className="text-gray-400 text-sm mt-1">Results with line-by-line breakdown will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BuyerForm({ counties, onBack }: { counties: any[]; onBack: () => void }) {
  const [f, sF] = useState({ purchase_price: '350000', loan_amount: '280000', loan_type: 'conventional', interest_rate: '6.75', county_id: counties[0]?.id?.toString() || '1', closing_date: '2026-07-15', annual_property_taxes: '2930', annual_homeowners_insurance: '1800', months_insurance_prepaid: '3', months_tax_escrow: '3', seller_paid_closing_costs: '0', property_address: '', client_name: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const s = (k: string, v: any) => sF(p => ({ ...p, [k]: v }));

  const calc = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.post('/calculators/buyer-estimate', { ...f, purchase_price: parseFloat(f.purchase_price), loan_amount: parseFloat(f.loan_amount), interest_rate: parseFloat(f.interest_rate), county_id: parseInt(f.county_id), annual_property_taxes: parseFloat(f.annual_property_taxes), annual_homeowners_insurance: parseFloat(f.annual_homeowners_insurance), months_insurance_prepaid: parseInt(f.months_insurance_prepaid), months_tax_escrow: parseInt(f.months_tax_escrow), seller_paid_closing_costs: parseFloat(f.seller_paid_closing_costs) });
      setResult(res.data);
    } catch (e: any) { setError(e.response?.data?.detail || 'Calculation failed'); }
    setLoading(false);
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-xl font-bold text-gray-900">🔑 Buyer Estimate</h2><p className="text-sm text-gray-500">Estimate buyer closing costs and cash to close</p></div>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 border-b pb-1 text-sm uppercase tracking-wide">Property Info</h3>
          <Field label="Property Address"><Inp type="text" value={f.property_address} onChange={(v: string) => s('property_address', v)} placeholder="123 Main St" /></Field>
          <Field label="Client / Buyer Name"><Inp type="text" value={f.client_name} onChange={(v: string) => s('client_name', v)} placeholder="Jane Doe" /></Field>
          <Field label="County">
            <select value={f.county_id} onChange={e => s('county_id', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              {counties.map((c: any) => <option key={c.id} value={c.id}>{c.county_name}, {c.state}</option>)}
            </select>
          </Field>
          <Field label="Closing Date"><Inp type="date" value={f.closing_date} onChange={(v: string) => s('closing_date', v)} /></Field>

          <h3 className="font-semibold text-gray-700 border-b pb-1 text-sm uppercase tracking-wide pt-2">Purchase &amp; Loan</h3>
          <Field label="Purchase Price"><Inp value={f.purchase_price} onChange={(v: string) => s('purchase_price', v)} prefix="$" required /></Field>
          <Field label="Loan Amount"><Inp value={f.loan_amount} onChange={(v: string) => s('loan_amount', v)} prefix="$" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Loan Type">
              <select value={f.loan_type} onChange={e => s('loan_type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="conventional">Conventional</option>
                <option value="fha">FHA</option>
                <option value="va">VA</option>
                <option value="usda">USDA</option>
              </select>
            </Field>
            <Field label="Interest Rate"><Inp value={f.interest_rate} onChange={(v: string) => s('interest_rate', v)} suffix="%" /></Field>
          </div>

          <h3 className="font-semibold text-gray-700 border-b pb-1 text-sm uppercase tracking-wide pt-2">Tax &amp; Insurance</h3>
          <Field label="Annual Property Taxes (estimated)"><Inp value={f.annual_property_taxes} onChange={(v: string) => s('annual_property_taxes', v)} prefix="$" /></Field>
          <p className="text-xs text-gray-400 -mt-2">Tip: Look up on your county CAD website for exact amounts</p>
          <Field label="Annual Homeowners Insurance"><Inp value={f.annual_homeowners_insurance} onChange={(v: string) => s('annual_homeowners_insurance', v)} prefix="$" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Months Insurance Prepaid"><Inp value={f.months_insurance_prepaid} onChange={(v: string) => s('months_insurance_prepaid', v)} /></Field>
            <Field label="Months Tax Escrow"><Inp value={f.months_tax_escrow} onChange={(v: string) => s('months_tax_escrow', v)} /></Field>
          </div>

          <h3 className="font-semibold text-gray-700 border-b pb-1 text-sm uppercase tracking-wide pt-2">Credits</h3>
          <Field label="Seller Paid Closing Costs"><Inp value={f.seller_paid_closing_costs} onChange={(v: string) => s('seller_paid_closing_costs', v)} prefix="$" /></Field>

          <button onClick={calc} disabled={loading} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors mt-2">
            {loading ? 'Calculating...' : 'Calculate Cash to Close'}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        <div>
          {result ? (
            <>
              <ResultPanel result={result} title="Buyer Estimate Results" />
              <ActionBar result={result} inputData={f} sheetType="buyer" onBack={() => setResult(null)} />
            </>
          ) : (
            <div className="bg-gray-50 border rounded-lg p-12 text-center h-full flex flex-col items-center justify-center">
              <p className="text-5xl mb-4">📋</p>
              <p className="text-gray-500">Fill in the details and click Calculate</p>
              <p className="text-gray-400 text-sm mt-1">Results with line-by-line breakdown will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GenericCalcForm({ calc, onBack }: { calc: typeof CALCS[0]; onBack: () => void }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jsonInput, setJsonInput] = useState('');

  const run = async () => {
    setLoading(true); setError('');
    try {
      const payload = jsonInput ? JSON.parse(jsonInput) : {};
      const res = await api.post(`/calculators/${calc.slug}`, payload);
      setResult(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Failed');
    }
    setLoading(false);
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-xl font-bold text-gray-900">{calc.icon} {calc.name}</h2><p className="text-sm text-gray-500">{calc.desc}</p></div>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
        <p className="text-amber-800 text-sm">🚧 Full form coming soon. This calculator works — enter JSON input below to test it.</p>
      </div>
      <textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} rows={8} placeholder='{"county_id": 1, ...}'
        className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm mb-3" />
      <button onClick={run} disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">
        {loading ? 'Running...' : 'Calculate'}
      </button>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      {result && <pre className="mt-4 p-4 bg-gray-50 border rounded-md text-xs overflow-auto max-h-96">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

export default function CalculatorPage() {
  const [active, setActive] = useState<string | null>(null);
  const { data: counties } = useQuery({ queryKey: ['counties'], queryFn: () => api.get('/counties/').then(r => r.data) });
  const c = counties || [];
  const onBack = () => setActive(null);

  if (active === 'seller-net-sheet') return <div className="p-6 max-w-6xl mx-auto"><SellerForm counties={c} onBack={onBack} /></div>;
  if (active === 'buyer-estimate') return <div className="p-6 max-w-6xl mx-auto"><BuyerForm counties={c} onBack={onBack} /></div>;
  if (active) {
    const calc = CALCS.find(x => x.slug === active);
    if (calc) return <div className="p-6 max-w-6xl mx-auto"><GenericCalcForm calc={calc} onBack={onBack} /></div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Calculators</h1>
      <p className="text-gray-500 mb-6">11 calculators — select one to get started</p>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Core Calculators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CALCS.slice(0, 2).map(c => (
            <button key={c.slug} onClick={() => setActive(c.slug)} className={`${c.color} border rounded-lg p-5 text-left transition-shadow cursor-pointer shadow-sm hover:shadow-md`}>
              <div className="text-3xl mb-2">{c.icon}</div>
              <h3 className="font-semibold text-gray-900">{c.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{c.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Analysis Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CALCS.slice(2).map(c => (
            <button key={c.slug} onClick={() => setActive(c.slug)} className={`${c.color} border rounded-lg p-4 text-left transition-shadow cursor-pointer shadow-sm hover:shadow-md`}>
              <div className="text-2xl mb-1">{c.icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm">{c.name}</h3>
              <p className="text-xs text-gray-600 mt-1">{c.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
