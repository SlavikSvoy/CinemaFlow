import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../index.css";
import { generateHallSeats } from "../services/hallLayout";

export default function HallControlPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [controlData, setControlData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const seatMatrix = generateHallSeats();

  const normalizeSeatLabel = (seat) => {
    if (!seat) return "";

    if (typeof seat === "string") {
      return seat;
    }

    if (typeof seat === "number") {
      return String(seat);
    }

    if (seat.seat_number && typeof seat.seat_number === "string") {
      return seat.seat_number;
    }

    if (seat.seatNumber && typeof seat.seatNumber === "string") {
      return seat.seatNumber;
    }

    if (seat.seat && typeof seat.seat === "string") {
      return seat.seat;
    }

    if (seat.label && typeof seat.label === "string") {
      return seat.label;
    }

    if (seat.seat_row && seat.seat_number) {
      return `${seat.seat_row}${seat.seat_number}`;
    }

    if (seat.row && seat.number) {
      return `${seat.row}${seat.number}`;
    }

    return "";
  };

  const getSoldSeats = () => {
    if (!controlData) return [];

    const source =
      controlData.sold_seats ||
      controlData.soldSeats ||
      controlData.booked_seats ||
      controlData.bookedSeats ||
      [];

    return source.map(normalizeSeatLabel).filter(Boolean);
  };

  const getCheckedSeats = () => {
    if (!controlData) return [];

    const source =
      controlData.checked_seats ||
      controlData.checkedSeats ||
      controlData.passed_seats ||
      controlData.passedSeats ||
      controlData.checked_tickets ||
      controlData.checkedTickets ||
      [];

    return source.map(normalizeSeatLabel).filter(Boolean);
  };

  const soldSeats = getSoldSeats();
  const checkedSeats = getCheckedSeats();

  const soldSeatSet = new Set(soldSeats);
  const checkedSeatSet = new Set(checkedSeats);

  const selectedSession = sessions.find(
    (session) => String(session.id) === String(selectedSessionId),
  );

  const soldCount = Number(
    controlData?.sold_count ??
      controlData?.soldCount ??
      soldSeats.length ??
      0,
  );

  const checkedCount = Number(
    controlData?.checked_count ??
      controlData?.checkedCount ??
      checkedSeats.length ??
      0,
  );

  const waitingCount = Math.max(soldCount - checkedCount, 0);
  const progressPercent =
    soldCount > 0 ? Math.round((checkedCount / soldCount) * 100) : 0;

  const loadSessions = async () => {
    try {
      const res = await api.get("/sessions");
      setSessions(res.data);

      if (res.data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(res.data[0].id);
      }
    } catch (err) {
      setMessage("Помилка завантаження сеансів");
    }
  };

  const loadControlData = useCallback(async () => {
    if (!selectedSessionId) return;

    try {
      setLoading(true);
      setMessage("");

      const res = await api.get(`/controller/${selectedSessionId}`);
      setControlData(res.data);
    } catch (err) {
      setControlData(null);
      setMessage(
        err.response?.data?.error ||
          "Помилка завантаження даних контролю залу",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    loadControlData();
  }, [loadControlData]);

  const getSeatStatus = (seatLabel) => {
    if (checkedSeatSet.has(seatLabel)) {
      return "checked";
    }

    if (soldSeatSet.has(seatLabel)) {
      return "sold";
    }

    return "free";
  };

  const getSeatTitle = (seatLabel) => {
    const status = getSeatStatus(seatLabel);

    if (status === "checked") {
      return `${seatLabel}: відвідувач уже пройшов контроль`;
    }

    if (status === "sold") {
      return `${seatLabel}: квиток куплено, але відвідувач ще не пройшов`;
    }

    return `${seatLabel}: вільне місце`;
  };

  return (
    <div className="container">
      <h2>👮 Контроль залу</h2>

      <div className="admin-card">
        <h3>🎬 Оберіть сеанс</h3>

        <select
          className="input"
          value={selectedSessionId}
          onChange={(e) => {
            setSelectedSessionId(e.target.value);
            setControlData(null);
            setMessage("");
          }}
        >
          <option value="">Оберіть сеанс</option>

          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.title} — {session.hall_name} —{" "}
              {new Date(session.show_time).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      {message && <p className="admin-message">{message}</p>}

      {selectedSession && (
        <div className="admin-card">
          <h3>{selectedSession.title}</h3>
          <p>
            🏛 {selectedSession.hall_name} | 🕒{" "}
            {new Date(selectedSession.show_time).toLocaleString()}
          </p>
        </div>
      )}

      <div className="admin-grid">
        <div className="admin-card">
          <h3>🎟 Продано</h3>
          <p className="control-big-number">{soldCount}</p>
        </div>

        <div className="admin-card">
          <h3>✅ Пройшло</h3>
          <p className="control-big-number">{checkedCount}</p>
        </div>

        <div className="admin-card">
          <h3>⏳ Очікується</h3>
          <p className="control-big-number">{waitingCount}</p>
        </div>

        <div className="admin-card">
          <h3>📊 Заповненість</h3>
          <p className="control-big-number">{progressPercent}%</p>
        </div>
      </div>

      <div className="control-progress-card">
        <div className="control-progress-header">
          <span>Фактична присутність у залі</span>
          <span>
            {checkedCount} / {soldCount}
          </span>
        </div>

        <div className="control-progress-track">
          <div
            className="control-progress-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <p>
          {waitingCount === 0
            ? "Усі продані квитки вже перевірено"
            : `Ще очікується відвідувачів: ${waitingCount}`}
        </p>
      </div>

      <div className="control-hall-card">
        <div className="control-hall-header">
          <div>
            <span className="control-section-label">СХЕМА ЗАЛУ</span>
            <h3>Вигляд місць</h3>
          </div>

          <div className="control-legend">
            <span>
              <i className="control-dot free"></i> Вільне
            </span>
            <span>
              <i className="control-dot sold"></i> Куплено, не сидить
            </span>
            <span>
              <i className="control-dot checked"></i> Уже сидить
            </span>
          </div>
        </div>

        <div className="screen">ЕКРАН</div>

        <div className="control-seat-layout">
          {seatMatrix.map((rowSeats) => (
            <div className="control-seat-row" key={rowSeats[0].row}>
              <span className="control-row-label">{rowSeats[0].row}</span>

              {rowSeats.map((seat) => {
                const seatLabel = seat.label;
                const status = getSeatStatus(seatLabel);

                return (
                  <button
                    key={seatLabel}
                    type="button"
                    title={getSeatTitle(seatLabel)}
                    className={`control-seat ${status}`}
                  >
                    {seatLabel}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <h3>✅ Уже сидять</h3>

          {checkedSeats.length > 0 ? (
            <div className="control-seat-list">
              {checkedSeats.map((seat) => (
                <span key={seat} className="control-seat-chip checked">
                  {seat}
                </span>
              ))}
            </div>
          ) : (
            <p>Ще ніхто не пройшов контроль.</p>
          )}
        </div>

        <div className="admin-card">
          <h3>⏳ Купили, але ще не сидять</h3>

          {soldSeats.filter((seat) => !checkedSeatSet.has(seat)).length > 0 ? (
            <div className="control-seat-list">
              {soldSeats
                .filter((seat) => !checkedSeatSet.has(seat))
                .map((seat) => (
                  <span key={seat} className="control-seat-chip sold">
                    {seat}
                  </span>
                ))}
            </div>
          ) : (
            <p>Немає відвідувачів, які очікуються.</p>
          )}
        </div>
      </div>

      <div className="admin-quick-actions">
        <Link to="/scanner" className="button admin-action-link">
          Перейти до QR-сканера
        </Link>

        <button className="button" onClick={loadControlData} disabled={loading}>
          {loading ? "Оновлення..." : "Повторно перевірити зал"}
        </button>
      </div>
    </div>
  );
}
