import type { Draw } from '@kit/draw';
import { color } from '@kit/palette';

const KEYWORDS = /^(int|void|double|return|if|else)$/;

// Code lines with a moving highlight band, for scenes that step through a program
export function codePanel(draw: Draw, lines: string[], top = 36, lineHeight = 28) {
    const band = draw.rect(0, 0, 330, lineHeight, { fill: 'rgba(244, 211, 94, 0.11)' });

    lines.forEach((line, i) => {
        const y = top + i * lineHeight;
        draw.text(i + 1, 26, y, { mono: true, size: 12, color: color.faint, anchor: 'end' });
        const text = draw.text('', 44, y, { mono: true, size: 14 });
        text.el.setAttribute('xml:space', 'preserve');
        text.el.style.whiteSpace = 'pre';
        for (const token of line.match(/\s+|\w+|./g) ?? []) {
            const span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            span.textContent = token;
            span.setAttribute('fill', KEYWORDS.test(token) ? color.value : /^\d+$/.test(token) ? color.target : color.ink);
            text.el.appendChild(span);
        }
    });

    return (line: number) => band.set({ y: top + (line - 1) * lineHeight - lineHeight * 0.7 });
}
