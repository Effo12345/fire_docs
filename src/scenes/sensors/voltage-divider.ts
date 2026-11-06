import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';
import { readDivider, travelDegrees, MAX_COUNT } from './lib/divider';

const RES_X = 70;
const TOP = 70;
const BOTTOM = 320;
const BAR_X = 200;

export default defineScene({
    label: 'A potentiometer drawn as a resistor with a sliding contact. The contact picks off a voltage between about 0 and 5 volts that is proportional to the shaft angle, and the converter turns that voltage into a count from 0 to 4095.',
    width: 480,
    duration: 0,
    height: 400,
    params: [
        { key: 'shaft', label: 'shaft angle (degrees)', min: 0, max: 330, step: 1, value: 100, digits: 0 },
        { key: 'v2', label: 'part: 0 = original, 1 = V2', min: 0, max: 1, step: 1, value: 0, digits: 0 },
    ],
    build({ draw }) {
        const yAt = (fraction: number) => BOTTOM - fraction * (BOTTOM - TOP);

        // Supply and ground rails
        draw.line(RES_X - 40, TOP - 20, RES_X + 40, TOP - 20, { color: color.dim, width: 2 });
        draw.text('about 5 V', RES_X + 48, TOP - 15, { color: color.dim, size: 14 });
        draw.line(RES_X, TOP - 20, RES_X, TOP, { width: 2.5 });
        draw.line(RES_X - 40, BOTTOM + 20, RES_X + 40, BOTTOM + 20, { color: color.dim, width: 2 });
        draw.text('0 V (ground)', RES_X + 48, BOTTOM + 25, { color: color.dim, size: 14 });
        draw.line(RES_X, BOTTOM, RES_X, BOTTOM + 20, { width: 2.5 });

        // The resistor, split in two by the contact
        draw.rect(RES_X - 14, TOP, 28, BOTTOM - TOP, { color: color.ink, width: 1.75 });
        const upper = draw.line(RES_X, TOP, RES_X, TOP, { color: color.rule, width: 8 });
        const lower = draw.line(RES_X, BOTTOM, RES_X, BOTTOM, { color: color.value, width: 8 });

        // Contact, and the wire that carries its voltage to the converter
        const contact = draw.circle(0, 0, 6, { fill: color.focus });
        const wire = draw.line(RES_X + 14, BOTTOM, BAR_X, BOTTOM, { color: color.value, width: 2.5 });

        // Converter scale, 0 at the bottom and 4095 at the top
        draw.rect(BAR_X, TOP, 26, BOTTOM - TOP, { color: color.ink, width: 1.75 });
        draw.text('ADC', BAR_X + 13, TOP - 14, { size: 15, anchor: 'middle' });
        draw.text(`${MAX_COUNT}`, BAR_X + 34, TOP + 5, { color: color.dim, size: 13, mono: true });
        draw.text('0', BAR_X + 34, BOTTOM + 5, { color: color.dim, size: 13, mono: true });
        const fill = draw.line(BAR_X + 13, BOTTOM, BAR_X + 13, BOTTOM, { color: color.value, width: 12 });

        const readVolts = draw.text('', 270, 150, { mono: true, size: 15, color: color.value });
        const readCount = draw.text('', 270, 180, { mono: true, size: 15, color: color.value });
        const readAngle = draw.text('', 270, 210, { mono: true, size: 15, color: color.focus });
        const readStep = draw.text('', 270, 250, { size: 13, color: color.dim });
        const note = draw.text('', 270, 272, { size: 13, color: color.dim });

        return ({ p }) => {
            const v2 = p.v2 > 0.5;
            const r = readDivider(p.shaft, v2);
            const y = yAt(r.fraction);

            upper.to(RES_X, TOP, RES_X, y);
            lower.to(RES_X, y, RES_X, BOTTOM);
            contact.move(RES_X + 14, y);
            wire.to(RES_X + 14, y, BAR_X, y);
            fill.to(BAR_X + 13, BOTTOM, BAR_X + 13, y);

            readVolts.text(`voltage: ${r.volts.toFixed(2)} V`);
            readCount.text(`get_value(): ${r.count}`);
            readAngle.text(`get_angle(): ${r.angle.toFixed(1)}`);
            readStep.text(`one count = ${(travelDegrees(v2) / MAX_COUNT).toFixed(3)} degrees`);
            note.text(r.atStop ? `end of travel: ${r.angle.toFixed(0)} degrees` : '');
        };
    },
});
