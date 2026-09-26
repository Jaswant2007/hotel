import { useState } from 'react'
import api, { errMsg } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, refresh } = useAuth()
  const [tab, setTab] = useState('details')
  const [msg, setMsg] = useState(null) // {type, text}
  const [busy, setBusy] = useState(false)

  const [details, setDetails] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' })
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' })
  const [newAddr, setNewAddr] = useState({ label: 'Home', line1: '', area: '', city: 'Chennai', pincode: '' })

  const flash = (type, text) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const saveDetails = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.patch('/profile', { name: details.name, phone: details.phone, email: details.email })
      await refresh()
      flash('ok', 'Profile updated')
    } catch (err) {
      flash('err', errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.patch('/profile/password', pwd)
      setPwd({ currentPassword: '', newPassword: '' })
      flash('ok', 'Password changed successfully')
    } catch (err) {
      flash('err', errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  const addAddress = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.post('/profile/addresses', newAddr)
      await refresh()
      setNewAddr({ label: 'Home', line1: '', area: '', city: 'Chennai', pincode: '' })
      flash('ok', 'Address saved')
    } catch (err) {
      flash('err', errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  const setDefaultAddress = async (addressId) => {
    try {
      await api.patch(`/profile/addresses/${addressId}`, { isDefault: true })
      await refresh()
      flash('ok', 'Default address updated')
    } catch (err) {
      flash('err', errMsg(err))
    }
  }

  const deleteAddress = async (addressId) => {
    try {
      await api.delete(`/profile/addresses/${addressId}`)
      await refresh()
      flash('ok', 'Address removed')
    } catch (err) {
      flash('err', errMsg(err))
    }
  }

  if (!user) return null

  const tabCls = (id) =>
    `rounded-full px-4 py-2 text-sm font-bold transition ${
      tab === id ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
    }`

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-100 font-display text-2xl font-extrabold text-brand-700">
          {user.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">{user.name}</h1>
          <p className="text-sm text-stone-500">
            {user.email} · {user.phone}
            {user.isFirstOrder && (
              <span className="ml-2 chip bg-leaf-100 text-leaf-800">10% first-order discount pending</span>
            )}
          </p>
        </div>
      </div>

      {msg && (
        <p className={`mt-4 rounded-xl p-3 text-sm ${msg.type === 'ok' ? 'bg-leaf-50 text-leaf-800' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button className={tabCls('details')} onClick={() => setTab('details')}>Personal details</button>
        <button className={tabCls('addresses')} onClick={() => setTab('addresses')}>Addresses ({user.addresses?.length || 0})</button>
        <button className={tabCls('password')} onClick={() => setTab('password')}>Change password</button>
      </div>

      {tab === 'details' && (
        <form onSubmit={saveDetails} className="card mt-5 space-y-4 p-6">
          <div>
            <label className="label">Full name</label>
            <input className="input" required value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Mobile</label>
              <input className="input" required maxLength={10} value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
            </div>
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </form>
      )}

      {tab === 'addresses' && (
        <div className="mt-5 space-y-4">
          <ul className="space-y-3">
            {(user.addresses || []).map((a) => (
              <li key={a._id} className="card flex items-start justify-between gap-3 p-4">
                <div className="text-sm">
                  <p className="font-bold text-ink">
                    {a.label}
                    {a.isDefault && <span className="ml-2 chip bg-leaf-100 text-leaf-800">Default</span>}
                  </p>
                  <p className="text-stone-600">{a.line1}{a.area ? `, ${a.area}` : ''}, {a.city} — {a.pincode}</p>
                </div>
                <div className="flex shrink-0 gap-2 text-xs font-semibold">
                  {!a.isDefault && (
                    <button onClick={() => setDefaultAddress(a._id)} className="text-brand-600 hover:underline">Make default</button>
                  )}
                  <button onClick={() => deleteAddress(a._id)} className="text-red-500 hover:underline">Remove</button>
                </div>
              </li>
            ))}
            {(user.addresses || []).length === 0 && (
              <li className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
                No saved addresses yet.
              </li>
            )}
          </ul>

          <form onSubmit={addAddress} className="card space-y-3 p-6">
            <h2 className="font-display text-lg font-extrabold text-ink">Add a new address</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="Label (Home/Work)" value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} />
              <input className="input" required placeholder="City" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
              <input className="input sm:col-span-2" required placeholder="Door no, street" value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} />
              <input className="input" placeholder="Area" value={newAddr.area} onChange={(e) => setNewAddr({ ...newAddr, area: e.target.value })} />
              <input className="input" required maxLength={6} inputMode="numeric" placeholder="Pincode" value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })} />
            </div>
            <button className="btn-primary" disabled={busy}>Save address</button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <form onSubmit={changePassword} className="card mt-5 space-y-4 p-6">
          <div>
            <label className="label">Current password</label>
            <input className="input" type="password" required value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">New password</label>
            <input className="input" type="password" required minLength={6} value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
          </div>
          <button className="btn-primary" disabled={busy}>{busy ? 'Updating…' : 'Change password'}</button>
        </form>
      )}
    </div>
  )
}
