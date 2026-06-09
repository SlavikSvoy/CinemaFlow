import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../services/api";
import "../index.css";

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const processingRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 5,
      qrbox: {
        width: 260,
        height: 260,
      },
    });

    scanner.render(
      async (text) => {
        if (processingRef.current) return;

        processingRef.current = true;
        setIsLoading(true);
        setScanError("");

        try {
          const data = JSON.parse(text);

          const res = await api.post("/checkin", {
            ticket_id: data.ticket_id,
            session_id: data.session_id,
            seat: data.seat,
            hash: data.hash,
          });

          setScanResult({
            status: "success",
            message: res.data.message || "✅ Вхід дозволено",
            ticket: res.data.ticket,
            stats: res.data.stats,
          });
        } catch (err) {
          setScanResult({
            status: "error",
            message: err.response?.data?.error || "❌ QR-квиток недійсний",
            ticket: err.response?.data?.ticket || null,
            stats: err.response?.data?.stats || null,
          });

          setScanError(err.response?.data?.error || "❌ QR-квиток недійсний");
        } finally {
          setIsLoading(false);

          setTimeout(() => {
            processingRef.current = false;
          }, 2000);
        }
      },
      () => {},
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  const formatDateTime = (value) => {
    if (!value) return "Не вказано";
    return new Date(value).toLocaleString();
  };

  const formatTime = (value) => {
    if (!value) return "Не вказано";

    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const ticket = scanResult?.ticket;
  const stats = scanResult?.stats;

  return (
    <div className="scanner-page">
      <section className="scanner-hero">
        <div>
          <p className="scanner-label">CinemaFlow Control</p>
          <h1>Сканування QR-квитків</h1>
          <p>
            Наведіть камеру на QR-код відвідувача. Після перевірки система
            автоматично покаже інформацію про квиток, сеанс та заповненість
            кінозалу.
          </p>
        </div>

        <div className="scanner-status-card">
          <span className="pulse-dot"></span>
          <p>Модуль контролера активний</p>
        </div>
      </section>

      <section className="scanner-layout">
        <div className="scanner-card">
          <div className="scanner-card-header">
            <h2>📷 Сканер квитка</h2>
            <span>{isLoading ? "Перевірка..." : "Готово до сканування"}</span>
          </div>

          <div className="scanner-box">
            <div id="reader"></div>
          </div>

          <p className="scanner-hint">
            Після успішного сканування квиток буде автоматично позначений як
            використаний.
          </p>
        </div>

        <div className="scanner-card result-panel">
          <h2>Результат перевірки</h2>

          {!scanResult && (
            <div className="empty-result">
              <div className="empty-icon">🎫</div>
              <p>Дані з’являться після сканування QR-квитка.</p>
            </div>
          )}

          {scanResult && (
            <>
              <div
                className={
                  scanResult.status === "success"
                    ? "scan-result success"
                    : "scan-result danger"
                }
              >
                <h3>{scanResult.message}</h3>
                {scanError && <p>{scanError}</p>}
              </div>

              {ticket && (
                <div className="ticket-check-info">
                  <div className="info-block main-ticket-info">
                    <p className="info-label">Фільм</p>
                    <h3>{ticket.title}</h3>
                    <span className="age-badge">{ticket.age_rating}</span>
                  </div>

                  <div className="info-grid">
                    <div className="info-block">
                      <p className="info-label">Категорія</p>
                      <strong>{ticket.category}</strong>
                    </div>

                    <div className="info-block">
                      <p className="info-label">Зал</p>
                      <strong>{ticket.hall_name}</strong>
                    </div>

                    <div className="info-block">
                      <p className="info-label">Місце</p>
                      <strong>{ticket.seat_number}</strong>
                    </div>

                    <div className="info-block">
                      <p className="info-label">ID квитка</p>
                      <strong>#{ticket.id}</strong>
                    </div>

                    <div className="info-block">
                      <p className="info-label">Початок</p>
                      <strong>{formatTime(ticket.show_time)}</strong>
                    </div>

                    <div className="info-block">
                      <p className="info-label">Кінець</p>
                      <strong>{formatTime(ticket.end_time)}</strong>
                    </div>
                  </div>

                  <div className="full-date">
                    <p>Дата та час сеансу</p>
                    <strong>{formatDateTime(ticket.show_time)}</strong>
                  </div>
                </div>
              )}

              {stats && (
                <div className="hall-stats-panel">
                  <h3>Статистика залу</h3>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <p>Купили квитків</p>
                      <strong>{stats.sold}</strong>
                    </div>

                    <div className="stat-card">
                      <p>Реально пройшло</p>
                      <strong>{stats.checked}</strong>
                    </div>

                    <div className="stat-card difference">
                      <p>Різниця</p>
                      <strong>{stats.difference}</strong>
                    </div>
                  </div>

                  <div className="progress-wrapper">
                    <div className="progress-top">
                      <span>Заповненість за проходом</span>
                      <span>
                        {stats.sold > 0
                          ? Math.round((stats.checked / stats.sold) * 100)
                          : 0}
                        %
                      </span>
                    </div>

                    <div className="progress-line">
                      <div
                        className="progress-fill"
                        style={{
                          width:
                            stats.sold > 0
                              ? `${Math.min(
                                  100,
                                  Math.round(
                                    (stats.checked / stats.sold) * 100,
                                  ),
                                )}%`
                              : "0%",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
