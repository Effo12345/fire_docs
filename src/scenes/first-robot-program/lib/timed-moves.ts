// A simplified model of a timed autonomous routine, for the page on timed moves.
// Pure math, no drawing. The numbers are illustrative: they show the kind of
// spread timed moves have, not measurements of any one robot.

// 450 RPM at the wheels, 3.25 in wheels
export const TOP_SPEED = (450 / 60) * Math.PI * 3.25;

// Distance between the left and right wheels, in inches. Illustrative.
export const TRACK_WIDTH = 13;

export type Kind = 'drive' | 'turn' | 'settle';

// One line of the routine: what kind of move, millivolts, and how long in seconds
export interface Segment {
    kind: Kind;
    voltage: number;
    seconds: number;
}

// driveFor(6000, 1000), turnFor(4000, 460), driveFor(6000, 1000), each followed by a short settle
export const ROUTINE: Segment[] = [
    { kind: 'drive', voltage: 6000, seconds: 1.0 },
    { kind: 'settle', voltage: 0, seconds: 0.15 },
    { kind: 'turn', voltage: 4000, seconds: 0.46 },
    { kind: 'settle', voltage: 0, seconds: 0.15 },
    { kind: 'drive', voltage: 6000, seconds: 1.0 },
    { kind: 'settle', voltage: 0, seconds: 0.15 },
];

export const ROUTINE_SECONDS = ROUTINE.reduce((sum, seg) => sum + seg.seconds, 0);

export interface Conditions {
    // Fraction of speed lost (0 to 1): hot motors, extra load, anything that cuts what the motors give
    shortfall: number;
    // 0 is slick, 1 is very grippy
    grip: number;
    // Starting heading error in degrees, positive is clockwise
    angle: number;
}

// The day the times were tuned
export const BASELINE: Conditions = { shortfall: 0, grip: 0.7, angle: 0 };

export interface Pose {
    x: number;
    y: number;
    // Degrees clockwise from north (up the field)
    heading: number;
}

const DT = 0.01;

// The whole path as one sample per DT. The start is (0, 0) facing north.
export const simulate = (c: Conditions): Pose[] => {
    // Slower to speed up than to stop, and both worse on a slick floor
    const rise = 0.06 + 0.30 * (1 - c.grip);
    const fall = 0.03 + 0.15 * (1 - c.grip);
    const top = TOP_SPEED * (1 - c.shortfall);

    const path: Pose[] = [];
    let left = 0;
    let right = 0;
    let x = 0;
    let y = 0;
    let heading = (c.angle * Math.PI) / 180;

    let segment = 0;
    let segmentEnd = ROUTINE[0].seconds;
    const steps = Math.round(ROUTINE_SECONDS / DT);

    for(let i = 0; i <= steps; i++) {
        const t = i * DT;
        while(segment < ROUTINE.length - 1 && t >= segmentEnd) {
            segment++;
            segmentEnd += ROUTINE[segment].seconds;
        }

        const seg = ROUTINE[segment];
        const speed = (seg.voltage / 12000) * top;
        const wantLeft = speed;
        const wantRight = seg.kind === 'turn' ? -speed : speed;

        left += ((wantLeft - left) / (Math.abs(wantLeft) > Math.abs(left) ? rise : fall)) * DT;
        right += ((wantRight - right) / (Math.abs(wantRight) > Math.abs(right) ? rise : fall)) * DT;

        const forward = (left + right) / 2;
        heading += ((left - right) / TRACK_WIDTH) * DT;
        x += forward * Math.sin(heading) * DT;
        y += forward * Math.cos(heading) * DT;

        path.push({ x, y, heading: (heading * 180) / Math.PI });
    }

    return path;
};

// Fixed numbers between -1 and 1, so the "other runs" are the same every time
const WOBBLE = [
    [0.8, -0.5, 0.3],
    [-0.6, 0.9, -0.7],
    [0.2, 0.4, 0.9],
    [-0.9, -0.3, -0.2],
    [0.5, -0.8, 0.6],
];

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

// Five more runs of the same program on a different day: the conditions wander a little.
// `variation` is how much (0 to 1).
export const otherRuns = (c: Conditions, variation: number): Conditions[] =>
    WOBBLE.map(([a, b, d]) => ({
        shortfall: clamp(c.shortfall + variation * 0.05 * a, 0, 1),
        grip: clamp(c.grip + variation * 0.2 * b, 0.1, 1),
        angle: c.angle + variation * 2 * d,
    }));

export const poseAt = (path: Pose[], t: number): Pose => {
    const index = clamp(Math.round(t / DT), 0, path.length - 1);
    return path[index];
};
