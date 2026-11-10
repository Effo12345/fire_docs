// Pure helpers for the units and frames scenes. Headings are compass style: 0 along +y, clockwise positive.

// Where a field point sits from the robot's view: how far ahead of it, and how far to its right
export function toRobotFrame(point: { x: number; y: number }, pose: { x: number; y: number; heading: number }) {
    const rad = (pose.heading * Math.PI) / 180;
    const dx = point.x - pose.x;
    const dy = point.y - pose.y;

    return {
        forward: dx * Math.sin(rad) + dy * Math.cos(rad),
        right: dx * Math.cos(rad) - dy * Math.sin(rad),
    };
}

// Compass heading to the math convention (0 along +x, counterclockwise positive), kept in [0, 360)
export const toStandard = (heading: number) => (((90 - heading) % 360) + 360) % 360;

// Bring any angle into [0, 360)
export const wrap360 = (degrees: number) => ((degrees % 360) + 360) % 360;

// Signed difference from a to b the short way, in [-180, 180]
export function wrap180(degrees: number) {
    let wrapped = degrees % 360;

    if(wrapped > 180) {
        wrapped -= 360;
    } else if(wrapped < -180) {
        wrapped += 360;
    }

    return wrapped;
}

export const naiveAverage = (a: number, b: number) => (a + b) / 2;

// Average of two headings, going the short way between them
export const headingAverage = (a: number, b: number) => wrap360(a + wrap180(b - a) / 2);
