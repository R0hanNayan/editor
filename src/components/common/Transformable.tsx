'use client';

import React, { useRef, useEffect } from 'react';
import { Transformer } from 'react-konva';
import Konva from 'konva';

interface TransformableProps {
  selectedShapes: Konva.Node[];
  onTransformEnd?: () => void;
}

export const TransformableWrapper: React.FC<TransformableProps> = ({
  selectedShapes,
  onTransformEnd,
}) => {
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (transformerRef.current) {
      transformerRef.current.nodes(selectedShapes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedShapes]);

  return (
    <Transformer
      ref={transformerRef}
      boundBoxFunc={(oldBox, newBox) => {
        // Limit resize
        if (newBox.width < 5 || newBox.height < 5) {
          return oldBox;
        }
        return newBox;
      }}
      rotateEnabled={true}
      enabledAnchors={[
        'top-left',
        'top-center',
        'top-right',
        'middle-right',
        'middle-left',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ]}
      anchorSize={8}
      anchorStroke="#333"
      anchorStrokeWidth={1}
      anchorFill="#fff"
      anchorCornerRadius={2}
      borderStroke="#333"
      borderDash={[4, 4]}
      onTransformEnd={onTransformEnd}
    />
  );
};
