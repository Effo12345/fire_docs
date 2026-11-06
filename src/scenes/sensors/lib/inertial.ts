// Pure helpers for the inertial sensor scenes. All motions and noise are made up.

// Bring any angle into [0, 360), the range get_heading() uses
export const wrapHeading = (degrees: number) => ((degrees % 360) + 360) % 360;

// Signed error to turn from current to target by the shorter way, clockwise positive.
// Same arithmetic as the C++ on the page.
export function shortestTurn(target: number, current: number) {
    let error = (target - current) % 360;

    if(error > 180) {
        error -= 360;
    } else if(error < -180) {
        error += 360;
    }

    return error;
}

// A spin that goes clockwise to `peak` degrees, then back the other way through zero
export const SPIN_DURATION = 10;

const smooth = (u: number) => u * u * (3 - 2 * u);

export function spinRotation(t: number, peak: number) {
    const u = Math.min(1, Math.max(0, t / SPIN_DURATION));
    const turnAround = 0.55;
    const end = -0.35 * peak;

    if(u < turnAround) {
        return peak * smooth(u / turnAround);
    }

    return peak + (end - peak) * smooth((u - turnAround) / (1 - turnAround));
}

// Adding slices: a turn rate that rises quickly and tails off, in degrees per second
export const SLICE_SPAN = 6;

export const turnRate = (t: number) => 90 * t * Math.exp(1 - t);

// Sum of rate x slice width for every slice that has started by time t
export function sliceSum(width: number, t: number) {
    let sum = 0;

    for(let k = 0; k * width <= t + 1e-9 && k * width < SLICE_SPAN; k++) {
        const w = Math.min(width, SLICE_SPAN - k * width);
        sum += turnRate(k * width) * w;
    }

    return sum;
}

// The angle to compare against: the same sum with very thin slices
export function exactAngle(t: number) {
    const n = 4000;
    let sum = 0;

    for(let k = 0; k < n; k++) {
        const x = (k / n) * t;
        sum += turnRate(x) * (t / n);
    }

    return sum;
}

// Drift: a robot sitting still, a gyro with a small rate error and some noise
export const DRIFT_SECONDS = 60;
export const DRIFT_STEP = 0.5;

function noiseAt(k: number) {
    const h = Math.sin(k * 12.9898 + 78.233) * 43758.5453;
    return (h - Math.floor(h)) * 2 - 1;
}

// Integrated heading after each step. bias and noise are in degrees per second.
export function driftRun(bias: number, noise: number) {
    const values = [0];
    let total = 0;

    for(let k = 0; k < DRIFT_SECONDS / DRIFT_STEP; k++) {
        total += (bias + noise * noiseAt(k)) * DRIFT_STEP;
        values.push(total);
    }

    return values;
}
