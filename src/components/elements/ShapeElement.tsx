'use client';
import React, { useRef, useEffect } from 'react';
import { Rect, Circle, Ellipse, Group, Transformer } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { SVGElement } from '@/types/svg';
import Konva from 'konva';
import { SkewHandles } from '../common/SkewHandles';

interface ShapeElementProps {
  element: SVGElement;
  isSelected: boolean;
  isMultiSelected: boolean; // Add this to know if part of multi-selection
  onSelect: () => void;
  onUpdate: (updates: Partial<SVGElement>) => void;
}

export const ShapeElement: React.FC<ShapeElementProps> = React.memo(({
  element,
  isSelected,
  isMultiSelected,
  onSelect,
  onUpdate,
}) => {
  const shapeRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && element.selectionMode === 'transform' && !isMultiSelected) {
      // Only attach transformer if not part of multi-selection
      if (trRef.current && shapeRef.current) {
        trRef.current.nodes([shapeRef.current]);
        trRef.current.getLayer()?.batchDraw();
      }
    }
  }, [isSelected, isMultiSelected, element.selectionMode, element.width, element.height, element.radius, element.radiusX, element.radiusY]);

  // Calculate center offset for skew transform
  const getCenterOffset = () => {
    if (element.type === 'rect') {
      return {
        x: (element.width || 100) / 2,
        y: (element.height || 100) / 2
      };
    } else if (element.type === 'circle') {
      const radius = element.radius || 50;
      return { x: radius, y: radius };
    } else if (element.type === 'ellipse') {
      const rx = element.radiusX || 50;
      const ry = element.radiusY || 30;
      return { x: rx, y: ry };
    }
    return { x: 0, y: 0 };
  };

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect();
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const pos = e.target.position();
    // Use requestAnimationFrame to batch the update - direct coordinates
    requestAnimationFrame(() => {
      onUpdate({ x: pos.x, y: pos.y });
    });
  };

  const handleTransformEnd = () => {
    if (shapeRef.current) {
      const node = shapeRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const rotation = node.rotation();
      
      // Batch the updates with requestAnimationFrame
      requestAnimationFrame(() => {
        // Reset scale and rotation transforms on the node
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

        let updates: Partial<SVGElement> = {
          x: node.x(),
          y: node.y(),
          rotation: normalizeRotation(rotation),
        };

        if (element.type === 'rect') {
          updates.width = Math.max(5, (element.width || 100) * scaleX);
          updates.height = Math.max(5, (element.height || 100) * scaleY);
        } else if (element.type === 'circle') {
          updates.radius = Math.max(5, (element.radius || 50) * Math.max(scaleX, scaleY));
        } else if (element.type === 'ellipse') {
          updates.radiusX = Math.max(5, (element.radiusX || 50) * scaleX);
          updates.radiusY = Math.max(5, (element.radiusY || 30) * scaleY);
        }
        
        onUpdate(updates);
      });
    }
  };

  const renderShape = () => {
    // Calculate colors with opacity
    const fillColor = element.fill === 'transparent' || element.fill === 'none' 
      ? undefined 
      : element.fill;
    const strokeColor = element.stroke === 'transparent' || element.stroke === 'none' 
      ? undefined 
      : element.stroke;

    const commonProps = {
      fill: fillColor,
      fillOpacity: element.fillOpacity,
      stroke: isSelected ? '#3b82f6' : strokeColor,
      strokeOpacity: isSelected ? 1 : element.strokeOpacity,
      strokeWidth: isSelected ? element.strokeWidth + 1 : element.strokeWidth,
      onClick: handleClick,
      onTap: handleClick,
      // Performance optimizations
      perfectDrawEnabled: false,
      shadowForStrokeEnabled: false,
      hitStrokeWidth: 0,
    };

    if (element.type === 'rect') {
      return (
        <Rect
          {...commonProps}
          x={0}
          y={0}
          width={element.width || 100}
          height={element.height || 100}
        />
      );
    }

    if (element.type === 'circle') {
      const radius = element.radius || 50;
      return (
        <Circle
          {...commonProps}
          x={0}
          y={0}
          radius={radius}
        />
      );
    }

    if (element.type === 'ellipse') {
      const rx = element.radiusX || 50;
      const ry = element.radiusY || 30;
      return (
        <Ellipse
          {...commonProps}
          x={0}
          y={0}
          radiusX={rx}
          radiusY={ry}
        />
      );
    }

    return null;
  };

  return (
    <React.Fragment>
      <Group
        ref={shapeRef}
        id={`shape-${element.id}`}
        x={element.x}
        y={element.y}
        rotation={element.rotation || 0}
        skewX={element.skewX || 0}
        skewY={element.skewY || 0}
        draggable={!isMultiSelected} // Disable individual dragging when multi-selected
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        // Performance optimizations
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
      >
        {renderShape()}
      </Group>
      {isSelected && element.selectionMode === 'transform' && !isMultiSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          rotateEnabled={true}
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
      {isSelected && element.selectionMode === 'skew' && !isMultiSelected && (
        <SkewHandles
          element={element}
          onUpdate={onUpdate}
          getBounds={() => {
            if (element.type === 'rect') {
              return {
                width: element.width || 100,
                height: element.height || 100,
                centerX: element.x + (element.width || 100) / 2,
                centerY: element.y + (element.height || 100) / 2
              };
            } else if (element.type === 'circle') {
              const radius = element.radius || 50;
              return {
                width: radius * 2,
                height: radius * 2,
                centerX: element.x, // For circles, x,y IS the center
                centerY: element.y  // For circles, x,y IS the center
              };
            } else if (element.type === 'ellipse') {
              const rx = element.radiusX || 50;
              const ry = element.radiusY || 30;
              return {
                width: rx * 2,
                height: ry * 2,
                centerX: element.x, // For ellipses, x,y IS the center
                centerY: element.y  // For ellipses, x,y IS the center
              };
            }
            return { width: 100, height: 100, centerX: element.x + 50, centerY: element.y + 50 };
          }}
        />
      )}
    </React.Fragment>
  );
});
