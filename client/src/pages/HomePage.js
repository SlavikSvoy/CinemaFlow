import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import "../index.css";

const getHallBadge = (hallName) => {
  if (hallName?.includes("4DX")) return "💨 4DX";
  if (hallName?.includes("3D")) return "🕶 3D";
  return "🎥 2D";
};

const getHallClass = (hallName) => {
  if (hallName?.includes("4DX")) return "hall-4dx";
  if (hallName?.includes("3D")) return "hall-3d";
  return "hall-2d";
};

export default function HomePage() {
  const [sessions, setSessions] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [hallFilter, setHallFilter] = useState("all");
  const [email, setEmail] = useState("");
  const [subscribeMessage, setSubscribeMessage] = useState("");
  const [popularError, setPopularError] = useState("");

  useEffect(() => {
    api
      .get("/sessions")
      .then((res) => setSessions(res.data))
      .catch(() => setSessions([]));

    api
      .get("/movies/popular")
      .then((res) => {
        setPopularMovies(res.data);
        setPopularError("");
      })
      .catch(() => {
        setPopularMovies([]);
        setPopularError("Не вдалося завантажити популярні фільми");
      });
  }, []);

  const filteredPopularMovies = popularMovies.filter((movie) => {
    const matchesSearch = movie.title
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesHall =
      hallFilter === "all" ||
      (hallFilter === "2d" && movie.hall_name?.includes("2D")) ||
      (hallFilter === "3d" && movie.hall_name?.includes("3D")) ||
      (hallFilter === "4dx" && movie.hall_name?.includes("4DX"));

    return matchesSearch && matchesHall;
  });

  const nearestSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(a.show_time) - new Date(b.show_time))
      .slice(0, 4);
  }, [sessions]);

  const subscribe = () => {
    if (!email.trim()) {
      setSubscribeMessage("Введіть електронну пошту");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubscribeMessage("Некоректний формат електронної пошти");
      return;
    }

    setSubscribeMessage("✅ Ви успішно підписалися на новини та акції");
    setEmail("");
  };

  return (
    <main>
      <section className="hero-section">
        <div className="hero-text">
          <h1>Ласкаво просимо до нашого кінотеатру</h1>
          <p>
            Обирайте фільми, бронюйте квитки та насолоджуйтесь переглядом у
            зручному форматі.
          </p>

          <a href="#movies" className="hero-button">
            Переглянути афішу
          </a>
        </div>

        <div className="hero-image hero-video-frame">
          <video
            className="hero-banner hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/videos/cinemaflow-poster.jpg"
          >
            <source src="/videos/cinemaflow-banner.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      <section className="container" id="movies">
        <h2 className="section-title">Популярні фільми</h2>

        <div className="filters">
          <input
            className="input search-input"
            placeholder="Пошук фільму..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="input"
            value={hallFilter}
            onChange={(e) => setHallFilter(e.target.value)}
          >
            <option value="all">Усі зали</option>
            <option value="2d">🎥 2D</option>
            <option value="3d">🕶 3D</option>
            <option value="4dx">💨 4DX</option>
          </select>
        </div>

        {popularError && <p className="error">{popularError}</p>}

        <div className="movies-grid home-movies-grid">
          {filteredPopularMovies.map((movie) => (
            <div className="movie-card" key={movie.movie_id}>
              <div className="movie-poster-wrap">
                <img
                  src={
                    movie.poster_url ||
                    "https://via.placeholder.com/300x450?text=CinemaFlow"
                  }
                  alt={movie.title}
                  className="movie-poster"
                />

                <div className="movie-overlay">
                  <h3>{movie.title}</h3>
                  <p>Категорія: {movie.category || "Не вказано"}</p>
                  <p>Вікове обмеження: {movie.age_rating || "0+"}</p>
                  <p>Тривалість: {movie.duration || "—"} хв</p>
                  <p>Бронювань: {movie.bookings_count || 0}</p>
                </div>
              </div>

              <div className="movie-info">
                <span className={`hall-badge ${getHallClass(movie.hall_name)}`}>
                  {getHallBadge(movie.hall_name)}
                </span>

                <h3>{movie.title}</h3>

                {movie.show_time ? (
                  <p>🕒 {new Date(movie.show_time).toLocaleString()}</p>
                ) : (
                  <p>🕒 Сеанс не вказано</p>
                )}

                <p>🏛 {movie.hall_name || "Зал не вказано"}</p>
                <p>🔥 Бронювань: {movie.bookings_count || 0}</p>

                <Link to={`/booking/movie/${movie.movie_id}`}>
                  <button className="button">Детальніше</button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredPopularMovies.length === 0 && !popularError && (
          <div className="empty-result">
            <div className="empty-icon">🎬</div>
            <p>Популярних фільмів за вашим запитом не знайдено.</p>
          </div>
        )}
      </section>

      <section className="nearest-section">
        <div className="container">
          <h2 className="section-title">Найближчі сеанси</h2>

          <div className="sessions-list">
            {nearestSessions.map((s) => (
              <div className="session-row" key={s.id}>
                <img
                  src={
                    s.poster_url ||
                    "https://via.placeholder.com/120x80?text=CinemaFlow"
                  }
                  alt={s.title}
                  className="session-thumb"
                />

                <div className="session-info">
                  <h3>{s.title}</h3>
                  <p>{s.hall_name}</p>
                </div>

                <div className="session-date">
                  <p>📅 {new Date(s.show_time).toLocaleDateString()}</p>
                  <p>
                    🕒{" "}
                    {new Date(s.show_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <Link to={`/booking/movie/${s.movie_id}`}>
                  <button className="button session-button">Обрати</button>
                </Link>
              </div>
            ))}
          </div>

          {nearestSessions.length === 0 && (
            <div className="empty-result">
              <div className="empty-icon">🕒</div>
              <p>Найближчих сеансів поки немає.</p>
            </div>
          )}
        </div>
      </section>

      <section className="advantages-section">
        <div className="advantage-card">
          <div className="advantage-icon">🎟</div>
          <h3>Онлайн-бронювання</h3>
          <p>Бронюйте квитки у будь-який час.</p>
        </div>

        <div className="advantage-card">
          <div className="advantage-icon">💺</div>
          <h3>Вибір місць у залі</h3>
          <p>Обирайте найкращі місця для перегляду.</p>
        </div>

        <div className="advantage-card">
          <div className="advantage-icon">▦</div>
          <h3>Електронні квитки</h3>
          <p>Отримуйте квитки з QR-кодом.</p>
        </div>

        <div className="advantage-card">
          <div className="advantage-icon">🛡</div>
          <h3>Безпечно та зручно</h3>
          <p>Процес бронювання швидкий і зрозумілий.</p>
        </div>
      </section>

      <section className="subscribe-section">
        <div>
          <h3>Підпишіться на новини та акції</h3>
          <p>Будьте в курсі новинок та спеціальних пропозицій.</p>
        </div>

        <div className="subscribe-form">
          <input
            className="input"
            placeholder="Ваш e-mail"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSubscribeMessage("");
            }}
          />

          <button className="button" onClick={subscribe}>
            Підписатися
          </button>
        </div>

        {subscribeMessage && (
          <p className="subscribe-message">{subscribeMessage}</p>
        )}
      </section>

      <footer className="footer" id="contacts">
        <div>
          <h3>Про нас</h3>
          <p>Сучасний кінотеатр з комфортом для вас та вашої родини.</p>
        </div>

        <div>
          <h3>Меню</h3>
          <p>Головна</p>
          <p>Фільми</p>
          <p>Сеанси</p>
          <p>Про нас</p>
        </div>

        <div>
          <h3>Підтримка</h3>
          <p>Питання та відповіді</p>
          <p>Умови використання</p>
          <p>Політика конфіденційності</p>
        </div>

        <div id="about">
          <h3>Контакти</h3>
          <p>📞 +380 00 000 00 00</p>
          <p>✉ info@cinemaflow.com</p>
          <p>📍 м. Вінниця, вул. Кінотеатрна, 1</p>
        </div>
      </footer>
    </main>
  );
}
