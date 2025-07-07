'use client';

import React, { useCallback, useRef, useState, useMemo } from 'react';
import { Stage, Layer, Line, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useEditorState } from '@/hooks/useEditorState';
import { Toolbar } from '../panels/Toolbar';
import { PathElement } from '../elements/PathElement';
import { ShapeElement } from '../elements/ShapeElement';
import { DrawingElement } from '../elements/DrawingElement';
import { LineElement } from '../elements/LineElement';
import { TextElement } from '../elements/TextElement';
import { FileUpload } from '../common/FileUpload';
import { PropertiesPanel } from '../panels/PropertiesPanel';
import { MultiSelectionGroup } from './MultiSelectionGroup';
import { VirtualizedElementList } from '../performance/VirtualizedElementList';
import { Point, SVGElement } from '@/types/svg';
import { getVisibleElements, throttleRaf } from '@/utils/performance';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Pre-calculate grid lines for better performance
const createGridLines = () => {
  const lines = [];
  
  // Vertical lines
  for (let i = 0; i <= Math.ceil(CANVAS_WIDTH / 20); i++) {
    lines.push(
      <Line
        key={`grid-v-${i}`}
        points={[i * 20, 0, i * 20, CANVAS_HEIGHT]}
        stroke="#f0f0f0"
        strokeWidth={1}
        listening={false}
        perfectDrawEnabled={false}
        hitStrokeWidth={0}
      />
    );
  }
  
  // Horizontal lines
  for (let i = 0; i <= Math.ceil(CANVAS_HEIGHT / 20); i++) {
    lines.push(
      <Line
        key={`grid-h-${i}`}
        points={[0, i * 20, CANVAS_WIDTH, i * 20]}
        stroke="#f0f0f0"
        strokeWidth={1}
        listening={false}
        perfectDrawEnabled={false}
        hitStrokeWidth={0}
      />
    );
  }
  
  return lines;
};

const GRID_LINES = createGridLines();

