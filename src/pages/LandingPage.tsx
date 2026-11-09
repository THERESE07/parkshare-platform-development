import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  CheckCircle2,
  Clock3,
  MapPin,
  ParkingCircle,
  Search,
  ShieldCheck,
  Ticket,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "../components/ui";

export default function LandingPage() {
  const roles = [
    {
      title: "Driver",
      desc: "Find verified parking, reserve ahead and arrive with confidence.",
      icon: CarFront,
      href: "/driver/find",
    },
    {
      title: "Parking operator",
      desc: "Manage your lots, spaces, pricing and incoming reservations.",
      icon: ParkingCircle,
      href: "/operator",
    },
    {
      title: "Attendant",
      desc: "Help verify reservations and manage vehicle arrival and departure.",
      icon: ShieldCheck,
      href: "/login",
    },
    {
      title: "Event organizer",
      desc: "Coordinate event parking and keep an eye on capacity.",
      icon: Ticket,
      href: "/login",
    },
    {
      title: "ParkShare admin",
      desc: "Oversee verification, support and the parking network.",
      icon: BadgeCheck,
      href: "/login",
    },
  ];
  return (
    <div className="bg-[#f8faf9]">
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cce4df] bg-[#edf7f4] px-3.5 py-2 text-xs font-semibold text-[#176b67]">
              <MapPin className="size-3.5" /> Built in Kigali · designed for
              Rwanda
            </div>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] text-[#203238] sm:text-5xl lg:text-6xl">
              Know your parking.{" "}
              <span className="text-[#176b67]">Reserve it.</span> Arrive with
              confidence.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#66777a]">
              Find parking with clear information, book before you arrive, and
              connect your reservation to the real parking experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/driver/find"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#176b67] px-5 font-semibold text-white shadow-md shadow-[#176b67]/15 hover:bg-[#10534f]"
              >
                Explore parking <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/signup?as=operator"
                className="inline-flex h-12 items-center rounded-xl border border-[#d5e2df] bg-white px-5 font-semibold text-[#203238] hover:border-[#8bbdb6]"
              >
                List your parking
              </Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-[#dfe8e5] pt-6">
              <div>
                <p className="text-2xl font-extrabold text-[#203238]">Kigali</p>
                <p className="mt-1 text-xs text-[#66777a]">
                  First launch market
                </p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#203238]">RWF</p>
                <p className="mt-1 text-xs text-[#66777a]">Local pricing</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-[#203238]">
                  One flow
                </p>
                <p className="mt-1 text-xs text-[#66777a]">
                  Search to check-in
                </p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[28px] border border-[#dfe8e5] bg-white p-4 shadow-xl shadow-[#234b46]/8 sm:p-5">
              <div className="rounded-2xl bg-[#edf4f2] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#176b67]">
                      Parking discovery
                    </p>
                    <h2 className="mt-1 text-lg font-bold">
                      Near your destination
                    </h2>
                  </div>
                  <span className="grid size-10 place-items-center rounded-xl bg-white text-[#176b67]">
                    <MapPin className="size-5" />
                  </span>
                </div>
                <div className="mt-4 rounded-xl border border-[#dfe8e5] bg-white p-3.5">
                  <div className="flex items-center gap-3">
                    <Search className="size-5 text-[#176b67]" />
                    <div>
                      <p className="text-sm font-semibold">Search Kigali</p>
                      <p className="text-xs text-[#66777a]">
                        Area, destination or parking name
                      </p>
                    </div>
                  </div>
                </div>
                {[
                  [
                    "Availability you can understand",
                    "Freshness and capacity should be confirmed by live backend data.",
                  ],
                  [
                    "A reservation tied to your vehicle",
                    "Your booking, plate and arrival details stay connected.",
                  ],
                  [
                    "Rwanda-ready payments",
                    "Prepare for local payment methods without faking a completed transaction.",
                  ],
                ].map(([title, desc], index) => (
                  <div
                    key={title}
                    className="mt-3 flex gap-3 rounded-xl border border-[#dfe8e5] bg-white p-3.5"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#edf7f4] text-[#176b67]">
                      {index === 0 ? (
                        <Clock3 className="size-4" />
                      ) : index === 1 ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <WalletCards className="size-4" />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-[#66777a]">
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-4 -left-3 hidden items-center gap-2 rounded-xl border border-[#dfe8e5] bg-white px-4 py-3 shadow-lg sm:flex">
              <BadgeCheck className="size-5 text-[#176b67]" />
              <span className="text-sm font-semibold">
                Verified when confirmed
              </span>
            </div>
          </div>
        </section>
        <section id="how" className="border-y border-[#dfe8e5] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-[#176b67]">
                How it works
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                From search to parked in four steps
              </h2>
              <p className="mt-3 text-[#66777a]">
                Designed around the real steps that make a parking reservation
                trustworthy.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "01",
                  "Find",
                  "Compare parking by location and the information the operator provides.",
                ],
                [
                  "02",
                  "Reserve",
                  "Choose your vehicle and arrival window for a reservation.",
                ],
                [
                  "03",
                  "Pay",
                  "See a clear payment state; success is only shown when confirmed by the API/provider.",
                ],
                [
                  "04",
                  "Arrive",
                  "Use reservation details for check-in and check-out.",
                ],
              ].map(([n, title, desc]) => (
                <article
                  key={n}
                  className="rounded-2xl border border-[#dfe8e5] p-5"
                >
                  <span className="text-sm font-bold text-[#176b67]">{n}</span>
                  <h3 className="mt-3 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#66777a]">
                    {desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="trust" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 className="text-3xl font-bold">
            One network, different workspaces
          </h2>
          <p className="mt-3 max-w-2xl text-[#66777a]">
            Each role should see only the operations it is allowed to perform.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map(({ title, desc, icon: Icon, href }) => (
              <Link
                to={href}
                key={title}
                className="group rounded-2xl border border-[#dfe8e5] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#9ccbc3] hover:shadow-lg"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-[#edf7f4] text-[#176b67]">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 flex items-center gap-2 font-bold">
                  {title}
                  <ArrowRight className="size-4 text-[#176b67] transition group-hover:translate-x-1" />
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#66777a]">{desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-[#dfe8e5] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-sm text-[#66777a] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p>Rwanda-first parking network · Kigali</p>
          <p>ParkShare · 2026</p>
        </div>
      </footer>
    </div>
  );
}
