export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// Which step a scripted scene is on at time t, the step before it, and an eased 0 to 1 progress into the change
export function stepAt<S>(states: S[], step: number, t: number) {
    const index = Math.max(0, Math.min(states.length - 1, Math.floor(t / step)));
    const within = Math.min(1, (t - index * step) / (step * 0.3));

    return {
        s: states[index],
        prev: states[Math.max(0, index - 1)],
        k: 1 - Math.pow(1 - within, 3),
        index,
    };
}
