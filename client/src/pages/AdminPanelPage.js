import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "../index.css";

const fixPoster = (url) => {
  if (!url) return "";

  return url.replace(
    "media.themoviedb.org/t/p/w300_and_h450_face",
    "image.tmdb.org/t/p/w500",
  );
};

const translateGenreToUkrainian = (genre) => {
  if (!genre) return "Не вказано";

  const dictionary = {
    Action: "Бойовик",
    Adventure: "Пригоди",
    Animation: "Анімація",
    Biography: "Біографія",
    Comedy: "Комедія",
    Crime: "Кримінал",
    Documentary: "Документальний",
    Drama: "Драма",
    Family: "Сімейний",
    Fantasy: "Фентезі",
    History: "Історичний",
    Horror: "Жахи",
    Music: "Музичний",
    Musical: "Мюзикл",
    Mystery: "Детектив",
    Romance: "Романтика",
    "Sci-Fi": "Фантастика",
    Sport: "Спорт",
    Thriller: "Трилер",
    War: "Військовий",
    Western: "Вестерн",
  };

  return genre
    .split(",")
    .map((item) => item.trim())
    .map((item) => dictionary[item] || item)
    .join(", ");
};

const normalizeAgeRating = (rating) => {
  if (!rating) return "0+";

  const value = rating.toUpperCase();

  if (value.includes("NC-17") || value === "R") return "18+";
  if (value.includes("PG-13")) return "12+";
  if (value === "PG") return "6+";
  if (value === "G") return "0+";

  return "0+";
};

