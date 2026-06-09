const router = require("express").Router();
const pool = require("../db");
const crypto = require("crypto");

const createHash = (ticketId) => {
  return crypto
    .createHash("sha256")
    .update(ticketId + "SECRET_KEY")
    .digest("hex");
};

const getSessionStats = async (sessionId) => {
  const sold = await pool.query(
    "SELECT COUNT(*) FROM bookings WHERE session_id = $1",
    [sessionId],
  );

  const checked = await pool.query(
    "SELECT COUNT(*) FROM check_ins WHERE session_id = $1",
    [sessionId],
  );

  const soldCount = Number(sold.rows[0].count);
  const checkedCount = Number(checked.rows[0].count);

  return {
    sold: soldCount,
    checked: checkedCount,
    difference: soldCount - checkedCount,
  };
};

const getTicketInfo = async (ticketId) => {
  const result = await pool.query(
    `
    SELECT 
      bookings.id,
      bookings.session_id,
      bookings.seat_number,
      bookings.email,
      bookings.is_used,

      sessions.show_time,
      sessions.show_time + (movies.duration || ' minutes')::interval AS end_time,

      movies.title,
      movies.duration,
      COALESCE(movies.category, 'Не вказано') AS category,
      COALESCE(movies.age_rating, '0+') AS age_rating,

      halls.name AS hall_name
    FROM bookings
    JOIN sessions ON bookings.session_id = sessions.id
    JOIN movies ON sessions.movie_id = movies.id
    JOIN halls ON sessions.hall_id = halls.id
    WHERE bookings.id = $1
    `,
    [ticketId],
  );

  return result.rows[0];
};

router.post("/", async (req, res) => {
  const { ticket_id, session_id, seat, hash } = req.body;

  if (!ticket_id || !session_id || !seat || !hash) {
    return res.status(400).json({
      error: "❌ QR-код містить неповні дані",
    });
  }

  try {
    const expectedHash = createHash(ticket_id);

    if (hash !== expectedHash) {
      return res.status(400).json({
        error: "❌ Підроблений QR-код",
      });
    }

    const ticket = await getTicketInfo(ticket_id);

    if (!ticket) {
      return res.status(404).json({
        error: "❌ Квиток не знайдено",
      });
    }

    if (String(ticket.session_id) !== String(session_id)) {
      return res.status(400).json({
        error: "❌ Квиток не відповідає цьому сеансу",
        ticket,
      });
    }

    if (String(ticket.seat_number) !== String(seat)) {
      return res.status(400).json({
        error: "❌ Місце у QR-квитку не збігається з бронюванням",
        ticket,
      });
    }

    const statsBefore = await getSessionStats(ticket.session_id);

    if (ticket.is_used) {
      return res.status(400).json({
        error: "❌ Квиток вже використаний",
        ticket,
        stats: statsBefore,
      });
    }

    const existingCheck = await pool.query(
      "SELECT * FROM check_ins WHERE ticket_id = $1",
      [ticket_id],
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({
        error: "❌ Квиток вже проскановано",
        ticket,
        stats: statsBefore,
      });
    }

    await pool.query("UPDATE bookings SET is_used = TRUE WHERE id = $1", [
      ticket_id,
    ]);

    await pool.query(
      "INSERT INTO check_ins (session_id, ticket_id) VALUES ($1, $2)",
      [ticket.session_id, ticket_id],
    );

    const updatedTicket = {
      ...ticket,
      is_used: true,
    };

    const statsAfter = await getSessionStats(ticket.session_id);

    res.json({
      message: "✅ Вхід дозволено",
      ticket: updatedTicket,
      stats: statsAfter,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Помилка сервера під час перевірки квитка",
    });
  }
});

router.get("/stats/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const stats = await getSessionStats(sessionId);

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Помилка отримання статистики",
    });
  }
});

module.exports = router;
