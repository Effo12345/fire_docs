// Two-channel (quadrature) encoder model, simplified.
// Positions are measured in slot pitches: 1 means the disk moved one slot-and-gap forward.

export const DURATION = 8;

// Forward for 4 s, rest, then partway back
export function diskPosition(t: number) {
    if(t <= 4) {
        return 0.75 * t;
    }
    if(t <= 5) {
        return 3;
    }
    return 3 - 0.5 * (Math.min(t, DURATION) - 5);
}

function frac(x: number) {
    return x - Math.floor(x);
}

// Channel A sees light for the first half of each pitch, B sees it a quarter pitch later
export function channelA(x: number) {
    return frac(x) < 0.5 ? 1 : 0;
}

export function channelB(x: number) {
    return frac(x - 0.25) < 0.5 ? 1 : 0;
}

// Order of states when A leads: 00, 10, 11, 01
const CYCLE = ['00', '10', '11', '01'];

export function stateOf(a: number, b: number) {
    return `${a}${b}`;
}

// +1 or -1 when the state moved one step around the cycle, 0 if it didn't move
export function decodeStep(prev: string, next: string) {
    if(prev === next) {
        return 0;
    }
    const diff = (CYCLE.indexOf(next) - CYCLE.indexOf(prev) + 4) % 4;
    return diff === 1 ? 1 : -1;
}

export interface Edge {
    t: number;
    channel: 'A' | 'B';
    step: number;
}

// Every edge up to time tMax, found by stepping through time
export function edgesUpTo(tMax: number, swap: boolean): Edge[] {
    const edges: Edge[] = [];
    const dt = 0.002;
    const read = (t: number) => {
        const x = diskPosition(t);
        const a = channelA(x);
        const b = channelB(x);
        return swap ? { a: b, b: a } : { a, b };
    };

    let last = read(0);
    for(let t = dt; t <= tMax; t += dt) {
        const now = read(t);
        const step = decodeStep(stateOf(last.a, last.b), stateOf(now.a, now.b));
        if(step !== 0) {
            edges.push({ t, channel: now.a !== last.a ? 'A' : 'B', step });
        }
        last = now;
    }
    return edges;
}
