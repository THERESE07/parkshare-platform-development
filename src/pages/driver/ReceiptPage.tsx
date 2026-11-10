import { useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { paymentApi } from "../../api";
import { formatRwf } from "../../lib/format";
import { useLoad } from "../../lib/useLoad";
import { Alert, BackLink, Card, Loading, Logo, buttonClass } from "../../components/ui";

/** Payment receipt from the API (guide §9: VAT line only when vatAmount > 0). */
export default function ReceiptPage() {
  const reservationId = Number(useParams().id);
  const { data: receipt, loading, error } = useLoad(async () => {
    const payment = await paymentApi.getForReservation(reservationId);
    return paymentApi.receipt(payment.id);
  }, [reservationId]);

  if (loading) return <Loading>Loading your receipt…</Loading>;
  if (error || !receipt)
    return (
      <div className="mx-auto max-w-md">
        <BackLink to="/driver/bookings">My bookings</BackLink>
        <Alert title="No receipt yet">{error || "This booking hasn't been paid."}</Alert>
      </div>
    );

  const rows: [string, string | null | undefined][] = [
    ["Reservation", receipt.reservationCode],
    ["Parking", receipt.parkingLotName],
    ["Address", receipt.parkingLotAddress],
    ["Operator", receipt.operatorBusinessName],
    ["Operator reg. no.", receipt.operatorRegistrationNumber],
    ["Customer", receipt.customerName],
    ["Vehicle", receipt.vehiclePlate],
    ["From", receipt.startKigali],
    ["Until", receipt.endKigali],
    ["Paid with", receipt.paymentMethod?.replace("_", " ")],
    ["Phone", receipt.payerPhone],
  ];

  return (
    <div className="mx-auto max-w-md">
      <div className="flex items-center justify-between print:hidden">
        <BackLink to="/driver/bookings">My bookings</BackLink>
        <button type="button" onClick={() => window.print()} className={buttonClass("outline", "sm", "mb-4")}>
          <Printer className="size-4" /> Print
        </button>
      </div>
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <Logo size="sm" />
          <div className="text-right text-xs text-muted-foreground">
            <p className="font-mono font-semibold text-foreground">{receipt.receiptNumber}</p>
            <p>{receipt.issuedAtKigali}</p>
            <p className="uppercase">{receipt.status}</p>
          </div>
        </div>
        <dl className="mt-6 space-y-2 text-sm">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
        </dl>
        <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          {receipt.vatAmount > 0 && (
            <>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Amount excl. VAT</dt>
                <dd className="tabular-nums">{formatRwf(receipt.amountExcludingVat)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">VAT ({Math.round(receipt.vatRate * 100)}%)</dt>
                <dd className="tabular-nums">{formatRwf(receipt.vatAmount)}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="font-display font-bold tabular-nums">{formatRwf(receipt.total)}</dd>
          </div>
          {receipt.refunded > 0 && (
            <div className="flex justify-between text-success">
              <dt>Refunded</dt>
              <dd className="tabular-nums">−{formatRwf(receipt.refunded)}</dd>
            </div>
          )}
        </dl>
        {receipt.note && <p className="mt-4 text-xs text-muted-foreground">{receipt.note}</p>}
      </Card>
    </div>
  );
}
