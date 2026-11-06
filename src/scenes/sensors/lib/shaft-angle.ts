// A shaft that turns past one full rotation, with a power cycle in the middle.
// The motion and numbers are illustrative.

export const DURATION = 10;
export const POWER_OFF = 4;
export const POWER_ON = 6;

// Degrees the shaft has turned in total
export function shaftDegrees(t: number) {
    if(t <= POWER_OFF) {
        return 30 + 225 * t;
    }
    if(t <= POWER_ON) {
        return 30 + 225 * POWER_OFF;
    }
    return 30 + 225 * POWER_OFF + 90 * (t - POWER_ON);
}

export function angleDegrees(t: number) {
    return ((shaftDegrees(t) % 360) + 360) % 360;
}

// What position reads. The program zeroed it at t = 0.
// After a power cycle the sources disagree: restart at 0, or restart at the current angle.
export function positionDegrees(t: number, restartAtAngle: boolean) {
    const sinceStart = shaftDegrees(t) - shaftDegrees(0);
    if(t <= POWER_ON) {
        return sinceStart;
    }
    const sinceOn = shaftDegrees(t) - shaftDegrees(POWER_ON);
    return restartAtAngle ? angleDegrees(POWER_ON) + sinceOn : sinceOn;
}
