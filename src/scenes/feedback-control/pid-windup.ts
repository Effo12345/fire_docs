import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { simulateDrive, type DriveRun } from '@kit/sim/drive';
import { color } from '@kit/palette';

const TARGET = 96;
const DURATION = 10;
const SAMPLES = 500;
const OFF = 100;

export default defineScene({
    label: 'A robot drives 96 inches under PID. One graph traces its position, the other the voltage the integral term asks for. A slider sets how close to the target the integral may start adding up.',
    duration: DURATION,
    height: 480,
    params: [
        { key: 'kI', label: '<em>k</em><sub>I</sub>', min: 0, max: 1, step: 0.05, value: 0.3, digits: 2 },
        { key: 'zone', label: 'I zone (in, 100 = off)', min: 2, max: OFF, step: 2, value: OFF, digits: 0 },
    ],
    build({ draw }) {
        const posAxes = new Axes(draw, {
            box: { left: 56, right: 676, top: 44, bottom: 224 },
            x: [0, DURATION],
            y: [0, 120],
            xTicks: [2, 4, 6, 8, 10],
            xUnit: ' s',
            yTicks: [0, 48, 96],
            yLabel: 'position (in)',
        });
        posAxes.hline(TARGET, { color: color.target, width: 1.5, dash: '5 5' });
        const posCurve = posAxes.curve({ color: color.value });
        const dot = draw.circle(0, 0, 5, { fill: color.focus });

        const iAxes = new Axes(draw, {
            box: { left: 56, right: 676, top: 282, bottom: 392 },
            x: [0, DURATION],
            y: [-2, 12],
            xTicks: [2, 4, 6, 8, 10],
            xUnit: ' s',
            yTicks: [0, 6, 12],
            yLabel: 'voltage asked for by the I term (V)',
        });
        const iCurve = iAxes.curve({ color: color.focus, width: 2 });

        const result = draw.text('', 52, 440, { size: 14, color: color.ink });
        const note = draw.text('', 52, 462, { size: 14, color: color.dim });

        let run: DriveRun;
        let iTerm: number[] = [];
        let key = '';
        let over = 0;
        let settle: number | null = null;

        return ({ t, p }) => {
            const nextKey = `${p.kI}|${p.zone}`;
            if(nextKey !== key) {
                key = nextKey;
                const zone = p.zone >= OFF ? undefined : p.zone;
                run = simulateDrive(TARGET, { kP: 0.6, kI: p.kI, kD: 0.05, iZone: zone }, DURATION, SAMPLES);
                iTerm = run.errorSum.map((s) => s * p.kI);
                over = Math.max(0, Math.max(...run.position) - TARGET);
                const n = run.position.length;
                const inBand = (k: number) => Math.abs(run.position[k] - TARGET) < 1;
                let first = -1;
                for(let k = n - 1; k >= 0 && inBand(k); k--) {
                    first = k;
                }
                settle = first < 0 ? null : run.t[first];
            }

            const index = Math.min(run.position.length - 1, Math.round((t / DURATION) * (run.position.length - 1)));
            posCurve.d(posAxes.trace(run.position, DURATION, index + 1));
            iCurve.d(iAxes.trace(iTerm, DURATION, index + 1));
            dot.set({ cx: posAxes.sx(t), cy: posAxes.sy(run.position[index]) });

            const zoneText = p.zone >= OFF ? 'I zone off' : `I zone ${p.zone} in`;
            result.text(`${zoneText}. Overshoot ${over.toFixed(1)} in. ${settle === null ? 'Does not settle within 1 in' : `Within 1 in for good at ${settle.toFixed(1)} s`}.`);
            note.text(`Peak I term ${Math.max(...iTerm).toFixed(1)} V while the P term fades as the robot arrives.`);
        };
    },
});
