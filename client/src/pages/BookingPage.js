import { useParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import "../index.css";
import { generateHallSeats } from "../services/hallLayout";

export default function Booking() {
  const { movieId } = useParams();

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const seatMatrix = generateHallSeats();

  useEffect(() => {
    api.get("/sessions").then((res) => {
      const movieSessions = res.data.filter(
        (s) => String(s.movie_id) === String(movieId),
      );

      setSessions(movieSessions);

      if (movieSessions.length > 0) {
        setSelectedSession(movieSessions[0].id);
      }
    });
  }, [movieId]);

  const loadOccupiedSeats = useCallback(async () => {
    if (!selectedSession) return;

    try {
      const res = await api.get(`/bookings/session/${selectedSession}/seats`);
      setOccupiedSeats(res.data);
    } catch (err) {
      setError("Помилка завантаження зайнятих місць");
    }
  }, [selectedSession]);

  useEffect(() => {
    loadOccupiedSeats();
  }, [loadOccupiedSeats]);

  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const book = async () => {
    if (!selectedSession || !selectedSeat) return;

    if (!email.trim()) {
      setError("Введіть електронну пошту для отримання квитка");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Некоректний формат електронної пошти");
      return;
    }

    try {
      setError("");

      const res = await api.post("/bookings", {
        session_id: selectedSession,
        seat_number: selectedSeat,
        email: email.trim(),
      });

      setTicket(res.data);
      setSelectedSeat(null);
      setEmail("");
      await loadOccupiedSeats();
    } catch (err) {
      setError(err.response?.data?.message || "Помилка бронювання");
    }
  };

  const activeSession = sessions.find(
    (s) => String(s.id) === String(selectedSession),
  );

  return (
    <div className="container">
      <h2>💺 Оберіть сеанс і місце</h2>

      {activeSession && (
        <div className="booking-movie-info">
          <h3>{activeSession.title}</h3>
          <p>🏛 {activeSession.hall_name}</p>
        </div>
      )}

      <div className="session-picker">
        {sessions.map((s) => (
          <button
            key={s.id}
            className={`session-time-button ${
              String(selectedSession) === String(s.id) ? "active" : ""
            }`}
            onClick={() => {
              setSelectedSession(s.id);
              setSelectedSeat(null);
              setTicket(null);
              setEmail("");
              setError("");
            }}
          >
            🕒{" "}
            {new Date(s.show_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            <span>{s.hall_name}</span>
          </button>
        ))}
      </div>

      <div className="screen">ЕКРАН</div>

      <div className="seats-layout">
        {seatMatrix.map((rowSeats) => (
          <div key={rowSeats[0].row} className="row">
            {rowSeats.map((seat) => {
              const seatLabel = seat.label;
              const isOccupied = occupiedSeats.includes(seatLabel);
              const isSelected = selectedSeat === seatLabel;

              return (
                <div
                  key={seatLabel}
                  className={`seat ${isSelected ? "selected" : ""} ${
                    isOccupied ? "occupied" : ""
                  }`}
                  onClick={() => {
                    if (!isOccupied) {
                      setSelectedSeat(seatLabel);
                      setTicket(null);
                      setError("");
                    }
                  }}
                >
                  {seatLabel}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="legend">
        <span className="legend-item free"></span> Вільне
        <span className="legend-item selected-box"></span> Обране
        <span className="legend-item occupied-box"></span> Зайняте
      </div>

      {selectedSeat && (
        <div className="card">
          <h3>Оформлення квитка</h3>
          <p>💺 Обране місце: {selectedSeat}</p>

          <input
            className="input"
            type="email"
            placeholder="Email для отримання квитка"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />

          <button className="button" onClick={book}>
            🎟 Забронювати
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {ticket && (
        <div className="card success-card">
          <p>✅ Місце успішно заброньовано</p>
          <p>🎟 ID квитка: {ticket.id}</p>
          <p>💺 Місце: {ticket.seat_number}</p>
          <p>📧 Квиток підготовлено для надсилання на: {ticket.email}</p>
          <p>Тепер перейдіть у вкладку 🎫 та введіть ID квитка.</p>
        </div>
      )}
    </div>
  );
}
