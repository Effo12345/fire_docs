import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

// Rough figures for a processor of this class. The relative sizes are what matter.
const LEVELS = [
    { name: 'register', real: '1.5 ns', scaled: '1 second', ns: 1.5 },
    { name: 'cache', real: '6 ns', scaled: '4 seconds', ns: 6 },
    { name: 'RAM', real: '100 ns', scaled: 'about 1 minute', ns: 100 },
    { name: 'SD card', real: '1 ms', scaled: 'about 8 days', ns: 1000000 },
];

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

export default defineScene({
    label: 'Four bars on a logarithmic scale comparing how long a read takes from a register, cache, RAM and an SD card',
    duration: 8,
    height: 280,
    beats: [
        { at: 0, text: 'A <em>register</em> can be read within one tick of the CPU\'s clock. Pretend that tick lasts one whole second.' },
        { at: 1.5, text: 'On that scale, the <em>cache</em> takes a few seconds. Not bad.' },
        { at: 3, text: '<em>RAM</em> takes about a minute, long enough to get up and refill your water.' },
        { at: 4.5, text: 'An SD card takes over a week. This is why a robot never reads an SD card in the middle of a control loop.' },
    ],
    build({ draw }) {
        const left = 96;
        const right = 470;
        const maxLog = Math.log10(1000000 / 1.5);
        const widths = LEVELS.map((level) => 6 + (Math.log10(level.ns / 1.5) / maxLog) * (right - left - 6));

        draw.text('read time', 488, 28, { color: color.dim, size: 13 });
        draw.text('if a register took 1 s', 572, 28, { color: color.dim, size: 13 });

        const rows = LEVELS.map((level, i) => {
            const y = 52 + i * 52;
            draw.text(level.name, left - 12, y + 19, { size: 15, anchor: 'end' });
            draw.line(left, y - 4, left, y + 34, { color: color.rule, width: 1 });
            const bar = draw.rect(left, y + 4, 0, 22, { fill: i === 3 ? color.error : color.value });
            const real = draw.text(level.real, 488, y + 20, { mono: true, size: 13, color: color.dim });
            const scaled = draw.text(level.scaled, 572, y + 20, { size: 14 });
            return { bar, real, scaled };
        });
        draw.text('each step to the right is much longer than the last (logarithmic scale)', left, 268, { color: color.faint, size: 12 });

        return ({ t }) => {
            rows.forEach(({ bar, real, scaled }, i) => {
                const grown = ease((t - i * 1.5 - 0.2) / 1.1);
                bar.set({ width: widths[i] * grown });
                real.opacity(grown);
                scaled.opacity(grown);
            });
        };
    },
});
