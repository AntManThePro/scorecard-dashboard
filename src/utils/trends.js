/**
 * Trend Analysis Utilities
 * 
 * Functions for analyzing time-series scorecard data.
 * Expected data format: [{ week: "2025-W01", score: 28 }, ...]
 */

/**
 * Calculate simple moving average
 * @param {Array<{week: string, score: number}>} data - Array of weekly score data
 * @param {number} [window=3] - Window size for moving average calculation
 * @returns {Array<number>} Array of moving average values for each data point
 */
export const movingAverage = (data, window = 3) =>
  data.map((_, i) => {
    const slice = data.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((s, d) => s + d.score, 0) / slice.length;
  });

/**
 * Calculate momentum (rate of change between last two data points)
 * @param {Array<{week: string, score: number}>} data - Array of weekly score data
 * @returns {number} Difference between last and second-to-last score, or 0 if insufficient data
 */
export const momentum = data =>
  data.length < 2 ? 0 : data[data.length - 1].score - data[data.length - 2].score;

/**
 * Calculate volatility using population standard deviation
 * @param {Array<{week: string, score: number}>} data - Array of weekly score data
 * @returns {number} Standard deviation of scores, or 0 for empty arrays
 */
export const volatility = data => {
  if (data.length === 0) return 0;
  const mean = data.reduce((s, d) => s + d.score, 0) / data.length;
  const variance =
    data.reduce((s, d) => s + (d.score - mean) ** 2, 0) / data.length;
  return Math.sqrt(variance);
};

/**
 * Generate a trend label based on momentum value
 * @param {number} m - Momentum value (typically the difference between consecutive scores)
 * @returns {string} "UP" if m > 0.5, "DOWN" if m < -0.5, otherwise "FLAT"
 */
export const trendLabel = m =>
  m > 0.5 ? "UP" : m < -0.5 ? "DOWN" : "FLAT";
