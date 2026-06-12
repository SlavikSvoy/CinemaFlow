import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../index.css";

export default function HallControlPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [stats, setStats] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (!selectedSessionId) return;

    const interval = setInterval(() => {
      loadStats(selectedSessionId, true);
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

  const loadStats = async (sessionId, silent = false) => {
    if (!sessionId) {
      setStats(null);
      return;
    }

    try {
      if (!silent) setLoadingStats(true);
      setError("");

      const res = await api.get(`/checkin/stats/${sessionId}`);
      setStats(res.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
      setError("Не вдалося завантажити статистику залу.");
    } finally {
      if (!silent) setLoadingStats(false);
    }
  };

  const handleSelect = async (e) => {
    const sessionId = e.target.value;
    setSelectedSessionId(sessionId);
    setStats(null);
    await loadStats(sessionId);
  };

  const selectedSession = sessions.find(
    (s) => String(s.id) === String(selectedSessionId)
  );

  const sold = Number(stats?.sold || 0);
  const checked = Number(stats?.checked || 0);
  const expected = Number(stats?.difference || Math.max(sold - checked, 0));
  const percent = sold > 0 ? Math.round((checked / sold) * 100) : 0;

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

  return (
    <div className="hall-control-page">
      <div className="container hall-control-container">
        <div className="hall-control-hero">
          <div>
            <p className="hall-control-label">Панель контролера</p>
            <h2>👮 Контроль залу</h2>
            <p>
              Оберіть сеанс, щоб переглянути кількість проданих квитків,
              перевірених QR-квитків та фактичну заповненість залу.
            </p>
          </div>

          <div className="hall-control-live">
            <span className="pulse-dot"></span>
            <div>
              <strong>Live-режим</strong>
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
            onClick={() => loadStats(selectedSessionId)}
            disabled={!selectedSessionId || loadingStats}
          >
            {loadingStats ? "Оновлення..." : "Оновити дані"}
          </button>
        </div>

        {!selectedSession && (
          <div className="hall-empty-card">
            <div className="hall-empty-icon">🎬</div>
            <h3>Оберіть сеанс</h3>
            <p>
              Після вибору сеансу система покаже інформацію про фільм,
              кількість проданих квитків і кількість відвідувачів, які вже
              пройшли контроль.
            </p>
          </div>
        )}

        {selectedSession && (
          <>
            <div className="hall-session-card">
              <div>
                <p className="hall-card-label">Обраний сеанс</p>
                <h3>{selectedSession.title}</h3>
              </div>

              <div className="hall-session-info">
                <span>🏛 {selectedSession.hall_name}</span>
                <span>🕒 {formatDate(selectedSession.show_time)}</span>
              </div>
            </div>

            {stats && (
              <>
                <div className="hall-stats-grid">
                  <div className="hall-stat-card">
                    <p>🎟 Продано</p>
                    <strong>{sold}</strong>
                    <span>квитків</span>
                  </div>

                  <div className="hall-stat-card checked">
                    <p>👥 Пройшло</p>
                    <strong>{checked}</strong>
                    <span>відвідувачів</span>
                  </div>

                  <div className="hall-stat-card waiting">
                    <p>⏳ Очікується</p>
                    <strong>{expected}</strong>
                    <span>ще не пройшли</span>
                  </div>

                  <div className="hall-stat-card percent">
                    <p>📊 Заповненість</p>
                    <strong>{percent}%</strong>
                    <span>від проданих</span>
                  </div>
                </div>

                <div className="hall-progress-card">
                  <div className="hall-progress-top">
                    <span>Фактично пройшли контроль</span>
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
                      {expected > 0
                        ? `Ще очікується ${expected} відвідувачів`
                        : "Усі продані квитки вже перевірено"}
                    </span>

                    {lastUpdate && (
                      <span>Оновлено: {lastUpdate.toLocaleTimeString("uk-UA")}</span>
                    )}
                  </div>
                </div>

                <div className="hall-actions">
                  <Link to="/scanner" className="button hall-action-link">
                    Перейти до QR-сканера
                  </Link>

                  <button
                    className="button hall-secondary-button"
                    onClick={() => loadStats(selectedSessionId)}
                  >
                    Повторно перевірити статистику
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
