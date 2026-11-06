// Pure helpers for the distance sensor scenes. Noise, dropouts and speeds are made up.

// Light covers about 299.79 mm every nanosecond
export const MM_PER_NS = 299.792458;
export const RANGE_MIN = 20;
export const RANGE_MAX = 2000;

// Out and back, so the path is twice the distance
export const roundTripNs = (mm: number) => (2 * mm) / MM_PER_NS;

// The time-of-flight scene is slowed down so that 1 mm of light travel takes 1 ms on screen
export const SCREEN_SECONDS_PER_MM = 0.001;

// Spec sheet numbers, taken literally: about 15 mm below 200 mm, about 5 percent above
export const errorMm = (mm: number) => (mm < 200 ? 15 : 0.05 * mm);

// A flat wall that is 2 * half long, centered straight ahead of the sensor
export const WALL_HALF = 500;

export interface WallReading {
    hit: boolean;
    along: number;
    reading: number;
    band: number;
}

// perp: straight-on distance to the wall. turn: how far the sensor points off straight, in degrees.
export function wallReading(perp: number, turn: number): WallReading {
    const rad = (turn * Math.PI) / 180;
    const along = perp / Math.cos(rad);
    const across = Math.abs(perp * Math.tan(rad));
    const hit = across <= WALL_HALF && along >= RANGE_MIN && along <= RANGE_MAX;

    return { hit, along, reading: hit ? Math.round(along) : 9999, band: hit ? errorMm(along) : 0 };
}

// A robot closing on a wall: the real distance falls steadily
export const FILTER_SAMPLES = 80;
const START_MM = 1500;
const END_MM = 300;

export const trueMm = (k: number) => START_MM + ((END_MM - START_MM) * k) / (FILTER_SAMPLES - 1);

function hash(k: number, salt: number) {
    const h = Math.sin(k * 12.9898 + salt * 78.233) * 43758.5453;
    return h - Math.floor(h);
}

// What the program would be handed: a little noise, now and then 9999, now and then a stray near reading
export function rawReading(k: number) {
    const roll = hash(k, 1);

    if(roll > 0.92) {
        return 9999;
    }

    if(roll < 0.04) {
        return Math.round(trueMm(k) * 0.35);
    }

    return Math.round(trueMm(k) + (hash(k, 2) - 0.5) * 24);
}

// Median of the last `window` raw readings, using however many exist at the start
export function medianAt(k: number, window: number) {
    const values: number[] = [];

    for(let i = Math.max(0, k - window + 1); i <= k; i++) {
        values.push(rawReading(i));
    }

    values.sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
}
