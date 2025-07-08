'use client';

import React, { useMemo } from 'react';
import { Circle, Group, Line } from 'react-konva';
import { SVGElement } from '@/types/svg';
import Konva from 'konva';

interface SkewHandlesProps {
  element: SVGElement;
  onUpdate: (updates: Partial<SVGElement>) => void;
  getBounds: () => { width: number; height: number; centerX: number; centerY: number };
}

export const SkewHandles: React.FC<SkewHandlesProps> = ({ element, onUpdate, getBounds }) => {
  const bounds = getBounds();
  const { width, height, centerX, centerY } = bounds;

  // Skew sensitivity constants
  const DAMPING_FACTOR = 0.3; // Reduces sensitivity
  const MIN_BASE_DISPLACEMENT = 200; // Minimum displacement for consistent behavior
  const MAX_SKEW_ANGLE = 45; // Maximum skew angle in degrees

  // Helper function to rotate a point around the center
  const rotatePoint = (point: { x: number; y: number }, angle: number, center: { x: number; y: number }) => {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  };

  // Calculate handle positions with rotation consideration
  const handlePositions = useMemo(() => {
    const margin = 20; // Distance from the shape edge
    const rotation = element.rotation || 0;
    const center = { x: centerX, y: centerY };
    
    // Calculate base positions (before rotation)
    const basePositions = {
      topCenter: { x: centerX, y: centerY - height/2 - margin },
      bottomCenter: { x: centerX, y: centerY + height/2 + margin },
      leftCenter: { x: centerX - width/2 - margin, y: centerY },
      rightCenter: { x: centerX + width/2 + margin, y: centerY },
    };

    // Apply rotation to each position
    return {
      topCenter: rotatePoint(basePositions.topCenter, rotation, center),
      bottomCenter: rotatePoint(basePositions.bottomCenter, rotation, center),
      leftCenter: rotatePoint(basePositions.leftCenter, rotation, center),
      rightCenter: rotatePoint(basePositions.rightCenter, rotation, center),
    };
  }, [centerX, centerY, width, height, element.rotation]);

  // Helper function to calculate displacement from skew value
  const getDisplacementFromSkew = (skewValue: number, dimension: number) => {
    const baseDisplacement = Math.max(MIN_BASE_DISPLACEMENT, dimension * 1.5);
    return (skewValue / (MAX_SKEW_ANGLE * DAMPING_FACTOR)) * baseDisplacement;
  };

  // Helper function to calculate skew value from displacement
  const getSkewFromDisplacement = (displacement: number, dimension: number) => {
    const baseDisplacement = Math.max(MIN_BASE_DISPLACEMENT, dimension * 1.5);
    const skewValue = Math.max(-MAX_SKEW_ANGLE, Math.min(MAX_SKEW_ANGLE, (displacement / baseDisplacement) * MAX_SKEW_ANGLE * DAMPING_FACTOR));
    return Math.round(skewValue * 10) / 10; // Round to 1 decimal place
  };

  const handleSkewDrag = (handleType: 'horizontal' | 'vertical', e: Konva.KonvaEventObject<DragEvent>) => {
    const pos = e.target.position();
    const rotation = element.rotation || 0;
    const center = { x: centerX, y: centerY };
    
    // Calculate the initial position accounting for rotation
    const margin = 20;
    let initialPos: { x: number; y: number };
    
    if (handleType === 'horizontal') {
      const basePos = e.target.name() === 'top' 
        ? { x: centerX, y: centerY - height/2 - margin }
        : { x: centerX, y: centerY + height/2 + margin };
      initialPos = rotatePoint(basePos, rotation, center);
      
      // For rotated elements, we need to transform the drag delta back to the element's local coordinate system
      const dragDelta = { x: pos.x - initialPos.x, y: pos.y - initialPos.y };
      const inverseDelta = rotatePoint(dragDelta, -rotation, { x: 0, y: 0 });
      
      const skewValue = getSkewFromDisplacement(inverseDelta.x, width);
      onUpdate({ skewX: skewValue });
    } else {
      const basePos = e.target.name() === 'left'
        ? { x: centerX - width/2 - margin, y: centerY }
        : { x: centerX + width/2 + margin, y: centerY };
      initialPos = rotatePoint(basePos, rotation, center);
      
      // For rotated elements, we need to transform the drag delta back to the element's local coordinate system
      const dragDelta = { x: pos.x - initialPos.x, y: pos.y - initialPos.y };
      const inverseDelta = rotatePoint(dragDelta, -rotation, { x: 0, y: 0 });
      
      const skewValue = getSkewFromDisplacement(inverseDelta.y, height);
      onUpdate({ skewY: skewValue });
    }
  };

  const resetHandlePosition = (handleType: 'horizontal' | 'vertical', handleName: string) => {
    // Reset handle position when skew changes from other sources (like sliders)
    const rotation = element.rotation || 0;
    const center = { x: centerX, y: centerY };
    
    if (handleType === 'horizontal') {
      const currentSkew = element.skewX || 0;
      const displacement = getDisplacementFromSkew(currentSkew, width);
      const basePos = handleName === 'top' 
        ? { x: handlePositions.topCenter.x + displacement, y: handlePositions.topCenter.y }
        : { x: handlePositions.bottomCenter.x + displacement, y: handlePositions.bottomCenter.y };
      
      // If there's rotation, we need to apply additional rotation to the displacement
      if (rotation !== 0) {
        const baseCenter = handleName === 'top'
          ? { x: centerX, y: centerY - height/2 - 20 }
          : { x: centerX, y: centerY + height/2 + 20 };
        const displacedBase = { x: baseCenter.x + displacement, y: baseCenter.y };
        return rotatePoint(displacedBase, rotation, center);
      }
      return basePos;
    } else {
      const currentSkew = element.skewY || 0;
      const displacement = getDisplacementFromSkew(currentSkew, height);
      const basePos = handleName === 'left'
        ? { x: handlePositions.leftCenter.x, y: handlePositions.leftCenter.y + displacement }
        : { x: handlePositions.rightCenter.x, y: handlePositions.rightCenter.y + displacement };
      
      // If there's rotation, we need to apply additional rotation to the displacement
      if (rotation !== 0) {
        const baseCenter = handleName === 'left'
          ? { x: centerX - width/2 - 20, y: centerY }
          : { x: centerX + width/2 + 20, y: centerY };
        const displacedBase = { x: baseCenter.x, y: baseCenter.y + displacement };
        return rotatePoint(displacedBase, rotation, center);
      }
      return basePos;
    }
  };

  return (
    <Group zIndex={1000}>
      {/* Guide lines */}
      <Line
        points={[
          resetHandlePosition('horizontal', 'top').x, resetHandlePosition('horizontal', 'top').y,
          rotatePoint({ x: centerX - width/2, y: centerY - height/2 }, element.rotation || 0, { x: centerX, y: centerY }).x,
          rotatePoint({ x: centerX - width/2, y: centerY - height/2 }, element.rotation || 0, { x: centerX, y: centerY }).y
        ]}
        stroke="#eab308"
        strokeWidth={1}
        dash={[3, 3]}
        opacity={0.7}
        listening={false}
      />
      <Line
        points={[
          resetHandlePosition('horizontal', 'top').x, resetHandlePosition('horizontal', 'top').y,
          rotatePoint({ x: centerX + width/2, y: centerY - height/2 }, element.rotation || 0, { x: centerX, y: centerY }).x,
          rotatePoint({ x: centerX + width/2, y: centerY - height/2 }, element.rotation || 0, { x: centerX, y: centerY }).y
        ]}
        stroke="#eab308"
        strokeWidth={1}
        dash={[3, 3]}
        opacity={0.7}
        listening={false}
      />
      <Line
        points={[
          resetHandlePosition('horizontal', 'bottom').x, resetHandlePosition('horizontal', 'bottom').y,
          rotatePoint({ x: centerX - width/2, y: centerY + height/2 }, element.rotation || 0, { x: centerX, y: centerY }).x,
          rotatePoint({ x: centerX - width/2, y: centerY + height/2 }, element.rotation || 0, { x: centerX, y: centerY }).y
        ]}
        stroke="#eab308"
        strokeWidth={1}
        dash={[3, 3]}
        opacity={0.7}
        listening={false}
      />
      <Line
        points={[
          resetHandlePosition('horizontal', 'bottom').x, resetHandlePosition('horizontal', 'bottom').y,
          rotatePoint({ x: centerX + width/2, y: centerY + height/2 }, element.rotation || 0, { x: centerX, y: centerY }).x,
          rotatePoint({ x: centerX + width/2, y: centerY + height/2 }, element.rotation || 0, { x: centerX, y: centerY }).y
        ]}
        stroke="#eab308"
        strokeWidth={1}
        dash={[3, 3]}
        opacity={0.7}
        listening={false}
      />
      <Line
        points={[
          resetHandlePosition('vertical', 'left').x, resetHandlePosition('vertical', 'left').y,
          rotatePoint({ x: centerX - width/2, y: centerY - height/2 }, element.rotation || 0, { x: centerX, y: centerY }).x,
          rotatePoint({ x: centerX - width/2, y: centerY - height/2 }, element.rotation || 0, { x: centerX, y: centerY }).y
        ]}
        stroke="#eab308"
        strokeWidth={1}
        dash={[3, 3]}
        opacity={0.7}
        listening={false}
      />
      <Line
        points={[
          resetHandlePosition('vertical', 'left').x, resetHandlePosition('vertical', 'left').y,
          rotatePoint({ x: centerX - width/2, y: centerY + height/2 }, element.rotation || 0, { x: centerX, y: centerY }).x,
          rotatePoint({ x: centerX - width/2, y: centerY + height/2 }, element.rotation || 0, { x: centerX, y: centerY }).y
        ]}
        stroke="#eab308"
        strokeWidth={1}
        dash={[3, 3]}
        opacity={0.7}
        listening={false}
      />
      <Line
        points={[
          resetHandlePosition('vertical', 'right').x, resetHandlePosition('vertical', 'right').y,
          rotatePoint({ x: centerX + width/2, y: centerY - height/2 }, element.rotation || 0, { x: centerX, y: centerY }).x,
          rotatePoint({ x: centerX + width/2, y: centerY - height/2 }, element.rotation || 0, { x: centerX, y: centerY }).y
        ]}
        stroke="#eab308"
        strokeWidth={1}
        dash={[3, 3]}
        opacity={0.7}
        listening={false}
      />
      <Line
        points={[
          resetHandlePosition('vertical', 'right').x, resetHandlePosition('vertical', 'right').y,
          rotatePoint({ x: centerX + width/2, y: centerY + height/2 }, element.rotation || 0, { x: centerX, y: centerY }).x,
          rotatePoint({ x: centerX + width/2, y: centerY + height/2 }, element.rotation || 0, { x: centerX, y: centerY }).y
        ]}
        stroke="#eab308"
        strokeWidth={1}
        dash={[3, 3]}
        opacity={0.7}
        listening={false}
      />

      {/* Top handle for horizontal skew */}
      <Circle
        name="top"
        {...resetHandlePosition('horizontal', 'top')}
        radius={6}
        fill="#fef3c7"
        stroke="#eab308"
        strokeWidth={2}
        draggable
        zIndex={1000} // Higher z-index for better visibility
        onDragMove={(e) => handleSkewDrag('horizontal', e)}
        onMouseEnter={(e) => {
          e.target.getStage()!.container().style.cursor = 'ew-resize';
        }}
        onMouseLeave={(e) => {
          e.target.getStage()!.container().style.cursor = 'default';
        }}
      />

      {/* Bottom handle for horizontal skew */}
      <Circle
        name="bottom"
        {...resetHandlePosition('horizontal', 'bottom')}
        radius={6}
        fill="#fef3c7"
        stroke="#eab308"
        strokeWidth={2}
        draggable
        zIndex={1000} // Higher z-index for better visibility
        onDragMove={(e) => handleSkewDrag('horizontal', e)}
        onMouseEnter={(e) => {
          e.target.getStage()!.container().style.cursor = 'ew-resize';
        }}
        onMouseLeave={(e) => {
          e.target.getStage()!.container().style.cursor = 'default';
        }}
      />

      {/* Left handle for vertical skew */}
      <Circle
        name="left"
        {...resetHandlePosition('vertical', 'left')}
        radius={6}
        fill="#fef3c7"
        stroke="#eab308"
        strokeWidth={2}
        draggable
        zIndex={1000} // Higher z-index for better visibility
        onDragMove={(e) => handleSkewDrag('vertical', e)}
        onMouseEnter={(e) => {
          e.target.getStage()!.container().style.cursor = 'ns-resize';
        }}
        onMouseLeave={(e) => {
          e.target.getStage()!.container().style.cursor = 'default';
        }}
      />

      {/* Right handle for vertical skew */}
      <Circle
        name="right"
        {...resetHandlePosition('vertical', 'right')}
        radius={6}
        fill="#fef3c7"
        stroke="#eab308"
        strokeWidth={2}
        draggable
        zIndex={1000} // Higher z-index for better visibility
        onDragMove={(e) => handleSkewDrag('vertical', e)}
        onMouseEnter={(e) => {
          e.target.getStage()!.container().style.cursor = 'ns-resize';
        }}
        onMouseLeave={(e) => {
          e.target.getStage()!.container().style.cursor = 'default';
        }}
      />
    </Group>
  );
};
