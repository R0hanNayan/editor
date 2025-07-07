'use client';

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Group, Transformer } from 'react-konva';
import { SVGElement } from '@/types/svg';
import { throttleRaf, BatchUpdater, processBulkTransform, precomputeTransformMatrix, transformTracker } from '@/utils/performance';
import Konva from 'konva';

interface MultiSelectionGroupProps {
  selectedElements: SVGElement[];
  onUpdateElements: (updates: { id: string; updates: Partial<SVGElement> }[]) => void;
  children: React.ReactNode;
}

// Create a single batch updater instance for all multi-selection operations
const batchUpdater = new BatchUpdater();

// Helper function to normalize rotation to -180 to 180 degrees
const normalizeRotation = (rotation: number): number => {
  rotation = rotation % 360;
  if (rotation > 180) rotation -= 360;
  if (rotation < -180) rotation += 360;
  return rotation;
};

export const MultiSelectionGroup: React.FC<MultiSelectionGroupProps> = React.memo(({
  selectedElements,
  onUpdateElements,
  children,
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Memoize selected element IDs for performance
  const selectedElementIds = useMemo(() => 
    selectedElements.map(el => el.id), 
    [selectedElements]
  );

  // Get the selection mode from the first selected element
  const selectionMode = useMemo(() => 
    selectedElements.length > 0 ? selectedElements[0].selectionMode : 'transform',
    [selectedElements]
  );

  const isMultiSelect = selectedElements.length > 1;

  useEffect(() => {
    if (isMultiSelect && trRef.current && groupRef.current) {
      let retryCount = 0;
      const maxRetries = 5;
      
      const updateTransformer = () => {
        const nodes: Konva.Node[] = [];
        
        // Get all selected shape nodes from the stage
        const stage = groupRef.current?.getStage();
        if (stage) {
          // Find all shape nodes for selected elements
          selectedElementIds.forEach(elementId => {
            // Use find() to search the entire stage - this is more comprehensive
            const matchingNodes = stage.find(`#shape-${elementId}`);
            if (matchingNodes.length > 0) {
              nodes.push(matchingNodes[0]);
            } else {
              // Try alternative search methods
              const layers = stage.children || [];
              for (const layer of layers) {
                const nodeInLayer = layer.findOne(`#shape-${elementId}`);
                if (nodeInLayer) {
                  nodes.push(nodeInLayer);
                  break;
                }
              }
            }
          });
        }

        // If we didn't find all nodes and still have retries left, try again
        if (nodes.length < selectedElementIds.length && retryCount < maxRetries) {
          retryCount++;
          setTimeout(updateTransformer, 20 * retryCount); // Increasing delay
          return;
        }

        // Attach all found nodes to the transformer
        if (trRef.current) {
          trRef.current.nodes(nodes);
          if (nodes.length > 0) {
            trRef.current.getLayer()?.batchDraw();
          }
        }
        
        // Debug: Log the number of nodes found vs expected
        if (nodes.length !== selectedElementIds.length) {
          console.warn(`MultiSelectionGroup: Found ${nodes.length} nodes but expected ${selectedElementIds.length}. Selected IDs:`, selectedElementIds);
        }
      };
      
      // Start the update process with initial delay
      const timeoutId = setTimeout(updateTransformer, 10);
      return () => clearTimeout(timeoutId);
    } else if (trRef.current && !isMultiSelect) {
      // Clear transformer when not multi-selecting
      trRef.current.nodes([]);
    }
  }, [selectedElementIds, isMultiSelect, selectedElements.length]);

  // Optimized drag handler with better performance for large selections
  const handleGroupDragEnd = useCallback((e: any) => {
    if (!isMultiSelect) return;

    const deltaX = e.target.x();
    const deltaY = e.target.y();

    // Early return if no actual movement
    if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) {
      e.target.position({ x: 0, y: 0 });
      return;
    }

    // Reset group position immediately for visual feedback
    e.target.position({ x: 0, y: 0 });

    // Create position updates - handle different element types appropriately
    const updates = selectedElements.map(element => {
      if (element.type === 'drawing' && element.points) {
        // For drawing elements, translate all points
        const newPoints = element.points.map((point, index) => {
          if (index % 2 === 0) {
            return point + deltaX; // x coordinate
          } else {
            return point + deltaY; // y coordinate
          }
        });
        return {
          id: element.id,
          updates: {
            points: newPoints,
          },
        };
      } else if (element.type === 'line' && element.x2 !== undefined && element.y2 !== undefined) {
        // For line elements, translate both start and end points
        return {
          id: element.id,
          updates: {
            x: element.x + deltaX,
            y: element.y + deltaY,
            x2: element.x2 + deltaX,
            y2: element.y2 + deltaY,
          },
        };
      } else {
        // For regular elements (rect, circle, path), just translate x,y
        return {
          id: element.id,
          updates: {
            x: element.x + deltaX,
            y: element.y + deltaY,
          },
        };
      }
    });

    // Apply updates with high priority for immediate response
    batchUpdater.add(() => {
      onUpdateElements(updates);
    }, true);
  }, [isMultiSelect, selectedElements, onUpdateElements]);

  const handleMultiTransformEnd = useCallback(async () => {
    if (!isMultiSelect || !trRef.current) return;

    // Get the transformer's current transform
    const transformer = trRef.current;
    const nodes = transformer.nodes();
    
    // Only proceed if we have nodes attached
    if (nodes.length === 0) return;
    
    const scaleX = transformer.scaleX();
    const scaleY = transformer.scaleY();
    const rotation = transformer.rotation(); // This is in degrees

    // Only proceed if there's actual transformation
    if (Math.abs(scaleX - 1) < 0.001 && Math.abs(scaleY - 1) < 0.001 && Math.abs(rotation) < 0.001) return;

    // Calculate the original bounding box from the elements' center points
    // This approach is more stable for rotated elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    selectedElements.forEach(element => {
      if (element.type === 'drawing' && element.points) {
        // For drawing elements, calculate bounding box from points
        for (let i = 0; i < element.points.length; i += 2) {
          const x = element.points[i];
          const y = element.points[i + 1];
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      } else if (element.type === 'line' && element.x2 !== undefined && element.y2 !== undefined) {
        // For line elements, calculate bounding box from endpoints
        minX = Math.min(minX, element.x, element.x2);
        minY = Math.min(minY, element.y, element.y2);
        maxX = Math.max(maxX, element.x, element.x2);
        maxY = Math.max(maxY, element.y, element.y2);
      } else {
        // Calculate the center point of each element regardless of rotation
        const elementWidth = element.width || (element.radius ? element.radius * 2 : 0) || (element.radiusX ? element.radiusX * 2 : 0) || 100;
        const elementHeight = element.height || (element.radius ? element.radius * 2 : 0) || (element.radiusY ? element.radiusY * 2 : 0) || 100;
        
        const centerX = element.x + elementWidth / 2;
        const centerY = element.y + elementHeight / 2;
        
        minX = Math.min(minX, centerX - elementWidth / 2);
        minY = Math.min(minY, centerY - elementHeight / 2);
        maxX = Math.max(maxX, centerX + elementWidth / 2);
        maxY = Math.max(maxY, centerY + elementHeight / 2);
      }
    });
    
    const originalCenterX = (minX + maxX) / 2;
    const originalCenterY = (minY + maxY) / 2;

    // Reset transformer immediately for visual feedback to prevent lag
    transformer.scaleX(1);
    transformer.scaleY(1);
    transformer.rotation(0);
    transformer.getLayer()?.batchDraw(); // Force immediate redraw

    // Prepare transform data
    const transformData = { scaleX, scaleY, rotation };
    const centerData = { x: originalCenterX, y: originalCenterY };

    try {
      // Start performance tracking
      transformTracker.start(selectedElements.length);
      
      // Use optimized bulk processing for better performance
      console.log(`Processing ${selectedElements.length} elements with bulk transform...`);
      
      const updates = await processBulkTransform(
        selectedElements,
        transformData,
        centerData,
        (processed: number, total: number) => {
          // Optional: Show progress indicator for very large selections
          if (total > 200) {
            console.log(`Transform progress: ${processed}/${total}`);
          }
        }
      );

      // Apply all updates at once with high priority
      batchUpdater.add(() => {
        onUpdateElements(updates);
        // Finish performance tracking
        transformTracker.finish();
      }, true); // High priority for immediate visual feedback
      
    } catch (error) {
      console.warn('Transform processing was interrupted:', error);
      // Fallback to synchronous processing - this should not happen with the new system
      try {
        const updates = await processBulkTransform(selectedElements, transformData, centerData);
        batchUpdater.add(() => {
          onUpdateElements(updates);
          transformTracker.finish();
        }, true);
      } catch (fallbackError) {
        console.error('Fallback transform processing failed:', fallbackError);
        transformTracker.finish();
      }
    }
  }, [isMultiSelect, selectedElements, onUpdateElements]);

  return (
    <>
      <Group ref={groupRef} draggable={isMultiSelect} onDragEnd={handleGroupDragEnd}>
        {children}
      </Group>
      {isMultiSelect && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          rotateEnabled={selectionMode !== 'skew'}
          resizeEnabled={selectionMode !== 'skew'}
          enabledAnchors={selectionMode === 'skew' ? [] : undefined}
          boundBoxFunc={(oldBox, newBox) => {
            if (selectionMode === 'skew') {
              return oldBox; // Prevent resizing in skew mode
            }
            // Limit resize
            if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
              return oldBox;
            }
            return newBox;
          }}
          anchorSize={8}
          anchorStroke={selectionMode === 'skew' ? "#eab308" : "#3b82f6"}
          anchorStrokeWidth={2}
          anchorFill="#ffffff"
          anchorCornerRadius={2}
          borderStroke={selectionMode === 'skew' ? "#eab308" : "#3b82f6"}
          borderStrokeWidth={2}
          borderDash={[4, 4]}
          onTransformEnd={selectionMode !== 'skew' ? handleMultiTransformEnd : undefined}
        />
      )}
    </>
  );
});
