import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { DURATION, POWER_OFF, POWER_ON, shaftDegrees, angleDegrees, positionDegrees } from './lib/shaft-angle';

const CX = 120;
const CY = 170;
const R = 70;
const LEFT = 330;
const RIGHT = 690;
const TOP = 60;
const BOTTOM = 280;
const Y_MAX = 1300;

export default defineScene({
    label: 'A shaft turns more than two full rotations and the power is cycled in the middle. The angle always wraps back to zero after 360 degrees and survives the power cycle, while the position keeps climbing and may restart after power on.',
    duration: DURATION,
    height: 380,
    params: [{ key: 'restart', label: 'after power on, position restarts at: 0 = zero, 1 = the angle', min: 0, max: 1, step: 1, value: 0, digits: 0 }],
    build({ draw }) {
        const sx = (t: number) => LEFT + (t / DURATION) * (RIGHT - LEFT);
        const sy = (deg: number) => BOTTOM - (Math.max(-50, Math.min(deg, Y_MAX)) / Y_MAX) * (BOTTOM - TOP);

        // Dial
        draw.circle(CX, CY, R, { color: color.rule, width: 1.5 });
        draw.text('0', CX, CY - R - 8, { color: color.dim, size: 13, anchor: 'middle' });
        const needle = draw.line(CX, CY, CX, CY - R, { color: color.value, width: 3 });
        draw.circle(CX, CY, 4, { fill: color.ink });
        const rotations = draw.text('', CX, CY + R + 28, { size: 14, anchor: 'middle', color: color.dim });

        // Chart
        draw.line(LEFT, BOTTOM, RIGHT, BOTTOM, { color: color.rule, width: 1 });
        for(const deg of [0, 360, 720, 1080]) {
            draw.line(LEFT - 4, sy(deg), LEFT, sy(deg), { color: color.rule, width: 1 });
            draw.text(`${deg}`, LEFT - 10, sy(deg) + 5, { color: color.dim, size: 12, anchor: 'end' });
        }
        draw.text('degrees', LEFT - 10, TOP - 14, { color: color.dim, size: 12, anchor: 'end' });
        for(let s = 0; s <= DURATION; s += 2) {
            draw.text(`${s} s`, sx(s), BOTTOM + 22, { color: color.dim, size: 13, anchor: 'middle' });
        }
        const off = draw.rect(sx(POWER_OFF), TOP, sx(POWER_ON) - sx(POWER_OFF), BOTTOM - TOP, { color: color.rule, width: 1 });
        draw.text('power off', (sx(POWER_OFF) + sx(POWER_ON)) / 2, TOP + 16, { color: color.dim, size: 13, anchor: 'middle' });

        const angleLine = draw.path('', { color: color.value, width: 2.5 });
        const positionLine = draw.path('', { color: color.focus, width: 2.5 });
        const playhead = draw.line(0, TOP, 0, BOTTOM, { color: color.rule, width: 1.5 });

        draw.text('angle', RIGHT - 6, TOP - 14, { color: color.value, size: 14, anchor: 'end' });
        draw.text('position', RIGHT - 70, TOP - 14, { color: color.focus, size: 14, anchor: 'end' });

        const readAngle = draw.text('', LEFT, 330, { mono: true, size: 14, color: color.value });
        const readPosition = draw.text('', LEFT, 352, { mono: true, size: 14, color: color.focus });

        return ({ t, p }) => {
            const restart = p.restart > 0.5;
            const deg = angleDegrees(t);
            const rad = (deg * Math.PI) / 180;
            needle.to(CX, CY, CX + R * Math.sin(rad), CY - R * Math.cos(rad));
            rotations.text(`full turns so far: ${Math.floor(shaftDegrees(t) / 360)}`);

            // Angle is a sawtooth, drawn as separate pieces so the wraps don't get a diagonal line
            const steps = 500;
            let dA = '';
            let dP = '';
            let prevAngle = -1;
            for(let i = 0; i <= steps; i++) {
                const tt = (i / steps) * t;
                const a = angleDegrees(tt);
                const wrapped = prevAngle >= 0 && Math.abs(a - prevAngle) > 180;
                dA += `${i === 0 || wrapped ? 'M' : 'L'}${sx(tt).toFixed(1)} ${sy(a).toFixed(1)}`;
                dP += `${i ? 'L' : 'M'}${sx(tt).toFixed(1)} ${sy(positionDegrees(tt, restart)).toFixed(1)}`;
                prevAngle = a;
            }
            angleLine.d(dA);
            positionLine.d(dP);
            playhead.to(sx(t), TOP, sx(t), BOTTOM);

            const powered = t < POWER_OFF || t > POWER_ON;
            readAngle.text(powered ? `get_angle():    ${Math.round(deg * 100)}` : 'get_angle():    (sensor off)');
            readPosition.text(powered ? `get_position(): ${Math.round(positionDegrees(t, restart) * 100)}` : 'get_position(): (sensor off)');
            off.opacity(1);
        };
    },
});
