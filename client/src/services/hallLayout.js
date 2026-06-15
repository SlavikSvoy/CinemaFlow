export const HALL_ROWS = ["A", "B", "C", "D"];
export const SEATS_PER_ROW = 6;

export const generateHallSeats = () => {
  return HALL_ROWS.map((row) =>
    Array.from({ length: SEATS_PER_ROW }, (_, index) => ({
      row,
      number: index + 1,
      label: `${row}${index + 1}`,
    })),
  );
};