const router = require("express").Router();
const pool = require("../db");

// Популярні фільми за кількістю бронювань
// GET /movies/popular
router.get("/popular", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        movies.id AS movie_id,
        movies.title,
        movies.duration,
        movies.poster_url,
        COALESCE(movies.category, 'Не вказано') AS category,
        COALESCE(movies.age_rating, '0+') AS age_rating,

        COUNT(bookings.id) AS bookings_count,

        MIN(sessions.show_time) AS show_time,

        (
          SELECT halls.name
          FROM sessions AS s2
          JOIN halls ON s2.hall_id = halls.id
          WHERE s2.movie_id = movies.id
          ORDER BY s2.show_time ASC
          LIMIT 1
        ) AS hall_name

      FROM movies
      LEFT JOIN sessions ON sessions.movie_id = movies.id
      LEFT JOIN bookings ON bookings.session_id = sessions.id

      GROUP BY movies.id
      ORDER BY bookings_count DESC, MIN(sessions.show_time) ASC NULLS LAST
      LIMIT 6
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Помилка отримання популярних фільмів:", err);

    res.status(500).json({
      error: "Помилка отримання популярних фільмів",
    });
  }
});

// Отримання всіх фільмів
// GET /movies
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM movies ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error("Помилка отримання фільмів:", err);

    res.status(500).json({
      error: "Помилка отримання фільмів",
    });
  }
});

// Створення нового фільму
// POST /movies
router.post("/", async (req, res) => {
  const { title, duration, poster_url, category, age_rating } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO movies (title, duration, poster_url, category, age_rating)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        title,
        duration,
        poster_url,
        category || "Не вказано",
        age_rating || "0+",
      ],
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Помилка створення фільму:", err);

    res.status(500).json({
      error: "Помилка створення фільму",
    });
  }
});

// Видалення фільму
// DELETE /movies/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM movies WHERE id = $1", [id]);

    res.json({
      message: "Фільм видалено",
    });
  } catch (err) {
    console.error("Помилка видалення фільму:", err);

    res.status(500).json({
      error: "Не можна видалити фільм, якщо до нього привʼязані сеанси",
    });
  }
});

module.exports = router;
