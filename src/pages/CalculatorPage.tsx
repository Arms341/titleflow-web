import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

const CALCULATORS = [
  { slug: 'seller-net-sheet', name: 'Seller Net Sheet', icon: '🏠', description: 'Calculate seller net proceeds with title insurance', color: 'bg-emerald-50 border-emerald-200' },
  { slug: 'buyer-estimate', name: 'Buyer Estimate', icon: '🔑', description: 'Estimate buyer closing costs and cash to close', color: 'bg-blue-50 border-blue-200' },
  { slug: 'sell-vs-rent', name: 'Sell vs Rent', icon: '⚖️', description: 'Compare selling vs renting over time', color: 'bg-purple-50 border-purple-200' },
  { slug: 'holding-cost', name: 'Holding Cost', icon: '📊', description: 'Calculate monthly and total holding costs', color: 'bg-orange-50 border-orange-200' },
  { slug: 'buydown', name: 'Buydown', icon: '📉', description: 'Rate buydown scenarios and break-even', color: 'bg-teal-50 border-teal-200' },
  { slug: 'truvalue', name: 'TruValue Analysis', icon: '💎', description: 'Compare net proceeds at 3 listing prices', color: 'bg-indigo-50 border-indigo-200' },
  { slug: 'buyer-compensation', name: 'Buyer Compensation', icon: '🤝', description: 'Post-NAR settlement compensation scenarios', color: 'bg-rose-50 border-rose-200' },
  { slug: 'buy-now-vs-later', name: 'Buy Now vs Later', icon: '⏳', description: 'Cost of waiting to purchase', color: 'bg-amber-50 border-amber-200' },
  { slug: 'price-vs-rate', name: 'Price vs Rate', icon: '📈', description: 'Price and rate impact on payment', color: 'bg-cyan-50 border-cyan-200' },
  { slug: 'extra-payment', name: 'Extra Payment', icon: '💰', description: 'Impact of extra mortgage payments', color: 'bg-lime-50 border-lime-200' },
  { slug: 'scenario-compare', name: 'Scenario Compare', icon: '🔄', description: 'Side-by-side comparison of two offers', color: 'bg-pink-50 border-pink-200' },
];

function formatCurrency(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '$0.00';
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function CurrencyInput({ label, value, onChange, required = false }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-2 text-gray-500">$</span>
        <input type="number" step="0.01" value={value} onChange={e => onChange(e.target.value)}
          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required={required} placeholder="0.00" />
      </div>
    </div>
  );
}

function PercentInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input type="number" step="0.1" value={value} onChange={e => onChange(e.target.value)}
          className="w-full pl-3 pr-7 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="3.0" />
        <span className="absolute right-3 top-2 text-gray-500">%</span>
      </div>
    </div>
  );
}

