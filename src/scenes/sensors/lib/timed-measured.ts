// A deliberately simple drive model with made-up numbers (illustrative, not measured from a robot).
// Wheels chase a commanded speed, then coast after the power is cut.
export const TARGET = 48;
export const DURATION = 4;
export const DT = 0.01;

const FULL_SPEED = 30;
const SPIN_UP = 0.12;
const COAST = 0.12;
const LOAD_SLOWDOWN = 0.45;

export interface DriveRun {
    position: number[];
    final: number;
}

// Power stays on while keepGoing(time, measuredPosition) says so
function simulate(load: number, keepGoing: (time: number, position: number) => boolean): DriveRun {
    const command = FULL_SPEED * (1 - LOAD_SLOWDOWN * load);
    const steps = Math.round(DURATION / DT);
    const position = [0];

    let speed = 0;
    let x = 0;
    let powered = true;

    for(let i = 1; i <= steps; i++) {
        if(powered && !keepGoing(i * DT, x)) {
            powered = false;
        }

        if(powered) {
            speed += ((command - speed) / SPIN_UP) * DT;
        } else {
            speed -= (speed / COAST) * DT;
        }

        x += speed * DT;
        position.push(x);
    }

    return { position, final: x };
}

// How long the timed program drives: the time that lands on the target with no load
function findTimedSeconds() {
    let low = 0.5;
    let high = 3;
    for(let i = 0; i < 40; i++) {
        const mid = (low + high) / 2;
        const run = simulate(0, (time) => time < mid);
        if(run.final < TARGET) {
            low = mid;
        } else {
            high = mid;
        }
    }

    return (low + high) / 2;
}

export const TIMED_SECONDS = findTimedSeconds();

const cache = new Map<number, { timed: DriveRun; measured: DriveRun }>();

export function runBoth(load: number) {
    const key = Math.round(load * 1000);
    let runs = cache.get(key);
    if(!runs) {
        runs = {
            timed: simulate(load, (time) => time < TIMED_SECONDS),
            // Stops commanding power once the wheels have measured the target
            measured: simulate(load, (_time, position) => position < TARGET),
        };
        cache.set(key, runs);
    }

    return runs;
}
