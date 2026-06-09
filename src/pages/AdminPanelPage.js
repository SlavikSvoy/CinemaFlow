import { useEffect, useState } from "react";
import api from "../services/api";
import "../index.css";

const fixPoster = (url) => {
  if (!url) return "";

  return url.replace(
    "media.themoviedb.org/t/p/w300_and_h450_face",
    "image.tmdb.org/t/p/w500",
  );
};

export default function Admin() {
  const logout = () => {
    localStorage.removeItem("role");
    window.location.href = "/login";
  };
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [posterUrl, setPosterUrl] = useState("");

  const [movies, setMovies] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [movieId, setMovieId] = useState("");
  const [hallId, setHallId] = useState("1");
  const [showTime, setShowTime] = useState("");
  const [message, setMessage] = useState("");

  const loadMovies = async () => {
    const res = await api.get("/movies");
    setMovies(res.data);
  };

  const loadSessions = async () => {
    const res = await api.get("/sessions");
    setSessions(res.data);
  };

  useEffect(() => {
    loadMovies();
    loadSessions();
  }, []);

  const addMovie = async () => {
    if (!title || !duration) {
      setMessage("Заповніть назву і тривалість");
      return;
    }

    await api.post("/movies", {
      title,
      duration: Number(duration),
      poster_url: fixPoster(posterUrl),
    });

    setTitle("");
    setDuration("");
    setPosterUrl("");
    setMessage("✅ Фільм додано");
    loadMovies();
  };

  const addSession = async () => {
    if (!movieId || !hallId || !showTime) {
      setMessage("Оберіть фільм, зал і час сеансу");
      return;
    }

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
    await api.delete(`/sessions/${id}`);
    setMessage("🗑 Сеанс видалено");
    loadSessions();
  };

  return (
    <div className="container">
      <h1>⚙️ Адмін-панель</h1>

      <button className="button" onClick={logout}>
        Вийти
      </button>
      <h1>⚙️ Адмін-панель</h1>
      {message && <p className="admin-message">{message}</p>}

      <div className="admin-grid">
        <div className="admin-card">
          <h3>➕ Додати фільм</h3>

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

          <button className="button" onClick={addMovie}>
            Додати фільм
          </button>
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
          <div className="admin-list-item" key={movie.id}>
            <span>
              #{movie.id} — {movie.title} ({movie.duration} хв)
            </span>

            <button
              className="delete-button"
              onClick={() => deleteMovie(movie.id)}
            >
              Видалити
            </button>
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
