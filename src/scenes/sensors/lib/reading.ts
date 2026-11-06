// Pure helpers for the reading-anatomy scene. The "world" is a made-up signal.
export const SPAN = 4;
export const SPIKE_AT = 2.6;

// A slow rise, plus one short, sharp bump
export const world = (t: number) => 4 + 0.35 * t + 3 * Math.exp(-(((t - SPIKE_AT) / 0.07) ** 2));

// The same "random" number for the same sample every time, so scrubbing is stable
function noiseAt(k: number) {
    const h = Math.sin(k * 12.9898 + 78.233) * 43758.5453;
    return (h - Math.floor(h)) * 2 - 1;
}

const snap = (value: number, step: number) => Math.round(value / step) * step;

export interface Samples {
    times: number[];
    values: number[];
}

export function sampleWorld(interval: number, step: number, noise: number): Samples {
    const times: number[] = [];
    const values: number[] = [];

    for(let k = 0; k * interval <= SPAN + 1e-9; k++) {
        const time = k * interval;
        times.push(time);
        values.push(snap(world(time) + noise * noiseAt(k), step));
    }

    return { times, values };
}

// What the program holds at time t: the newest sample taken so far
export function latestIndex(samples: Samples, t: number) {
    let index = 0;
    while(index + 1 < samples.times.length && samples.times[index + 1] <= t + 1e-9) {
        index++;
    }

    return index;
}
