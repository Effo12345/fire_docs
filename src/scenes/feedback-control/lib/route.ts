// A route of straight legs and clockwise turns, where every turn comes out a little off
// and every leg comes out a little short. Pure math with no drawing. Units are inches
// and degrees, and headings are compass style: 0 along +y, positive clockwise.

export const START = { x: 30, y: 30 };
export const LEGS = [72, 60, 48, 36];

export interface RoutePoint {
    x: number;
    y: number;
    heading: number; // Heading the robot has while driving the leg that starts here
}

export interface Route {
    points: RoutePoint[]; // One per leg start, plus the end
    end: { x: number; y: number };
}

// turnError is degrees every turn overshoots by. shortfall is the percent each leg comes up short
export const runRoute = (turnError: number, shortfall: number): Route => {
    const points: RoutePoint[] = [];
    let x = START.x;
    let y = START.y;
    let heading = 0;

    for(const leg of LEGS) {
        points.push({ x, y, heading });

        const rad = (heading * Math.PI) / 180;
        const driven = leg * (1 - shortfall / 100);
        x += driven * Math.sin(rad);
        y += driven * Math.cos(rad);

        heading += 90 + turnError;
    }

    points.push({ x, y, heading });
    return { points, end: { x, y } };
};

export const missDistance = (turnError: number, shortfall: number) => {
    const planned = runRoute(0, 0).end;
    const actual = runRoute(turnError, shortfall).end;
    return Math.hypot(actual.x - planned.x, actual.y - planned.y);
};
