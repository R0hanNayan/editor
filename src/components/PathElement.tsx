'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Group, Path, Circle, Line, Transformer } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { SVGElement, PathPoint, Point } from '@/types/svg';
import { pathPointsToString } from '@/utils/svg';
import Konva from 'konva';

interface PathElementProps {
  element: SVGElement;
  isSelected: boolean;
  isMultiSelected: boolean; // Add this to know if part of multi-selection
  onSelect: () => void;
  onUpdate: (updates: Partial<SVGElement>) => void;
}

const CONTROL_POINT_RADIUS = 4;
const CONTROL_POINT_COLOR = '#3b82f6';
const SELECTED_STROKE_COLOR = '#3b82f6';

export const PathElement: React.FC<PathElementProps> = React.memo(({
  element,
  isSelected,
  isMultiSelected,
  onSelect,
  onUpdate,
}) => {
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null);
  const pathRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && element.selectionMode === 'transform' && !isMultiSelected) {
      // Only attach transformer if not part of multi-selection
      if (trRef.current && pathRef.current) {
        trRef.current.nodes([pathRef.current]);
        trRef.current.getLayer()?.batchDraw();
      }
    }
  }, [isSelected, isMultiSelected, element.selectionMode, element.path?.points]);

  // For demonstration, create a simple path if none exists
  const pathPoints: PathPoint[] = element.path?.points || [
    { id: '1', type: 'move', x: 0, y: 0 },
    { id: '2', type: 'line', x: 100, y: 0 },
    { id: '3', type: 'line', x: 100, y: 100 },
    { id: '4', type: 'line', x: 0, y: 100 },
    { id: '5', type: 'close', x: 0, y: 0 },
  ];

  const pathData = pathPointsToString(pathPoints);

  const handlePathClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect();
  };

  const handlePointDragStart = (pointId: string) => {
    setDraggedPointId(pointId);
  };

  const handlePointDragMove = (pointId: string, newPos: Point) => {
    if (draggedPointId !== pointId) return;

    // Update the path in real-time during drag
    const updatedPoints = pathPoints.map(point =>
      point.id === pointId ? { ...point, x: newPos.x, y: newPos.y } : point
    );

    onUpdate({
      path: {
        ...element.path!,
        points: updatedPoints,
      },
    });
  };

  const handlePointDragEnd = (pointId: string, finalPos: Point) => {
    // Final position update - ensure consistency
    const updatedPoints = pathPoints.map(point =>
      point.id === pointId ? { ...point, x: finalPos.x, y: finalPos.y } : point
    );

    onUpdate({
      path: {
        ...element.path!,
        points: updatedPoints,
      },
    });

    setDraggedPointId(null);
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const pos = e.target.position();
    // Use requestAnimationFrame to batch the update
    requestAnimationFrame(() => {
      onUpdate({ x: pos.x, y: pos.y });
    });
  };

  const handleTransformEnd = () => {
    if (pathRef.current) {
      const node = pathRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const rotation = node.rotation();
      
      // Reset transforms
      node.scaleX(1);
      node.scaleY(1);
      node.rotation(0);

      // Normalize rotation to prevent accumulation issues
      const normalizeRotation = (rot: number) => {
        rot = rot % 360;
        if (rot > 180) rot -= 360;
        if (rot < -180) rot += 360;
        return rot;
      };
      
      // For paths, we need to scale the actual path points
      if (element.path && (scaleX !== 1 || scaleY !== 1)) {
        const scaledPoints = element.path.points.map(point => ({
          ...point,
          x: point.x * scaleX,
          y: point.y * scaleY,
          controlPoint1: point.controlPoint1 ? {
            x: point.controlPoint1.x * scaleX,
            y: point.controlPoint1.y * scaleY
          } : undefined,
          controlPoint2: point.controlPoint2 ? {
            x: point.controlPoint2.x * scaleX,
            y: point.controlPoint2.y * scaleY
          } : undefined,
        }));
        
        onUpdate({
          x: node.x(),
          y: node.y(),
          rotation: normalizeRotation(rotation),
          path: {
            ...element.path,
            points: scaledPoints,
          },
        });
      } else {
        onUpdate({
          x: node.x(),
          y: node.y(),
          rotation: normalizeRotation(rotation),
        });
      }
    }
  };

  const renderPathContent = () => (
    <Group
      ref={pathRef}
      id={`shape-${element.id}`}
      x={element.x}
      y={element.y}
      rotation={element.rotation || 0}
      draggable={!isMultiSelected} // Disable individual dragging when multi-selected
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {/* Main Path */}
      <Path
        data={pathData}
        fill={element.fill === 'transparent' || element.fill === 'none' ? undefined : element.fill}
        fillOpacity={element.fillOpacity}
        stroke={isSelected ? SELECTED_STROKE_COLOR : (element.stroke === 'transparent' || element.stroke === 'none' ? undefined : element.stroke)}
        strokeOpacity={isSelected ? 1 : element.strokeOpacity}
        strokeWidth={isSelected ? element.strokeWidth + 1 : element.strokeWidth}
        onClick={handlePathClick}
        onTap={handlePathClick}
        perfectDrawEnabled={false}
      />

      {/* Control Points (only show when in edit mode) */}
      {isSelected && element.selectionMode === 'edit' && pathPoints.map(point => {
        if (point.type === 'close') return null;
        
        return (
          <Circle
            key={point.id}
            x={point.x}
            y={point.y}
            radius={CONTROL_POINT_RADIUS}
            fill={CONTROL_POINT_COLOR}
            stroke="white"
            strokeWidth={1}
            draggable
            onDragStart={(e) => {
              e.cancelBubble = true; // Prevent event from bubbling
              handlePointDragStart(point.id);
            }}
            onDragMove={(e) => {
              e.cancelBubble = true; // Prevent event from bubbling
              const pos = e.target.position();
              handlePointDragMove(point.id, pos);
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true; // Prevent event from bubbling to the parent Group
              const pos = e.target.position();
              handlePointDragEnd(point.id, pos);
            }}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (container) {
                container.style.cursor = 'pointer';
              }
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (container) {
                container.style.cursor = 'default';
              }
            }}
          />
        );
      })}

      {/* Control Point Handles for Bezier Curves (only show when in edit mode) */}
      {isSelected && element.selectionMode === 'edit' && pathPoints.map(point => {
        if (point.type !== 'curve' || !point.controlPoint1 || !point.controlPoint2) {
          return null;
        }

        return (
          <Group key={`control-${point.id}`}>
            {/* Control Point 1 */}
            <Circle
              x={point.controlPoint1.x}
              y={point.controlPoint1.y}
              radius={CONTROL_POINT_RADIUS - 1}
              fill="white"
              stroke={CONTROL_POINT_COLOR}
              strokeWidth={1}
              draggable
              onDragMove={(e) => {
                e.cancelBubble = true; // Prevent event from bubbling
                const pos = e.target.position();
                const updatedPoints = pathPoints.map(p =>
                  p.id === point.id 
                    ? { ...p, controlPoint1: pos }
                    : p
                );
                onUpdate({
                  path: {
                    ...element.path!,
                    points: updatedPoints,
                  },
                });
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true; // Prevent event from bubbling
                const pos = e.target.position();
                const updatedPoints = pathPoints.map(p =>
                  p.id === point.id 
                    ? { ...p, controlPoint1: pos }
                    : p
                );
                onUpdate({
                  path: {
                    ...element.path!,
                    points: updatedPoints,
                  },
                });
              }}
            />
            
            {/* Control Point 2 */}
            <Circle
              x={point.controlPoint2.x}
              y={point.controlPoint2.y}
              radius={CONTROL_POINT_RADIUS - 1}
              fill="white"
              stroke={CONTROL_POINT_COLOR}
              strokeWidth={1}
              draggable
              onDragMove={(e) => {
                e.cancelBubble = true; // Prevent event from bubbling
                const pos = e.target.position();
                const updatedPoints = pathPoints.map(p =>
                  p.id === point.id 
                    ? { ...p, controlPoint2: pos }
                    : p
                );
                onUpdate({
                  path: {
                    ...element.path!,
                    points: updatedPoints,
                  },
                });
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true; // Prevent event from bubbling
                const pos = e.target.position();
                const updatedPoints = pathPoints.map(p =>
                  p.id === point.id 
                    ? { ...p, controlPoint2: pos }
                    : p
                );
                onUpdate({
                  path: {
                    ...element.path!,
                    points: updatedPoints,
                  },
                });
              }}
            />
          </Group>
        );
      })}
    </Group>
  );

  return (
    <React.Fragment>
      {renderPathContent()}
      {isSelected && element.selectionMode === 'transform' && !isMultiSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
          anchorSize={8}
          anchorStroke="#3b82f6"
          anchorStrokeWidth={2}
          anchorFill="#ffffff"
          anchorCornerRadius={2}
          borderStroke="#3b82f6"
          borderStrokeWidth={2}
          borderDash={[4, 4]}
        />
      )}
    </React.Fragment>
  );
});
