import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { DriverLayout, OperatorLayout, PublicLayout, SignedInLayout } from "./components/layouts";
import LandingPage from "./pages/LandingPage";
import { ForgotPasswordPage, LoginPage, NotFound, SignupPage, VerifyPage } from "./pages/AuthPages";
import DriverHome from "./pages/driver/DriverHome";
import FindParking from "./pages/driver/FindParking";
import ParkingDetail from "./pages/driver/ParkingDetail";
import ReserveParking from "./pages/driver/ReserveParking";
import Bookings from "./pages/driver/Bookings";
import ReceiptPage from "./pages/driver/ReceiptPage";
import ActiveParking from "./pages/driver/ActiveParking";
import Profile from "./pages/driver/Profile";
import Vehicles from "./pages/driver/Vehicles";
import { EventDetail, Events } from "./pages/driver/Events";
import OperatorOverview from "./pages/operator/OperatorOverview";
import OperatorLots from "./pages/operator/OperatorLots";
import OperatorReservations from "./pages/operator/OperatorReservations";
import Gate from "./pages/operator/Gate";
import Admin from "./pages/operator/Admin";

/** Old Vite URL /driver/book/:lotId now lives at /driver/parking/:id/reserve. */
function LegacyBookRedirect() {
  const { lotId } = useParams();
  return <Navigate to={`/driver/parking/${lotId}/reserve`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route element={<SignedInLayout />}>
          <Route path="verify" element={<VerifyPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="driver" element={<DriverLayout />}>
        <Route index element={<DriverHome />} />
        <Route path="find" element={<FindParking />} />
        <Route path="parking/:id" element={<ParkingDetail />} />
        <Route path="parking/:id/reserve" element={<ReserveParking />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id/receipt" element={<ReceiptPage />} />
        <Route path="active" element={<ActiveParking />} />
        <Route path="profile" element={<Profile />} />
        <Route path="vehicles" element={<Vehicles />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="book/:lotId" element={<LegacyBookRedirect />} />
        <Route path="reservations" element={<Navigate to="/driver/bookings" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="operator" element={<OperatorLayout />}>
        <Route index element={<OperatorOverview />} />
        <Route path="lots" element={<OperatorLots />} />
        <Route path="reservations" element={<OperatorReservations />} />
        <Route path="gate" element={<Gate />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
