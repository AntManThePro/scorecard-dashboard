// expects [{ week: "2025-W01", score: 28 }, ...]

// simple moving average
export const movingAverage = (data, window = 3) =>
  data.map((_, i) => {
    const slice = data.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((s, d) => s + d.score, 0) / slice.length;
  });

// momentum = last - previous
export const momentum = data =>
  data.length < 2 ? 0 : data[data.length - 1].score - data[data.length - 2].score;

// volatility = standard deviation
export const volatility = data => {
  const mean = data.reduce((s, d) => s + d.score, 0) / data.length;
  const variance =
    data.reduce((s, d) => s + (d.score - mean) ** 2, 0) / data.length;
  return Math.sqrt(variance);
};

// trend label
export const trendLabel = m =>
  m > 0.5 ? "UP" : m < -0.5 ? "DOWN" : "FLAT";
