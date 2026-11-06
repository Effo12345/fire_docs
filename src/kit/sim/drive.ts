// A simple model of a drivetrain moving along a line, controlled by PID. Pure math with
// no drawing, so it can feed a future field simulator too. Units are inches, seconds, volts.

export interface DriveModel {
    accelPerVolt: number; // in/s^2 for each volt
    drag: number; // 1/s, sets the top speed
    friction: number; // Volts lost to friction, so small outputs do nothing
    maxVolts: number;
}

export const v5Drive: DriveModel = { accelPerVolt: 30, drag: 6, friction: 1, maxVolts: 12 };

export interface PidGains {
    kP: number; // Volts per inch of error
    kI: number; // Volts per inch-second of accumulated error
    kD: number; // Volts per inch/s of error change
    iZone?: number; // Only add to the error sum within this many inches of the target
}

export interface DriveRun {
    t: number[];
    position: number[];
    error: number[];
    errorRate: number[];
    errorSum: number[];
    volts: number[];
}

const DT = 0.002;

export const simulateDrive = (target: number, gains: PidGains, duration: number, samples = 400, model = v5Drive): DriveRun => {
    const run: DriveRun = { t: [], position: [], error: [], errorRate: [], errorSum: [], volts: [] };
    const stepsPerSample = Math.max(1, Math.round(duration / samples / DT));
    const steps = samples * stepsPerSample;
    const iLimit = gains.kI > 0 ? model.maxVolts / gains.kI : 0;
    let x = 0;
    let v = 0;
    let sum = 0;

    for (let i = 0; i <= steps; i++) {
        const error = target - x;
        const rate = -v;
        if(gains.iZone === undefined || Math.abs(error) < gains.iZone) {
            sum = Math.max(-iLimit, Math.min(iLimit, sum + error * DT));
        }
        const raw = gains.kP * error + gains.kI * sum + gains.kD * rate;
        const volts = Math.max(-model.maxVolts, Math.min(model.maxVolts, raw));

        if(i % stepsPerSample === 0) {
            run.t.push(i * DT);
            run.position.push(x);
            run.error.push(error);
            run.errorRate.push(rate);
            run.errorSum.push(sum);
            run.volts.push(volts);
        }

        // Friction eats the first bit of voltage, and holds a stopped robot still
        const pushing = Math.abs(volts) - model.friction;
        const effective = pushing > 0 ? Math.sign(volts) * pushing : 0;
        if(effective === 0 && Math.abs(v) < 0.5) {
            v = 0;
        }
        else {
            v += (model.accelPerVolt * effective - model.drag * v) * DT;
        }
        x += v * DT;
    }

    return run;
};
