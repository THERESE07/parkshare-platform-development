import {
  loadLotLayout,
  parkingApi,
  pricingApi,
  reservationApi,
  type ParkingLot,
  type ParkingSpace,
  type ParkingZone,
  type PricingRule,
  type Reservation,
} from "../../lib/api";

export type OperatorLot = {
  lot: ParkingLot;
  zones: ParkingZone[];
  spaces: ParkingSpace[];
  rules: PricingRule[];
  reservations: Reservation[];
};

/** Everything the operator console shows, for every lot the operator owns. */
export async function loadOperatorLots(
  operatorId: number,
  { withReservations = true }: { withReservations?: boolean } = {},
): Promise<OperatorLot[]> {
  const lots = await parkingApi.listByOperator(operatorId);
  return Promise.all(
    lots.map(async (lot) => {
      const [layout, rules, reservations] = await Promise.all([
        loadLotLayout(lot.id).catch(() => ({ zones: [], spaces: [] })),
        pricingApi.activeRules(lot.id).catch(() => []),
        withReservations ? reservationApi.listByParkingLot(lot.id).catch(() => []) : Promise.resolve([]),
      ]);
      return { lot, ...layout, rules, reservations };
    }),
  );
}

export const inUse = (s: ParkingSpace) => ["OCCUPIED", "RESERVED"].includes((s.status ?? "").toUpperCase());
export const isFree = (s: ParkingSpace) => (s.status ?? "").toUpperCase() === "AVAILABLE";
