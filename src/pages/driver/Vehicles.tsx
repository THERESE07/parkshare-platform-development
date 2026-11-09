import { useState, type FormEvent } from "react";
import { CarFront } from "lucide-react";
import { vehicleApi, type VehicleType } from "../../lib/api";
import { errorMessage } from "../../lib/format";
import { useSession } from "../../lib/session";
import { useLoad } from "../../lib/useLoad";
import { Alert, BackLink, Card, EmptyState, Field, Input, Loading, PageHeader, Pill, Select, buttonClass } from "../../components/ui";

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: "CAR", label: "Car / SUV" },
  { value: "MOTORCYCLE", label: "Motorcycle" },
  { value: "TRUCK", label: "Truck / pickup" },
  { value: "BUS", label: "Bus / minibus" },
  { value: "OTHER", label: "Other" },
];

export default function Vehicles() {
  const user = useSession()!;
  const { data: vehicles, setData: setVehicles, loading, error } = useLoad(
    () => vehicleApi.listByUser(user.userId),
    [user.userId],
  );
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("CAR");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const list = vehicles ?? [];

  async function addVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    setNotice("");
    try {
      const created = await vehicleApi.create(user.userId, {
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleType,
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        color: color.trim() || undefined,
        isDefault: list.length === 0,
        isActive: true,
      });
      setVehicles((current) => [...(current ?? []), created]);
      setPlateNumber("");
      setMake("");
      setModel("");
      setColor("");
      setNotice("Vehicle saved to your account.");
    } catch (cause) {
      setFormError(errorMessage(cause, "Could not save vehicle."));
    } finally {
      setBusy(false);
    }
  }

  async function makeDefault(id: number) {
    setFormError("");
    setNotice("");
    try {
      const updated = await vehicleApi.setDefault(id);
      setVehicles((current) => (current ?? []).map((v) => ({ ...v, isDefault: v.id === updated.id })));
      setNotice("Default vehicle updated.");
    } catch (cause) {
      setFormError(errorMessage(cause, "Could not update default vehicle."));
    }
  }

  return (
    <div>
      <BackLink to="/driver/profile">Profile</BackLink>
      <PageHeader title="My vehicles" description="The vehicles you can attach to a reservation." />
      <div className="grid items-start gap-6 lg:grid-cols-[.85fr_1.15fr]">
        <form onSubmit={addVehicle} className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-sans text-lg font-bold tracking-normal">Add a vehicle</h2>
          <Field label="Number plate" htmlFor="plate">
            <Input
              id="plate"
              required
              pattern="[A-Za-z0-9 \-]{2,30}"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              placeholder="e.g. RAD 421 C"
            />
          </Field>
          <Field label="Vehicle type" htmlFor="vehicleType">
            <Select id="vehicleType" value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleType)}>
              {VEHICLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Make" htmlFor="make" optional>
              <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Toyota" />
            </Field>
            <Field label="Model" htmlFor="model" optional>
              <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="RAV4" />
            </Field>
          </div>
          <Field label="Color" htmlFor="color" optional>
            <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </Field>
          {formError && <Alert>{formError}</Alert>}
          {notice && <Alert tone="success">{notice}</Alert>}
          <button disabled={busy} className={buttonClass("primary", "md", "w-full")}>
            {busy ? "Saving…" : "Save vehicle"}
          </button>
        </form>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-sans text-lg font-bold tracking-normal">Saved vehicles</h2>
            <span className="text-sm text-muted-foreground">{list.length} total</span>
          </div>
          {loading && <Loading>Loading vehicles…</Loading>}
          {error && <Alert>{error}</Alert>}
          {!loading && !error && list.length === 0 && (
            <EmptyState
              icon={<CarFront className="size-6" />}
              title="No vehicles yet"
              description="Add a vehicle to prepare for your first reservation."
            />
          )}
          <div className="space-y-3">
            {list.map((v) => (
              <Card key={v.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                    <CarFront className="size-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-sans font-bold tracking-normal">{v.plateNumber}</h3>
                      {v.isDefault && <Pill tone="primary">Default</Pill>}
                      {!v.isActive && <Pill>Inactive</Pill>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[v.make, v.model, v.color].filter(Boolean).join(" · ") || "Vehicle details not provided"} ·{" "}
                      {v.vehicleType.toLowerCase()}
                    </p>
                  </div>
                </div>
                {!v.isDefault && v.isActive && (
                  <button onClick={() => void makeDefault(v.id)} className={buttonClass("outline", "sm")}>
                    Make default
                  </button>
                )}
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
