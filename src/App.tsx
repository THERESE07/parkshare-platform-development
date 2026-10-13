import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight, BadgeCheck, CarFront, CheckCircle2, Clock3, LoaderCircle,
  MapPin, ParkingCircle, Search, ShieldCheck, Ticket, WalletCards, XCircle,
} from 'lucide-react'
import { authApi, authToken, parkingApi, reservationApi, vehicleApi, type AuthResponse, type ParkingLot, type Vehicle } from './lib/api'

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight">
      <span className="grid size-10 place-items-center rounded-xl bg-[#176b67] text-white shadow-sm">
        <ParkingCircle className="size-6" />
      </span>
      <span className="text-xl">Park<span className="text-[#176b67]">Share</span></span>
    </Link>
  )
}

function Header() {
  const location = useLocation()
  const signedIn = Boolean(authToken.get())
  return (
    <header data-path={location.pathname} className="sticky top-0 z-20 border-b border-[#dfe8e5] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
        <Brand />
        <nav className="hidden items-center gap-7 text-sm font-medium text-[#66777a] md:flex">
          <a href="/#how" className="hover:text-[#176b67]">How it works</a>
          <a href="/#trust" className="hover:text-[#176b67]">Trusted availability</a>
          <Link to="/driver/find" className="hover:text-[#176b67]">Find parking</Link><Link to="/driver/vehicles" className="hover:text-[#176b67]">Vehicles</Link><Link to="/driver/reservations" className="hover:text-[#176b67]">Reservations</Link>
        </nav>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <button onClick={() => { authApi.logout(); window.sessionStorage.removeItem('parkshare.authUser'); window.location.assign('/') }} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#176b67] hover:bg-[#edf5f3]">Sign out</button>
          ) : (
            <Link to="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#176b67] hover:bg-[#edf5f3]">Sign in</Link>
          )}
          <Link to="/driver/find" className="inline-flex items-center gap-2 rounded-xl bg-[#176b67] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10534f]">
            Find parking <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}

