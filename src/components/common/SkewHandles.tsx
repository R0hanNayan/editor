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

  // Calculate handle positions
  const handlePositions = useMemo(() => {
    const margin = 20; // Distance from the shape edge
    return {
      // Top and bottom handles for horizontal skew
      topCenter: { x: centerX, y: centerY - height/2 - margin },
      bottomCenter: { x: centerX, y: centerY + height/2 + margin },
      // Left and right handles for vertical skew
      leftCenter: { x: centerX - width/2 - margin, y: centerY },
      rightCenter: { x: centerX + width/2 + margin, y: centerY },
    };
  }, [centerX, centerY, width, height]);

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
    const initialPos = handleType === 'horizontal' 
      ? (e.target.name() === 'top' ? handlePositions.topCenter : handlePositions.bottomCenter)
      : (e.target.name() === 'left' ? handlePositions.leftCenter : handlePositions.rightCenter);

    if (handleType === 'horizontal') {
      const deltaX = pos.x - initialPos.x;
      const skewValue = getSkewFromDisplacement(deltaX, width);
      onUpdate({ skewX: skewValue });
    } else {
      const deltaY = pos.y - initialPos.y;
      const skewValue = getSkewFromDisplacement(deltaY, height);
      onUpdate({ skewY: skewValue });
    }
  };

  const resetHandlePosition = (handleType: 'horizontal' | 'vertical', handleName: string) => {
    // Reset handle position when skew changes from other sources (like sliders)
    if (handleType === 'horizontal') {
      const currentSkew = element.skewX || 0;
      const displacement = getDisplacementFromSkew(currentSkew, width);
      return handleName === 'top' 
        ? { x: handlePositions.topCenter.x + displacement, y: handlePositions.topCenter.y }
        : { x: handlePositions.bottomCenter.x + displacement, y: handlePositions.bottomCenter.y };
    } else {
      const currentSkew = element.skewY || 0;
      const displacement = getDisplacementFromSkew(currentSkew, height);
      return handleName === 'left'
        ? { x: handlePositions.leftCenter.x, y: handlePositions.leftCenter.y + displacement }
        : { x: handlePositions.rightCenter.x, y: handlePositions.rightCenter.y + displacement };
    }
  };

  return (
    <Group>
      {/* Guide lines */}
      <Line
        points={[
          handlePositions.topCenter.x + getDisplacementFromSkew(element.skewX || 0, width), handlePositions.topCenter.y,
          centerX, centerY - height/2
        ]}
        stroke="#eab308"
        strokeWidth={1}
        dash={[3, 3]}
        opacity={0.7}
        listening={false}
      />
      <Line
        points={[
          handlePositions.bottomCenter.x + getDisplacementFromSkew(element.skewX || 0, width), handlePositions.bottomCenter.y,
          centerX, centerY + height/2
        ]}
        stroke="#eab308"
        strokeWidth={1}
        dash={[3, 3]}
        opacity={0.7}
        listening={false}
      />
      <Line
        points={[
          handlePositions.leftCenter.x, handlePositions.leftCenter.y + getDisplacementFromSkew(element.skewY || 0, height),
          centerX - width/2, centerY
        ]}
        stroke="#eab308"
        strokeWidth={1}
        dash={[3, 3]}
        opacity={0.7}
        listening={false}
      />
      <Line
        points={[
          handlePositions.rightCenter.x, handlePositions.rightCenter.y + getDisplacementFromSkew(element.skewY || 0, height),
          centerX + width/2, centerY
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
