import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../index.css";

const TOTAL_SEATS = 24;

const getHallBadge = (hallName) => {
  if (hallName?.includes("4DX")) return "💨 4DX";
  if (hallName?.includes("3D")) return "🕶 3D";
  return "🎥 2D";
};

const getHallClass = (hallName) => {
  if (hallName?.includes("4DX")) return "hall-4dx";
  if (hallName?.includes("3D")) return "hall-3d";
  return "hall-2d";
};

const getAvailabilityStatus = (freeSeats) => {
  if (freeSeats <= 0) {
    return {
      text: "Місць немає",
      className: "availability-red",
    };
  }

  if (freeSeats <= 6) {
    return {
      text: "Мало місць",
      className: "availability-yellow",
    };
  }

  return {
    text: "Є місця",
    className: "availability-green",
  };
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [occupiedSeatsBySession, setOccupiedSeatsBySession] = useState({});
  const [search, setSearch] = useState("");
  const [hallFilter, setHallFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const loadSessions = async () => {
      const res = await api.get("/sessions");
      const sessionsData = res.data;
      setSessions(sessionsData);

      const occupiedData = {};

      await Promise.all(
        sessionsData.map(async (session) => {
          try {
            const occupiedRes = await api.get(
              `/bookings/session/${session.id}/seats`,
            );

            occupiedData[session.id] = occupiedRes.data.length;
          } catch {
            occupiedData[session.id] = 0;
          }
        }),
      );

      setOccupiedSeatsBySession(occupiedData);
    };

    loadSessions();
  }, []);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort(
      (a, b) => new Date(a.show_time) - new Date(b.show_time),
    );
  }, [sessions]);

  const nearestSession = sortedSessions[0];

  const filteredSessions = sortedSessions.filter((session) => {
    const matchesSearch = session.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesHall =
      hallFilter === "all" ||
      (hallFilter === "2d" && session.hall_name?.includes("2D")) ||
      (hallFilter === "3d" && session.hall_name?.includes("3D")) ||
      (hallFilter === "4dx" && session.hall_name?.includes("4DX"));

    const sessionDate = new Date(session.show_time).toISOString().split("T")[0];

    const matchesDate = !dateFilter || sessionDate === dateFilter;

    return matchesSearch && matchesHall && matchesDate;
  });

  const formatDate = (value) => {
    return new Date(value).toLocaleDateString("uk-UA");
  };

  const formatTime = (value) => {
    return new Date(value).toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="sessions-page">
      <section className="sessions-hero">
        <p className="scanner-label">CinemaFlow Schedule</p>
        <h1>Розклад сеансів</h1>
        <p>
          Переглядайте актуальний розклад показів, фільтруйте сеанси за датою,
          залом або назвою фільму та переходьте до бронювання місць.
        </p>
      </section>

      {nearestSession && (
        <section className="nearest-session-highlight">
          <div className="nearest-session-text">
            <p className="scanner-label">Найближчий сеанс</p>
            <h2>{nearestSession.title}</h2>

            <div className="nearest-session-meta">
              <span>📅 {formatDate(nearestSession.show_time)}</span>
              <span>🕒 {formatTime(nearestSession.show_time)}</span>
              <span>🏛 {nearestSession.hall_name}</span>
              <span
                className={`hall-badge ${getHallClass(
                  nearestSession.hall_name,
                )}`}
              >
                {getHallBadge(nearestSession.hall_name)}
              </span>
            </div>

            <Link to={`/booking/movie/${nearestSession.movie_id}`}>
              <button className="button nearest-session-button">
                Забронювати місце
              </button>
            </Link>
          </div>

          <img
            src={
              nearestSession.poster_url ||
              "https://via.placeholder.com/300x450?text=CinemaFlow"
            }
            alt={nearestSession.title}
            className="nearest-session-poster"
          />
        </section>
      )}

      <section className="container">
        <div className="sessions-filters">
          <input
            className="input"
            placeholder="Пошук фільму..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <input
            className="input"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          <select
            className="input"
            value={hallFilter}
            onChange={(e) => setHallFilter(e.target.value)}
          >
            <option value="all">Усі зали</option>
            <option value="2d">🎥 2D</option>
            <option value="3d">🕶 3D</option>
            <option value="4dx">💨 4DX</option>
          </select>
        </div>

        <div className="sessions-cards-list">
          {filteredSessions.map((session) => {
            const occupiedSeats = occupiedSeatsBySession[session.id] || 0;
            const freeSeats = TOTAL_SEATS - occupiedSeats;
            const availability = getAvailabilityStatus(freeSeats);

            return (
              <div className="session-card-modern" key={session.id}>
                <img
                  src={
                    session.poster_url ||
                    "https://via.placeholder.com/300x450?text=CinemaFlow"
                  }
                  alt={session.title}
                  className="session-card-poster"
                />

                <div className="session-card-content">
                  <div className="session-card-top">
                    <div>
                      <span
                        className={`hall-badge ${getHallClass(
                          session.hall_name,
                        )}`}
                      >
                        {getHallBadge(session.hall_name)}
                      </span>

                      <h3>{session.title}</h3>
                    </div>

                    <span
                      className={`availability-badge ${availability.className}`}
                    >
                      {availability.text}
                    </span>
                  </div>

                  <div className="session-card-details">
                    <div>
                      <p>Дата</p>
                      <strong>📅 {formatDate(session.show_time)}</strong>
                    </div>

                    <div>
                      <p>Час</p>
                      <strong>🕒 {formatTime(session.show_time)}</strong>
                    </div>

                    <div>
                      <p>Зал</p>
                      <strong>🏛 {session.hall_name}</strong>
                    </div>

                    <div>
                      <p>Тривалість</p>
                      <strong>⏱ {session.duration || "—"} хв</strong>
                    </div>
                  </div>

                  <div className="session-seat-info">
                    <div className="seat-progress-top">
                      <span>Вільно місць</span>
                      <strong>
                        {freeSeats} / {TOTAL_SEATS}
                      </strong>
                    </div>

                    <div className="seat-progress-line">
                      <div
                        className="seat-progress-fill"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, (freeSeats / TOTAL_SEATS) * 100),
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <Link to={`/booking/movie/${session.movie_id}`}>
                    <button
                      className="button"
                      disabled={freeSeats <= 0}
                      title={freeSeats <= 0 ? "Усі місця зайняті" : ""}
                    >
                      {freeSeats <= 0 ? "Місць немає" : "Обрати місце"}
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSessions.length === 0 && (
          <div className="empty-result sessions-empty">
            <div className="empty-icon">🕒</div>
            <p>Сеансів за вашим запитом не знайдено.</p>
          </div>
        )}
      </section>
    </main>
  );
}