function LandingPage() {
  const roles = [
    { title: 'Driver', desc: 'Find verified parking, reserve ahead and arrive with confidence.', icon: CarFront, href: '/driver/find' },
    { title: 'Parking operator', desc: 'Manage your lots, spaces, pricing and incoming reservations.', icon: ParkingCircle, href: '/operator' },
    { title: 'Attendant', desc: 'Help verify reservations and manage vehicle arrival and departure.', icon: ShieldCheck, href: '/login' },
    { title: 'Event organizer', desc: 'Coordinate event parking and keep an eye on capacity.', icon: Ticket, href: '/login' },
    { title: 'ParkShare admin', desc: 'Oversee verification, support and the parking network.', icon: BadgeCheck, href: '/login' },
  ]
  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Header />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cce4df] bg-[#edf7f4] px-3.5 py-2 text-xs font-semibold text-[#176b67]">
              <MapPin className="size-3.5" /> Built in Kigali · designed for Rwanda
            </div>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] text-[#203238] sm:text-5xl lg:text-6xl">
              Know your parking. <span className="text-[#176b67]">Reserve it.</span> Arrive with confidence.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#66777a]">
              Find parking with clear information, book before you arrive, and connect your reservation to the real parking experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/driver/find" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#176b67] px-5 font-semibold text-white shadow-md shadow-[#176b67]/15 hover:bg-[#10534f]">
                Explore parking <ArrowRight className="size-4" />
              </Link>
              <Link to="/operator" className="inline-flex h-12 items-center rounded-xl border border-[#d5e2df] bg-white px-5 font-semibold text-[#203238] hover:border-[#8bbdb6]">
                Operator workspace
              </Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-[#dfe8e5] pt-6">
              <div><p className="text-2xl font-extrabold text-[#203238]">Kigali</p><p className="mt-1 text-xs text-[#66777a]">First launch market</p></div>
              <div><p className="text-2xl font-extrabold text-[#203238]">RWF</p><p className="mt-1 text-xs text-[#66777a]">Local pricing</p></div>
              <div><p className="text-2xl font-extrabold text-[#203238]">One flow</p><p className="mt-1 text-xs text-[#66777a]">Search to check-in</p></div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[28px] border border-[#dfe8e5] bg-white p-4 shadow-xl shadow-[#234b46]/8 sm:p-5">
              <div className="rounded-2xl bg-[#edf4f2] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#176b67]">Parking discovery</p><h2 className="mt-1 text-lg font-bold">Near your destination</h2></div>
                  <span className="grid size-10 place-items-center rounded-xl bg-white text-[#176b67]"><MapPin className="size-5" /></span>
                </div>
                <div className="mt-4 rounded-xl border border-[#dfe8e5] bg-white p-3.5">
                  <div className="flex items-center gap-3"><Search className="size-5 text-[#176b67]" /><div><p className="text-sm font-semibold">Search Kigali</p><p className="text-xs text-[#66777a]">Area, destination or parking name</p></div></div>
                </div>
                {[
                  ['Availability you can understand', 'Freshness and capacity should be confirmed by live backend data.'],
                  ['A reservation tied to your vehicle', 'Your booking, plate and arrival details stay connected.'],
                  ['Rwanda-ready payments', 'Prepare for local payment methods without faking a completed transaction.'],
                ].map(([title, desc], index) => (
                  <div key={title} className="mt-3 flex gap-3 rounded-xl border border-[#dfe8e5] bg-white p-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#edf7f4] text-[#176b67]">{index === 0 ? <Clock3 className="size-4" /> : index === 1 ? <CheckCircle2 className="size-4" /> : <WalletCards className="size-4" />}</span>
                    <div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-[#66777a]">{desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-4 -left-3 hidden items-center gap-2 rounded-xl border border-[#dfe8e5] bg-white px-4 py-3 shadow-lg sm:flex">
              <BadgeCheck className="size-5 text-[#176b67]" /><span className="text-sm font-semibold">Verified when confirmed</span>
            </div>
          </div>
        </section>
        <section id="how" className="border-y border-[#dfe8e5] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#176b67]">How it works</p><h2 className="mt-2 text-3xl font-bold">From search to parked in four steps</h2><p className="mt-3 text-[#66777a]">Designed around the real steps that make a parking reservation trustworthy.</p></div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['01', 'Find', 'Compare parking by location and the information the operator provides.'],
                ['02', 'Reserve', 'Choose your vehicle and arrival window for a reservation.'],
                ['03', 'Pay', 'See a clear payment state; success is only shown when confirmed by the API/provider.'],
                ['04', 'Arrive', 'Use reservation details for check-in and check-out.'],
              ].map(([n, title, desc]) => <article key={n} className="rounded-2xl border border-[#dfe8e5] p-5"><span className="text-sm font-bold text-[#176b67]">{n}</span><h3 className="mt-3 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#66777a]">{desc}</p></article>)}
            </div>
          </div>
        </section>
        <section id="trust" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-bold">One network, different workspaces</h2><p className="mt-3 max-w-2xl text-[#66777a]">Each role should see only the operations it is allowed to perform.</p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map(({title, desc, icon: Icon, href}) => <Link to={href} key={title} className="group rounded-2xl border border-[#dfe8e5] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#9ccbc3] hover:shadow-lg"><span className="grid size-11 place-items-center rounded-xl bg-[#edf7f4] text-[#176b67]"><Icon className="size-5" /></span><h3 className="mt-4 flex items-center gap-2 font-bold">{title}<ArrowRight className="size-4 text-[#176b67] transition group-hover:translate-x-1" /></h3><p className="mt-2 text-sm leading-6 text-[#66777a]">{desc}</p></Link>)}
          </div>
        </section>
      </main>
      <footer className="border-t border-[#dfe8e5] bg-white"><div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-sm text-[#66777a] sm:flex-row sm:items-center sm:justify-between sm:px-6"><Brand /><p>Rwanda-first parking network · Kigali</p><p>ParkShare · 2026</p></div></footer>
    </div>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<AuthResponse | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await authApi.login({ email, password })
      window.sessionStorage.setItem('parkshare.authUser', JSON.stringify(result))
      setUser(result)
      window.setTimeout(() => navigate('/driver/find'), 350)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-[calc(100vh-72px)] place-items-center px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-[#dfe8e5] bg-white p-6 shadow-xl shadow-[#234b46]/5 sm:p-8">
        <Brand />
        <h1 className="mt-8 text-2xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-[#66777a]">Sign in with your ParkShare account. Your access depends on the role assigned by the backend.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 block h-11 w-full rounded-xl border border-[#d5e2df] px-3 font-normal outline-none focus:border-[#176b67]" /></label>
          <label className="block text-sm font-semibold">Password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5 block h-11 w-full rounded-xl border border-[#d5e2df] px-3 font-normal outline-none focus:border-[#176b67]" /></label>
          {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>}
          {user && <div role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">Signed in as {user.email} · {user.roles.join(', ')}</div>}
          <button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#176b67] font-semibold text-white hover:bg-[#10534f] disabled:opacity-60">{busy && <LoaderCircle className="size-4 animate-spin" />}{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="mt-5 text-xs leading-5 text-[#66777a]">For local development, ensure the Spring Boot API is running and the frontend environment points to it.</p>
      </section>
    </main>
  )
}

function ParkingDiscoveryPage() {
  const [lots, setLots] = useState<ParkingLot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    parkingApi.list()
      .then(data => { if (active) setLots(data) })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Unable to load parking lots.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = lots.filter(lot => `${lot.name} ${lot.address} ${lot.city}`.toLowerCase().includes(query.toLowerCase()))
  return (
    <main className="mx-auto min-h-[calc(100vh-72px)] max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/" className="text-sm font-semibold text-[#176b67]">← Back to ParkShare</Link>
      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h1 className="text-3xl font-bold">Find parking</h1><p className="mt-2 text-sm text-[#66777a]">Results come from the connected Spring Boot API, not the demo parking list.</p></div>
        <label className="relative block w-full sm:max-w-sm"><Search className="absolute left-3 top-3 size-4 text-[#66777a]" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, address or city" className="h-11 w-full rounded-xl border border-[#d5e2df] bg-white pl-9 pr-3 outline-none focus:border-[#176b67]" /></label>
      </div>
      {loading && <p className="mt-8 flex items-center gap-2 text-sm text-[#66777a]"><LoaderCircle className="size-4 animate-spin" />Loading parking from the API…</p>}
      {error && <div role="alert" className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><XCircle className="mt-0.5 size-5 shrink-0 text-amber-700" /><div><h2 className="font-bold text-amber-950">Parking data could not be loaded</h2><p className="mt-1 text-sm leading-6 text-amber-900">{error}</p><p className="mt-2 text-xs text-amber-900">Check that the backend is running, that you are signed in if the endpoint requires authentication, and that CORS allows http://localhost:5173.</p></div></div></div>}
      {!loading && !error && filtered.length === 0 && <div className="mt-8 rounded-2xl border border-dashed border-[#c9d9d5] bg-white p-10 text-center"><ParkingCircle className="mx-auto size-8 text-[#176b67]" /><h2 className="mt-3 font-bold">No parking lots returned</h2><p className="mt-1 text-sm text-[#66777a]">The API returned no matching lots. We don't insert fake results.</p></div>}
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {filtered.map(lot => <article key={lot.id} className="rounded-2xl border border-[#dfe8e5] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{lot.name}</h2><p className="mt-1 flex items-center gap-1 text-sm text-[#66777a]"><MapPin className="size-3.5" />{lot.address}, {lot.city}</p></div><span className="rounded-full bg-[#edf7f4] px-3 py-1 text-xs font-bold text-[#176b67]">{lot.status}</span></div><p className="mt-4 text-sm text-[#66777a]">{lot.description || 'No description provided by the operator.'}</p><div className="mt-4 flex items-center justify-between border-t border-[#edf1ef] pt-3 text-sm"><span className="text-[#66777a]">Reported capacity</span><strong>{lot.totalCapacity ?? 'Not provided'}</strong></div><p className="mt-3 text-xs leading-5 text-[#66777a]">Free-space count and freshness are not exposed in this parking-lot response. We will only show them after mapping the space/occupancy endpoints.</p><Link to={authToken.get() ? `/driver/book/${lot.id}` : '/login'} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#176b67] px-4 py-2.5 text-sm font-semibold text-white">Reserve this lot <ArrowRight className="size-4"/></Link></article>)}
      </div>
    </main>
  )
}


function getSignedInUser(): AuthResponse | null {
  const raw = window.sessionStorage.getItem('parkshare.authUser')
  if (!raw) return null
  try { return JSON.parse(raw) as AuthResponse } catch { return null }
}

function DriverVehiclesPage() {
  const user = getSignedInUser()
  const [vehicles, setVehicles] = useState<import('./lib/api').Vehicle[]>([])
  const [plateNumber, setPlateNumber] = useState('')
  const [vehicleType, setVehicleType] = useState('CAR')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [color, setColor] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function reload() {
    if (!user) { setLoading(false); return }
    try { setVehicles(await vehicleApi.listByUser(user.userId)); setError('') }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load vehicles.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void reload() }, [])
  async function addVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    setBusy(true); setError(''); setNotice('')
    try {
      const created = await vehicleApi.create(user.userId, {
        plateNumber: plateNumber.trim().toUpperCase(), vehicleType,
        make: make.trim() || undefined, model: model.trim() || undefined,
        color: color.trim() || undefined, isDefault: vehicles.length === 0, isActive: true,
      })
      setVehicles(current => [...current, created])
      setPlateNumber(''); setMake(''); setModel(''); setColor('')
      setNotice('Vehicle saved to your account.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save vehicle.') }
    finally { setBusy(false) }
  }
  async function makeDefault(id: number) {
    setError(''); setNotice('')
    try {
      const updated = await vehicleApi.setDefault(id)
      setVehicles(current => current.map(vehicle => ({...vehicle, isDefault: vehicle.id === updated.id})))
      setNotice('Default vehicle updated.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update default vehicle.') }
  }

  return <main className="mx-auto min-h-[calc(100vh-72px)] max-w-6xl px-4 py-10 sm:px-6">
    <Link to="/driver/find" className="text-sm font-semibold text-[#176b67]">← Back to parking</Link>
    <div className="mt-5"><h1 className="text-3xl font-bold">My vehicles</h1><p className="mt-2 text-sm text-[#66777a]">Manage the vehicles attached to your ParkShare account. Vehicle data is loaded from the API.</p></div>
    {!user && <div className="mt-6 rounded-2xl border border-[#dfe8e5] bg-white p-5">Please <Link to="/login" className="font-semibold text-[#176b67] underline">sign in</Link> to manage your vehicles.</div>}
    {user && <div className="mt-7 grid items-start gap-6 lg:grid-cols-[.85fr_1.15fr]">
      <form onSubmit={addVehicle} className="space-y-4 rounded-2xl border border-[#dfe8e5] bg-white p-5">
        <h2 className="text-lg font-bold">Add a vehicle</h2>
        <label className="block text-sm font-semibold">Number plate<input required value={plateNumber} onChange={e=>setPlateNumber(e.target.value)} placeholder="e.g. RAA 123 A" className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e2df] px-3 font-normal outline-none focus:border-[#176b67]" /></label>
        <label className="block text-sm font-semibold">Vehicle type<select value={vehicleType} onChange={e=>setVehicleType(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e2df] bg-white px-3 font-normal"><option value="CAR">Car</option><option value="MOTORCYCLE">Motorcycle</option><option value="SUV">SUV</option><option value="VAN">Van</option><option value="TRUCK">Truck</option><option value="OTHER">Other</option></select></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-semibold">Make <span className="font-normal text-[#66777a]">(optional)</span><input value={make} onChange={e=>setMake(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e2df] px-3 font-normal" /></label><label className="block text-sm font-semibold">Model <span className="font-normal text-[#66777a]">(optional)</span><input value={model} onChange={e=>setModel(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e2df] px-3 font-normal" /></label></div>
        <label className="block text-sm font-semibold">Color <span className="font-normal text-[#66777a]">(optional)</span><input value={color} onChange={e=>setColor(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e2df] px-3 font-normal" /></label>
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
        <button disabled={busy} className="h-11 w-full rounded-xl bg-[#176b67] px-4 font-semibold text-white disabled:opacity-60">{busy ? 'Saving…' : 'Save vehicle'}</button>
      </form>
      <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Saved vehicles</h2><span className="text-sm text-[#66777a]">{vehicles.length} total</span></div>
        {loading && <p className="rounded-xl bg-white p-5 text-sm text-[#66777a]">Loading vehicles…</p>}
        {!loading && !error && vehicles.length === 0 && <div className="rounded-2xl border border-dashed border-[#c9d9d5] bg-white p-8 text-center"><CarFront className="mx-auto size-8 text-[#176b67]"/><h3 className="mt-3 font-bold">No vehicles yet</h3><p className="mt-1 text-sm text-[#66777a]">Add a vehicle to prepare for your first reservation.</p></div>}
        <div className="space-y-3">{vehicles.map(vehicle=><article key={vehicle.id} className="flex flex-col gap-4 rounded-2xl border border-[#dfe8e5] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#edf7f4] text-[#176b67]"><CarFront className="size-5"/></span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{vehicle.plateNumber}</h3>{vehicle.isDefault && <span className="rounded-full bg-[#edf7f4] px-2.5 py-1 text-xs font-bold text-[#176b67]">Default</span>}</div><p className="mt-1 text-sm text-[#66777a]">{[vehicle.make, vehicle.model, vehicle.color].filter(Boolean).join(' · ') || 'Vehicle details not provided'} · {vehicle.vehicleType}</p><p className="mt-1 text-xs text-[#66777a]">{vehicle.isActive ? 'Active' : 'Inactive'}</p></div></div>{!vehicle.isDefault && <button onClick={()=>void makeDefault(vehicle.id)} className="rounded-xl border border-[#d5e2df] px-3 py-2 text-sm font-semibold text-[#176b67] hover:bg-[#edf7f4]">Make default</button>}</article>)}</div>
      </section>
    </div>}
  </main>
}

function DriverBookingPage() {
  const { lotId } = useParams()
  const navigate = useNavigate()
  const user = getSignedInUser()
  const [lot, setLot] = useState<ParkingLot | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehicleId, setVehicleId] = useState('')
  const [startLocal, setStartLocal] = useState('')
  const [endLocal, setEndLocal] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!user || !lotId) { setLoading(false); return }
    Promise.all([parkingApi.get(Number(lotId)), vehicleApi.listByUser(user.userId)])
      .then(([parkingLot, savedVehicles]) => {
        setLot(parkingLot)
        setVehicles(savedVehicles.filter(vehicle => vehicle.isActive))
        const preferred = savedVehicles.find(vehicle => vehicle.isDefault && vehicle.isActive) || savedVehicles.find(vehicle => vehicle.isActive)
        if (preferred) setVehicleId(String(preferred.id))
      })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Could not prepare the reservation form.'))
      .finally(() => setLoading(false))
  }, [user?.userId, lotId])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !lot) return
    const start = new Date(startLocal)
    const end = new Date(endLocal)
    const total = Number(amount)
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      setError('Choose a valid end time after the start time.')
      return
    }
    if (!Number.isFinite(total) || total < 0) {
      setError('Enter a valid non-negative amount agreed with the parking operator.')
      return
    }
    setSaving(true); setError(''); setNotice('')
    try {
      const created = await reservationApi.create({
        userId: user.userId,
        vehicleId: Number(vehicleId),
        parkingLotId: lot.id,
        reservation: {
          reservationCode: `PS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          totalAmount: total,
          currency: 'RWF',
          notes: notes.trim() || undefined,
        },
      })
      setNotice(`Reservation ${created.reservationCode || `#${created.id}`} was created with status ${created.status}.`)
      window.setTimeout(() => navigate('/driver/reservations'), 1200)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Reservation could not be created.')
    } finally { setSaving(false) }
  }

  return <main className="mx-auto min-h-[calc(100vh-72px)] max-w-4xl px-4 py-10 sm:px-6">
    <Link to="/driver/find" className="text-sm font-semibold text-[#176b67]">← Back to parking</Link>
    <div className="mt-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#176b67]">Reservation</p><h1 className="mt-2 text-3xl font-bold">Reserve parking</h1><p className="mt-2 text-sm text-[#66777a]">Choose your vehicle and time window. Confirm the amount with the operator before submitting.</p></div>
    {!user && <div className="mt-6 rounded-2xl border border-[#dfe8e5] bg-white p-5">Please <Link to="/login" className="font-semibold text-[#176b67] underline">sign in</Link> before creating a reservation.</div>}
    {loading && <p className="mt-6 rounded-xl bg-white p-5 text-sm text-[#66777a]">Loading parking and saved vehicles…</p>}
    {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
    {user && !loading && lot && <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border border-[#dfe8e5] bg-white p-5 sm:p-7">
      <section className="rounded-xl bg-[#edf7f4] p-4"><h2 className="font-bold">{lot.name}</h2><p className="mt-1 text-sm text-[#66777a]">{lot.address}, {lot.city}</p><p className="mt-2 text-xs text-[#66777a]">Capacity: {lot.totalCapacity ?? 'Not provided'} · Status: {lot.status}</p></section>
      {vehicles.length === 0 ? <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">You need an active vehicle before reserving. <Link to="/driver/vehicles" className="font-semibold underline">Add a vehicle</Link>.</div> : <label className="block text-sm font-semibold">Vehicle<select required value={vehicleId} onChange={e=>setVehicleId(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e2df] bg-white px-3 font-normal">{vehicles.map(vehicle=><option key={vehicle.id} value={vehicle.id}>{vehicle.plateNumber}{vehicle.isDefault ? ' · Default' : ''}</option>)}</select></label>}
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Start time<input required type="datetime-local" value={startLocal} onChange={e=>setStartLocal(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e2df] px-3 font-normal" /></label><label className="block text-sm font-semibold">End time<input required type="datetime-local" min={startLocal || undefined} value={endLocal} onChange={e=>setEndLocal(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e2df] px-3 font-normal" /></label></div>
      <label className="block text-sm font-semibold">Agreed amount (RWF)<input required type="number" min="0" step="1" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Enter amount confirmed with the operator" className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e2df] px-3 font-normal" /><span className="mt-1.5 block text-xs font-normal leading-5 text-[#66777a]">The current parking-lot API does not provide a verified price. This amount is entered by you and is not an automatically calculated quote.</span></label>
      <label className="block text-sm font-semibold">Notes <span className="font-normal text-[#66777a]">(optional)</span><textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Arrival details or accessibility needs" className="mt-1.5 w-full rounded-xl border border-[#d5e2df] p-3 font-normal" /></label>
      <button disabled={saving || vehicles.length===0} className="h-12 w-full rounded-xl bg-[#176b67] px-4 font-semibold text-white disabled:opacity-60">{saving ? 'Creating reservation…' : 'Create reservation'}</button>
      <p className="text-xs leading-5 text-[#66777a]">This submits a reservation record. It does not charge a payment method or confirm mobile-money payment.</p>
    </form>}
    {user && !loading && !lot && !error && <div className="mt-6 rounded-xl bg-white p-5 text-sm text-[#66777a]">Parking lot not found.</div>}
  </main>
}

function DriverReservationsPage() {
  const user = getSignedInUser()
  const [reservations, setReservations] = useState<import('./lib/api').Reservation[]>([])
  const [lots, setLots] = useState<ParkingLot[]>([])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (!user) { setLoading(false); return }
    Promise.all([reservationApi.listByUser(user.userId), parkingApi.list()])
      .then(([items, parkingLots]) => { setReservations(items); setLots(parkingLots) })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Could not load reservations.'))
      .finally(() => setLoading(false))
  }, [])
  async function cancel(id: number) {
    setBusyId(id); setError(''); setNotice('')
    try {
      const updated = await reservationApi.cancel(id)
      setReservations(current => current.map(item => item.id === id ? updated : item))
      setNotice('Reservation cancellation was saved by the API.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not cancel reservation.') }
    finally { setBusyId(null) }
  }
  const lotName = (id: number) => lots.find(lot => lot.id === id)?.name || `Parking lot #${id}`
  return <main className="mx-auto min-h-[calc(100vh-72px)] max-w-6xl px-4 py-10 sm:px-6">
    <Link to="/driver/find" className="text-sm font-semibold text-[#176b67]">← Back to parking</Link>
    <div className="mt-5"><h1 className="text-3xl font-bold">My reservations</h1><p className="mt-2 text-sm text-[#66777a]">Your reservation history comes from the connected backend.</p></div>
    {!user && <div className="mt-6 rounded-2xl border border-[#dfe8e5] bg-white p-5">Please <Link to="/login" className="font-semibold text-[#176b67] underline">sign in</Link> to view reservations.</div>}
    {user && <div className="mt-6 space-y-3">
      {loading && <p className="rounded-xl bg-white p-5 text-sm text-[#66777a]">Loading reservations…</p>}
      {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
      {!loading && !error && reservations.length === 0 && <div className="rounded-2xl border border-dashed border-[#c9d9d5] bg-white p-10 text-center"><Ticket className="mx-auto size-8 text-[#176b67]"/><h2 className="mt-3 font-bold">No reservations yet</h2><p className="mt-1 text-sm text-[#66777a]">Once you reserve parking, it will appear here.</p><Link to="/driver/find" className="mt-4 inline-flex rounded-xl bg-[#176b67] px-4 py-2.5 font-semibold text-white">Find parking</Link></div>}
      {reservations.map(item=><article key={item.id} className="rounded-2xl border border-[#dfe8e5] bg-white p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{lotName(item.parkingLotId)}</h2><span className="rounded-full bg-[#edf7f4] px-2.5 py-1 text-xs font-bold text-[#176b67]">{item.status}</span></div><p className="mt-2 text-sm text-[#66777a]">Code: <strong className="text-[#203238]">{item.reservationCode || `#${item.id}`}</strong></p><p className="mt-1 text-sm text-[#66777a]">{new Date(item.startTime).toLocaleString()} – {new Date(item.endTime).toLocaleString()}</p><p className="mt-2 text-sm font-semibold">{item.currency || 'RWF'} {Number(item.totalAmount).toLocaleString()}</p></div>{['PENDING','CONFIRMED'].includes(item.status) && <button disabled={busyId === item.id} onClick={()=>void cancel(item.id)} className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">{busyId === item.id ? 'Cancelling…' : 'Cancel reservation'}</button>}</div></article>)}
    </div>}
  </main>
}

function OperatorPage() {
  const user = getSignedInUser()
  const [lots, setLots] = useState<ParkingLot[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Kigali')
  const [description, setDescription] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [capacity, setCapacity] = useState('')

  const allowed = Boolean(user?.roles.some(role => role.includes('OPERATOR') || role.includes('ADMIN')))
  async function reloadLots() {
    if (!user || !allowed) return
    setLoading(true)
    try { setLots(await parkingApi.listByOperator(user.userId)); setMessage('') }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Unable to load operator lots.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void reloadLots() }, [])

  async function createLot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !allowed) return
    setSaving(true); setMessage('')
    try {
      const created = await parkingApi.create(user.userId, {
        name: name.trim(), address: address.trim(), city: city.trim(),
        description: description.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        totalCapacity: capacity ? Number(capacity) : undefined,
        status: 'ACTIVE',
      })
      setLots(current => [created, ...current])
      setName(''); setAddress(''); setDescription(''); setContactPhone(''); setCapacity('')
      setMessage('Parking lot created successfully.')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Unable to create parking lot.')
    } finally { setSaving(false) }
  }

  return <main className="mx-auto min-h-[calc(100vh-72px)] max-w-6xl px-4 py-10 sm:px-6">
    <Link to="/" className="text-sm font-semibold text-[#176b67]">← Back to ParkShare</Link>
    <div className="mt-5"><h1 className="text-3xl font-bold">Operator workspace</h1><p className="mt-2 text-sm text-[#66777a]">Create a parking lot and manage the lots assigned to your operator account.</p></div>
    {!user && <div className="mt-6 rounded-2xl border border-[#dfe8e5] bg-white p-5 text-sm text-[#66777a]">Sign in with an operator account to continue. <Link to="/login" className="font-semibold text-[#176b67] underline">Sign in</Link></div>}
    {user && !allowed && <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Your account does not have the OPERATOR or ADMIN role. Please sign in with an authorized account.</div>}
    {user && allowed && <div className="mt-7 grid items-start gap-6 lg:grid-cols-[.85fr_1.15fr]">
      <form onSubmit={createLot} className="space-y-4 rounded-2xl border border-[#dfe8e5] bg-white p-5">
        <h2 className="text-lg font-bold">Register a parking lot</h2>
        <label className="block text-sm font-semibold">Parking lot name<input required value={name} onChange={e=>setName(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e2df] px-3 font-normal focus:border-[#176b67] focus:outline-none" /></label>
        <label className="block text-sm font-semibold">Street address / area<input required value={address} onChange={e=>setAddress(e.target.value)} placeholder="e.g. KG 7 Ave, Kimihurura" className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e2df] px-3 font-normal focus:border-[#176b67] focus:outline-none" /></label>
        <label className="block text-sm font-semibold">City<input required value={city} onChange={e=>setCity(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e2df] px-3 font-normal focus:border-[#176b67] focus:outline-none" /></label>
        <label className="block text-sm font-semibold">Description <span className="font-normal text-[#66777a]">(optional)</span><textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} className="mt-1.5 w-full rounded-xl border border-[#d5e2df] p-3 font-normal focus:border-[#176b67] focus:outline-none" /></label>
        <label className="block text-sm font-semibold">Contact phone <span className="font-normal text-[#66777a]">(optional)</span><input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e2df] px-3 font-normal focus:border-[#176b67] focus:outline-none" /></label>
        <label className="block text-sm font-semibold">Total capacity <span className="font-normal text-[#66777a]">(optional)</span><input type="number" min="1" step="1" value={capacity} onChange={e=>setCapacity(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#d5e2df] px-3 font-normal focus:border-[#176b67] focus:outline-none" /></label>
        {message && <p role="status" className="rounded-xl bg-[#edf7f4] p-3 text-sm text-[#176b67]">{message}</p>}
        <button disabled={saving} className="h-11 w-full rounded-xl bg-[#176b67] px-4 font-semibold text-white disabled:opacity-60">{saving ? 'Creating…' : 'Create parking lot'}</button>
      </form>
      <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Your parking lots</h2><span className="text-sm text-[#66777a]">{lots.length} total</span></div>
        {loading && <p className="rounded-xl bg-white p-5 text-sm text-[#66777a]">Loading your lots…</p>}
        {!loading && lots.length===0 && <div className="rounded-2xl border border-dashed border-[#c9d9d5] bg-white p-8 text-center"><ParkingCircle className="mx-auto size-8 text-[#176b67]"/><h3 className="mt-3 font-bold">No parking lots yet</h3><p className="mt-1 text-sm text-[#66777a]">Create your first lot using the form.</p></div>}
        <div className="space-y-3">{lots.map(lot=><article key={lot.id} className="rounded-2xl border border-[#dfe8e5] bg-white p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{lot.name}</h3><p className="mt-1 text-sm text-[#66777a]">{lot.address}, {lot.city}</p></div><span className="rounded-full bg-[#edf7f4] px-2.5 py-1 text-xs font-bold text-[#176b67]">{lot.status}</span></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#edf1ef] pt-3 text-sm"><div><p className="text-[#66777a]">Capacity</p><p className="mt-1 font-semibold">{lot.totalCapacity ?? 'Not set'}</p></div><div><p className="text-[#66777a]">Lot ID</p><p className="mt-1 font-semibold">#{lot.id}</p></div></div></article>)}</div>
      </section>
    </div>}
  </main>
}

function NotFound() {
  return <main className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-3xl font-bold">Page not found</h1><p className="mt-3 text-[#66777a]">This page is not part of the Vite migration yet.</p><Link to="/" className="mt-5 inline-block font-semibold text-[#176b67]">Return home</Link></main>
}

export default function App() {
  return <><Header /><Routes><Route path="/" element={<LandingPage />} /><Route path="/login" element={<LoginPage />} /><Route path="/driver" element={<Navigate to="/driver/find" replace />} /><Route path="/driver/find" element={<ParkingDiscoveryPage />} /><Route path="/driver/vehicles" element={<DriverVehiclesPage />} /><Route path="/driver/book/:lotId" element={<DriverBookingPage />} /><Route path="/driver/reservations" element={<DriverReservationsPage />} /><Route path="/operator" element={<OperatorPage />} /><Route path="*" element={<NotFound />} /></Routes></>
}