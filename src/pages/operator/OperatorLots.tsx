import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, LoaderCircle, MapPinned, Plus } from "lucide-react";
import {
  RWANDA_DISTRICTS,
  parkingApi,
  parkingSpaceApi,
  parkingZoneApi,
  pricingApi,
  type OperatorPreview,
  type ParkingSpace,
  type SpaceStatus,
  type SpaceType,
} from "../../api";
import { SPACE_STATUS_META, errorMessage, formatRwf } from "../../lib/format";
import { useSession } from "../../lib/session";
import { useLoad } from "../../lib/useLoad";
import { Alert, Card, EmptyState, Field, Input, Loading, OccupancyBar, PageHeader, Select, Textarea, buttonClass, cn } from "../../components/ui";
import { LotStatusPill } from "../../components/parking";
import { LocationPicker } from "../../components/map";
import type { LatLng } from "../../lib/geo";
import { inUse, loadOperatorLots, type OperatorLot } from "./data";

const SPACE_TYPES: SpaceType[] = ["STANDARD", "DISABLED", "EV", "VIP", "MOTORCYCLE"];
const SETTABLE: SpaceStatus[] = ["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE"];

export default function OperatorLots() {
  const user = useSession()!;
  const [params] = useSearchParams();
  const { data, loading, error, reload } = useLoad(
    () => loadOperatorLots(user.userId, { withReservations: false }),
    [user.userId],
  );
  const [showForm, setShowForm] = useState(params.get("new") === "1");
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div>
      <PageHeader
        title="My lots"
        description="Keep spaces and prices up to date so drivers see the truth."
        action={
          <button type="button" onClick={() => setShowForm((s) => !s)} className={buttonClass("primary", "md")}>
            <Plus className="size-4" /> {showForm ? "Close form" : "Add lot"}
          </button>
        }
      />

      {showForm && (
        <NewLotForm
          operatorId={user.userId}
          onCreated={async (id) => {
            setShowForm(false);
            setExpanded(id);
            await reload();
          }}
        />
      )}

      {loading && !data && <Loading>Loading your lots…</Loading>}
      {error && <Alert title="Your lots could not be loaded">{error}</Alert>}
      {data && data.length === 0 && !showForm && (
        <EmptyState
          icon={<MapPinned className="size-6" />}
          title="No parking lots yet"
          description="Add your first lot to start receiving reservations."
        />
      )}

      <div className="space-y-4">
        {data?.map((item) => (
          <LotCard
            key={item.lot.id}
            item={item}
            open={expanded === item.lot.id}
            onToggle={() => setExpanded((id) => (id === item.lot.id ? null : item.lot.id))}
            onChanged={reload}
          />
        ))}
      </div>
    </div>
  );
}