export default function Admin() {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [category, setCategory] = useState("");
  const [ageRating, setAgeRating] = useState("0+");

  const [movies, setMovies] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [movieId, setMovieId] = useState("");
  const [hallId, setHallId] = useState("1");
  const [showTime, setShowTime] = useState("");
  const [message, setMessage] = useState("");

  const [editingMovieId, setEditingMovieId] = useState(null);

  const [importTitle, setImportTitle] = useState("");
  const [importResults, setImportResults] = useState([]);
  const [importLoading, setImportLoading] = useState(false);

  const logout = () => {
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  const resetMovieForm = () => {
    setTitle("");
    setDuration("");
    setPosterUrl("");
    setCategory("");
    setAgeRating("0+");
    setEditingMovieId(null);
  };

  const loadMovies = async () => {
    try {
      const res = await api.get("/movies");
      setMovies(res.data);
    } catch (err) {
      setMessage("Помилка завантаження фільмів");
    }
  };

  const loadSessions = async () => {
    try {
      const res = await api.get("/sessions");
      setSessions(res.data);
    } catch (err) {
      setMessage("Помилка завантаження сеансів");
    }
  };

  useEffect(() => {
    loadMovies();
    loadSessions();
  }, []);

  const searchMovieFromApi = async () => {
    if (!importTitle.trim()) {
      setMessage("Введіть назву фільму для автоматичного пошуку");
      return;
    }

    try {
      setImportLoading(true);
      setImportResults([]);
      setMessage("");

      const res = await api.get("/movies/import/search", {
        params: {
          title: importTitle.trim(),
        },
      });

      if (!res.data || res.data.length === 0) {
        setMessage("Фільми за цією назвою не знайдено");
        return;
      }

      setImportResults(res.data);
      setMessage("✅ Фільми знайдено. Оберіть потрібний варіант");
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Помилка автоматичного пошуку фільму",
      );
    } finally {
      setImportLoading(false);
    }
  };

  const fillMovieFormFromApi = (movie) => {
    setTitle(movie.title || "");
    setDuration(movie.duration || "");
    setPosterUrl(movie.poster_url || "");
    setCategory(translateGenreToUkrainian(movie.category));
    setAgeRating(normalizeAgeRating(movie.age_rating));

    setEditingMovieId(null);
    setMessage(`✅ Дані фільму "${movie.title}" підставлено у форму`);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addOrUpdateMovie = async () => {
    if (!title || !duration) {
      setMessage("Заповніть назву і тривалість");
      return;
    }

    const movieData = {
      title,
      duration: Number(duration),
      poster_url: fixPoster(posterUrl),
      category: category || "Не вказано",
      age_rating: ageRating || "0+",
    };

    try {
      if (editingMovieId) {
        await api.put(`/movies/${editingMovieId}`, movieData);
        setMessage("✅ Фільм оновлено");
      } else {
        await api.post("/movies", movieData);
        setMessage("✅ Фільм додано");
      }

      resetMovieForm();
      setImportResults([]);
      setImportTitle("");
      loadMovies();
    } catch (err) {
      setMessage(err.response?.data?.error || "Помилка збереження фільму");
    }
  };

  const startEditMovie = (movie) => {
    setEditingMovieId(movie.id);
    setTitle(movie.title || "");
    setDuration(movie.duration || "");
    setPosterUrl(movie.poster_url || "");
    setCategory(movie.category || "");
    setAgeRating(movie.age_rating || "0+");
    setMessage(`Редагування фільму: ${movie.title}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addSession = async () => {
    if (!movieId || !hallId || !showTime) {
      setMessage("Оберіть фільм, зал і час сеансу");
      return;
    }

    try {
      await api.post("/sessions", {
        movie_id: Number(movieId),
        hall_id: Number(hallId),
        show_time: showTime,
      });

      setMovieId("");
      setHallId("1");
      setShowTime("");
      setMessage("✅ Сеанс створено");
      loadSessions();
    } catch (err) {
      setMessage(err.response?.data?.error || "Помилка створення сеансу");
    }
  };

  const deleteMovie = async (id) => {
    try {
      await api.delete(`/movies/${id}`);
      setMessage("🗑 Фільм видалено");
      loadMovies();
      loadSessions();
    } catch (err) {
      setMessage(err.response?.data?.error || "Помилка видалення фільму");
    }
  };

  const deleteSession = async (id) => {
    try {
      await api.delete(`/sessions/${id}`);
      setMessage("🗑 Сеанс видалено");
      loadSessions();
    } catch (err) {
      setMessage(err.response?.data?.error || "Помилка видалення сеансу");
    }
  };

  return (
    <div className="container">
      <div className="admin-header">
        <div>
          <h1>⚙️ Адмін-панель</h1>
          <p>
            Керування фільмами, сеансами та доступ до функцій контролера.
          </p>
        </div>

        <button className="logout-button" onClick={logout}>
          Вийти
        </button>
      </div>

      <div className="admin-card">
        <h3>🧭 Швидкий доступ</h3>

        <div className="admin-quick-actions">
          <Link to="/scanner" className="button admin-action-link">
            📷 QR-сканер
          </Link>

          <Link to="/control" className="button admin-action-link">
            👮 Контроль залу
          </Link>
        </div>
      </div>

      {message && <p className="admin-message">{message}</p>}

      <div className="admin-card movie-import-card">
        <h3>🔎 Автоматичне додавання фільму</h3>
        <p>
          Введіть назву фільму, і система автоматично знайде інформацію через
          OMDb API: назву, тривалість, жанр, віковий рейтинг і постер.
        </p>

        <div className="movie-import-search">
          <input
            className="input"
            placeholder="Наприклад: Batman"
            value={importTitle}
            onChange={(e) => setImportTitle(e.target.value)}
          />

          <button
            className="button"
            onClick={searchMovieFromApi}
            disabled={importLoading}
          >
            {importLoading ? "Пошук..." : "Знайти фільм"}
          </button>
        </div>

        {importResults.length > 0 && (
          <div className="movie-import-results">
            {importResults.map((movie) => (
              <div className="movie-import-result" key={movie.external_id}>
                <div className="movie-import-poster">
                  {movie.poster_url ? (
                    <img src={movie.poster_url} alt={movie.title} />
                  ) : (
                    <span>Без постера</span>
                  )}
                </div>

                <div className="movie-import-info">
                  <h4>
                    {movie.title} {movie.year ? `(${movie.year})` : ""}
                  </h4>

                  <p>
                    <strong>Тривалість:</strong>{" "}
                    {movie.duration ? `${movie.duration} хв` : "не вказано"}
                  </p>

                  <p>
                    <strong>Жанр:</strong>{" "}
                    {movie.category || "не вказано"}
                  </p>

                  <p>
                    <strong>Рейтинг:</strong>{" "}
                    {normalizeAgeRating(movie.age_rating)}
                  </p>

                  {movie.description && (
                    <p className="movie-import-description">
                      {movie.description}
                    </p>
                  )}

                  <button
                    className="button"
                    onClick={() => fillMovieFormFromApi(movie)}
                  >
                    Заповнити форму
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <h3>{editingMovieId ? "✏️ Редагувати фільм" : "➕ Додати фільм"}</h3>

          <input
            className="input"
            placeholder="Назва фільму"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            className="input"
            placeholder="Тривалість, хв"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />

          <input
            className="input"
            placeholder="URL постера"
            value={posterUrl}
            onChange={(e) => setPosterUrl(e.target.value)}
          />

          <input
            className="input"
            placeholder="Жанр фільму, наприклад: фантастика"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <select
            className="input"
            value={ageRating}
            onChange={(e) => setAgeRating(e.target.value)}
          >
            <option value="0+">0+</option>
            <option value="6+">6+</option>
            <option value="12+">12+</option>
            <option value="16+">16+</option>
            <option value="18+">18+</option>
          </select>

          <button className="button" onClick={addOrUpdateMovie}>
            {editingMovieId ? "Зберегти зміни" : "Додати фільм"}
          </button>

          {editingMovieId && (
            <button
              className="button admin-cancel-button"
              onClick={resetMovieForm}
            >
              Скасувати редагування
            </button>
          )}
        </div>

        <div className="admin-card">
          <h3>🎬 Створити сеанс</h3>

          <select
            className="input"
            value={movieId}
            onChange={(e) => setMovieId(e.target.value)}
          >
            <option value="">Оберіть фільм</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={hallId}
            onChange={(e) => setHallId(e.target.value)}
          >
            <option value="1">Зал 1 — 2D</option>
            <option value="4">Зал 2 — 3D</option>
            <option value="5">Зал 3 — 4DX</option>
          </select>

          <input
            className="input"
            type="datetime-local"
            value={showTime}
            onChange={(e) => setShowTime(e.target.value)}
          />

          <button className="button" onClick={addSession}>
            Створити сеанс
          </button>
        </div>
      </div>

      <div className="admin-card">
        <h3>📋 Список фільмів</h3>

        {movies.map((movie) => (
          <div className="admin-list-item admin-movie-item" key={movie.id}>
            <span>
              #{movie.id} — {movie.title} ({movie.duration} хв)
              <br />
              <small>
                Жанр: {movie.category || "Не вказано"} | Рейтинг:{" "}
                {movie.age_rating || "0+"}
              </small>
            </span>

            <div className="admin-item-actions">
              <button
                className="button edit-button"
                onClick={() => startEditMovie(movie)}
              >
                Редагувати
              </button>

              <button
                className="delete-button"
                onClick={() => deleteMovie(movie.id)}
              >
                Видалити
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <h3>📋 Список сеансів</h3>

        {sessions.map((s) => (
          <div className="admin-list-item" key={s.id}>
            <span>
              #{s.id} — {s.title} | {s.hall_name} |{" "}
              {new Date(s.show_time).toLocaleString()}
            </span>

            <button
              className="delete-button"
              onClick={() => deleteSession(s.id)}
            >
              Видалити
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
