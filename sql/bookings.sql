ALTER TABLE bookings
ADD CONSTRAINT unique_seat UNIQUE (session_id, seat_number);