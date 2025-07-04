import { PathPoint, Point } from '@/types/svg';

export const generateId = (): string => {
  return `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const parsePathData = (pathData: string): PathPoint[] => {
  const points: PathPoint[] = [];
  const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
  
  commands.forEach((command, index) => {
    const type = command[0];
    const values = command.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    
    switch (type.toLowerCase()) {
      case 'm':
        if (values.length >= 2) {
          points.push({
            id: generateId(),
            type: 'move',
            x: values[0],
            y: values[1]
          });
        }
        break;
      case 'l':
        if (values.length >= 2) {
          points.push({
            id: generateId(),
            type: 'line',
            x: values[0],
            y: values[1]
          });
        }
        break;
      case 'c':
        if (values.length >= 6) {
          points.push({
            id: generateId(),
            type: 'curve',
            x: values[4],
            y: values[5],
            controlPoint1: { x: values[0], y: values[1] },
            controlPoint2: { x: values[2], y: values[3] }
          });
        }
        break;
      case 'z':
        points.push({
          id: generateId(),
          type: 'close',
          x: 0,
          y: 0
        });
        break;
    }
  });
  
  return points;
};

export const pathPointsToString = (points: PathPoint[]): string => {
  return points.map(point => {
    switch (point.type) {
      case 'move':
        return `M ${point.x} ${point.y}`;
      case 'line':
        return `L ${point.x} ${point.y}`;
      case 'curve':
        if (point.controlPoint1 && point.controlPoint2) {
          return `C ${point.controlPoint1.x} ${point.controlPoint1.y} ${point.controlPoint2.x} ${point.controlPoint2.y} ${point.x} ${point.y}`;
        }
        return `L ${point.x} ${point.y}`;
      case 'close':
        return 'Z';
      default:
        return '';
    }
  }).join(' ');
};

export const getPointDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const isPointNearPath = (point: Point, pathPoints: PathPoint[], threshold: number = 10): boolean => {
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const p1 = pathPoints[i];
    const p2 = pathPoints[i + 1];
    
    if (p2.type === 'close') continue;
    
    const distance = getDistanceToLineSegment(point, p1, p2);
    if (distance <= threshold) {
      return true;
    }
  }
  return false;
};

const getDistanceToLineSegment = (point: Point, lineStart: Point, lineEnd: Point): number => {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};
