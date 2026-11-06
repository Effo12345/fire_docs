// Steps through C++ line by line while its variables update. Each variable is a labeled
// box, so readers can see exactly what every line does to memory.
import { defineScene, type SceneDef } from './scene';
import { color } from './palette';

export interface CodeStep {
    line: number; // 1-indexed line of code being run
    vars?: Record<string, string | number>; // Variables that change on this step
    out?: string; // Text this step prints
    note?: string; // One sentence on what just happened
}

export interface CodeSceneOptions {
    label: string;
    code: string;
    steps: CodeStep[];
    stepTime?: number;
    autoplay?: boolean;
}

const KEYWORDS = /\b(int|double|float|bool|char|void|const|auto|return|if|else|while|for|true|false|break|continue|struct|class|public|private)\b/;
const TOKENS = /(\/\/.*$|"[^"]*"|\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*(?=\()|\b[A-Za-z_]\w*\b|\s+|.)/g;

const tokenColor = (token: string) => {
    if(token.startsWith('//')) return color.faint;
    if(token.startsWith('"') || /^\d/.test(token)) return color.target;
    if(KEYWORDS.test(token) && /^\w+$/.test(token)) return color.value;
    return null;
};

export const defineCodeScene = (o: CodeSceneOptions): SceneDef => {
    const stepTime = o.stepTime ?? 1.6;
    const lines = o.code.replace(/^\n+|\s+$/g, '').split('\n');
    const lineHeight = 26;
    const codeTop = 28;
    const maxChars = Math.max(...lines.map((line) => line.length));
    const charWidth = 8.4;
    const codeWidth = Math.max(330, 50 + maxChars * charWidth);
    const hasOut = o.steps.some((step) => step.out);
    const names = [...new Set(o.steps.flatMap((step) => Object.keys(step.vars ?? {})))];
    const width = 720;
    const boxesPerRow = Math.max(1, Math.floor((width - codeWidth - 30) / 78));
    const boxRows = Math.ceil(names.length / boxesPerRow);
    const panelHeight = 34 + boxRows * 76 + (hasOut ? 74 : 0);
    const height = Math.max(codeTop + lines.length * lineHeight + 24, panelHeight);

    // Work out the full state after each step ahead of time
    const states: Record<string, string | number>[] = [];
    const outputs: string[] = [];
    o.steps.reduce<[Record<string, string | number>, string]>(([vars, out], step) => {
        const nextVars = { ...vars, ...step.vars };
        const nextOut = out + (step.out ?? '');
        states.push(nextVars);
        outputs.push(nextOut);
        return [nextVars, nextOut];
    }, [{}, '']);

    return defineScene({
        label: o.label,
        width,
        height,
        duration: o.steps.length * stepTime,
        autoplay: o.autoplay,
        beats: o.steps.flatMap((step, i) => (step.note ? [{ at: i * stepTime, text: step.note }] : [])),
        build({ draw }) {
            const band = draw.rect(0, 0, codeWidth, lineHeight, { fill: 'rgba(244, 211, 94, 0.11)' });
            const cursor = draw.path('', { color: color.focus, width: 2 });

            lines.forEach((line, i) => {
                const y = codeTop + i * lineHeight;
                draw.text(i + 1, 26, y, { mono: true, size: 12, color: color.faint, anchor: 'end' });
                const text = draw.text('', 44, y, { mono: true, size: 14 });
                text.el.setAttribute('xml:space', 'preserve');
                text.el.style.whiteSpace = 'pre';
                for (const token of line.match(TOKENS) ?? []) {
                    const span = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                    span.textContent = token;
                    const isCall = /^[A-Za-z_]\w*$/.test(token) && line.includes(`${token}(`) && !KEYWORDS.test(token);
                    span.setAttribute('fill', tokenColor(token) ?? (isCall ? color.focus : color.ink));
                    text.el.appendChild(span);
                }
            });

            const panelX = codeWidth + 30;
            const boxes = names.map((name, i) => {
                const x = panelX + (i % boxesPerRow) * 78;
                const y = 34 + Math.floor(i / boxesPerRow) * 76;
                draw.text(name, x + 33, y - 8, { mono: true, size: 13, color: color.dim, anchor: 'middle' });
                const box = draw.rect(x, y, 66, 40, { color: color.dim, width: 1.25 });
                const value = draw.text('', x + 33, y + 26, { mono: true, size: 16, anchor: 'middle', color: color.value });
                return { name, box, value };
            });

            const outTop = 34 + boxRows * 76 + 8;
            let outText: ReturnType<typeof draw.text> | null = null;
            if(hasOut) {
                draw.text('output', panelX, outTop, { size: 13, color: color.dim });
                draw.line(panelX, outTop + 6, width - 4, outTop + 6, { color: color.rule, width: 1 });
                outText = draw.text('', panelX, outTop + 28, { mono: true, size: 14 });
            }

            return ({ t }) => {
                const index = Math.min(o.steps.length - 1, Math.floor(t / stepTime));
                const step = o.steps[index];
                const within = Math.min(1, (t - index * stepTime) / (stepTime * 0.25));
                const prevLine = o.steps[Math.max(0, index - 1)].line;
                const eased = 1 - Math.pow(1 - within, 3);
                const row = prevLine + (step.line - prevLine) * eased;
                const bandY = codeTop + (row - 1) * lineHeight - lineHeight * 0.72;
                band.set({ y: bandY });
                cursor.set({ d: `M31 ${bandY + 7} l6 6 l-6 6` });

                const vars = states[index];
                for (const { name, box, value } of boxes) {
                    const changed = step.vars && name in step.vars;
                    value.text(name in vars ? vars[name] : '');
                    box.set({ stroke: changed && within < 1 ? color.focus : color.dim, 'stroke-width': changed && within < 1 ? 2 : 1.25 });
                }
                outText?.text(outputs[index]);
            };
        },
    });
};
