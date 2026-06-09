const router = require("express").Router();
const pool = require("../db");
const QRCode = require("qrcode");
const crypto = require("crypto");

router.post("/", async (req, res) => {
  const { session_id, seat_number, email } = req.body;

  if (!session_id || !seat_number || !email) {
    return res.status(400).json({
      message: "Необхідно вказати сеанс, місце та електронну пошту",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Некоректний формат електронної пошти",
    });
  }

  try {
    const exists = await pool.query(
      "SELECT * FROM bookings WHERE session_id = $1 AND seat_number = $2",
      [session_id, seat_number],
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "❌ Місце вже зайняте" });
    }

    const result = await pool.query(
      `
      INSERT INTO bookings (session_id, seat_number, email)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [session_id, seat_number, email.trim()],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Помилка створення бронювання" });
  }
});

router.get("/:id/qr", async (req, res) => {
  try {
    const ticketId = req.params.id;
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({
        message: "Для отримання квитка потрібно вказати електронну пошту",
      });
    }

    const ticket = await pool.query(
      `
      SELECT 
        bookings.id,
        bookings.session_id,
        bookings.seat_number,
        bookings.email,
        bookings.is_used,
        sessions.show_time,
        movies.title,
        halls.name AS hall_name
      FROM bookings
      JOIN sessions ON bookings.session_id = sessions.id
      JOIN movies ON sessions.movie_id = movies.id
      JOIN halls ON sessions.hall_id = halls.id
      WHERE bookings.id = $1
      `,
      [ticketId],
    );

    if (ticket.rows.length === 0) {
      return res.status(404).json({ message: "Квиток не знайдено" });
    }

    const data = ticket.rows[0];

    if (String(data.email).toLowerCase() !== String(email).toLowerCase()) {
      return res.status(403).json({
        message: "Вказана електронна пошта не відповідає цьому квитку",
      });
    }

    const payload = {
      ticket_id: data.id,
      session_id: data.session_id,
      seat: data.seat_number,
      hash: crypto
        .createHash("sha256")
        .update(data.id + "SECRET_KEY")
        .digest("hex"),
    };

    const qr = await QRCode.toDataURL(JSON.stringify(payload));

    res.json({
      ticket: data,
      qr,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Помилка генерації QR" });
  }
});

router.get("/session/:sessionId/seats", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT seat_number
      FROM bookings
      WHERE session_id = $1
      `,
      [sessionId],
    );

    const occupiedSeats = result.rows.map((row) => row.seat_number);
    res.json(occupiedSeats);
  } catch (err) {
    console.error("Помилка отримання місць:", err);
    res.status(500).json({ error: "Помилка отримання зайнятих місць" });
  }
});

module.exports = router;
