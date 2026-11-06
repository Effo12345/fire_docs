// Simplified drive model: the wheels follow a commanded speed, the robot follows the wheels
// only as fast as grip allows. All numbers are illustrative.
export const DURATION = 5;
export const WALL = 30;
export const CUT_TIME = 3;

const TOP_SPEED = 20;
const RAMP = 0.1;
const MAX_ACCEL = 240;
const STEP = 0.01;

// Speed the wheel surfaces are turning, in inches per second
export function wheelSpeed(time: number) {
    if(time < CUT_TIME) {
        return TOP_SPEED * Math.min(time / RAMP, 1);
    }

    return TOP_SPEED * Math.max(1 - (time - CUT_TIME) / RAMP, 0);
}

export interface Run {
    times: number[];
    truth: number[];
    encoder: number[];
}

// Grip limits how fast the robot can speed up; slowing down uses the full limit.
// Integrates the whole run with a fixed step, so any moment can be scrubbed to
export function simulate(grip: number, wall: boolean): Run {
    const accel = MAX_ACCEL * grip;
    const times: number[] = [];
    const truth: number[] = [];
    const encoder: number[] = [];

    let velocity = 0;
    let position = 0;
    let counted = 0;

    for(let time = 0; time <= DURATION + 1e-9; time += STEP) {
        times.push(time);
        truth.push(position);
        encoder.push(counted);

        const wheel = wheelSpeed(time);
        const change = Math.max(-MAX_ACCEL * STEP, Math.min(accel * STEP, wheel - velocity));
        velocity += change;
        position += velocity * STEP;
        counted += wheel * STEP;

        if(wall && position >= WALL) {
            position = WALL;
            velocity = 0;
        }
    }

    return { times, truth, encoder };
}
