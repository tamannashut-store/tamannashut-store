import { useEffect, useState } from 'react';
import axios from 'axios';

const endpoint = `${import.meta.env.VITE_API_URL}/api/products/admin`;

export default function ListingSeller({ value, onChange, productId, status, onAssigned }) {
  const [sellers, setSellers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true;
    axios.get(`${endpoint}/seller-choices`).then(({ data }) => { if (active) { setSellers(data.sellers || []); setLoaded(true); } })
      .catch(() => { if (active) setError('Seller choices could not be loaded. Refresh before assigning a seller.'); });
    return () => { active = false; };
  }, []);
  const current = sellers.find(seller => seller.id === value);
  const choice = sellers.find(seller => seller.id === (productId ? selected : value));
  const assign = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const { data } = await axios.patch(`${endpoint}/${productId}/seller`, { sellerId: selected, reason });
      setMessage(data.message); setSelected(''); setReason(''); onAssigned(data.product.sellerId);
    } catch (e) { setError(e.response?.data?.message || 'Seller assignment could not be saved.'); }
    finally { setBusy(false); }
  };
  return <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-label="Listing ownership">
    <h2 className="text-lg font-bold">Listing seller</h2>
    {productId && <p className="mt-2 text-sm text-slate-600">Current seller: <strong>{current?.name || 'Platform / existing seller'}</strong></p>}
    <p className="mt-2 text-sm leading-6 text-slate-600">Create and manage a seller’s listing as administrator. The seller owns the product; your administrator account remains the recorded actor. Seller sign-in is not required.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="mt-3 rounded-xl bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    {(!productId || status === 'draft') ? <div className="mt-4 max-w-xl space-y-4">
      <label className="block text-sm font-semibold">{productId ? 'Assign draft to seller' : 'Seller / storefront'}<select aria-label={productId ? 'Assign draft to seller' : 'Seller / storefront'} disabled={!loaded || busy} value={productId ? selected : value} onChange={e => productId ? setSelected(e.target.value) : onChange(e.target.value)} className="field-control mt-2">
        <option value="">{productId ? 'Choose an eligible seller' : "Tamanna’s Hut (platform listing)"}</option>
        {sellers.map(seller => <option key={seller.id} value={seller.id} disabled={Boolean(productId && seller.id === value)}>{seller.name}</option>)}
      </select></label>
      {choice?.deliveryStates?.length > 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">This store’s existing delivery restriction remains: {choice.deliveryStates.join(', ')}. Settlement restrictions remain in place.</p>}
      {productId ? <><label className="block text-sm font-semibold">Reason for seller assignment<textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={500} rows={2} className="field-control mt-2" placeholder="For example, correct the admin-created draft to its actual seller"/></label>
        <button type="button" onClick={assign} disabled={busy || !selected || reason.trim().length < 5} className="btn-secondary">{busy ? 'Assigning securely…' : 'Assign draft and record audit'}</button>
        <p className="text-xs leading-5 text-slate-500">This changes ownership only. The listing stays private and goes to administrator approval. Photos, variants and prices are preserved. Save other product edits separately.</p></> : choice && <p className="text-sm text-slate-500">This listing will belong to {choice.name} and use the existing administrator approval flow.</p>}
    </div> : <p className="mt-4 text-sm text-slate-500">Ownership is locked for published or archived listings. Only private drafts with no order or review history can be reassigned.</p>}
  </section>;
}
