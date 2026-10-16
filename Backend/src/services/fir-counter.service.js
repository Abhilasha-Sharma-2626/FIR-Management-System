/**
 * Atomically generates next sequential FIR Number for a police station
 * Format: FIR/<STATION_CODE>/<YYYY>/<00001>
 *
 * @param {object} client - pg pool client with an active transaction
 * @param {number} stationId
 * @returns {Promise<string>} Generated FIR number
 */
async function generateNextFirNumber(client, stationId) {
  const currentYear = new Date().getFullYear();

  // 1. Fetch station code
  const stationRes = await client.query(
    'SELECT code FROM police_stations WHERE station_id = $1',
    [stationId]
  );

  if (stationRes.rows.length === 0) {
    throw new Error(`Police station with ID ${stationId} does not exist.`);
  }

  const stationCode = stationRes.rows[0].code;

  // 2. Atomic UPSERT with row lock
  const counterRes = await client.query(
    `INSERT INTO fir_counters (station_id, year, last_seq)
     VALUES ($1, $2, 1)
     ON CONFLICT (station_id, year)
     DO UPDATE SET last_seq = fir_counters.last_seq + 1
     RETURNING last_seq;`,
    [stationId, currentYear]
  );

  const seq = counterRes.rows[0].last_seq;
  const paddedSeq = String(seq).padStart(5, '0');

  return `FIR/${stationCode}/${currentYear}/${paddedSeq}`;
}

module.exports = {
  generateNextFirNumber
};
