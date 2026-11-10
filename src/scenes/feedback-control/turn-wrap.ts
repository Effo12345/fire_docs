import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { robot } from '@kit/robot';
import { color } from '@kit/palette';
import { simulateTurn, shortestTurn, type TurnRun } from './lib/turn-sim';

const DURATION = 3;
const CX = 192;
const CY = 190;
const R = 118;

// Compass degrees to a point on the dial. 0 is up, clockwise is positive
const dialX = (deg: number, r: number) => CX + r * Math.sin((deg * Math.PI) / 180);
const dialY = (deg: number, r: number) => CY - r * Math.cos((deg * Math.PI) / 180);

export default defineScene({
    label: 'A robot seen from above turns in place toward a target heading on a compass dial, under PID. Graphs show the motor output and the error the controller sees. A switch decides whether the error is wrapped to the shortest way around or plain target minus heading.',
    duration: DURATION,
    height: 470,
    params: [
        { key: 'start', label: 'start heading', min: 0, max: 359, step: 5, value: 350, digits: 0 },
        { key: 'target', label: 'target heading', min: 0, max: 359, step: 5, value: 10, digits: 0 },
        { key: 'wrap', label: 'wrap the error (1 = yes, 0 = no)', min: 0, max: 1, step: 1, value: 1, digits: 0 },
        { key: 'kP', label: '<em>k</em><sub>P</sub> (mV per degree)', min: 20, max: 600, step: 10, value: 200, digits: 0 },
        { key: 'kI', label: '<em>k</em><sub>I</sub> (mV per degree-second)', min: 0, max: 400, step: 10, value: 150, digits: 0 },
        { key: 'kD', label: '<em>k</em><sub>D</sub> (mV per degree/second)', min: 0, max: 40, step: 1, value: 10, digits: 0 },
    ],
    build({ draw }) {
        draw.circle(CX, CY, R, { color: color.rule, width: 1 });
        for (const deg of [0, 90, 180, 270]) {
            draw.line(dialX(deg, R - 8), dialY(deg, R - 8), dialX(deg, R), dialY(deg, R), { color: color.rule, width: 1 });
            draw.text(String(deg), dialX(deg, R + 18), dialY(deg, R + 18) + 5, { color: color.dim, size: 13, anchor: 'middle' });
        }

        const startMark = draw.circle(0, 0, 4, { color: color.dim, width: 1.5 });
        const targetLine = draw.line(0, 0, 0, 0, { color: color.target, width: 2 });
        const targetDot = draw.circle(0, 0, 6, { fill: color.target });
        const headingDot = draw.circle(0, 0, 5, { fill: color.value });
        const bot = robot(draw, { size: 44 });

        const outAxes = new Axes(draw, {
            box: { left: 440, right: 672, top: 56, bottom: 156 },
            x: [0, DURATION],
            y: [-12, 12],
            xTicks: [1, 2, 3],
            xUnit: ' s',
            yTicks: [-12, 0, 12],
            yLabel: 'output (V)',
        });
        const outCurve = outAxes.curve({ color: color.focus, width: 1.5 });

        const errAxes = new Axes(draw, {
            box: { left: 440, right: 672, top: 232, bottom: 332 },
            x: [0, DURATION],
            y: [-360, 360],
            xTicks: [1, 2, 3],
            xUnit: ' s',
            yTicks: [-360, 0, 360],
            yLabel: 'error the controller sees (deg)',
        });
        const errCurve = errAxes.curve({ color: color.error, width: 1.5 });

        const line1 = draw.text('', 52, 392, { size: 14, color: color.ink });
        const line2 = draw.text('', 52, 414, { size: 14, color: color.ink });
        const line3 = draw.text('', 52, 436, { size: 14, color: color.dim });

        let run: TurnRun;
        let key = '';

        return ({ t, p }) => {
            const nextKey = `${p.start}|${p.target}|${p.wrap}|${p.kP}|${p.kI}|${p.kD}`;
            if(nextKey !== key) {
                key = nextKey;
                run = simulateTurn(p.start, p.target, { kP: p.kP, kI: p.kI, kD: p.kD, wrap: p.wrap >= 0.5 }, DURATION);
            }

            const index = Math.min(run.t.length - 1, Math.round((t / DURATION) * (run.t.length - 1)));
            const heading = run.heading[index];

            startMark.set({ cx: dialX(p.start, R), cy: dialY(p.start, R) });
            targetLine.to(CX, CY, dialX(p.target, R), dialY(p.target, R));
            targetDot.set({ cx: dialX(p.target, R), cy: dialY(p.target, R) });
            headingDot.set({ cx: dialX(heading, R), cy: dialY(heading, R) });
            bot.move(CX, CY, heading - 90);

            outCurve.d(outAxes.trace(run.volts, DURATION, index + 1));
            errCurve.d(errAxes.trace(run.seen, DURATION, index + 1));

            const short = shortestTurn(p.target, p.start);
            const sees = run.seen[0];
            line1.text(`Heading ${heading.toFixed(0)}. The controller reads an error of ${sees.toFixed(0)} at the start.`);
            line2.text(`The short way is ${Math.abs(short).toFixed(0)} degrees ${short < 0 ? 'counterclockwise' : 'clockwise'}.`);
            const result = run.settleAt === null
                ? `Never settles in ${DURATION} s. It has spun ${run.traveled.toFixed(0)} degrees in total.`
                : `Settles at ${run.settleAt.toFixed(1)} s after spinning ${run.traveled.toFixed(0)} degrees. Overshoot ${run.peakPast.toFixed(1)} degrees.`;
            line3.text(result);
        };
    },
});
