// Turning stick positions into wheel commands, and wheel commands into motion.
// Pure math, no drawing, so a future simulator can reuse it.

export const STICK_MAX = 127;

// 450 RPM at the wheels, 3.25 in wheels
export const TOP_SPEED = (450 / 60) * Math.PI * 3.25;

// Distance between the left and right wheels, in inches. Illustrative.
export const TRACK_WIDTH = 13;

export type Overflow = 'clamp' | 'scale';

export interface Mix {
    left: number;
    right: number;
    // What the formula asked for before it was brought back inside the range
    askLeft: number;
    askRight: number;
}

export const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

export const tankMix = (leftStick: number, rightStick: number): Mix => ({
    left: clamp(leftStick, -STICK_MAX, STICK_MAX),
    right: clamp(rightStick, -STICK_MAX, STICK_MAX),
    askLeft: leftStick,
    askRight: rightStick,
});

export const arcadeMix = (forward: number, turn: number, overflow: Overflow): Mix => {
    const askLeft = forward + turn;
    const askRight = forward - turn;

    if(overflow === 'clamp') {
        return {
            left: clamp(askLeft, -STICK_MAX, STICK_MAX),
            right: clamp(askRight, -STICK_MAX, STICK_MAX),
            askLeft,
            askRight,
        };
    }

    // Shrink both by the same factor, so the ratio between the sides survives
    const biggest = Math.max(Math.abs(askLeft), Math.abs(askRight));
    const factor = biggest > STICK_MAX ? STICK_MAX / biggest : 1;
    return { left: askLeft * factor, right: askRight * factor, askLeft, askRight };
};

// Where the robot is after `seconds`, starting at the origin facing +y (up).
// Heading is clockwise from up, in radians. Positions are in inches.
export const robotPose = (left: number, right: number, seconds: number) => {
    const vLeft = (left / STICK_MAX) * TOP_SPEED;
    const vRight = (right / STICK_MAX) * TOP_SPEED;
    const v = (vLeft + vRight) / 2;
    const omega = (vLeft - vRight) / TRACK_WIDTH;
    const heading = omega * seconds;

    if(Math.abs(omega) < 1e-6) {
        return { x: 0, y: v * seconds, heading };
    }
    return {
        x: (v / omega) * (1 - Math.cos(heading)),
        y: (v / omega) * Math.sin(heading),
        heading,
    };
};

// Deadband with the rest of the range stretched to fill the gap, then a power curve
export const shapeStick = (input: number, deadband: number, curve: number) => {
    const size = Math.abs(input);
    if(size <= deadband) {
        return 0;
    }
    const unit = (size - deadband) / (STICK_MAX - deadband);
    return Math.sign(input) * STICK_MAX * Math.pow(unit, curve);
};
