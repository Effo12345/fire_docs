import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { color } from '@kit/palette';
import { RANGE_MAX, RANGE_MIN, errorMm } from './lib/distance';

export default defineScene({
    label: 'A chart of how far off the distance sensor may be at each distance, from the spec sheet: about 15 millimeters below 200 millimeters and about 5 percent above. A slider picks a distance and the scene shows the range the true distance could fall in.',
    height: 360,
    duration: 0,
    params: [
        { key: 'reading', label: 'sensor reads (mm)', min: RANGE_MIN, max: RANGE_MAX, step: 10, value: 1000, digits: 0 },
    ],
    build({ draw }) {
        const axes = new Axes(draw, {
            box: { left: 70, right: 690, top: 150, bottom: 320 },
            x: [0, RANGE_MAX],
            y: [0, 110],
            xTicks: [500, 1000, 1500, 2000],
            xUnit: ' mm',
            yTicks: [0, 25, 50, 75, 100],
            yLabel: 'possible error (mm)',
        });

        // The two stated figures, drawn as the spec reads
        let d = '';
        for(let mm = RANGE_MIN; mm <= RANGE_MAX; mm += 10) {
            const e = errorMm(mm);
            if(mm === 200) {
                d += `L${axes.sx(199.9).toFixed(1)} ${axes.sy(errorMm(199.9)).toFixed(1)}`;
            }
            d += `${d ? 'L' : 'M'}${axes.sx(mm).toFixed(1)} ${axes.sy(e).toFixed(1)}`;
        }
        draw.path(d, { color: color.dim, width: 2 });
        const marker = draw.line(0, 150, 0, 320, { color: color.focus, width: 1.5 });
        const dot = draw.circle(0, 0, 5, { fill: color.focus });

        const line1 = draw.text('', 20, 28, { size: 15, color: color.value });
        const line2 = draw.text('', 20, 54, { size: 15 });
        const line3 = draw.text('', 20, 80, { size: 14, color: color.dim });
        draw.text('limits from the spec sheet, not a measured typical error', 20, 112, { size: 13, color: color.dim });

        return ({ p }) => {
            const mm = p.reading;
            const e = errorMm(mm);

            marker.to(axes.sx(mm), 150, axes.sx(mm), 320);
            dot.set({ cx: axes.sx(mm), cy: axes.sy(e) });
            line1.text(`reads ${Math.round(mm)} mm (${(mm / 25.4).toFixed(1)} in)`);
            line2.text(`true distance: ${Math.round(mm - e)} to ${Math.round(mm + e)} mm`);
            line3.text(`up to ${e.toFixed(0)} mm off, or ${(e / 25.4).toFixed(1)} in`);
        };
    },
});
