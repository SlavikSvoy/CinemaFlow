CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title TEXT,
    duration INT
);

CREATE TABLE halls (
    id SERIAL PRIMARY KEY,
    name TEXT,
    capacity INT
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    movie_id INT REFERENCES movies(id),
    hall_id INT REFERENCES halls(id),
    show_time TIMESTAMP
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES sessions(id),
    seat_number TEXT,
    is_used BOOLEAN DEFAULT FALSE
);

CREATE TABLE check_ins (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES sessions(id),
    ticket_id INT REFERENCES bookings(id),
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

