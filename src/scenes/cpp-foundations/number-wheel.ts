import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

const CX = 190;
const CY = 200;
const R = 120;

export default defineScene({
    label: 'A wheel of the 256 values a single byte can hold. A slider picks a number to store, and the wheel shows what the byte actually holds when read as unsigned and as signed, wrapping around when the number does not fit.',
    duration: 0,
    height: 400,
    params: [{ key: 'n', label: 'number to store', min: -140, max: 300, step: 1, value: 100, digits: 0 }],
    build({ draw }) {
        const angle = (v: number) => (v / 256) * Math.PI * 2 - Math.PI / 2;
        const at = (v: number, r: number): [number, number] => [CX + r * Math.cos(angle(v)), CY + r * Math.sin(angle(v))];

        draw.circle(CX, CY, R, { color: color.rule, width: 1.5 });
        for (let v = 0; v < 256; v += 16) {
            const [x1, y1] = at(v, R - 6);
            const [x2, y2] = at(v, R);
            draw.line(x1, y1, x2, y2, { color: color.dim, width: 1 });
        }

        // Unsigned names outside, signed names inside
        for (const v of [0, 64, 128, 192]) {
            const [ox, oy] = at(v, R + 22);
            draw.text(v, ox, oy + 5, { mono: true, size: 14, anchor: 'middle', color: color.dim });
            const [ix, iy] = at(v, R - 28);
            draw.text(v < 128 ? v : v - 256, ix, iy + 5, { mono: true, size: 14, anchor: 'middle', color: color.faint });
        }
        draw.text('outer numbers: unsigned', CX, CY + R + 52, { size: 13, anchor: 'middle', color: color.dim });
        draw.text('inner numbers: signed', CX, CY + R + 72, { size: 13, anchor: 'middle', color: color.faint });

        const hand = draw.line(CX, CY, CX, CY, { color: color.value, width: 2 });
        const dot = draw.circle(CX, CY, 7, { fill: color.focus });

        const row = (label: string, y: number) => {
            draw.text(label, 400, y, { size: 14, color: color.dim });
            return draw.text('', 400, y + 30, { mono: true, size: 20 });
        };
        const asked = row('number you asked to store', 90);
        const bits = row('the byte holds', 160);
        const unsignedText = row('read as unsigned (std::uint8_t)', 230);
        const signedText = row('read as signed (std::int8_t)', 300);
        const wrapNote = draw.text('', 400, 372, { size: 14, color: color.error });

        return ({ p }) => {
            const n = Math.round(p.n);
            const byte = ((n % 256) + 256) % 256;
            const signed = byte < 128 ? byte : byte - 256;

            const [x, y] = at(byte, R);
            hand.to(CX, CY, x, y);
            dot.set({ cx: x, cy: y });

            asked.text(n);
            bits.text(byte.toString(2).padStart(8, '0')).set({ fill: color.value });
            unsignedText.text(byte).set({ fill: byte === n ? color.ink : color.error });
            signedText.text(signed).set({ fill: signed === n ? color.ink : color.error });
            const wrapped = byte !== n || signed !== n;
            wrapNote.text(wrapped ? 'Red: not the number you asked for.' : '');
        };
    },
});
