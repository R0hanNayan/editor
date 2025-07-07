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

  // Calculate relative points (relative to the group's position)
  const relativePoints = [0, 0, element.x2 - element.x, element.y2 - element.y];
  
  // Calculate center offset for skew transform
  const centerOffsetX = (element.x2 - element.x) / 2;
  const centerOffsetY = (element.y2 - element.y) / 2;

  return (
    <Group
      id={`shape-group-${element.id}`}
      x={element.x + centerOffsetX}
      y={element.y + centerOffsetY}
      offsetX={centerOffsetX}
      offsetY={centerOffsetY}
      rotation={element.rotation || 0}
      skewX={element.skewX || 0}
      skewY={element.skewY || 0}
      draggable={!isMultiSelected && isSelected}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        if (isMultiSelected) return;
        
        const node = e.target as Konva.Group;
        const pos = node.position();
        
        // Calculate new position accounting for center offset
        const newX = pos.x - centerOffsetX;
        const newY = pos.y - centerOffsetY;
        const deltaX = newX - element.x;
        const deltaY = newY - element.y;
        
        onUpdate(element.id, { 
          x: newX,
          y: newY,
          x2: (element.x2 ?? 0) + deltaX,
          y2: (element.y2 ?? 0) + deltaY
        });
      }}
    >
      <Line
        id={`shape-${element.id}`}
        points={relativePoints}
        stroke={element.stroke === 'transparent' || element.stroke === 'none' ? undefined : element.stroke}
        strokeOpacity={element.strokeOpacity}
        strokeWidth={element.strokeWidth}
        lineCap="round"
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
    </Group>
  );
});

LineElement.displayName = 'LineElement';
