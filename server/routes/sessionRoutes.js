const router = require("express").Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
  SELECT 
    sessions.*,
    movies.title,
    movies.poster_url,
    halls.name AS hall_name
  FROM sessions
  JOIN movies ON sessions.movie_id = movies.id
  JOIN halls ON sessions.hall_id = halls.id
  ORDER BY show_time
`);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Помилка отримання сеансів" });
  }
});

router.post("/", async (req, res) => {
  const { movie_id, hall_id, show_time } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO sessions (movie_id, hall_id, show_time)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [movie_id, hall_id, show_time],
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Помилка створення сеансу" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM check_ins WHERE session_id = $1", [id]);
    await pool.query("DELETE FROM bookings WHERE session_id = $1", [id]);
    await pool.query("DELETE FROM sessions WHERE id = $1", [id]);

    res.json({ message: "Сеанс видалено" });
  } catch (err) {
    res.status(500).json({ error: "Помилка видалення сеансу" });
  }
});

module.exports = router;
