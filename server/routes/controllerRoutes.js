const router = require("express").Router();
const pool = require("../db");
router.get("/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  const sold = await db.query(
    "SELECT COUNT(*) FROM bookings WHERE session_id = $1",
    [sessionId],
  );

  const entered = await db.query(
    `
    SELECT COUNT(*) FROM check_ins
    JOIN bookings ON bookings.id = check_ins.ticket_id
    WHERE bookings.session_id = $1
  `,
    [sessionId],
  );

  res.json({
    sold: sold.rows[0].count,
    entered: entered.rows[0].count,
  });
});

module.exports = router;
