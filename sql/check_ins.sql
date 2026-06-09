CREATE TABLE IF NOT EXISTS check_ins (
  id SERIAL PRIMARY KEY,
  session_id INTEGER,
  ticket_id INTEGER
);