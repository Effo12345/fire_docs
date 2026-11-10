import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

const CX = 170;
const CY = 170;
const R = 100;
const LINE_Y = 340;
const LINE_X = 20;

const point = (rad: number, radius: number) => [CX + radius * Math.cos(rad), CY - radius * Math.sin(rad)];

export default defineScene({
    label: 'A circle with an arc swept from the right, and that arc straightened below into a line. Segments one radius long are marked along it, so the angle in radians is the number of radii the arc holds.',
    duration: 0,
    width: 720,
    height: 400,
    params: [
        { key: 'angle', label: 'angle (degrees)', min: 0, max: 360, step: 1, value: 90, digits: 0 },
    ],
    build({ draw }) {
        draw.circle(CX, CY, R, { color: color.rule, width: 1.5 });
        draw.line(CX, CY, CX + R, CY, { color: color.dim, width: 1.5 });
        draw.text('radius', CX + R / 2, CY + 20, { color: color.dim, size: 13, anchor: 'middle' });

        const arc = draw.path('', { color: color.focus, width: 4 });
        const hand = draw.line(CX, CY, CX + R, CY, { color: color.ink, width: 2 });
        draw.circle(CX, CY, 3, { fill: color.ink });

        // One radius long each, laid end to end. Six and a bit fit around the whole circle
        draw.line(LINE_X, LINE_Y, LINE_X + 6.4 * R, LINE_Y, { color: color.rule, width: 1 });
        const unrolled = draw.line(LINE_X, LINE_Y, LINE_X, LINE_Y, { color: color.focus, width: 4 });
        for(let i = 0; i <= 6; i++) {
            draw.line(LINE_X + i * R, LINE_Y - 7, LINE_X + i * R, LINE_Y + 7, { color: color.dim, width: 1.5 });
            draw.text(String(i), LINE_X + i * R, LINE_Y + 28, { color: color.dim, size: 13, anchor: 'middle' });
        }
        draw.text('the arc, straightened, measured in radii', LINE_X, LINE_Y - 22, { color: color.dim, size: 13 });
        draw.text('1 radian is about 57.3 degrees', 400, 230, { color: color.dim, size: 14 });

        const degText = draw.text('', 400, 90, { mono: true, size: 16, color: color.ink });
        const radText = draw.text('', 400, 126, { mono: true, size: 16, color: color.focus });
        const note = draw.text('', 400, 170, { size: 14, color: color.dim });

        return ({ p }) => {
            const deg = p.angle;
            const rad = (deg * Math.PI) / 180;
            const [x1, y1] = point(rad, R);

            hand.to(CX, CY, x1, y1);
            const large = deg > 180 ? 1 : 0;
            arc.d(deg < 0.5 ? '' : deg >= 359.5
                ? `M${CX + R} ${CY}A${R} ${R} 0 1 0 ${CX - R} ${CY}A${R} ${R} 0 1 0 ${CX + R} ${CY}`
                : `M${CX + R} ${CY}A${R} ${R} 0 ${large} 0 ${x1.toFixed(1)} ${y1.toFixed(1)}`);
            unrolled.to(LINE_X, LINE_Y, LINE_X + rad * R, LINE_Y);

            degText.text(`${deg.toFixed(0)} degrees`);
            radText.text(`${rad.toFixed(2)} radians`);
            note.text(deg >= 359.5 ? 'the whole circle: 2 pi radians' : deg === 180 ? 'half a circle: pi radians' : deg === 90 ? 'a quarter: pi / 2 radians' : '');
        };
    },
});
