import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { color } from '@kit/palette';
import { STICK_MAX, shapeStick } from './lib/drive-mix';

export default defineScene({
    label: 'A graph of stick position against the value sent to the motors. A straight diagonal line is no shaping. A deadband flattens the line to zero around the center, and a curve exponent bends the rest so small stick movements give small outputs. Sliders set the deadband, the curve strength and a probe position.',
    width: 720,
    height: 400,
    duration: 0,
    params: [
        { key: 'deadband', label: 'deadband', min: 0, max: 40, step: 1, value: 10, digits: 0 },
        { key: 'curve', label: 'curve exponent', min: 1, max: 3, step: 0.1, value: 2, digits: 1 },
        { key: 'probe', label: 'stick position', min: -127, max: 127, step: 1, value: 50, digits: 0 },
    ],
    build({ draw }) {
        const axes = new Axes(draw, {
            box: { left: 70, right: 410, top: 40, bottom: 360 },
            x: [-STICK_MAX, STICK_MAX],
            y: [-STICK_MAX, STICK_MAX],
            xTicks: [-127, 0, 127],
            yTicks: [-127, 0, 127],
            yLabel: 'sent to the motors',
            xLabel: 'stick reads',
        });
        axes.hline(0, { color: color.rule, width: 1 });

        const band = draw.rect(0, 40, 0, 320, { fill: 'rgba(160, 160, 160, 0.14)' });
        const bandLabel = draw.text('counts as 0', 0, 56, { color: color.dim, size: 13, anchor: 'middle' });
        draw.line(axes.sx(-STICK_MAX), axes.sy(-STICK_MAX), axes.sx(STICK_MAX), axes.sy(STICK_MAX), { color: color.faint, width: 1.5, dash: '5 5' });
        const curve = axes.curve({ color: color.value });
        const dropX = draw.line(0, 0, 0, 0, { color: color.focus, width: 1.5, dash: '4 4' });
        const dropY = draw.line(0, 0, 0, 0, { color: color.focus, width: 1.5, dash: '4 4' });
        const dot = draw.circle(0, 0, 6, { fill: color.focus });

        // Readout on the right
        draw.text('dashed line: no shaping', 450, 62, { color: color.dim, size: 14 });
        draw.text('blue line: shaped', 450, 86, { color: color.value, size: 14 });
        const inText = draw.text('', 450, 160, { mono: true, size: 15 });
        const outText = draw.text('', 450, 188, { mono: true, size: 15 });
        const plainText = draw.text('', 450, 216, { mono: true, size: 15, color: color.dim });
        const note = draw.text('', 450, 262, { size: 14, color: color.dim });
        const note2 = draw.text('', 450, 284, { size: 14, color: color.dim });

        return ({ p }) => {
            const db = p.deadband;
            const k = p.curve;

            const half = (db / STICK_MAX) * (axes.sx(STICK_MAX) - axes.sx(0));
            band.set({ x: axes.sx(0) - half, width: half * 2 });
            bandLabel.at(axes.sx(0), 56).show(db >= 14);

            let d = '';
            for (let x = -STICK_MAX; x <= STICK_MAX; x++) {
                d += `${x === -STICK_MAX ? 'M' : 'L'}${axes.sx(x).toFixed(1)} ${axes.sy(shapeStick(x, db, k)).toFixed(1)}`;
            }
            curve.d(d);

            const out = shapeStick(p.probe, db, k);
            dot.set({ cx: axes.sx(p.probe), cy: axes.sy(out) });
            dropX.to(axes.sx(p.probe), axes.sy(0), axes.sx(p.probe), axes.sy(out));
            dropY.to(axes.sx(p.probe), axes.sy(out), axes.sx(-STICK_MAX), axes.sy(out));

            inText.text(`stick reads  ${String(Math.round(p.probe)).padStart(4)}`);
            outText.text(`motor gets   ${String(Math.round(out)).padStart(4)}`);
            plainText.text(`with no shaping ${String(Math.round(p.probe)).padStart(4)}`);

            if(db > 0 && Math.abs(p.probe) <= db) {
                note.text('Inside the deadband, so the robot is told to stop.');
            } else if(k > 1.05) {
                note.text('The curve keeps small moves small.');
            } else {
                note.text('');
            }
            note2.text('');
        };
    },
});