function NewLotForm({ operatorId, onCreated }: { operatorId: number; onCreated: (id: number) => Promise<void> }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState<string>("Gasabo");
  const [city, setCity] = useState("Kigali");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [location, setLocation] = useState<LatLng | null>(null);
  const [capacity, setCapacity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await parkingApi.create(operatorId, {
        name: name.trim(),
        address: address.trim(),
        district,
        city: city.trim(),
        description: description.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        totalCapacity: capacity ? Number(capacity) : undefined,
        latitude: location?.lat,
        longitude: location?.lng,
      });
      await onCreated(created.id);
    } catch (cause) {
      setError(errorMessage(cause, "The parking lot could not be created."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mb-6 p-5">
      <h2 className="font-sans text-lg font-bold tracking-normal">Register a parking lot</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        New lots start as <strong>awaiting approval</strong> until a ParkShare admin verifies them.
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Parking lot name" htmlFor="lotName" className="sm:col-span-2">
          <Input id="lotName" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Street address / area" htmlFor="lotAddress" className="sm:col-span-2">
          <Input
            id="lotAddress"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. KG 7 Ave, Kimihurura"
          />
        </Field>
        <Field label="District" htmlFor="lotDistrict">
          <Select id="lotDistrict" value={district} onChange={(e) => setDistrict(e.target.value)}>
            {RWANDA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="City" htmlFor="lotCity">
          <Input id="lotCity" required value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
        <Field label="Contact phone" htmlFor="lotPhone" optional>
          <Input id="lotPhone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </Field>
        <Field label="Total capacity" htmlFor="lotCapacity" optional>
          <Input id="lotCapacity" type="number" min="1" step="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </Field>
        <div className="space-y-1.5 sm:col-span-2">
          <p className="text-sm font-semibold">
            Location on the map <span className="font-normal text-muted-foreground">(recommended)</span>
          </p>
          <LocationPicker value={location} onChange={setLocation} className="h-64" />
          <p className="text-xs text-muted-foreground">
            {location
              ? `Pinned at ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}. Drag the pin to adjust.`
              : "Tap the entrance of your lot so drivers can navigate to it. Must be inside Rwanda."}
          </p>
        </div>
        <Field label="Description" htmlFor="lotDescription" optional className="sm:col-span-2">
          <Textarea id="lotDescription" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        {error && <Alert className="sm:col-span-2">{error}</Alert>}
        <button disabled={saving} className={buttonClass("primary", "md", "sm:col-span-2")}>
          {saving ? "Creating…" : "Create parking lot"}
        </button>
      </form>
    </Card>
  );
}

function LotCard({
  item,
  open,
  onToggle,
  onChanged,
}: {
  item: OperatorLot;
  open: boolean;
  onToggle: () => void;
  onChanged: () => Promise<void>;
}) {
  const { lot, zones, spaces, rules } = item;
  const hourly = rules.find((r) => r.pricingType === "HOURLY");

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-sans text-lg font-semibold tracking-normal">{lot.name}</h2>
          <p className="text-sm text-muted-foreground">
            {lot.address}, {lot.city}
          </p>
        </div>
        <LotStatusPill status={lot.status} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        {spaces.length ? (
          <OccupancyBar occupied={spaces.filter(inUse).length} total={spaces.length} />
        ) : (
          <p className="text-sm text-muted-foreground">No spaces registered yet — add a zone and spaces below.</p>
        )}
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">
            Rate <span className="font-semibold text-foreground">{hourly ? `${formatRwf(hourly.amount)}/hr` : "standard"}</span>
          </span>
          <span className="text-muted-foreground">
            Spaces <span className="font-semibold text-foreground">{spaces.length}</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="mt-4 flex w-full items-center justify-between border-t border-border pt-4 text-sm font-semibold text-primary"
      >
        Manage spaces, zones & pricing
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-4 space-y-6">
          <SpacesEditor zones={zones} spaces={spaces} onChanged={onChanged} />
          <div className="grid gap-4 lg:grid-cols-3">
            <RateForm lotId={lot.id} current={hourly?.amount ?? null} onChanged={onChanged} />
            <ZoneForm lotId={lot.id} onChanged={onChanged} />
            {zones.length > 0 && <SpacesForm zones={zones} onChanged={onChanged} />}
          </div>
        </div>
      )}
    </Card>
  );
}

