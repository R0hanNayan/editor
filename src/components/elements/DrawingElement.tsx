'use client';

import React from 'react';
import { Line } from 'react-konva';
import { SVGElement } from '@/types/svg';
import Konva from 'konva';

interface DrawingElementProps {
  element: SVGElement;
  isSelected: boolean;
  onSelect: (elementId: string) => void;
  onUpdate: (elementId: string, updates: Partial<SVGElement>) => void;
  isMultiSelected: boolean;
}

export const DrawingElement: React.FC<DrawingElementProps> = React.memo(({
  element,
  isSelected,
  onSelect,
  onUpdate,
  isMultiSelected,
}) => {
  if (element.type !== 'drawing' || !element.points || element.points.length < 4) {
    return null;
  }

  return (
    <Line
      id={`shape-${element.id}`}
      points={element.points}
      stroke={element.stroke === 'transparent' || element.stroke === 'none' ? undefined : element.stroke}
      strokeOpacity={element.strokeOpacity}
      strokeWidth={element.strokeWidth}
      tension={0.5}
      lineCap="round"
      lineJoin="round"
      globalCompositeOperation="source-over"
      // Make it easier to select by increasing hit area
      hitStrokeWidth={Math.max(10, element.strokeWidth + 5)}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(element.id);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect(element.id);
      }}
      perfectDrawEnabled={false}
      // Enable drag for single selection, disable for multi-selection
      draggable={!isMultiSelected && isSelected}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        if (isMultiSelected) return;
        
        const node = e.target as Konva.Line;
        const deltaX = node.x();
        const deltaY = node.y();
        
        // Reset position since we'll update the points directly
        node.position({ x: 0, y: 0 });
        
        // Update all points by the delta
        const newPoints = element.points!.map((point, index) => {
          if (index % 2 === 0) {
            return point + deltaX; // x coordinate
          } else {
            return point + deltaY; // y coordinate
          }
        });
        
        onUpdate(element.id, { points: newPoints });
      }}
      // Add visual feedback for selection
      shadowColor={isSelected ? '#3b82f6' : undefined}
      shadowBlur={isSelected ? 8 : 0}
      shadowOpacity={isSelected ? 0.3 : 0}
      shadowOffsetX={0}
      shadowOffsetY={0}
    />
  );
});

DrawingElement.displayName = 'DrawingElement';
