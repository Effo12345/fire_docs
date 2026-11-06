// Pure helpers for the optical sensor scenes. Bands and timings are made up for the pictures.

// Is `hue` inside the band that starts at `low` and ends at `high`, going up the wheel?
// A band that crosses 0 has low above high, like 340 to 20.
export function inBand(hue: number, low: number, high: number) {
    return low <= high ? hue > low && hue < high : hue > low || hue < high;
}

// The two checks from the page, as written in C++
export const naiveCheck = (hue: number, low: number, high: number) => hue > low && hue < high;
export const orCheck = (hue: number, low: number, high: number) => hue > low || hue < high;

// A piece passes the sensor and is in view for `view` ms starting at `start`.
// The sensor hands over a reading every `period` ms. We assume each one averages the last
// `integration` ms of light, and report how much of that window had the piece in it.
export function windowShare(time: number, integration: number, start: number, view: number) {
    const from = time - integration;
    const overlap = Math.max(0, Math.min(time, start + view) - Math.max(from, start));

    return overlap / integration;
}

export const REPORT_PERIOD = 20;
export const PIECE_START = 360;
export const PIECE_LENGTH_IN = 2;

// Milliseconds a piece of the given length spends in view at a given speed
export const viewTime = (speed: number) => (PIECE_LENGTH_IN / speed) * 1000;
