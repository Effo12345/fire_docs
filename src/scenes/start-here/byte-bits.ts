import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

export default defineScene({
    label: 'Eight bits with place values from 128 down to 1. A slider sets a number from 0 to 255 and shows which bits are on.',
    duration: 0,
    height: 200,
    params: [{ key: 'value', label: 'value', min: 0, max: 255, step: 1, value: 37, digits: 0 }],
    build({ draw }) {
        const places = [128, 64, 32, 16, 8, 4, 2, 1];
        const left = 112;
        const size = 62;
        const cells = places.map((place, i) => {
            const x = left + i * size;
            draw.text(place, x + size / 2, 28, { color: color.dim, size: 14, anchor: 'middle' });
            const box = draw.rect(x + 3, 40, size - 6, size - 6, { color: color.rule, width: 1.25 });
            const digit = draw.text('0', x + size / 2, 75, { mono: true, size: 22, anchor: 'middle' });
            return { place, box, digit };
        });
        draw.text('byte', left - 16, 74, { color: color.dim, size: 14, anchor: 'end' });
        const sum = draw.text('', 360, 136, { size: 18, anchor: 'middle', color: color.focus });
        const forms = draw.text('', 360, 172, { mono: true, size: 14, anchor: 'middle', color: color.dim });

        return ({ p }) => {
            const value = Math.round(p.value);
            const on: number[] = [];
            for (const { place, box, digit } of cells) {
                const lit = (value & place) !== 0;
                digit.text(lit ? 1 : 0).set({ fill: lit ? color.value : color.faint });
                box.set({ stroke: lit ? color.value : color.rule });
                if(lit) on.push(place);
            }
            sum.text(on.length ? `${on.join(' + ')} = ${value}` : '0');
            const binary = value.toString(2).padStart(8, '0');
            const hex = value.toString(16).toUpperCase().padStart(2, '0');
            forms.text(`decimal ${value}    binary ${binary}    hexadecimal 0x${hex}`);
        };
    },
});
