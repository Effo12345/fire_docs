import { defineScene } from '@kit/scene';
import { color } from '@kit/palette';

export default defineScene({
    label: 'A switch circuit with a pull-up resistor. Pressing the switch connects the wire to ground, so the voltage at the port drops from high to low.',
    duration: 0,
    height: 380,
    params: [{ key: 'pressed', label: 'switch (0 = released, 1 = pressed)', min: 0, max: 1, step: 0.01, value: 0, digits: 0 }],
    build({ draw }) {
        const wireX = 250;
        const railY = 56;
        const nodeY = 170;
        const groundY = 330;

        draw.text('high (supply)', wireX - 20, railY - 14, { color: color.dim, size: 14 });
        draw.line(wireX - 40, railY, wireX + 40, railY, { color: color.dim, width: 2 });
        draw.text('ground (low)', wireX - 20, groundY + 34, { color: color.dim, size: 14 });
        draw.line(wireX - 40, groundY, wireX + 40, groundY, { color: color.dim, width: 2 });

        // Pull-up resistor between the supply and the junction
        const upper = draw.line(wireX, railY, wireX, 84, { width: 2.5 });
        draw.rect(wireX - 12, 84, 24, 52, { color: color.ink, width: 1.75 });
        draw.text('pull-up resistor', wireX + 24, 116, { color: color.dim, size: 14 });
        const mid = draw.line(wireX, 136, wireX, nodeY, { width: 2.5 });
        draw.circle(wireX, nodeY, 4.5, { fill: color.ink });

        // Wire from the junction to the port
        const portWire = draw.line(wireX, nodeY, 470, nodeY, { width: 2.5 });
        draw.rect(470, nodeY - 36, 200, 72, { color: color.ink, width: 1.75 });
        draw.text('ADI port', 570, nodeY - 12, { anchor: 'middle', size: 15 });
        const level = draw.text('', 570, nodeY + 14, { anchor: 'middle', size: 15, mono: true });

        // The switch below the junction: a gap that a lever bridges
        const gapTop = 236;
        const down = draw.line(wireX, nodeY, wireX, gapTop, { width: 2.5 });
        draw.circle(wireX, gapTop, 4, { fill: color.ink });
        const lever = draw.line(wireX, gapTop, wireX, 292, { color: color.focus, width: 3 });
        draw.circle(wireX, 292, 4, { fill: color.ink });
        const lower = draw.line(wireX, 292, wireX, groundY, { width: 2.5 });
        draw.text('switch', wireX + 60, 270, { color: color.dim, size: 14 });

        const status = draw.text('', 570, nodeY + 76, { anchor: 'middle', size: 14, color: color.dim });
        const current = draw.text('', wireX - 24, 230, { anchor: 'end', size: 14, color: color.focus });

        return ({ p }) => {
            const pressedNow = p.pressed > 0.5;

            // Lever swings from hanging free to touching the lower contact
            const angle = (1 - p.pressed) * 0.9;
            lever.to(wireX, gapTop, wireX + 56 * Math.sin(angle), gapTop + 56 * Math.cos(angle));

            // With the switch open, no current flows, so the whole wire sits at the supply level
            const wireColor = pressedNow ? color.rule : color.value;
            upper.set({ stroke: pressedNow ? color.focus : color.value });
            down.set({ stroke: pressedNow ? color.focus : color.value });
            mid.set({ stroke: pressedNow ? color.focus : color.value });
            lower.set({ stroke: pressedNow ? color.focus : color.rule });
            portWire.set({ stroke: wireColor });

            level.text(pressedNow ? 'wire: low (0)' : 'wire: high (1)').set({ fill: pressedNow ? color.dim : color.value });
            status.text(pressedNow ? 'pressed: wire tied to ground' : 'released: resistor holds it high');
            current.text(pressedNow ? 'current flows' : '');
        };
    },
});
