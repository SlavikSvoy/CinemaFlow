INSERT INTO sessions (movie_id, hall_id, show_time) VALUES
(1, 1, NOW()),
(2, 1, NOW() + INTERVAL '2 hours'),
(3, 1, NOW() + INTERVAL '4 hours');