// Pure gear and wheel math for the motor encoder scenes
export const WHEEL_DIAMETER = 3.25;
export const CIRCUMFERENCE = Math.PI * WHEEL_DIAMETER;

// Turns of the wheel for a given turn of the motor shaft, driver gear to driven gear
export const wheelTurns = (motorDegrees: number, driverTeeth: number, drivenTeeth: number) =>
    (motorDegrees / 360) * (driverTeeth / drivenTeeth);

export const inchesDriven = (motorDegrees: number, driverTeeth: number, drivenTeeth: number) =>
    wheelTurns(motorDegrees, driverTeeth, drivenTeeth) * CIRCUMFERENCE;

// Blue cartridge: 300 ticks per output turn, so 1.2 degrees per tick
export const BLUE_DEGREES_PER_TICK = 360 / 300;
