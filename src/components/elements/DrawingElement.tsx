'use client';

import React from 'react';
import { Line } from 'react-konva';
import { SVGElement } from '@/types/svg';
import Konva from 'konva';
import { SkewHandles } from '../common/SkewHandles';

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

  // Calculate bounding box for skew handles
  const getBounds = () => {
    if (!element.points || element.points.length === 0) {
      return { width: 100, height: 100, centerX: element.x + 50, centerY: element.y + 50 };
    }
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    for (let i = 0; i < element.points.length; i += 2) {
      const x = element.points[i];
      const y = element.points[i + 1];
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    
    const width = Math.max(50, maxX - minX);
    const height = Math.max(50, maxY - minY);
    // For direct coordinates, points are absolute, so center is just their center
    const centerX = element.x + (maxX + minX) / 2;
    const centerY = element.y + (maxY + minY) / 2;
    
    return { width, height, centerX, centerY };
  };

  return (
    <>
      <Line
        id={`shape-${element.id}`}
        points={element.points}
        x={element.x}
        y={element.y}
        rotation={element.rotation || 0}
        skewX={element.skewX || 0}
        skewY={element.skewY || 0}
        stroke={element.stroke === 'transparent' || element.stroke === 'none' ? undefined : element.stroke}
        strokeOpacity={element.strokeOpacity}
        strokeWidth={element.strokeWidth}
        tension={0.5}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation="source-over"
        // Make it easier to select by increasing hit area
        hitStrokeWidth={Math.max(10, element.strokeWidth + 5)}
        draggable={!isMultiSelected && isSelected}
        onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
          if (isMultiSelected) return;
          
          const node = e.target as Konva.Line;
          const deltaX = node.x();
          const deltaY = node.y();
          
          // Reset position since we'll update the element coordinates directly
          node.position({ x: 0, y: 0 });
          
          // Update element position (direct coordinates)
          onUpdate(element.id, { 
            x: element.x + deltaX,
            y: element.y + deltaY
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
          getBounds={getBounds}
        />
      )}
    </>
  );
});

DrawingElement.displayName = 'DrawingElement';
