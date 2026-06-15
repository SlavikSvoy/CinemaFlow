const router = require("express").Router();
const pool = require("../db");

// Отримання статистики контролю залу для конкретного сеансу
// GET /controller/:sessionId
router.get("/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const sessionResult = await pool.query(
      `
      SELECT
        sessions.id,
        sessions.show_time,
        movies.title AS movie_title,
        halls.name AS hall_name
      FROM sessions
      JOIN movies ON sessions.movie_id = movies.id
      JOIN halls ON sessions.hall_id = halls.id
      WHERE sessions.id = $1
      `,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        error: "Сеанс не знайдено",
      });
    }

    const soldResult = await pool.query(
      `
      SELECT COUNT(*) AS sold_count
      FROM bookings
      WHERE session_id = $1
      `,
      [sessionId]
    );

    const checkedResult = await pool.query(
      `
      SELECT COUNT(*) AS checked_count
      FROM check_ins
      WHERE session_id = $1
      `,
      [sessionId]
    );

    const soldSeatsResult = await pool.query(
      `
      SELECT seat_row, seat_number
      FROM bookings
      WHERE session_id = $1
      `,
      [sessionId]
    );

    const checkedSeatsResult = await pool.query(
      `
      SELECT ticket_id
      FROM check_ins
      WHERE session_id = $1
      `,
      [sessionId]
    );

    const soldCount = Number(soldResult.rows[0].sold_count);
    const checkedCount = Number(checkedResult.rows[0].checked_count);

    res.json({
      session: sessionResult.rows[0],
      sold_count: soldCount,
      checked_count: checkedCount,
      difference: soldCount - checkedCount,
      sold_seats: soldSeatsResult.rows,
      checked_tickets: checkedSeatsResult.rows,
    });
  } catch (err) {
    console.error("Помилка отримання контролю залу:", err);

    res.status(500).json({
      error: "Помилка отримання даних контролю залу",
    });
  }
});

module.exports = router;
