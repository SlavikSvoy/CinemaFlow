import { useState } from "react";
import api from "../services/api";
import "../index.css";

export default function Ticket() {
  const [ticketId, setTicketId] = useState("");
  const [email, setEmail] = useState("");
  const [ticket, setTicket] = useState(null);
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");

  const isValidEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const getTicket = async () => {
    setError("");
    setTicket(null);
    setQr("");

    if (!ticketId.trim()) {
      setError("Введіть ID квитка");
      return;
    }

    if (!email.trim()) {
      setError("Введіть електронну пошту, яку ви вказували при бронюванні");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Некоректний формат електронної пошти");
      return;
    }

    try {
      const res = await api.get(
        `/bookings/${ticketId.trim()}/qr?email=${encodeURIComponent(
          email.trim(),
        )}`,
      );

      setTicket(res.data.ticket);
      setQr(res.data.qr);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Помилка отримання квитка",
      );
    }
  };

  return (
    <div className="ticket-page">
      <section className="ticket-hero">
        <div>
          <p className="scanner-label">CinemaFlow Ticket</p>
          <h1>Отримання електронного квитка</h1>
          <p>
            Для перегляду QR-квитка введіть ID квитка та e-mail, який був
            вказаний під час бронювання.
          </p>
        </div>
      </section>

      <div className="ticket-access-card">
        <h2>🎫 Пошук квитка</h2>

        <input
          className="input"
          placeholder="ID квитка"
          value={ticketId}
          onChange={(e) => {
            setTicketId(e.target.value);
            setError("");
          }}
        />

        <input
          className="input"
          type="email"
          placeholder="E-mail, вказаний при бронюванні"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
        />

        <button className="button" onClick={getTicket}>
          Показати QR-квиток
        </button>

        {error && <p className="error">{error}</p>}
      </div>

      {ticket && qr && (
        <div className="ticket-card">
          <div className="ticket-left">
            <h2>CinemaFlow</h2>
            <h3>{ticket.title}</h3>

            <div className="ticket-row">
              <p>🕒 Сеанс</p>
              <strong>{new Date(ticket.show_time).toLocaleString()}</strong>
            </div>

            <div className="ticket-row">
              <p>🏛 Зал</p>
              <strong>{ticket.hall_name}</strong>
            </div>

            <div className="ticket-row">
              <p>💺 Місце</p>
              <strong>{ticket.seat_number}</strong>
            </div>

            <div className="ticket-row">
              <p>🎟 ID квитка</p>
              <strong>#{ticket.id}</strong>
            </div>

            <div className="ticket-row">
              <p>📧 E-mail</p>
              <strong>{ticket.email}</strong>
            </div>

            <p className={ticket.is_used ? "ticket-used" : "ticket-valid"}>
              {ticket.is_used
                ? "❌ Квиток вже використано"
                : "✅ Квиток дійсний"}
            </p>
          </div>

          <div className="ticket-right">
            <img src={qr} alt="QR-квиток" />
            <p>Покажіть QR-код контролеру</p>
          </div>
        </div>
      )}
    </div>
  );
}
