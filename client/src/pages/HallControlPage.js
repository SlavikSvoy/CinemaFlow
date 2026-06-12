import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../index.css";

export default function HallControlPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [hallData, setHallData] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingHall, setLoadingHall] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (!selectedSessionId) return;

    const interval = setInterval(() => {
      loadHallData(selectedSessionId, true);
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedSessionId]);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      setError("");

      const res = await api.get("/sessions");
      setSessions(res.data);
    } catch (err) {
      console.error(err);
      setError("Не вдалося завантажити список сеансів.");
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadHallData = async (sessionId, silent = false) => {
    if (!sessionId) {
      setHallData(null);
      return;
    }

    try {
      if (!silent) setLoadingHall(true);
      setError("");

      const res = await api.get(`/checkin/hall/${sessionId}`);
      setHallData(res.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
      setError("Не вдалося завантажити інформацію про зал.");
    } finally {
      if (!silent) setLoadingHall(false);
    }
  };

  const handleSelect = async (e) => {
    const sessionId = e.target.value;
    setSelectedSessionId(sessionId);
    setHallData(null);
    await loadHallData(sessionId);
  };

  const selectedSession = sessions.find(
    (s) => String(s.id) === String(selectedSessionId)
  );

  const bookings = hallData?.bookings || [];
  const sold = Number(hallData?.sold || 0);
  const checked = Number(hallData?.checked || 0);
  const waiting = Number(hallData?.difference || Math.max(sold - checked, 0));
  const percent = sold > 0 ? Math.round((checked / sold) * 100) : 0;

  const checkedPeople = bookings.filter((booking) => booking.checked_in);
  const waitingPeople = bookings.filter((booking) => !booking.checked_in);

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBuyerName = (booking) => {
    return (
      booking.customer_name ||
      booking.customer_email ||
      `Бронювання №${booking.id}`
    );
  };

  const buildHallSeats = () => {
    const capacity = Number(hallData?.session?.capacity || 100);
    const hasLetterSeats = bookings.some((booking) =>
      /[A-Za-zА-Яа-я]/.test(String(booking.seat_number || ""))
    );

    const seatsPerRow = hasLetterSeats ? 10 : 10;
    const rowsCount = Math.ceil(capacity / seatsPerRow);

    const bookingMap = new Map();

    bookings.forEach((booking) => {
      bookingMap.set(String(booking.seat_number), booking);
    });

    const rows = [];
    let seatCounter = 1;

    for (let rowIndex = 0; rowIndex < rowsCount; rowIndex++) {
      const row = [];

      for (let seatIndex = 1; seatIndex <= seatsPerRow; seatIndex++) {
        if (seatCounter > capacity) break;

        const rowLetter = String.fromCharCode(65 + rowIndex);
        const seatLabel = hasLetterSeats
          ? `${rowLetter}${seatIndex}`
          : String(seatCounter);

        const booking = bookingMap.get(seatLabel);

        row.push({
          label: seatLabel,
          booking,
          status: !booking
            ? "free"
            : booking.checked_in
              ? "checked"
              : "waiting",
        });

        seatCounter++;
      }

      rows.push(row);
    }

    return rows;
  };

  const hallRows = hallData ? buildHallSeats() : [];

  return (
    <div className="hall-control-page">
      <div className="container hall-control-container">
        <div className="hall-control-hero">
          <div>
            <p className="hall-control-label">Панель контролера</p>
            <h2>👮 Контроль залу</h2>
            <p>
              Оберіть сеанс, щоб переглянути продані місця, відвідувачів, які
              вже пройшли QR-контроль, та тих, хто купив квиток, але ще не
              зайшов до залу.
            </p>
          </div>

          <div className="hall-control-live">
            <span className="pulse-dot"></span>
            <div>
              <strong>Live-контроль</strong>
              <p>Дані оновлюються автоматично кожні 15 секунд</p>
            </div>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="hall-control-panel">
          <div className="hall-control-select-card">
            <label>Сеанс для контролю</label>

            <select
              className="input hall-control-select"
              value={selectedSessionId}
              onChange={handleSelect}
              disabled={loadingSessions}
            >
              <option value="">
                {loadingSessions ? "Завантаження сеансів..." : "Оберіть сеанс"}
              </option>

              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} — {s.hall_name} — {formatDate(s.show_time)}
                </option>
              ))}
            </select>
          </div>

          <button
            className="button hall-refresh-button"
            onClick={() => loadHallData(selectedSessionId)}
            disabled={!selectedSessionId || loadingHall}
          >
            {loadingHall ? "Оновлення..." : "Оновити"}
          </button>
        </div>

        {!selectedSession && (
          <div className="hall-empty-card">
            <div className="hall-empty-icon">🎬</div>
            <h3>Оберіть сеанс</h3>
            <p>
              Після вибору сеансу система покаже схему залу, продані місця,
              відвідувачів, які вже сидять, та тих, хто ще не пройшов контроль.
            </p>
          </div>
        )}

        {hallData && (
          <>
            <div className="hall-session-card">
              <div>
                <p className="hall-card-label">Обраний сеанс</p>
                <h3>{hallData.session.title}</h3>
              </div>

              <div className="hall-session-info">
                <span>🏛 {hallData.session.hall_name}</span>
                <span>🕒 {formatDate(hallData.session.show_time)}</span>
              </div>
            </div>

            <div className="hall-stats-grid">
              <div className="hall-stat-card">
                <p>🎟 Продано</p>
                <strong>{sold}</strong>
                <span>квитків</span>
              </div>

              <div className="hall-stat-card checked">
                <p>✅ Сидять</p>
                <strong>{checked}</strong>
                <span>пройшли QR-контроль</span>
              </div>

              <div className="hall-stat-card waiting">
                <p>⏳ Не зайшли</p>
                <strong>{waiting}</strong>
                <span>купили, але ще не сидять</span>
              </div>

              <div className="hall-stat-card percent">
                <p>📊 Заповненість</p>
                <strong>{percent}%</strong>
                <span>від проданих квитків</span>
              </div>
            </div>

            <div className="hall-progress-card">
              <div className="hall-progress-top">
                <span>Фактична присутність у залі</span>
                <strong>
                  {checked} / {sold}
                </strong>
              </div>

              <div className="hall-progress-line">
                <div
                  className="hall-progress-fill"
                  style={{ width: `${Math.min(percent, 100)}%` }}
                ></div>
              </div>

              <div className="hall-progress-footer">
                <span>
                  {waiting > 0
                    ? `Очікується ще ${waiting} відвідувачів`
                    : "Усі продані квитки вже перевірено"}
                </span>

                {lastUpdate && (
                  <span>Оновлено: {lastUpdate.toLocaleTimeString("uk-UA")}</span>
                )}
              </div>
            </div>

            <div className="hall-visual-card">
              <div className="hall-visual-header">
                <div>
                  <p className="hall-card-label">Схема залу</p>
                  <h3>Вигляд місць</h3>
                </div>

                <div className="hall-legend">
                  <span>
                    <i className="legend-seat free"></i> Вільне
                  </span>
                  <span>
                    <i className="legend-seat waiting"></i> Куплено, не сидить
                  </span>
                  <span>
                    <i className="legend-seat checked"></i> Уже сидить
                  </span>
                </div>
              </div>

              <div className="hall-screen">ЕКРАН</div>

              <div className="hall-seats-map">
                {hallRows.map((row, rowIndex) => (
                  <div className="hall-seat-row" key={rowIndex}>
                    <span className="hall-row-label">
                      {String.fromCharCode(65 + rowIndex)}
                    </span>

                    {row.map((seat) => (
                      <button
                        key={seat.label}
                        className={`hall-seat ${seat.status}`}
                        title={
                          seat.booking
                            ? `${seat.label}: ${getBuyerName(seat.booking)}`
                            : `${seat.label}: вільне місце`
                        }
                      >
                        {seat.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="hall-people-grid">
              <div className="hall-people-card">
                <div className="hall-people-header checked">
                  <h3>✅ Уже сидять</h3>
                  <span>{checkedPeople.length}</span>
                </div>

                {checkedPeople.length === 0 ? (
                  <p className="hall-list-empty">
                    Ще ніхто не пройшов контроль.
                  </p>
                ) : (
                  <div className="hall-people-list">
                    {checkedPeople.map((booking) => (
                      <div className="hall-person-item checked" key={booking.id}>
                        <strong>Місце {booking.seat_number}</strong>
                        <p>{getBuyerName(booking)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="hall-people-card">
                <div className="hall-people-header waiting">
                  <h3>⏳ Купили, але ще не сидять</h3>
                  <span>{waitingPeople.length}</span>
                </div>

                {waitingPeople.length === 0 ? (
                  <p className="hall-list-empty">
                    Немає відвідувачів, які очікуються.
                  </p>
                ) : (
                  <div className="hall-people-list">
                    {waitingPeople.map((booking) => (
                      <div className="hall-person-item waiting" key={booking.id}>
                        <strong>Місце {booking.seat_number}</strong>
                        <p>{getBuyerName(booking)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="hall-actions">
              <Link to="/scanner" className="button hall-action-link">
                Перейти до QR-сканера
              </Link>

              <button
                className="button hall-secondary-button"
                onClick={() => loadHallData(selectedSessionId)}
              >
                Повторно перевірити зал
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
