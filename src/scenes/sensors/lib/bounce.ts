// Contact chatter for one press, and what a polling loop makes of it.
// Simplified: the real chatter is messy, and these shapes are illustrative.

export const PRESS_AT = 8;
const SHARES = [0.14, 0.13, 0.17, 0.12, 0.2, 0.24];

export interface Bounce {
    // Times in ms when the contact flips, starting with the first touch
    edges: number[];
    // The time after which the contact stays closed
    settled: number;
}

export function bounceEdges(bounceMs: number): Bounce {
    const edges = [PRESS_AT];
    let t = PRESS_AT;
    for(const share of SHARES) {
        t += share * bounceMs;
        edges.push(t);
    }
    return { edges: bounceMs > 0 ? edges : [PRESS_AT], settled: PRESS_AT + bounceMs };
}

export function closedAt(t: number, b: Bounce) {
    if(t < b.edges[0]) {
        return false;
    }
    let flips = 0;
    for(const edge of b.edges) {
        if(t >= edge) {
            flips++;
        }
    }
    // First edge closes, each later one toggles
    return flips % 2 === 1 || t >= b.settled;
}

export interface Tick {
    time: number;
    closed: boolean;
    newPress: boolean;
    debounced: boolean;
}

export function sampleLoop(b: Bounce, offset: number, end: number, stable = 3): Tick[] {
    const ticks: Tick[] = [];
    let run = 0;
    let lastClosed = false;
    let fired = false;
    for(let time = offset; time <= end; time += 10) {
        const closed = closedAt(time, b);
        run = closed ? run + 1 : 0;

        const newPress = closed && !lastClosed;
        const debounced = run >= stable && !fired;
        if(debounced) {
            fired = true;
        }

        ticks.push({ time, closed, newPress, debounced });
        lastClosed = closed;
    }
    return ticks;
}
