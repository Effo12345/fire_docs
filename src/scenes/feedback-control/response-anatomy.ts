import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { simulateDrive } from '@kit/sim/drive';
import { color } from '@kit/palette';

const TARGET = 24;
const DURATION = 4;
const run = simulateDrive(TARGET, { kP: 1, kI: 0, kD: 0 }, DURATION);
const timeAt = (i: number) => run.t[i];
const riseStart = run.position.findIndex((x) => x >= TARGET * 0.1);
const riseEnd = run.position.findIndex((x) => x >= TARGET * 0.9);
const peak = Math.max(...run.position);
const peakIndex = run.position.indexOf(peak);
const BAND = 1.5;
let settleIndex = run.position.length - 1;
while(settleIndex > 0 && Math.abs(run.position[settleIndex] - TARGET) < BAND) settleIndex--;
const finalValue = run.position[run.position.length - 1];

export default defineScene({
    label: 'A robot position curve labeled with its rise time, overshoot, settling time and steady-state error',
    duration: 12,
    height: 350,
    beats: [
        { at: 0, text: 'This is called a <em>step response</em>: how a system reacts when its setpoint suddenly jumps. Engineers judge a controller by four numbers from this curve.' },
        { at: 2.5, text: '<strong>Rise time</strong>: how long it takes to go from 10% to 90% of the way there. Shorter is faster.' },
        { at: 5, text: '<strong>Overshoot</strong>: how far past the setpoint it goes.' },
        { at: 7.5, text: '<strong>Settling time</strong>: when it gets close to the setpoint and stays there.' },
        { at: 10, text: '<strong>Steady-state error</strong>: what\'s left once everything stops changing.' },
    ],
    build({ draw }) {
        const axes = new Axes(draw, {
            box: { left: 56, right: 700, top: 34, bottom: 310 },
            x: [0, DURATION],
            y: [0, 30],
            xTicks: [1, 2, 3, 4],
            xUnit: ' s',
            yTicks: [0, 12, 24],
            yLabel: 'position (in)',
        });
        axes.hline(TARGET, { color: color.target, width: 1.5, dash: '5 5' });
        draw.text('setpoint', 696, axes.sy(TARGET) + 18, { color: color.target, size: 14, anchor: 'end' });
        const curve = axes.curve({ color: color.value });

        const riseY = axes.sy(5);
        const riseSpan = draw.span(axes.sx(timeAt(riseStart)), riseY, axes.sx(timeAt(riseEnd)), riseY, { color: color.focus });
        const riseLabel = draw.text(`rise time ${(timeAt(riseEnd) - timeAt(riseStart)).toFixed(2)} s`, axes.sx(timeAt(riseEnd)) + 10, riseY + 5, { color: color.focus, size: 14 });

        const peakX = axes.sx(timeAt(peakIndex));
        const overSpan = draw.span(peakX, axes.sy(TARGET), peakX, axes.sy(peak), { color: color.error, tick: 4 });
        const overLabel = draw.text(`overshoot ${(peak - TARGET).toFixed(1)} in`, peakX + 10, axes.sy(peak) - 6, { color: color.error, size: 14 });

        const band = draw.rect(axes.sx(0), axes.sy(TARGET + BAND), axes.sx(DURATION) - axes.sx(0), axes.sy(TARGET - BAND) - axes.sy(TARGET + BAND), { fill: 'rgba(131, 193, 103, 0.12)' });
        const settleX = axes.sx(timeAt(settleIndex));
        const settleLine = draw.line(settleX, axes.sy(TARGET + BAND), settleX, axes.sy(0), { color: color.ink, width: 1.5, dash: '3 4' });
        const settleLabel = draw.text(`settling time ${timeAt(settleIndex).toFixed(2)} s`, settleX + 10, axes.sy(10), { size: 14 });

        const endX = axes.sx(DURATION) - 10;
        const stateSpan = draw.span(endX, axes.sy(TARGET), endX, axes.sy(finalValue), { color: color.error, tick: 4 });
        const stateLabel = draw.text(`steady-state error ${Math.abs(TARGET - finalValue).toFixed(1)} in`, endX - 6, axes.sy(TARGET + 3), { color: color.error, size: 14, anchor: 'end' });

        const within = (t: number, at: number) => Math.min(1, Math.max(0, (t - at) / 0.4));

        return ({ t }) => {
            const n = run.position.length - 1;
            curve.d(axes.trace(run.position, DURATION, Math.round(Math.min(1, t / 2.3) * n) + 1));
            for (const node of [riseSpan, riseLabel]) node.opacity(within(t, 2.5));
            for (const node of [overSpan, overLabel]) node.opacity(within(t, 5));
            for (const node of [band, settleLine, settleLabel]) node.opacity(within(t, 7.5));
            for (const node of [stateSpan, stateLabel]) node.opacity(within(t, 10));
        };
    },
});
