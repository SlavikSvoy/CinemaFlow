require('dotenv').config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/movies", require("./routes/movieRoutes"));
app.use("/sessions", require("./routes/sessionRoutes"));
app.use("/bookings", require("./routes/bookingRoutes"));
app.use("/checkin", require("./routes/checkinRoutes"));
app.use("/controller", require("./routes/controllerRoutes"));

app.get("/", (req, res) => {
  res.send("CinemaFlow API працює");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
