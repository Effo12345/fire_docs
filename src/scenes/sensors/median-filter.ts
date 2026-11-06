import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { color } from '@kit/palette';
import { FILTER_SAMPLES, medianAt, rawReading, trueMm } from './lib/distance';

const LEFT = 70;
const RIGHT = 700;
const TOP = 140;
const BOTTOM = 350;
const MAX_Y = 1700;

export default defineScene({
    label: 'A robot approaches a wall and its distance sensor readings arrive one at a time, with some noise, some 9999 dropouts and a few stray near readings. A median of the last few readings smooths them. A slider sets how many readings the median uses, and a larger window removes more bad readings but lags behind the real distance.',
    height: 400,
    duration: 8,
    params: [
        { key: 'window', label: 'readings in the median (made-up data)', min: 1, max: 9, step: 2, value: 5, digits: 0 },
    ],
    build({ draw }) {
        const axes = new Axes(draw, {
            box: { left: LEFT, right: RIGHT, top: TOP, bottom: BOTTOM },
            x: [0, FILTER_SAMPLES],
            y: [0, MAX_Y],
            xTicks: [20, 40, 60, 80],
            xUnit: '',
            yTicks: [0, 500, 1000, 1500],
            yLabel: 'mm',
        });
        draw.text('reading number', RIGHT, BOTTOM + 40, { size: 13, color: color.dim, anchor: 'end' });
        draw.text('9999 readings sit up here', RIGHT, TOP - 8, { size: 13, color: color.error, anchor: 'end' });

        let truth = '';
        for(let k = 0; k < FILTER_SAMPLES; k++) {
            truth += `${k ? 'L' : 'M'}${axes.sx(k).toFixed(1)} ${axes.sy(trueMm(k)).toFixed(1)}`;
        }
        draw.path(truth, { color: color.dim, width: 1.5, dash: '5 5' });

        const dots = [];
        for(let k = 0; k < FILTER_SAMPLES; k++) {
            const mm = rawReading(k);
            const dropout = mm === 9999;
            dots.push(draw.circle(axes.sx(k), axes.sy(dropout ? MAX_Y : mm), 3, { fill: dropout ? color.error : color.focus }));
        }
        const filtered = draw.path('', { color: color.value, width: 2.5 });

        draw.text('real distance', 20, 24, { size: 13, color: color.dim });
        draw.text('raw readings', 20, 44, { size: 13, color: color.focus });
        draw.text('median of the last few', 20, 64, { size: 13, color: color.value });
        const read = draw.text('', 20, 94, { size: 14, mono: true });

        return ({ t, p }) => {
            const last = Math.min(FILTER_SAMPLES - 1, Math.floor((t / 8) * FILTER_SAMPLES));
            const w = Math.round(p.window);

            for(let k = 0; k < FILTER_SAMPLES; k++) {
                dots[k].show(k <= last);
            }

            let d = '';
            for(let k = 0; k <= last; k++) {
                d += `${k ? 'L' : 'M'}${axes.sx(k).toFixed(1)} ${axes.sy(Math.min(medianAt(k, w), MAX_Y)).toFixed(1)}`;
            }
            filtered.d(d);

            const raw = rawReading(last);
            read.text(`raw ${raw}   median ${medianAt(last, w)}   truth ${Math.round(trueMm(last))}`);
        };
    },
});
