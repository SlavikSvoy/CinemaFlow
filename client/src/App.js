import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import HomePage from "./pages/HomePage";
import MoviesPage from "./pages/MoviesPage";
import SessionsPage from "./pages/SessionsPage";
import BookingPage from "./pages/BookingPage";
import TicketPage from "./pages/TicketPage";
import TicketScannerPage from "./pages/TicketScannerPage";
import HallControlPage from "./pages/HallControlPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import StaffLoginPage from "./pages/StaffLoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AboutPage from "./pages/AboutPage";

export default function App() {
  const role = localStorage.getItem("role");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const logout = () => {
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  return (
    <BrowserRouter>
      <header className="site-header">
        <Link to="/" className="logo-box" onClick={closeMobileMenu}>
          CinemaFlow
        </Link>

        <nav className="main-menu">
          <Link to="/">Головна</Link>
          <Link to="/movies">Фільми</Link>
          <Link to="/sessions">Сеанси</Link>
          <Link to="/about">Про нас</Link>
        </nav>

        <div className="header-actions">
          <Link to="/ticket" className="staff-link">
            🎫 Квиток
          </Link>

          <Link to="/" className="icon-button">
            🔍
          </Link>

          {!role && (
            <Link to="/login" className="icon-button">
              👤
            </Link>
          )}

          {role === "controller" && (
            <>
              <Link to="/scanner" className="staff-link">
                📷 Сканер
              </Link>
              <Link to="/controller" className="staff-link">
                👮 Контроль
              </Link>
            </>
          )}

          {role === "admin" && (
            <Link to="/admin" className="staff-link">
              ⚙️ Адмін
            </Link>
          )}

          {role && (
            <button className="nav-button" onClick={logout}>
              Вийти
            </button>
          )}

          <button
            className="icon-button menu-button"
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            ☰
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <Link to="/" onClick={closeMobileMenu}>
              Головна
            </Link>

            <Link to="/movies" onClick={closeMobileMenu}>
              Фільми
            </Link>

            <Link to="/sessions" onClick={closeMobileMenu}>
              Сеанси
            </Link>

            <Link to="/about" onClick={closeMobileMenu}>
              Про нас
            </Link>

            <Link to="/ticket" onClick={closeMobileMenu}>
              🎫 Квиток
            </Link>

            {!role && (
              <Link to="/login" onClick={closeMobileMenu}>
                👤 Вхід
              </Link>
            )}

            {role === "controller" && (
              <>
                <Link to="/scanner" onClick={closeMobileMenu}>
                  📷 Сканер
                </Link>

                <Link to="/controller" onClick={closeMobileMenu}>
                  👮 Контроль
                </Link>
              </>
            )}

            {role === "admin" && (
              <Link to="/admin" onClick={closeMobileMenu}>
                ⚙️ Адмін
              </Link>
            )}

            {role && (
              <button className="mobile-logout-button" onClick={logout}>
                Вийти
              </button>
            )}
          </div>
        )}
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/booking/movie/:movieId" element={<BookingPage />} />
        <Route path="/ticket" element={<TicketPage />} />
        <Route path="/login" element={<StaffLoginPage />} />
        <Route path="/about" element={<AboutPage />} />

        <Route
          path="/scanner"
          element={
            <ProtectedRoute allowedRoles={["controller"]}>
              <TicketScannerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/controller"
          element={
            <ProtectedRoute allowedRoles={["controller"]}>
              <HallControlPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPanelPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
