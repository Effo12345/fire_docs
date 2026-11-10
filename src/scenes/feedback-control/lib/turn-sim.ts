// A drivetrain spinning in place under PID, with or without wrapping the error.
// Pure math with no drawing. Units are degrees, seconds, volts, clockwise positive.

export interface TurnModel {
    accelPerVolt: number; // deg/s^2 for each volt
    drag: number; // 1/s, sets the top spin rate
    friction: number; // Volts lost to friction, so small outputs do nothing
    maxVolts: number;
}

export const spinModel: TurnModel = { accelPerVolt: 180, drag: 5, friction: 1, maxVolts: 12 };

export interface TurnSettings {
    kP: number; // Millivolts per degree of error
    kI: number; // Millivolts per degree-second of accumulated error
    kD: number; // Millivolts per degree per second of error change
    wrap: boolean; // Wrap the error to -180..180, or plain target - heading
}

export interface TurnRun {
    t: number[];
    theta: number[]; // Total rotation since the start, never wrapped
    heading: number[]; // What get_heading would say, 0 up to 360
    volts: number[];
    seen: number[]; // The error the controller used
    settleAt: number | null; // When it got within 2 degrees and stayed, or null
    peakPast: number; // Furthest past the target along the true turn, in degrees
    traveled: number; // Total degrees spun, in either direction
}

const DT = 0.002;
const SETTLE = 2; // Degrees. Within this and staying there counts as settled
const I_ZONE = 15; // Degrees. The sum only grows this close to the target, and resets when the error changes sign

const wrap360 = (a: number) => ((a % 360) + 360) % 360;

// Same idea as shortestTurn on the inertial sensor page
export const shortestTurn = (target: number, current: number) => {
    let error = (target - current) % 360;
    if(error > 180) {
        error -= 360;
    }
    else if(error < -180) {
        error += 360;
    }
    return error;
};

export const simulateTurn = (start: number, target: number, s: TurnSettings, duration: number, samples = 600, model = spinModel): TurnRun => {
    const run: TurnRun = { t: [], theta: [], heading: [], volts: [], seen: [], settleAt: null, peakPast: 0, traveled: 0 };
    const stepsPerSample = Math.max(1, Math.round(duration / samples / DT));
    const steps = samples * stepsPerSample;
    const truth = shortestTurn(target, start);
    let theta = 0;
    let w = 0;
    let sum = 0;
    let lastSeen = 0;
    let lastSettle: number | null = null;

    for (let i = 0; i <= steps; i++) {
        const heading = wrap360(start + theta);
        const seen = s.wrap ? shortestTurn(target, heading) : target - heading;
        const rate = -w;
        if(seen * lastSeen < 0) {
            sum = 0;
        }
        lastSeen = seen;
        if(Math.abs(seen) < I_ZONE) {
            sum += seen * DT;
        }
        const raw = (s.kP * seen + s.kI * sum + s.kD * rate) / 1000;
        const volts = Math.max(-model.maxVolts, Math.min(model.maxVolts, raw));

        const away = Math.abs(shortestTurn(target, heading));
        if(away < SETTLE) {
            lastSettle = lastSettle ?? i * DT;
        }
        else {
            lastSettle = null;
        }
        const past = Math.sign(truth) * (theta - truth);
        run.peakPast = Math.max(run.peakPast, past);

        if(i % stepsPerSample === 0) {
            run.t.push(i * DT);
            run.theta.push(theta);
            run.heading.push(heading);
            run.volts.push(volts);
            run.seen.push(seen);
        }

        const pushing = Math.abs(volts) - model.friction;
        const effective = pushing > 0 ? Math.sign(volts) * pushing : 0;
        if(effective === 0 && Math.abs(w) < 1) {
            w = 0;
        }
        else {
            w += (model.accelPerVolt * effective - model.drag * w) * DT;
        }
        theta += w * DT;
        run.traveled += Math.abs(w) * DT;
    }

    run.settleAt = lastSettle;
    return run;
};