function SpacesEditor({
  zones,
  spaces,
  onChanged,
}: {
  zones: OperatorLot["zones"];
  spaces: ParkingSpace[];
  onChanged: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function setStatus(space: ParkingSpace, status: SpaceStatus) {
    setBusyId(space.id);
    setError("");
    try {
      await parkingSpaceApi.setStatus(space.id, status);
      await onChanged();
    } catch (cause) {
      setError(errorMessage(cause, "The space could not be updated."));
    } finally {
      setBusyId(null);
    }
  }

  if (zones.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Set availability</p>
      {error && <Alert className="mb-3">{error}</Alert>}
      <div className="space-y-4">
        {zones.map((zone) => {
          const zoneSpaces = spaces.filter((s) => s.parkingZoneId === zone.id);
          return (
            <div key={zone.id}>
              <p className="mb-2 text-sm font-semibold">
                {zone.name}{" "}
                <span className="font-normal text-muted-foreground">
                  · {zoneSpaces.length} spaces{zone.status && zone.status !== "ACTIVE" ? ` · ${zone.status.toLowerCase()}` : ""}
                </span>
              </p>
              {zoneSpaces.length === 0 ? (
                <p className="text-sm text-muted-foreground">No spaces in this zone yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {zoneSpaces.map((space) => {
                    const status = (space.status ?? "").toUpperCase();
                    const tone = SPACE_STATUS_META[status]?.tone ?? "neutral";
                    return (
                      <label
                        key={space.id}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm",
                          tone === "success" && "border-success/30 bg-success-muted",
                          tone === "danger" && "border-destructive/20 bg-danger-muted",
                          tone === "info" && "border-info/20 bg-info-muted",
                          tone === "warning" && "border-warning/30 bg-warning-muted",
                          tone === "neutral" && "border-border bg-muted",
                        )}
                      >
                        <span className="font-mono font-semibold">{space.spaceCode}</span>
                        {busyId === space.id ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <select
                            aria-label={`Status of space ${space.spaceCode}`}
                            value={status}
                            onChange={(e) => setStatus(space, e.target.value as SpaceStatus)}
                            className="rounded-md bg-transparent text-xs font-medium outline-none"
                          >
                            {[...new Set<string>([...SETTABLE, status].filter(Boolean))].map((s) => (
                              <option key={s} value={s}>
                                {SPACE_STATUS_META[s]?.label ?? s}
                              </option>
                            ))}
                          </select>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniForm({
  title,
  children,
  onSubmit,
  busy,
  error,
  submitLabel,
}: {
  title: string;
  children: React.ReactNode;
  onSubmit: () => Promise<void>;
  busy: boolean;
  error: string;
  submitLabel: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit();
      }}
      className="space-y-3 rounded-xl border border-border bg-muted/40 p-4"
    >
      <p className="text-sm font-semibold">{title}</p>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <button disabled={busy} className={buttonClass("outline", "sm", "w-full")}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

function useAction(onChanged: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(action: () => Promise<unknown>, reset?: () => void) {
    setBusy(true);
    setError("");
    try {
      await action();
      reset?.();
      await onChanged();
    } catch (cause) {
      setError(errorMessage(cause, "That didn't work."));
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}

function RateForm({ lotId, current, onChanged }: { lotId: number; current: number | null; onChanged: () => Promise<void> }) {
  const [amount, setAmount] = useState(current ? String(current) : "");
  const { busy, error, run } = useAction(onChanged);
  return (
    <MiniForm
      title="Hourly rate"
      submitLabel={current ? "Save new rate" : "Set rate"}
      busy={busy}
      error={error}
      onSubmit={() =>
        run(() =>
          pricingApi.createRule(lotId, {
            name: `Hourly ${amount} RWF`,
            pricingType: "HOURLY",
            amount: Number(amount),
            currency: "RWF",
            active: true,
            effectiveFrom: new Date().toISOString(),
          }),
        )
      }
    >
      <Field label="RWF per hour" htmlFor={`rate-${lotId}`} hint="Up to 2,000 RWF/hour. ParkShare calculates what drivers pay.">
        <Input
          id={`rate-${lotId}`}
          required
          type="number"
          min="0"
          max="2000"
          step="10"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Field>
      <EarningsPreview lotId={lotId} hourlyRate={Number(amount) || undefined} />
    </MiniForm>
  );
}

/** What the operator receives at the typed rate, straight from the API (guide §10). */
function EarningsPreview({ lotId, hourlyRate }: { lotId: number; hourlyRate?: number }) {
  const [preview, setPreview] = useState<OperatorPreview | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const t = window.setTimeout(() => {
      pricingApi
        .operatorPreview(lotId, hourlyRate)
        .then((p) => active && (setPreview(p), setError("")))
        .catch((cause) => active && setError(errorMessage(cause, "Preview unavailable.")));
    }, 400);
    return () => {
      active = false;
      window.clearTimeout(t);
    };
  }, [lotId, hourlyRate]);

  if (error) return <p className="whitespace-pre-line text-xs text-muted-foreground">{error}</p>;
  if (!preview) return <p className="text-xs text-muted-foreground">Calculating your earnings…</p>;
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 text-xs">
      <p className="mb-1.5 font-semibold">What you'd earn{preview.basedOn ? ` (${preview.basedOn})` : ""}</p>
      <table className="w-full tabular-nums">
        <thead>
          <tr className="text-left text-muted-foreground">
            <th className="font-medium">Stay</th>
            <th className="text-right font-medium">Driver pays</th>
            <th className="text-right font-medium">You get</th>
          </tr>
        </thead>
        <tbody>
          {(preview.examples ?? []).map((ex) => (
            <tr key={ex.stay}>
              <td>{ex.stay}</td>
              <td className="text-right">{formatRwf(ex.driverPays)}</td>
              <td className="text-right font-semibold">{formatRwf(ex.yourNetIncome ?? ex.youReceive)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(preview.notes ?? []).map((n) => (
        <p key={n} className="mt-1.5 text-muted-foreground">
          {n}
        </p>
      ))}
    </div>
  );
}

function ZoneForm({ lotId, onChanged }: { lotId: number; onChanged: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const { busy, error, run } = useAction(onChanged);
  return (
    <MiniForm
      title="Add a zone"
      submitLabel="Add zone"
      busy={busy}
      error={error}
      onSubmit={() =>
        run(
          () =>
            parkingZoneApi.create(lotId, {
              name: name.trim(),
              capacity: capacity ? Number(capacity) : undefined,
              status: "ACTIVE",
            }),
          () => {
            setName("");
            setCapacity("");
          },
        )
      }
    >
      <Field label="Zone name" htmlFor={`zone-${lotId}`}>
        <Input id={`zone-${lotId}`} required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Basement B1" />
      </Field>
      <Field label="Capacity" htmlFor={`zonecap-${lotId}`} optional>
        <Input id={`zonecap-${lotId}`} type="number" min="0" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
      </Field>
    </MiniForm>
  );
}

function SpacesForm({ zones, onChanged }: { zones: OperatorLot["zones"]; onChanged: () => Promise<void> }) {
  const [zoneId, setZoneId] = useState(String(zones[0]?.id ?? ""));
  const [prefix, setPrefix] = useState("A");
  const [count, setCount] = useState("10");
  const [spaceType, setSpaceType] = useState<SpaceType>("STANDARD");
  const { busy, error, run } = useAction(onChanged);

  return (
    <MiniForm
      title="Add spaces"
      submitLabel={`Add ${count || 0} spaces`}
      busy={busy}
      error={error}
      onSubmit={() =>
        run(async () => {
          const zone = Number(zoneId);
          const existing = await parkingSpaceApi.listByZone(zone);
          const used = new Set(existing.map((s) => s.spaceCode));
          let n = 1;
          for (let made = 0; made < Number(count); n++) {
            const code = `${prefix.trim().toUpperCase()}${n}`;
            if (used.has(code)) continue;
            await parkingSpaceApi.create(zone, { spaceCode: code, spaceType, status: "AVAILABLE" });
            made++;
          }
        })
      }
    >
      <Field label="Zone" htmlFor="spaceZone">
        <Select id="spaceZone" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Code prefix" htmlFor="spacePrefix">
          <Input id="spacePrefix" required maxLength={6} value={prefix} onChange={(e) => setPrefix(e.target.value)} />
        </Field>
        <Field label="How many" htmlFor="spaceCount">
          <Input id="spaceCount" required type="number" min="1" max="50" value={count} onChange={(e) => setCount(e.target.value)} />
        </Field>
      </div>
      <Field label="Type" htmlFor="spaceType">
        <Select id="spaceType" value={spaceType} onChange={(e) => setSpaceType(e.target.value as SpaceType)}>
          {SPACE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
      </Field>
    </MiniForm>
  );
}
