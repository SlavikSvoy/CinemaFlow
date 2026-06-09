import { useEffect, useState } from "react";
import api from "../services/api";
import "../index.css";

export default function Controller() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/sessions").then((res) => setSessions(res.data));
  }, []);

  const loadStats = async (sessionId) => {
    if (!sessionId) {
      setStats(null);
      return;
    }

    const res = await api.get(`/checkin/stats/${sessionId}`);
    setStats(res.data);
  };

  const handleSelect = async (e) => {
    const sessionId = e.target.value;
    setSelectedSessionId(sessionId);
    await loadStats(sessionId);
  };

  const selectedSession = sessions.find(
    (s) => String(s.id) === String(selectedSessionId),
  );

  return (
    <div className="container">
      <h2>👮 Контроль залу</h2>

      <select
        className="input"
        value={selectedSessionId}
        onChange={handleSelect}
      >
        <option value="">Оберіть сеанс</option>

        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title} — {s.hall_name} — {new Date(s.show_time).toLocaleString()}
          </option>
        ))}
      </select>

      {selectedSession && (
        <div className="card">
          <h3>{selectedSession.title}</h3>
          <p>🏛 {selectedSession.hall_name}</p>
          <p>🕒 {new Date(selectedSession.show_time).toLocaleString()}</p>
        </div>
      )}

      {stats && (
        <div className="card">
          <p>🎟 Продано: {stats.sold}</p>
          <p>👥 Пройшло: {stats.checked}</p>
          <p>⚠️ Різниця: {stats.difference}</p>
        </div>
      )}
    </div>
  );
}