export const SVGEditor: React.FC = () => {
  const { state, actions, undoRedo } = useEditorState();
  const stageRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const panTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Drawing state for pencil tool
  const isDrawingPencil = useRef(false);
  const currentDrawingId = useRef<string | null>(null);
  
  // Line drawing state
  const isDrawingLine = useRef(false);
  const lineStartPoint = useRef<Point | null>(null);
  const [previewLine, setPreviewLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (panTimeoutRef.current) {
        clearTimeout(panTimeoutRef.current);
      }
    };
  }, []);

  // Add keyboard shortcuts for undo/redo and flip
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          if (undoRedo.canUndo) {
            actions.undo();
          }
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          if (undoRedo.canRedo) {
            actions.redo();
          }
        } else if (e.key === 'h') {
          // Ctrl+H for horizontal flip
          e.preventDefault();
          if (state.selectedElementIds.length > 0) {
            actions.flipHorizontally();
          }
        } else if (e.key === 'v') {
          // Ctrl+V for vertical flip (Note: this might conflict with paste, but we'll use it for now)
          e.preventDefault();
          if (state.selectedElementIds.length > 0) {
            actions.flipVertically();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [actions.undo, actions.redo, actions.flipHorizontally, actions.flipVertically, undoRedo.canUndo, undoRedo.canRedo, state.selectedElementIds.length]);

  // Add some initial demo shapes
  React.useEffect(() => {
    if (state.elements.length === 0) {
      // Add a sample rectangle
      actions.addElement({
        type: 'rect',
        x: 100,
        y: 100,
        width: 120,
        height: 80,
        stroke: '#333333',
        strokeWidth: 2,
        fill: 'rgba(59, 130, 246, 0.3)',
      });

      // Add a sample circle
      actions.addElement({
        type: 'circle',
        x: 360, // Center position 
        y: 210, // Center position
        radius: 60,
        stroke: '#333333',
        strokeWidth: 2,
        fill: 'rgba(34, 197, 94, 0.3)',
      });

      // Add a sample path
      actions.addElement({
        type: 'path',
        x: 150,
        y: 250,
        stroke: '#333333',
        strokeWidth: 2,
        fill: 'rgba(239, 68, 68, 0.3)',
        path: {
          id: 'demo-path',
          points: [
            { id: '1', type: 'move', x: 0, y: 0 },
            { id: '2', type: 'line', x: 100, y: 0 },
            { id: '3', type: 'line', x: 50, y: 50 },
            { id: '4', type: 'close', x: 0, y: 0 },
          ],
          stroke: '#333333',
          strokeWidth: 2,
          fill: 'rgba(239, 68, 68, 0.3)',
          isSelected: false,
        },
      });
    }
  }, [actions, state.elements.length]);

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty && !isSelecting) {
      actions.clearSelection();
    }
  };

  const handleStageMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const clickedOnEmpty = e.target === e.target.getStage();

    if (state.tool === 'select' && clickedOnEmpty) {
      // Start selection rectangle
      setDragStart(pos);
      setIsSelecting(true);
      setSelectionRect({
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
      });
    } else if (state.tool === 'rect') {
      // Create a new rectangle
      const id = actions.addElement({
        type: 'rect',
        x: pos.x,
        y: pos.y,
        width: 100,
        height: 100,
        stroke: '#333333',
        strokeWidth: 2,
        fill: 'rgba(59, 130, 246, 0.3)',
      });
      actions.selectElement(id);
      actions.setTool('select');
    } else if (state.tool === 'circle') {
      // Create a new circle - pos.x, pos.y should be the center
      const id = actions.addElement({
        type: 'circle',
        x: pos.x,
        y: pos.y,
        radius: 50,
        stroke: '#333333',
        strokeWidth: 2,
        fill: 'rgba(34, 197, 94, 0.3)',
      });
      actions.selectElement(id);
      actions.setTool('select');
    } else if (state.tool === 'pencil') {
      // Start drawing with pencil
      isDrawingPencil.current = true;
      const id = actions.addDrawingLine([pos.x, pos.y], '#333333', 2);
      currentDrawingId.current = id;
    } else if (state.tool === 'line') {
      // Handle line drawing with two clicks
      if (!isDrawingLine.current) {
        // First click - start the line
        isDrawingLine.current = true;
        lineStartPoint.current = pos;
      } else {
        // Second click - finish the line
        if (lineStartPoint.current) {
          const id = actions.addElement({
            type: 'line',
            x: lineStartPoint.current.x,
            y: lineStartPoint.current.y,
            x2: pos.x,
            y2: pos.y,
            stroke: '#333333',
            strokeWidth: 2,
            fill: 'transparent',
          });
          actions.selectElement(id);
          // Reset line drawing state
          isDrawingLine.current = false;
          lineStartPoint.current = null;
          actions.setTool('select');
        }
      }
    } else if (state.tool === 'text') {
      // Create a new text element
      const id = actions.addElement({
        type: 'text',
        x: pos.x,
        y: pos.y,
        text: 'Double-click to edit',
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'normal',
        fontWeight: 'normal',
        textAlign: 'left',
        verticalAlign: 'top',
        lineHeight: 1.2,
        letterSpacing: 0,
        textDecoration: '',
        width: 200,
        stroke: 'transparent',
        strokeWidth: 0,
        fill: '#000000',
      });
      actions.selectElement(id);
      actions.setTool('select');
    }
  };

  const handleStageMouseMove = useCallback(
    throttleRaf((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (!pos || !stage) return;

      if (state.tool === 'pencil' && isDrawingPencil.current && currentDrawingId.current) {
        // Continue drawing with pencil
        const currentElement = state.elements.find(el => el.id === currentDrawingId.current);
        if (currentElement && currentElement.points) {
          const newPoints = [...currentElement.points, pos.x, pos.y];
          actions.updateDrawingLine(currentDrawingId.current, newPoints);
        }
      } else if (state.tool === 'select' && dragStart) {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (pos && stage) {
          if (isSelecting) {
            // Update selection rectangle - throttled for performance
            setSelectionRect({
              x: Math.min(dragStart.x, pos.x),
              y: Math.min(dragStart.y, pos.y),
              width: Math.abs(pos.x - dragStart.x),
              height: Math.abs(pos.y - dragStart.y),
            });
          } else {
            // Pan the canvas with debounced state updates
            const newPan = {
              x: state.pan.x + (pos.x - dragStart.x),
              y: state.pan.y + (pos.y - dragStart.y),
            };
            
            // Clear existing timeout
            if (panTimeoutRef.current) {
              clearTimeout(panTimeoutRef.current);
            }
            
            // Debounce pan updates to reduce state changes
            panTimeoutRef.current = setTimeout(() => {
              actions.setPan(newPan);
            }, 16); // Update at most every 16ms (~60fps)
            
            // Update drag start for next iteration
            setDragStart(pos);
          }
        }
      } else if (state.tool === 'line' && isDrawingLine.current && lineStartPoint.current) {
        // Show preview line while drawing
        setPreviewLine({
          x1: lineStartPoint.current.x,
          y1: lineStartPoint.current.y,
          x2: pos.x,
          y2: pos.y,
        });
      }
    }),
    [state.tool, state.pan, state.elements, dragStart, isSelecting, actions]
  );

  const handleStageMouseUp = useCallback(() => {
    if (state.tool === 'pencil' && isDrawingPencil.current) {
      // Finish drawing
      isDrawingPencil.current = false;
      currentDrawingId.current = null;
    } else if (isSelecting && selectionRect && dragStart) {
      // Complete selection
      const stage = stageRef.current;
      const pos = stage?.getPointerPosition();
      if (pos) {
        const rectStart = dragStart;
        const rectEnd = pos;
        const selectedElementIds = actions.getElementsInRectangle(rectStart, rectEnd);
        if (selectedElementIds.length > 0) {
          actions.selectMultipleElements(selectedElementIds);
        } else {
          actions.clearSelection();
        }
      }
    }
    
    setDragStart(null);
    setIsDrawing(false);
    setIsSelecting(false);
    setSelectionRect(null);
    setPreviewLine(null); // Clear preview line on mouse up
  }, [state.tool, isSelecting, selectionRect, dragStart, actions]);

  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    
    actions.setZoom(newScale);
  };

  const handleElementSelect = useCallback((elementId: string, ctrlKey?: boolean) => {
    if (ctrlKey) {
      // Multi-select with Ctrl+click
      const currentSelection = state.selectedElementIds;
      if (currentSelection.includes(elementId)) {
        // Remove from selection
        const newSelection = currentSelection.filter(id => id !== elementId);
        actions.selectMultipleElements(newSelection);
      } else {
        // Add to selection
        actions.selectMultipleElements([...currentSelection, elementId]);
      }
    } else {
      // Single selection - this should use selectElement to handle transform/edit mode properly
      actions.selectElement(elementId);
    }
  }, [state.selectedElementIds, actions]);

  // Optimize rendering for large numbers of elements with virtual rendering
  const visibleElements = useMemo(() => {
    // For large SVGs, only render elements in the visible viewport
    if (state.elements.length > 100) {
      const viewBox = {
        x: -state.pan.x / state.zoom,
        y: -state.pan.y / state.zoom,
        width: CANVAS_WIDTH / state.zoom,
        height: CANVAS_HEIGHT / state.zoom,
      };
      return getVisibleElements(state.elements, viewBox, state.zoom);
    }
    return state.elements;
  }, [state.elements, state.pan, state.zoom]);

  // Memoize elements to prevent unnecessary re-renders
  const renderedElements = useMemo(() => {
    const isMultiSelected = state.selectedElementIds.length > 1;
    
    return visibleElements.map(element => {
      if (element.type === 'path') {
        return (
          <PathElement
            key={element.id}
            element={element}
            isSelected={element.isSelected}
            isMultiSelected={isMultiSelected}
            onSelect={() => handleElementSelect(element.id, false)} // Explicitly pass false for single click
            onUpdate={(updates: Partial<SVGElement>) => actions.updateElement(element.id, updates)}
          />
        );
      } else if (element.type === 'drawing') {
        return (
          <DrawingElement
            key={element.id}
            element={element}
            isSelected={element.isSelected}
            isMultiSelected={isMultiSelected}
            onSelect={() => handleElementSelect(element.id, false)}
            onUpdate={(elementId: string, updates: Partial<SVGElement>) => actions.updateElement(elementId, updates)}
          />
        );
      } else if (element.type === 'line') {
        return (
          <LineElement
            key={element.id}
            element={element}
            isSelected={element.isSelected}
            isMultiSelected={isMultiSelected}
            onSelect={() => handleElementSelect(element.id, false)}
            onUpdate={(elementId: string, updates: Partial<SVGElement>) => actions.updateElement(elementId, updates)}
          />
        );
      } else if (element.type === 'text') {
        return (
          <TextElement
            key={element.id}
            element={element}
            isSelected={element.isSelected}
            isMultiSelected={isMultiSelected}
            onSelect={() => handleElementSelect(element.id, false)}
            onUpdate={(elementId: string, updates: Partial<SVGElement>) => actions.updateElement(elementId, updates)}
          />
        );
      } else {
        return (
          <ShapeElement
            key={element.id}
            element={element}
            isSelected={element.isSelected}
            isMultiSelected={isMultiSelected}
            onSelect={() => handleElementSelect(element.id, false)} // Explicitly pass false for single click
            onUpdate={(updates: Partial<SVGElement>) => actions.updateElement(element.id, updates)}
          />
        );
      }
    });
  }, [visibleElements, state.selectedElementIds, handleElementSelect, actions]);

  // Memoize selected elements for MultiSelectionGroup
  const selectedElements = useMemo(() => 
    state.elements.filter(el => el.isSelected),
    [state.elements]
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toolbar 
        currentTool={state.tool}
        onToolChange={actions.setTool}
        zoom={state.zoom}
        onZoomChange={actions.setZoom}
        onClear={actions.clearCanvas}
        onExport={actions.exportSVG}
        onSelectAll={actions.selectAllElements}
        onUndo={actions.undo}
        onRedo={actions.redo}
        canUndo={undoRedo.canUndo}
        canRedo={undoRedo.canRedo}
        onFlipHorizontal={actions.flipHorizontally}
        onFlipVertical={actions.flipVertically}
        hasSelection={state.selectedElementIds.length > 0}
      />
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
          {/* File Upload Section */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Import SVG</h3>
            <FileUpload onSVGUpload={actions.importSVG} />
          </div>
          
          {/* Elements Section */}
          <div className="flex-1 flex flex-col p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Elements</h3>
              <div className="flex items-center gap-2">
                {state.elements.length > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {state.elements.length}
                  </span>
                )}
                {state.selectedElementIds.length > 1 && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {state.selectedElementIds.length} selected
                  </span>
                )}
              </div>
            </div>
            
            {/* Multi-select Actions */}
            {state.selectedElementIds.length > 1 && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">
                    Multi-Selection Active
                  </span>
                  {state.selectedElementIds.length > 100 && (
                    <span className="text-xs text-amber-600">
                      ⚠️ Large selection
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    state.selectedElementIds.forEach(id => actions.deleteElement(id));
                    actions.clearSelection();
                  }}
                  className="w-full px-3 py-2 text-sm font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  Delete Selected ({state.selectedElementIds.length})
                </button>
              </div>
            )}
            
            {/* Elements List */}
            <div className="flex-1 overflow-hidden">
              {state.elements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-sm">No elements</div>
                  <div className="text-xs mt-1">Create shapes or import an SVG</div>
                </div>
              ) : (
                <div className="space-y-1">
                  {state.elements.length > 50 ? (
                    <VirtualizedElementList
                      elements={state.elements}
                      selectedElementIds={state.selectedElementIds}
                      onElementSelect={handleElementSelect}
                      onElementDelete={actions.deleteElement}
                      maxVisibleItems={8}
                    />
                  ) : (
                    state.elements.map(element => (
                      <div
                        key={element.id}
                        className={`p-3 text-sm rounded-lg cursor-pointer flex justify-between items-center transition-colors ${
                          element.isSelected 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                        onClick={(e) => handleElementSelect(element.id, e.ctrlKey)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium capitalize">
                            {element.type} #{element.id.slice(-6)}
                          </span>
                          {element.isSelected && (
                            <span className={`text-xs mt-1 ${
                              element.selectionMode === 'transform' 
                                ? 'text-blue-600' 
                                : 'text-green-600'
                            }`}>
                              {element.selectionMode === 'transform' ? 'Transform Mode' : 'Edit Mode'}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.deleteElement(element.id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                          title="Delete element"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Canvas */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <div className="w-full h-full p-4">
            <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <Stage
                ref={stageRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                scaleX={state.zoom}
                scaleY={state.zoom}
                x={state.pan.x}
                y={state.pan.y}
                onClick={handleStageClick}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                onTouchStart={handleStageMouseDown}
                onTouchMove={handleStageMouseMove}
                onTouchEnd={handleStageMouseUp}
                onWheel={handleWheel}
                className="cursor-crosshair"
                // Performance optimizations
                perfectDrawEnabled={false}
                listening={true}
              >
              <Layer>
                {/* Grid background - pre-calculated for performance */}
                {GRID_LINES}
                
                {/* SVG Elements */}
                <MultiSelectionGroup
                  selectedElements={selectedElements}
                  onUpdateElements={actions.updateMultipleElements}
                >
                  {renderedElements}
                </MultiSelectionGroup>
                
                {/* Selection Rectangle */}
                {selectionRect && (
                  <Rect
                    x={selectionRect.x}
                    y={selectionRect.y}
                    width={selectionRect.width}
                    height={selectionRect.height}
                    fill="rgba(59, 130, 246, 0.1)"
                    stroke="#3b82f6"
                    strokeWidth={1}
                    dash={[5, 5]}
                    listening={false}
                    perfectDrawEnabled={false}
                  />
                )}
                
                {/* Preview Line - only show when drawing a line */}
                {state.tool === 'line' && previewLine && (
                  <Line
                    points={[previewLine.x1, previewLine.y1, previewLine.x2, previewLine.y2]}
                    stroke="#333333"
                    strokeWidth={2}
                    dash={[4, 4]}
                    listening={false}
                    perfectDrawEnabled={false}
                  />
                )}
              </Layer>
            </Stage>
            </div>
          </div>
        </div>
        
        {/* Right Sidebar - Properties Panel */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <PropertiesPanel
            selectedElement={state.elements.find(el => el.isSelected) || null}
            onUpdateElement={(updates) => {
              const selectedId = state.selectedElementId;
              if (selectedId) {
                actions.updateElement(selectedId, updates);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
