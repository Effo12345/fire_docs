// Colors come from theme.css, so prose and animations always agree.
// value = the quantity being watched, focus = look here, target = goal, error = what's wrong.
export const color = {
    value: 'var(--fd-value)',
    focus: 'var(--fd-focus)',
    target: 'var(--fd-target)',
    error: 'var(--fd-error)',
    ink: 'var(--fd-ink)',
    dim: 'var(--fd-ink-dim)',
    faint: 'var(--fd-ink-faint)',
    rule: 'var(--fd-rule)',
    bg: 'var(--fd-bg)',
    deep: 'var(--fd-bg-deep)',
};

export type Palette = typeof color;
