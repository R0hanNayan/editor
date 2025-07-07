'use client';

import React from 'react';
import { Line, Group, Transformer } from 'react-konva';
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

  // Calculate center offset for drawing points
  const getDrawingCenterOffset = () => {
    if (!element.points || element.points.length === 0) {
      return { x: 0, y: 0 };
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
    
    return {
      x: (maxX + minX) / 2,
      y: (maxY + minY) / 2
    };
  };

  const centerOffset = getDrawingCenterOffset();

  // Adjust points to be relative to center offset
  const adjustedPoints = element.points.map((coord, index) => {
    if (index % 2 === 0) {
      // X coordinate
      return coord - centerOffset.x;
    } else {
      // Y coordinate
      return coord - centerOffset.y;
    }
  });

  return (
    <Group
      id={`shape-group-${element.id}`}
      x={element.x + centerOffset.x}
      y={element.y + centerOffset.y}
      offsetX={centerOffset.x}
      offsetY={centerOffset.y}
      rotation={element.rotation || 0}
      skewX={element.skewX || 0}
      skewY={element.skewY || 0}
      draggable={!isMultiSelected && isSelected}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        if (isMultiSelected) return;
        
        const node = e.target as Konva.Group;
        const pos = node.position();
        
        onUpdate(element.id, { 
          x: pos.x - centerOffset.x,
          y: pos.y - centerOffset.y
        });
      }}
    >
      <Line
        id={`shape-${element.id}`}
        points={adjustedPoints}
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
            const centerOffset = getDrawingCenterOffset();
            // Calculate bounding box of drawing points
            let width = 100, height = 100;
            if (element.points && element.points.length > 0) {
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
              
              width = Math.max(50, maxX - minX);
              height = Math.max(50, maxY - minY);
            }
            
            return {
              width,
              height,
              centerX: element.x + centerOffset.x,
              centerY: element.y + centerOffset.y
            };
          }}
        />
      )}
    </Group>
  );
});

DrawingElement.displayName = 'DrawingElement';
