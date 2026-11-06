import { defineScene } from '@kit/scene';
import { Axes } from '@kit/axes';
import { robot } from '@kit/robot';
import { color } from '@kit/palette';
import { SPIN_DURATION, spinRotation, wrapHeading } from './lib/inertial';

const CX = 120;
const CY = 150;
const R = 72;

export default defineScene({
    label: 'A robot spins clockwise past a full turn, then back the other way. The dial and the chart show get_heading(), which jumps between 359 and 0 at each wrap, and get_rotation(), which keeps counting and goes negative on the way back.',
    duration: SPIN_DURATION,
    height: 380,
    params: [{ key: 'peak', label: 'how far it spins clockwise (degrees)', min: 100, max: 800, step: 10, value: 450, digits: 0 }],
    build({ draw }) {
        // Dial, with 0 at the top like a compass
        draw.circle(CX, CY, R, { color: color.rule, width: 1.5 });
        for(const [label, deg] of [['0', 0], ['90', 90], ['180', 180], ['270', 270]] as const) {
            const rad = (deg * Math.PI) / 180;
            draw.text(label, CX + (R + 20) * Math.sin(rad), CY - (R + 20) * Math.cos(rad) + 5, { color: color.dim, size: 13, anchor: 'middle' });
        }
        const bot = robot(draw, { size: 40 });
        const needle = draw.line(CX, CY, CX, CY - R, { color: color.value, width: 2.5 });

        // Chart
        const axes = new Axes(draw, {
            box: { left: 330, right: 700, top: 40, bottom: 250 },
            x: [0, SPIN_DURATION],
            y: [-400, 800],
            xTicks: [2, 4, 6, 8, 10],
            xUnit: ' s',
            yTicks: [-360, 0, 360, 720],
            yLabel: 'degrees',
        });
        axes.hline(0, { color: color.rule, width: 1 });

        const rotationLine = draw.path('', { color: color.focus, width: 2.5 });
        const headingLine = draw.path('', { color: color.value, width: 2.5 });
        const now = draw.line(0, 40, 0, 250, { color: color.faint, width: 1, dash: '3 4' });

        draw.text('get_heading()', 700, 28, { color: color.value, size: 14, anchor: 'end' });
        draw.text('get_rotation()', 540, 28, { color: color.focus, size: 14, anchor: 'end' });

        const readHeading = draw.text('', 56, 310, { mono: true, size: 14, color: color.value });
        const readRotation = draw.text('', 56, 334, { mono: true, size: 14, color: color.focus });
        const readTurns = draw.text('', 56, 358, { size: 14, color: color.dim });

        return ({ t, p }) => {
            const rotation = spinRotation(t, p.peak);
            const heading = wrapHeading(rotation);

            // Compass heading 0 is up, the robot sprite faces right at 0, so shift by 90
            bot.move(CX, CY, heading - 90);
            const rad = (heading * Math.PI) / 180;
            needle.to(CX, CY, CX + R * Math.sin(rad), CY - R * Math.cos(rad));

            // Heading is drawn in pieces so a wrap doesn't draw a line across the chart
            const steps = 400;
            let dH = '';
            let dR = '';
            let prev = -1;
            for(let i = 0; i <= steps; i++) {
                const tt = (i / steps) * t;
                const r = spinRotation(tt, p.peak);
                const h = wrapHeading(r);
                const jump = prev >= 0 && Math.abs(h - prev) > 180;
                dH += `${i === 0 || jump ? 'M' : 'L'}${axes.sx(tt).toFixed(1)} ${axes.sy(h).toFixed(1)}`;
                dR += `${i ? 'L' : 'M'}${axes.sx(tt).toFixed(1)} ${axes.sy(r).toFixed(1)}`;
                prev = h;
            }
            headingLine.d(dH);
            rotationLine.d(dR);
            now.to(axes.sx(t), 40, axes.sx(t), 250);

            readHeading.text(`get_heading():  ${heading.toFixed(1)}`);
            readRotation.text(`get_rotation(): ${rotation.toFixed(1)}`);
            readTurns.text(`full turns clockwise so far: ${Math.trunc(rotation / 360)}`);
        };
    },
});
