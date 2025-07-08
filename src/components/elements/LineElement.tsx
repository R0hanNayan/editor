'use client';

import React from 'react';
import { Line, Group, Transformer } from 'react-konva';
import { SVGElement } from '@/types/svg';
import Konva from 'konva';
import { SkewHandles } from '../common/SkewHandles';

interface LineElementProps {
  element: SVGElement;
  isSelected: boolean;
  onSelect: (elementId: string) => void;
  onUpdate: (elementId: string, updates: Partial<SVGElement>) => void;
  isMultiSelected: boolean;
}

export const LineElement: React.FC<LineElementProps> = React.memo(({
  element,
  isSelected,
  onSelect,
  onUpdate,
  isMultiSelected,
}) => {
  if (element.type !== 'line' || element.x2 === undefined || element.y2 === undefined) {
    return null;
  }

  // Calculate relative points (relative to the line's position)
  const relativePoints = [0, 0, element.x2 - element.x, element.y2 - element.y];

  return (
    <>
      <Line
        id={`shape-${element.id}`}
        points={relativePoints}
        x={element.x}
        y={element.y}
        rotation={element.rotation || 0}
        skewX={element.skewX || 0}
        skewY={element.skewY || 0}
        stroke={element.stroke === 'transparent' || element.stroke === 'none' ? undefined : element.stroke}
        strokeOpacity={element.strokeOpacity}
        strokeWidth={element.strokeWidth}
        lineCap="round"
        globalCompositeOperation="source-over"
        // Make it easier to select by increasing hit area
        hitStrokeWidth={Math.max(10, element.strokeWidth + 5)}
        draggable={!isMultiSelected && isSelected}
        onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
          if (isMultiSelected) return;
          
          const node = e.target as Konva.Line;
          const deltaX = node.x();
          const deltaY = node.y();
          
          // Reset position since we'll update the coordinates directly
          node.position({ x: 0, y: 0 });
          
          // Update start and end points
          onUpdate(element.id, { 
            x: element.x + deltaX,
            y: element.y + deltaY,
            x2: (element.x2 ?? 0) + deltaX,
            y2: (element.y2 ?? 0) + deltaY
          });
        }}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect(element.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelect(element.id);
        }}
        perfectDrawEnabled={false}
        // Add visual feedback for selection
        shadowColor={isSelected ? '#3b82f6' : undefined}
        shadowBlur={isSelected ? 8 : 0}
        shadowOpacity={isSelected ? 0.3 : 0}
        shadowOffsetX={0}
        shadowOffsetY={0}
      />
      
      {/* Skew Mode Handles */}
      {isSelected && !isMultiSelected && element.selectionMode === 'skew' && (
        <SkewHandles
          element={element}
          onUpdate={(updates) => onUpdate(element.id, updates)}
          getBounds={() => {
            const lineLength = Math.sqrt(
              Math.pow((element.x2 ?? 0) - element.x, 2) + 
              Math.pow((element.y2 ?? 0) - element.y, 2)
            );
            return {
              width: Math.abs((element.x2 ?? 0) - element.x) || lineLength,
              height: Math.abs((element.y2 ?? 0) - element.y) || 20, // Minimum height for handles
              centerX: element.x + ((element.x2 ?? 0) - element.x) / 2,
              centerY: element.y + ((element.y2 ?? 0) - element.y) / 2
            };
          }}
        />
      )}
    </>
  );
});

LineElement.displayName = 'LineElement';
