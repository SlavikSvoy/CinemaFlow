const express = require("express");
const cors = require("cors");


const app = express();
app.use(cors());
app.use(express.json());

app.use("/movies", require("./routes/movieRoutes"));
app.use("/sessions", require("./routes/sessionRoutes"));
app.use("/bookings", require("./routes/bookingRoutes"));
app.use("/checkin", require("./routes/checkinRoutes"));

app.get("/", (req, res) => {
  res.send("CinemaFlow API працює");
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
