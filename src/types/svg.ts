export interface Point {
  x: number;
  y: number;
}

export interface PathPoint extends Point {
  id: string;
  type: 'move' | 'line' | 'curve' | 'close';
  controlPoint1?: Point;
  controlPoint2?: Point;
}

export interface SVGPath {
  id: string;
  points: PathPoint[];
  stroke: string;
  strokeWidth: number;
  fill: string;
  isSelected: boolean;
}

export interface SVGElement {
  id: string;
  type: 'path' | 'rect' | 'circle' | 'ellipse' | 'drawing' | 'line' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  radiusX?: number;
  radiusY?: number;
  rotation?: number;
  path?: SVGPath;
  // For free drawing lines
  points?: number[]; // Flat array of x,y coordinates for drawing tool
  // For straight lines
  x2?: number; // End point x for straight lines
  y2?: number; // End point y for straight lines
  // For text elements
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: string;
  stroke: string;
  strokeWidth: number;
  strokeOpacity?: number;
  fill: string;
  fillOpacity?: number;
  isSelected: boolean;
  selectionMode?: 'transform' | 'edit';
}

export interface EditorState {
  elements: SVGElement[];
  selectedElementId: string | null;
  selectedElementIds: string[]; // Add multi-selection support
  tool: 'select' | 'path' | 'rect' | 'circle' | 'pencil' | 'line' | 'text';
  zoom: number;
  pan: Point;
}
