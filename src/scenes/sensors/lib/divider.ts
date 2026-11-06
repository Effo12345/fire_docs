// A potentiometer wired as a voltage divider feeding a 12 bit converter.
// The supply is about 5 V. The ideal model has no noise and no dead zone.

export const SUPPLY_VOLTS = 5;
export const MAX_COUNT = 4095;

// Degrees of travel for the original (EDR) and V2 parts
export function travelDegrees(v2: boolean) {
    return v2 ? 330 : 250;
}

export interface DividerReading {
    shaft: number;
    fraction: number;
    volts: number;
    count: number;
    angle: number;
    atStop: boolean;
}

export function readDivider(shaftDegrees: number, v2: boolean): DividerReading {
    const travel = travelDegrees(v2);
    const shaft = Math.max(0, Math.min(shaftDegrees, travel));
    const fraction = shaft / travel;
    const count = Math.round(fraction * MAX_COUNT);

    return {
        shaft,
        fraction,
        volts: SUPPLY_VOLTS * fraction,
        count,
        angle: (count * travel) / MAX_COUNT,
        atStop: shaftDegrees >= travel || shaftDegrees <= 0,
    };
}
