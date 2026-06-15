const router = require("express").Router();
const pool = require("../db");

// Автоматичний пошук фільмів через OMDb API
// GET /movies/import/search?title=Batman
// Автоматичний пошук фільмів через TMDb API з підтримкою української мови
// GET /movies/import/search?title=Бетмен
router.get("/import/search", async (req, res) => {
  try {
    const { title } = req.query;

    if (!title || title.trim().length < 2) {
      return res.status(400).json({
        message: "Введіть назву фільму для пошуку",
      });
    }

    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        message: "TMDB_API_KEY не вказано на сервері",
      });
    }

    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
      title.trim(),
    )}&language=uk-UA&include_adult=false&page=1`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      return res.json([]);
    }

    const movies = searchData.results.slice(0, 5);

    const detailedMovies = await Promise.all(
      movies.map(async (movie) => {
        const detailUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&language=uk-UA`;

        const detailResponse = await fetch(detailUrl);
        const detail = await detailResponse.json();

        const posterUrl = detail.poster_path
          ? `https://image.tmdb.org/t/p/w500${detail.poster_path}`
          : "";

        const genres =
          detail.genres && detail.genres.length > 0
            ? detail.genres.map((genre) => genre.name).join(", ")
            : "Не вказано";

        return {
          external_id: String(detail.id),
          title: detail.title || detail.original_title || "",
          year: detail.release_date
            ? detail.release_date.slice(0, 4)
            : "",
          duration: detail.runtime || null,
          category: genres,
          age_rating: "0+",
          description: detail.overview || "",
          poster_url: posterUrl,
        };
      }),
    );

    res.json(detailedMovies);
  } catch (error) {
    console.error("Помилка імпорту фільмів через TMDb:", error);

    res.status(500).json({
      message: "Не вдалося отримати дані про фільм",
    });
  }
});
    const searchUrl = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(
      title,
    )}&type=movie`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.Response === "False") {
      return res.json([]);
    }

    const movies = searchData.Search.slice(0, 5);

    const detailedMovies = await Promise.all(
      movies.map(async (movie) => {
        const detailUrl = `https://www.omdbapi.com/?apikey=${apiKey}&i=${movie.imdbID}&plot=short`;

        const detailResponse = await fetch(detailUrl);
        const detail = await detailResponse.json();

        const duration =
          detail.Runtime && detail.Runtime !== "N/A"
            ? parseInt(detail.Runtime.replace(" min", ""), 10)
            : null;

        return {
          external_id: detail.imdbID,
          title: detail.Title || "",
          year: detail.Year || "",
          duration: Number.isNaN(duration) ? null : duration,
          category: detail.Genre && detail.Genre !== "N/A" ? detail.Genre : "",
          age_rating: detail.Rated && detail.Rated !== "N/A" ? detail.Rated : "0+",
          description: detail.Plot && detail.Plot !== "N/A" ? detail.Plot : "",
          poster_url: detail.Poster && detail.Poster !== "N/A" ? detail.Poster : "",
        };
      }),
    );

    res.json(detailedMovies);
  } catch (error) {
    console.error("Помилка імпорту фільмів:", error);

    res.status(500).json({
      message: "Не вдалося отримати дані про фільм",
    });
  }
});

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
    const result = await pool.query(`
      SELECT
        id,
        title,
        duration,
        poster_url,
        COALESCE(category, 'Не вказано') AS category,
        COALESCE(age_rating, '0+') AS age_rating
      FROM movies
      ORDER BY id
    `);

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

  if (!title || !duration) {
    return res.status(400).json({
      error: "Назва фільму та тривалість є обовʼязковими",
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO movies 
        (title, duration, poster_url, category, age_rating)
      VALUES 
        ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        title.trim(),
        Number(duration),
        poster_url || "",
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

// Редагування фільму
// PUT /movies/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, duration, poster_url, category, age_rating } = req.body;

  if (!title || !duration) {
    return res.status(400).json({
      error: "Назва фільму та тривалість є обовʼязковими",
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE movies
      SET
        title = $1,
        duration = $2,
        poster_url = $3,
        category = $4,
        age_rating = $5
      WHERE id = $6
      RETURNING *
      `,
      [
        title.trim(),
        Number(duration),
        poster_url || "",
        category || "Не вказано",
        age_rating || "0+",
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Фільм не знайдено",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Помилка редагування фільму:", err);

    res.status(500).json({
      error: "Помилка редагування фільму",
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
