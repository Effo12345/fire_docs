// A drivetrain under bang-bang control: the controller looks at the position every
// loop period, picks full forward, full reverse or off, and holds that until the next look.
// Pure math with no drawing. Uses the physics constants of the PID model, so the two
// pages' robots behave alike. Units are inches, seconds, volts.
import { v5Drive, type DriveModel } from '@kit/sim/drive';

export interface BangBangSettings {
    band: number; // Inches either side of the target where the controller turns off
    period: number; // Seconds between looks at the position
}

export interface BangBangRun {
    t: number[];
    position: number[];
    speed: number[];
    volts: number[];
    flips: number; // How many times the output changed sign
    peak: number; // Furthest position reached
    restAt: number | null; // When it stopped for good, or null if it never does
}

const DT = 0.002;

// Moves the drivetrain one small step. Same physics as simulateDrive
const step = (model: DriveModel, state: { x: number; v: number }, volts: number) => {
    const pushing = Math.abs(volts) - model.friction;
    const effective = pushing > 0 ? Math.sign(volts) * pushing : 0;
    if(effective === 0 && Math.abs(state.v) < 0.5) {
        state.v = 0;
    }
    else {
        state.v += (model.accelPerVolt * effective - model.drag * state.v) * DT;
    }
    state.x += state.v * DT;
};

// Open loop for comparison: full power for a fixed time, then off. Nothing is measured
export const simulateTimed = (onSeconds: number, duration: number, samples = 600, model: DriveModel = v5Drive) => {
    const position: number[] = [];
    const state = { x: 0, v: 0 };
    const steps = Math.round(duration / DT);
    const every = Math.max(1, Math.round(steps / samples));
    for(let i = 0; i <= steps; i++) {
        if(i % every === 0) {
            position.push(state.x);
        }
        step(model, state, i * DT < onSeconds ? model.maxVolts : 0);
    }
    return { position, duration: ((position.length - 1) * every) * DT };
};

export const simulateBangBang = (target: number, s: BangBangSettings, duration: number, samples = 600, model: DriveModel = v5Drive): BangBangRun => {
    const run: BangBangRun = { t: [], position: [], speed: [], volts: [], flips: 0, peak: 0, restAt: null };
    const stepsPerSample = Math.max(1, Math.round(duration / samples / DT));
    const steps = samples * stepsPerSample;
    const stepsPerLook = Math.max(1, Math.round(s.period / DT));
    const state = { x: 0, v: 0 };
    let volts = 0;
    let lastSign = 0;
    let lastBusy = 0;

    for (let i = 0; i <= steps; i++) {
        // The controller only sees the position on its own schedule
        if(i % stepsPerLook === 0) {
            const error = target - state.x;
            if(error > s.band) {
                volts = model.maxVolts;
            }
            else if(error < -s.band) {
                volts = -model.maxVolts;
            }
            else {
                volts = 0;
            }

            const sign = Math.sign(volts);
            if(sign !== 0 && lastSign !== 0 && sign !== lastSign) {
                run.flips++;
            }
            if(sign !== 0) {
                lastSign = sign;
            }
        }

        // Busy means moving or still being driven
        if(Math.abs(state.v) > 0.05 || volts !== 0) {
            lastBusy = i;
        }
        run.peak = Math.max(run.peak, state.x);

        if(i % stepsPerSample === 0) {
            run.t.push(i * DT);
            run.position.push(state.x);
            run.speed.push(state.v);
            run.volts.push(volts);
        }

        step(model, state, volts);
    }

    run.restAt = lastBusy < steps ? (lastBusy + 1) * DT : null;
    return run;
};
