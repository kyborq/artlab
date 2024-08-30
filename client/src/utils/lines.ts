import { TPoint } from "@/store/useArtStore";

export const simplifyLine = (points: TPoint[], tolerance: number): TPoint[] => {
  if (points.length <= 2) return points;

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  let maxDistance = 0;
  let index = -1;

  for (let i = 1; i < points.length - 1; i++) {
    const distance = pointToLineDistance(points[i], firstPoint, lastPoint);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = simplifyLine(points.slice(0, index + 1), tolerance);
    const right = simplifyLine(points.slice(index), tolerance);
    return left.slice(0, left.length - 1).concat(right);
  } else {
    return [firstPoint, lastPoint];
  }
};

export const pointToLineDistance = (
  point: TPoint,
  start: TPoint,
  end: TPoint
): number => {
  const A = point.x - start.x;
  const B = point.y - start.y;
  const C = end.x - start.x;
  const D = end.y - start.y;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  const param = len_sq !== 0 ? dot / len_sq : -1;

  let xx: number, yy: number;

  if (param < 0) {
    xx = start.x;
    yy = start.y;
  } else if (param > 1) {
    xx = end.x;
    yy = end.y;
  } else {
    xx = start.x + param * C;
    yy = start.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};
