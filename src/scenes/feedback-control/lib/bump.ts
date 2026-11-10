// A robot driving 72 inches down a line when something knocks its heading sideways.
// The timed version drives its tuned time and never learns anything. The checking version
// watches how far it is from the line and how far it has gone, and steers back. Pure
// math with no drawing. Units are inches, degrees and seconds.

export const LENGTH = 72;
export const SPEED = 36;
export const BUMP_AT = 30 / SPEED;
export const TIMED_END = LENGTH / SPEED;

export interface BumpRun {
    t: number[];
    x: number[]; // Along the line
    y: number[]; // Sideways from the line, positive is the way the bump pushed
    done: number; // Seconds when it stopped
}

const DT = 0.002;

// kick is degrees of heading the bump adds. The tuned time puts the unbumped robot on the end of the line
export const simulateBump = (kick: number, checking: boolean, duration: number, samples = 400): BumpRun => {
    const run: BumpRun = { t: [], x: [], y: [], done: duration };
    const stepsPerSample = Math.max(1, Math.round(duration / samples / DT));
    const steps = samples * stepsPerSample;
    let x = 0;
    let y = 0;
    let heading = 0;
    let stopped = false;

    for(let i = 0; i <= steps; i++) {
        const time = i * DT;

        if(i % stepsPerSample === 0) {
            run.t.push(time);
            run.x.push(x);
            run.y.push(y);
        }

        if(!stopped && (checking ? x >= LENGTH : time >= TIMED_END)) {
            stopped = true;
            run.done = time;
        }
        if(stopped) {
            continue;
        }

        if(Math.abs(time - BUMP_AT) < DT / 2) {
            heading += kick;
        }

        // The checking robot aims back at the line, harder the further off it is
        if(checking) {
            const wanted = -Math.atan(y / 12) * 180 / Math.PI;
            heading += 4 * (wanted - heading) * DT;
        }

        const rad = (heading * Math.PI) / 180;
        x += SPEED * Math.cos(rad) * DT;
        y += SPEED * Math.sin(rad) * DT;
    }

    return run;
};
