import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

export default function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const signIn = () => {
    setError("");

    if (login === "admin" && password === "admin123") {
      localStorage.setItem("role", "admin");
      navigate("/admin");
      return;
    }

    if (login === "controller" && password === "controller123") {
      localStorage.setItem("role", "controller");
      navigate("/scanner");
      return;
    }

    setError("Невірний логін або пароль");
  };

  return (
    <div className="container">
      <h2>🔐 Службовий вхід</h2>

      <div className="card">
        <p>
          Вхід призначений для працівників кінотеатру: адміністратора та
          контролера квитків.
        </p>

        <input
          className="input"
          placeholder="Логін"
          value={login}
          onChange={(e) => {
            setLogin(e.target.value);
            setError("");
          }}
        />

        <input
          className="input"
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
        />

        <button className="button" onClick={signIn}>
          Увійти
        </button>

        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h3>Тестові службові облікові записи</h3>
        <p>
          <strong>Адміністратор:</strong> admin / admin123
        </p>
        <p>
          <strong>Контролер:</strong> controller / controller123
        </p>
      </div>
    </div>
  );
}
