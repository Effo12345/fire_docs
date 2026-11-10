import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { robot } from '@kit/robot';
import { color } from '@kit/palette';
import { simulateBangBang, type BangBangRun } from './lib/bang-bang';

const TARGET = 24;
const DURATION = 3;
const SAMPLES = 1500;

export default defineScene({
    label: 'A robot drives toward a 24 inch target under bang-bang control, which only ever uses full forward, off or full reverse. Graphs trace its position and its output voltage over three seconds. Sliders change the stop band and the loop period.',
    duration: DURATION,
    height: 450,
    params: [
        { key: 'band', label: 'stop band (in)', min: 0, max: 8, step: 0.25, value: 0.25, digits: 2 },
        { key: 'period', label: 'loop period (ms)', min: 4, max: 200, step: 2, value: 100, digits: 0 },
    ],
    build({ draw }) {
        const fx = (inches: number) => 50 + (inches / 36) * 620;
        const trackY = 52;

        draw.line(fx(0), trackY + 26, fx(36), trackY + 26, { color: color.rule, width: 1 });
        draw.line(fx(TARGET), trackY - 24, fx(TARGET), trackY + 30, { color: color.target });
        draw.text('target', fx(TARGET), trackY - 32, { color: color.target, size: 14, anchor: 'middle' });
        const bot = robot(draw);

        const result = draw.text('', 56, 108, { size: 14, color: color.ink });

        const axes = new Axes(draw, {
            box: { left: 56, right: 700, top: 150, bottom: 290 },
            x: [0, DURATION],
            y: [0, 36],
            xTicks: [1, 2, 3],
            xUnit: ' s',
            yTicks: [0, 12, 24, 36],
            yLabel: 'position (in)',
        });
        const band = draw.rect(axes.sx(0), 0, axes.sx(DURATION) - axes.sx(0), 0, { fill: color.target });
        band.opacity(0.18);
        axes.hline(TARGET, { color: color.target, width: 1.5, dash: '5 5' });
        const curve = axes.curve({ color: color.value });
        const dot = draw.circle(0, 0, 5, { fill: color.focus });

        const outAxes = new Axes(draw, {
            box: { left: 56, right: 700, top: 346, bottom: 416 },
            x: [0, DURATION],
            y: [-12, 12],
            xTicks: [1, 2, 3],
            xUnit: ' s',
            yTicks: [-12, 0, 12],
            yLabel: 'output (V)',
        });
        const outCurve = outAxes.curve({ color: color.focus, width: 1.5 });

        let run: BangBangRun;
        let key = '';

        return ({ t, p }) => {
            const nextKey = `${p.band}|${p.period}`;
            if(nextKey !== key) {
                key = nextKey;
                run = simulateBangBang(TARGET, { band: p.band, period: p.period / 1000 }, DURATION, SAMPLES);
            }

            const index = Math.min(run.position.length - 1, Math.round((t / DURATION) * (run.position.length - 1)));
            const x = run.position[index];
            curve.d(axes.trace(run.position, DURATION, index + 1));
            outCurve.d(outAxes.trace(run.volts, DURATION, index + 1));
            dot.set({ cx: axes.sx(t), cy: axes.sy(x) });

            const top = axes.sy(TARGET + p.band);
            band.set({ y: top, height: axes.sy(TARGET - p.band) - top });
            bot.move(fx(x) - 19, trackY);

            const end = run.position[run.position.length - 1];
            if(run.restAt === null) {
                result.text(`Never comes to rest. The output reversed ${run.flips} times in ${DURATION} s.`);
            }
            else {
                const off = end - TARGET;
                const how = Math.abs(off) < 0.05 ? 'on target' : `${Math.abs(off).toFixed(1)} in ${off < 0 ? 'short' : 'past'}`;
                result.text(`Comes to rest at ${run.restAt.toFixed(1)} s, ${how}. Peak ${run.peak.toFixed(1)} in.`);
            }
        };
    },
});
