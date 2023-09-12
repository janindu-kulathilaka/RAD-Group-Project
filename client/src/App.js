import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import Users from "./components/Users";
import Profile from "./components/Profile";
import TermsPage from "./pages/TermsPage";
import { UserContextProvider } from "./components/UserContext";
import { Routes, Route } from "react-router-dom";
import axios from "axios";
import ProfilePage from "./pages/ProfilePage";
import Accommodation from "./components/Accommodation";
import NewAccommodation from "./components/NewAccommodationForm";
import AdminAccommodation from "./components/AdminAccommodation";

axios.defaults.baseURL = "http://localhost:4000/";

axios.defaults.withCredentials = true;

function App() {
  return (
    <UserContextProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/users" element={<Users />} />
        <Route path="/profile/account" element={<Profile />} />
        <Route path="/profile/accommodation" element={<Accommodation />} />
        <Route
          path="/profile/accommodation/new"
          element={<NewAccommodation />}
        />
        <Route
          path="/profile/admin_accommodation"
          element={<AdminAccommodation />}
        />
      </Routes>
    </UserContextProvider>
  );
}

export default App;