function SellerNetSheetForm({ counties, onClose }: { counties: any[]; onClose: () => void }) {
  const [form, setForm] = useState({
    sale_price: '350000', existing_loan_balance: '150000',
    seller_agent_commission_pct: '3.0', buyer_agent_commission_pct: '3.0',
    county_id: counties[0]?.id?.toString() || '1', closing_date: '2026-07-15',
    prior_title_insurance: false, years_since_prior_policy: '0',
    hoa_payoff: '0', seller_concessions: '0', include_home_warranty: true,
    include_survey: false, miscellaneous_fees: '0', annual_property_taxes: '2930',
    property_address: '', client_name: '', save: false,
  });
  const [result, setResult] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/calculators/seller-net-sheet', {
      ...data,
      sale_price: parseFloat(data.sale_price),
      existing_loan_balance: parseFloat(data.existing_loan_balance),
      seller_agent_commission_pct: parseFloat(data.seller_agent_commission_pct),
      buyer_agent_commission_pct: parseFloat(data.buyer_agent_commission_pct),
      county_id: parseInt(data.county_id),
      hoa_payoff: parseFloat(data.hoa_payoff),
      seller_concessions: parseFloat(data.seller_concessions),
      miscellaneous_fees: parseFloat(data.miscellaneous_fees),
      annual_property_taxes: parseFloat(data.annual_property_taxes),
      years_since_prior_policy: data.prior_title_insurance ? parseInt(data.years_since_prior_policy) : null,
    }).then(r => r.data),
    onSuccess: (data) => setResult(data),
  });

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Seller Net Sheet</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 border-b pb-1">Property</h3>
          <input type="text" placeholder="Property Address" value={form.property_address} onChange={e => set('property_address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          <input type="text" placeholder="Client/Seller Name" value={form.client_name} onChange={e => set('client_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
            <select value={form.county_id} onChange={e => set('county_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md">
              {counties.map((c: any) => <option key={c.id} value={c.id}>{c.county_name}, {c.state}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Closing Date</label>
            <input type="date" value={form.closing_date} onChange={e => set('closing_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>

          <h3 className="font-semibold text-gray-700 border-b pb-1 pt-2">Price &amp; Loan</h3>
          <CurrencyInput label="Sale Price" value={form.sale_price} onChange={v => set('sale_price', v)} required />
          <CurrencyInput label="Existing Loan Balance" value={form.existing_loan_balance} onChange={v => set('existing_loan_balance', v)} />

          <h3 className="font-semibold text-gray-700 border-b pb-1 pt-2">Commissions</h3>
          <PercentInput label="Seller Agent Commission" value={form.seller_agent_commission_pct} onChange={v => set('seller_agent_commission_pct', v)} />
          <PercentInput label="Buyer Agent Commission" value={form.buyer_agent_commission_pct} onChange={v => set('buyer_agent_commission_pct', v)} />

          <h3 className="font-semibold text-gray-700 border-b pb-1 pt-2">Options</h3>
          <CurrencyInput label="Annual Property Taxes" value={form.annual_property_taxes} onChange={v => set('annual_property_taxes', v)} />
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.include_home_warranty} onChange={e => set('include_home_warranty', e.target.checked)} />
            <span className="text-sm">Include Home Warranty</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.include_survey} onChange={e => set('include_survey', e.target.checked)} />
            <span className="text-sm">Include Survey</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.prior_title_insurance} onChange={e => set('prior_title_insurance', e.target.checked)} />
            <span className="text-sm">Prior Title Insurance (Reissue Rate)</span>
          </div>

          <h3 className="font-semibold text-gray-700 border-b pb-1 pt-2">Other Costs</h3>
          <CurrencyInput label="HOA Payoff" value={form.hoa_payoff} onChange={v => set('hoa_payoff', v)} />
          <CurrencyInput label="Seller Concessions" value={form.seller_concessions} onChange={v => set('seller_concessions', v)} />
          <CurrencyInput label="Miscellaneous Fees" value={form.miscellaneous_fees} onChange={v => set('miscellaneous_fees', v)} />

          <button onClick={() => mutation.mutate(form)}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors mt-4"
            disabled={mutation.isPending}>
            {mutation.isPending ? 'Calculating...' : 'Calculate Net Proceeds'}
          </button>
          {mutation.isError && <p className="text-red-600 text-sm">Error: {(mutation.error as any)?.response?.data?.detail || 'Calculation failed'}</p>}
        </div>

        {result && (
          <div className="bg-gray-50 p-6 rounded-lg border">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Estimated Net Proceeds</p>
              <p className="text-4xl font-bold text-emerald-600">{formatCurrency(result.net_proceeds)}</p>
            </div>
            {result.reissue_savings && parseFloat(result.reissue_savings) > 0 && (
              <div className="bg-emerald-100 border border-emerald-300 rounded-md p-3 mb-4 text-center">
                <p className="text-emerald-800 font-semibold">Reissue Rate Applied — Saves {formatCurrency(result.reissue_savings)}!</p>
              </div>
            )}
            <div className="space-y-1">
              {result.line_items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-200">
                  <span className="text-gray-700">{item.label}</span>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t-2 border-gray-300 space-y-2">
              <div className="flex justify-between"><span>Sale Price</span><span className="font-semibold">{formatCurrency(result.sale_price)}</span></div>
              <div className="flex justify-between"><span>Total Closing Costs</span><span className="font-semibold text-red-600">-{formatCurrency(result.total_closing_costs)}</span></div>
              <div className="flex justify-between"><span>Loan Payoff</span><span className="font-semibold text-red-600">-{formatCurrency(result.loan_payoff || result.existing_loan_balance)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Net Proceeds</span><span className="text-emerald-600">{formatCurrency(result.net_proceeds)}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalculatorPage() {
  const [activeCalc, setActiveCalc] = useState<string | null>(null);
  const { data: counties } = useQuery({ queryKey: ['counties'], queryFn: () => api.get('/counties/').then(r => r.data) });

  if (activeCalc === 'seller-net-sheet') {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <SellerNetSheetForm counties={counties || []} onClose={() => setActiveCalc(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Calculators</h1>
      <p className="text-gray-500 mb-6">Select a calculator to get started</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CALCULATORS.map(calc => (
          <button key={calc.slug} onClick={() => setActiveCalc(calc.slug)}
            className={`${calc.color} border rounded-lg p-5 text-left hover:shadow-md transition-shadow cursor-pointer`}>
            <div className="text-3xl mb-2">{calc.icon}</div>
            <h3 className="font-semibold text-gray-900">{calc.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{calc.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
