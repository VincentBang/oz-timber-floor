const EPSILON = 1e-7;
export const MAX_ROOMS = 250;
export const MAX_POINTS = 128;
export const MAX_AREA = 100000;

const vectorArea = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
function direction(a, b, c) {
  const area = vectorArea(a, b, c);
  return Math.abs(area) <= EPSILON * Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)) ? 0 : Math.sign(area);
}
const between = (n, a, b) => n >= Math.min(a, b) - EPSILON && n <= Math.max(a, b) + EPSILON;
const onSegment = (p, a, b) => direction(a, b, p) === 0 && between(p.x, a.x, b.x) && between(p.y, a.y, b.y);
const samePoint = (a,b) => Math.hypot(a.x-b.x, a.y-b.y) <= EPSILON;

function signedDoubleArea(points) {
  const origin = points[0];
  return points.reduce((sum, point, i) => sum + vectorArea(origin, point, points[(i+1) % points.length]), 0);
}

export function metresPerPixel(a, b, value, unit) {
  const units = {m: 1, cm: 0.01, mm: 0.001};
  const metres = value * units[unit];
  if (!Number.isFinite(metres) || metres <= 0 || metres > 1000) throw Error('Enter a known distance greater than zero and no more than 1,000 metres.');
  const pixels = Math.hypot(a.x - b.x, a.y - b.y);
  if (!Number.isFinite(pixels) || pixels < 2) throw Error('Choose two distinct calibration points at least two plan pixels apart.');
  return metres / pixels;
}

function edgesMeet(a,b,c,d) {
  const x = direction(a,b,c), y = direction(a,b,d), z = direction(c,d,a), w = direction(c,d,b);
  return (x*y < 0 && z*w < 0) || onSegment(c,a,b) || onSegment(d,a,b) || onSegment(a,c,d) || onSegment(b,c,d);
}
export function roomArea(points, scale) {
  if (!Number.isFinite(scale) || scale <= 0) throw Error('Set the scale before measuring a room.');
  if (points.length < 3 || points.length > MAX_POINTS) throw Error('Trace between 3 and '+MAX_POINTS+' corners for a room.');
  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) throw Error('Use a point inside the plan.');
  }
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const a = points[i], b = points[(i+1)%n], c = points[(i+2)%n];
    if (samePoint(a,b)) throw Error('Two corners coincide. Undo the repeated point.');
    if (onSegment(c,a,b) || onSegment(a,b,c)) throw Error('A room boundary doubles back. Undo and trace around its outside edge.');
    for (let j = i+2; j < n; j++) {
      if (i === 0 && j === n-1) continue;
      if (edgesMeet(a,b,points[j],points[(j+1)%n])) throw Error('Room edges cross or touch themselves. Trace the corners in order.');
    }
  }
  const area = Math.abs(signedDoubleArea(points)) * scale * scale / 2;
  if (!Number.isFinite(area) || area < 0.01 || area > MAX_AREA) throw Error('Check the scale and trace. Each room must measure between 0.01 and 100,000 m².');
  return area;
}

function strictlyInside(p, polygon) {
  let inside = false;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i+1)%polygon.length];
    if (onSegment(p,a,b)) return false;
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x) inside = !inside;
  }
  return inside;
}

// Valid simple polygons may share a wall or a corner. Only their interiors
// count as overlapping. Collinear coincident edges can hide an overlap when
// all vertices lie on a boundary (including a duplicate traced in reverse).
export function roomsOverlap(first, second) {
  // The two interiors cannot overlap where their horizontal or vertical
  // extents are disjoint, including a shared edge at the extremes.
  for (const axis of ['x','y']) {
    const one=first.map(point=>point[axis]), two=second.map(point=>point[axis]);
    if (Math.max(...one)<=Math.min(...two) || Math.max(...two)<=Math.min(...one)) return false;
  }
  const winding = Math.sign(signedDoubleArea(first)) * Math.sign(signedDoubleArea(second));
  for (let i = 0; i < first.length; i++) {
    const a=first[i], b=first[(i+1)%first.length];
    if (strictlyInside(a,second)) return true;
    for (let j=0; j<second.length; j++) {
      const c=second[j], d=second[(j+1)%second.length];
      const x=direction(a,b,c), y=direction(a,b,d);
      if (x*y < 0 && direction(c,d,a)*direction(c,d,b) < 0) return true;
      if (x || y) continue;
      const axis=Math.abs(b.x-a.x) >= Math.abs(b.y-a.y) ? 'x' : 'y';
      const overlap=Math.min(Math.max(a[axis],b[axis]),Math.max(c[axis],d[axis])) -
        Math.max(Math.min(a[axis],b[axis]),Math.min(c[axis],d[axis]));
      if (overlap > EPSILON && winding*(b[axis]-a[axis])*(d[axis]-c[axis]) > 0) return true;
    }
  }
  if (second.some(p=>strictlyInside(p,first))) return true;
  // A chord through a concave corner can enter another room without a proper
  // edge crossing or strictly contained vertex. Split edges at boundary
  // contacts and classify each open interval between those contacts.
  function interiorSegment(polygon, other) {
    for (let i=0; i<polygon.length; i++) {
      const a=polygon[i], b=polygon[(i+1)%polygon.length];
      const axis=Math.abs(b.x-a.x)>=Math.abs(b.y-a.y) ? 'x' : 'y';
      const cuts=[0,1];
      for (const point of other) if (onSegment(point,a,b)) cuts.push((point[axis]-a[axis])/(b[axis]-a[axis]));
      cuts.sort((u,v)=>u-v);
      for (let j=1; j<cuts.length; j++) {
        if (cuts[j]<=cuts[j-1]) continue;
        const t=(cuts[j]+cuts[j-1])/2;
        if (strictlyInside({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)},other)) return true;
      }
    }
    return false;
  }
  return interiorSegment(first,second) || interiorSegment(second,first);
}
