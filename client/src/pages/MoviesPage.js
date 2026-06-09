import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
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

export default function MoviesPage() {
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState("");
  const [hallFilter, setHallFilter] = useState("all");

  useEffect(() => {
    api.get("/sessions").then((res) => setSessions(res.data));
  }, []);

  const movies = useMemo(() => {
    const uniqueMovies = [];

    sessions.forEach((session) => {
      const exists = uniqueMovies.some(
        (movie) => movie.movie_id === session.movie_id,
      );

      if (!exists) {
        uniqueMovies.push(session);
      }
    });

    return uniqueMovies;
  }, [sessions]);

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch = movie.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const movieSessions = sessions.filter(
      (session) => session.movie_id === movie.movie_id,
    );

    const matchesHall =
      hallFilter === "all" ||
      movieSessions.some((session) => {
        if (hallFilter === "2d") return session.hall_name?.includes("2D");
        if (hallFilter === "3d") return session.hall_name?.includes("3D");
        if (hallFilter === "4dx") return session.hall_name?.includes("4DX");
        return true;
      });

    return matchesSearch && matchesHall;
  });

  return (
    <main className="movies-page">
      <section className="movies-page-hero">
        <p className="scanner-label">CinemaFlow Movies</p>
        <h1>Усі доступні фільми</h1>
        <p>
          Переглядайте повний список фільмів, доступних у кінотеатрі, обирайте
          потрібний сеанс і бронюйте найкращі місця у залі.
        </p>
      </section>

      <section className="container">
        <div className="filters movies-page-filters">
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

        <div className="movies-grid all-movies-grid">
          {filteredMovies.map((movie) => {
            const movieSessions = sessions.filter(
              (session) => session.movie_id === movie.movie_id,
            );

            const nearestSession = movieSessions.sort(
              (a, b) => new Date(a.show_time) - new Date(b.show_time),
            )[0];

            return (
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
                    <p>Доступно сеансів: {movieSessions.length}</p>
                    <p>Найближчий сеанс: {nearestSession?.hall_name}</p>
                  </div>
                </div>

                <div className="movie-info">
                  <span
                    className={`hall-badge ${getHallClass(
                      nearestSession?.hall_name,
                    )}`}
                  >
                    {getHallBadge(nearestSession?.hall_name)}
                  </span>

                  <h3>{movie.title}</h3>

                  {nearestSession && (
                    <>
                      <p>
                        🕒 {new Date(nearestSession.show_time).toLocaleString()}
                      </p>
                      <p>🏛 {nearestSession.hall_name}</p>
                    </>
                  )}

                  <p>🎬 Сеансів доступно: {movieSessions.length}</p>

                  <Link to={`/booking/movie/${movie.movie_id}`}>
                    <button className="button">Купити квиток</button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMovies.length === 0 && (
          <div className="empty-result">
            <div className="empty-icon">🎬</div>
            <p>Фільмів за вашим запитом не знайдено.</p>
          </div>
        )}
      </section>
    </main>
  );
}
