import { useParams } from "react-router-dom";
import { Clock, MapPin, Phone, ShieldCheck, Star } from "lucide-react";
import { loadLotLayout, parkingApi, pricingApi } from "../../lib/api";
import { formatRwf } from "../../lib/format";
import { useLoad } from "../../lib/useLoad";
import { Alert, BackLink, ButtonLink, Card, Loading, OccupancyBar } from "../../components/ui";
import { LotStatusPill } from "../../components/parking";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");

export default function ParkingDetail() {
  const lotId = Number(useParams().id);
  const { data, loading, error } = useLoad(async () => {
    const lot = await parkingApi.get(lotId);
    const [layout, rules, hours, features, reviews] = await Promise.all([
      loadLotLayout(lotId).catch(() => ({ zones: [], spaces: [] })),
      pricingApi.activeRules(lotId).catch(() => []),
      parkingApi.hours(lotId).catch(() => []),
      parkingApi.features(lotId).catch(() => []),
      parkingApi.reviews(lotId).catch(() => []),
    ]);
    return { lot, ...layout, rules, hours, features, reviews };
  }, [lotId]);

  if (loading) return <Loading>Loading parking details…</Loading>;
  if (error || !data)
    return (
      <div>
        <BackLink to="/driver/find">Back to results</BackLink>
        <Alert title="This parking lot could not be loaded">{error || "Not found."}</Alert>
      </div>
    );

  const { lot, zones, spaces, rules, hours, features, reviews } = data;
  const open = lot.status?.toUpperCase() === "ACTIVE";
  const free = spaces.filter((s) => s.status?.toUpperCase() === "AVAILABLE").length;
  const hourly = rules.find((r) => r.pricingType === "HOURLY");
  const daily = rules.find((r) => r.pricingType === "DAILY");
  const rating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const sortedHours = [...hours].sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek));

  return (
    <div className="pb-10">
      <BackLink to="/driver/find">Back to results</BackLink>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div>
            <LotStatusPill status={lot.status} />
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{lot.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4" />
              {lot.address}, {lot.city}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {rating !== null ? (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-warning text-warning" />
                  <span className="font-medium text-foreground">{rating.toFixed(1)}</span> ({reviews.length}{" "}
                  {reviews.length === 1 ? "review" : "reviews"})
                </span>
              ) : (
                <span>No reviews yet</span>
              )}
              {lot.contactPhone && (
                <a href={`tel:${lot.contactPhone}`} className="flex items-center gap-1 hover:text-foreground">
                  <Phone className="size-4" /> {lot.contactPhone}
                </a>
              )}
            </div>
            {lot.description && <p className="mt-4 text-sm leading-6 text-muted-foreground">{lot.description}</p>}
          </div>

          <Card className="p-4">
            <h2 className="font-sans font-semibold tracking-normal">Live availability</h2>
            {spaces.length > 0 ? (
              <>
                <div className="mt-3">
                  <OccupancyBar occupied={spaces.length - free} total={spaces.length} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Based on the current status of the {spaces.length} spaces the operator has registered. Reserve to
                  hold a space for your time window.
                </p>
                {zones.length > 1 && (
                  <ul className="mt-3 divide-y divide-border rounded-xl border border-border text-sm">
                    {zones.map((zone) => {
                      const zoneSpaces = spaces.filter((s) => s.parkingZoneId === zone.id);
                      const zoneFree = zoneSpaces.filter((s) => s.status?.toUpperCase() === "AVAILABLE").length;
                      return (
                        <li key={zone.id} className="flex justify-between px-3 py-2">
                          <span>{zone.name}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {zoneFree} of {zoneSpaces.length} free
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                The operator hasn't registered individual spaces yet, so live availability isn't shown. You can
                still request a reservation.
              </p>
            )}
          </Card>

          {sortedHours.length > 0 && (
            <Card className="p-4">
              <h2 className="flex items-center gap-2 font-sans font-semibold tracking-normal">
                <Clock className="size-4 text-muted-foreground" /> Opening hours
              </h2>
              <dl className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
                {sortedHours.map((h) => (
                  <div key={h.id} className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{titleCase(h.dayOfWeek)}</dt>
                    <dd className="font-medium tabular-nums">
                      {h.closed ? "Closed" : `${h.openingTime.slice(0, 5)} – ${h.closingTime.slice(0, 5)}`}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          {features.length > 0 && (
            <Card className="p-4">
              <h2 className="font-sans font-semibold tracking-normal">Security & amenities</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {features.map((f) => (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-sm"
                  >
                    <ShieldCheck className="size-3.5 text-info" />
                    {titleCase(f.featureCode)}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {reviews.length > 0 && (
            <Card className="p-4">
              <h2 className="font-sans font-semibold tracking-normal">What drivers say</h2>
              <ul className="mt-3 space-y-3">
                {reviews.slice(0, 3).map((r) => (
                  <li key={r.id} className="text-sm">
                    <span className="flex items-center gap-0.5" aria-label={`${r.rating} out of 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={i < r.rating ? "size-3.5 fill-warning text-warning" : "size-3.5 text-border"}
                        />
                      ))}
                    </span>
                    {r.comment && <p className="mt-1 text-muted-foreground">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div>
          <Card className="p-5 lg:sticky lg:top-24">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-display text-3xl font-bold">{hourly ? formatRwf(hourly.amount) : "Standard rate"}</p>
                <p className="text-sm text-muted-foreground">{hourly ? "per hour" : "set by ParkShare"}</p>
              </div>
              {daily && (
                <div className="text-right text-sm text-muted-foreground">
                  <p>{formatRwf(daily.amount)}</p>
                  <p>full day</p>
                </div>
              )}
            </div>

            <dl className="mt-4 space-y-2 border-y border-border py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Spaces free now</dt>
                <dd className="font-medium tabular-nums">
                  {spaces.length ? `${free} of ${spaces.length}` : "Not reported"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Capacity</dt>
                <dd className="font-medium">{lot.totalCapacity ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Zones</dt>
                <dd className="font-medium">{zones.length || "—"}</dd>
              </div>
            </dl>

            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              You'll see the exact price, including 18% VAT, before you confirm. Cancel 60+ minutes before your start
              time for a full refund.
            </p>

            {open ? (
              <ButtonLink to={`/driver/parking/${lot.id}/reserve`} size="lg" className="mt-4 w-full">
                Reserve a space
              </ButtonLink>
            ) : (
              <button
                type="button"
                disabled
                className="mt-4 h-12 w-full cursor-not-allowed rounded-xl bg-muted text-base font-medium text-muted-foreground"
              >
                {lot.status?.toUpperCase() === "PENDING" ? "Not open for booking yet" : "Temporarily unavailable"}
              </button>
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground">Pay with MTN MoMo or Airtel Money</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
