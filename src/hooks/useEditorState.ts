import { useState, useCallback, useMemo } from 'react';
import { EditorState, SVGElement, Point } from '@/types/svg';
import { generateId, parsePathData, pathPointsToString } from '@/utils/svg';
import { useUndoRedo } from './useUndoRedo';

// Shallow comparison utility for performance
const shallowEqual = (obj1: any, obj2: any): boolean => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  
  return true;
};

const initialState: EditorState = {
  elements: [],
  selectedElementId: null,
  selectedElementIds: [],
  tool: 'select',
  zoom: 1,
  pan: { x: 0, y: 0 },
};

export const useEditorState = () => {
  const { 
    state, 
    setState, 
    undo, 
    redo, 
    clearHistory, 
    canUndo, 
    canRedo 
  } = useUndoRedo<EditorState>(initialState, {
    limit: 50,
    filter: (prevState, nextState) => {
      // Don't add to history for pan and zoom changes
      if (prevState.pan !== nextState.pan || prevState.zoom !== nextState.zoom) {
        return false;
      }
      // Don't add to history for tool changes
      if (prevState.tool !== nextState.tool) {
        return false;
      }
      // Don't add to history for selection changes only (without element changes)
      if (prevState.elements === nextState.elements && 
          (prevState.selectedElementId !== nextState.selectedElementId ||
           prevState.selectedElementIds !== nextState.selectedElementIds)) {
        return false;
      }
      return true;
    },
    groupBy: (prevState, nextState) => {
      // Group rapid drawing updates together
      if (prevState.elements.length === nextState.elements.length) {
        // Check if only drawing points changed (live drawing)
        for (let i = 0; i < prevState.elements.length; i++) {
          const prevEl = prevState.elements[i];
          const nextEl = nextState.elements[i];
          
          if (prevEl.type === 'drawing' && nextEl.type === 'drawing' && 
              prevEl.id === nextEl.id &&
              prevEl.points && nextEl.points &&
              prevEl.points.length < nextEl.points.length) {
            // This is a live drawing update - group it
            return `drawing-${prevEl.id}`;
          }
        }
      }
      return null;
    }
  });

  const addElement = useCallback((element: Omit<SVGElement, 'id' | 'isSelected'>) => {
    const newElement: SVGElement = {
      ...element,
      id: generateId(),
      isSelected: false,
      fillOpacity: element.fillOpacity ?? 1,
      strokeOpacity: element.strokeOpacity ?? 1,
    };
    
    setState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    
    return newElement.id;
  }, [setState]);

  const selectElement = useCallback((elementId: string | null) => {
    setState(prev => {
      const newElements = prev.elements.map(el => {
        if (el.id === elementId) {
          // If element is already selected, toggle between transform and edit mode
          if (el.isSelected && prev.selectedElementIds.length <= 1) {
            const newMode: 'transform' | 'edit' = el.selectionMode === 'transform' ? 'edit' : 'transform';
            return { ...el, selectionMode: newMode };
          } else {
            // First selection - start with transform mode
            return { ...el, isSelected: true, selectionMode: 'transform' as const };
          }
        } else {
          // Deselect other elements
          return { ...el, isSelected: false, selectionMode: undefined };
        }
      });

      return {
        ...prev,
        selectedElementId: elementId,
        selectedElementIds: elementId ? [elementId] : [], // Fix: properly set selectedElementIds
        elements: newElements,
      };
    });
  }, [setState]);

  const selectMultipleElements = useCallback((elementIds: string[]) => {
    setState(prev => {
      // Check if selection has actually changed
      const currentIds = prev.selectedElementIds;
      if (currentIds.length === elementIds.length && 
          currentIds.every(id => elementIds.includes(id))) {
        return prev; // No change needed
      }

      return {
        ...prev,
        selectedElementIds: elementIds,
        selectedElementId: elementIds.length === 1 ? elementIds[0] : null,
        elements: prev.elements.map(el => ({
          ...el,
          isSelected: elementIds.includes(el.id),
          selectionMode: elementIds.includes(el.id) ? 'transform' as const : undefined,
        })),
      };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => {
      // Check if there's anything to clear
      if (prev.selectedElementId === null && prev.selectedElementIds.length === 0) {
        return prev; // No change needed
      }

      return {
        ...prev,
        selectedElementId: null,
        selectedElementIds: [],
        elements: prev.elements.map(el => ({ ...el, isSelected: false, selectionMode: undefined })),
      };
    });
  }, []);

  const updateElement = useCallback((elementId: string, updates: Partial<SVGElement>) => {
    setState(prev => {
      const elementIndex = prev.elements.findIndex(el => el.id === elementId);
      if (elementIndex === -1) return prev;
      
      const currentElement = prev.elements[elementIndex];
      // Skip update if nothing actually changed
      if (shallowEqual(updates, currentElement)) return prev;

      const newElements = [...prev.elements];
      newElements[elementIndex] = { ...currentElement, ...updates };

      return {
        ...prev,
        elements: newElements,
      };
    });
  }, []);

  const updateMultipleElements = useCallback((updates: { id: string; updates: Partial<SVGElement> }[]) => {
    if (updates.length === 0) return; // No updates to apply

    setState(prev => {
      // Create a map for faster lookups
      const updateMap = new Map(updates.map(u => [u.id, u.updates]));
      let hasChanges = false;
      
      const newElements = prev.elements.map(el => {
        const update = updateMap.get(el.id);
        if (update && !shallowEqual(update, el)) {
          hasChanges = true;
          return { ...el, ...update };
        }
        return el;
      });

      // Only update state if there were actual changes
      return hasChanges ? { ...prev, elements: newElements } : prev;
    });
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId),
      selectedElementId: prev.selectedElementId === elementId ? null : prev.selectedElementId,
      selectedElementIds: prev.selectedElementIds.filter(id => id !== elementId),
    }));
  }, []);

  const setTool = useCallback((tool: EditorState['tool']) => {
    setState(prev => ({
      ...prev,
      tool,
      selectedElementId: null,
      selectedElementIds: [],
      elements: prev.elements.map(el => ({ ...el, isSelected: false, selectionMode: undefined })),
    }), true); // Skip history for tool changes
  }, [setState]);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, zoom)),
    }), true); // Skip history for zoom changes
  }, [setState]);

  const setPan = useCallback((pan: Point) => {
    setState(prev => ({
      ...prev,
      pan,
    }), true); // Skip history for pan changes
  }, [setState]);

  const importSVG = useCallback((svgContent: string) => {
    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');
      
      if (!svgElement) {
        console.error('Invalid SVG content');
        throw new Error('Invalid SVG content - no SVG element found');
      }

      // Check for parser errors
      const parserError = svgDoc.querySelector('parsererror');
      if (parserError) {
        console.error('SVG parsing error:', parserError.textContent);
        throw new Error('Invalid SVG format');
      }

      // Get SVG dimensions and viewBox
      let svgWidth = parseFloat(svgElement.getAttribute('width') || '100');
      let svgHeight = parseFloat(svgElement.getAttribute('height') || '100');
      
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
        svgWidth = vbWidth || svgWidth;
        svgHeight = vbHeight || svgHeight;
      }

      // Calculate scale to fit within 70% of canvas with margins
      const CANVAS_WIDTH = 800;
      const CANVAS_HEIGHT = 600;
      const maxWidth = CANVAS_WIDTH * 0.7;
      const maxHeight = CANVAS_HEIGHT * 0.7;
      
      const scaleX = maxWidth / svgWidth;
      const scaleY = maxHeight / svgHeight;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
      
      // Center the scaled SVG
      const scaledWidth = svgWidth * scale;
      const scaledHeight = svgHeight * scale;
      const offsetX = (CANVAS_WIDTH - scaledWidth) / 2;
      const offsetY = (CANVAS_HEIGHT - scaledHeight) / 2;
      
      const newElements: SVGElement[] = [];
      
      // Parse path elements
      const paths = svgDoc.querySelectorAll('path');
      paths.forEach(path => {
        const d = path.getAttribute('d') || '';
        const stroke = path.getAttribute('stroke') || '#000000';
        const strokeWidth = parseFloat(path.getAttribute('stroke-width') || '1');
        const fill = path.getAttribute('fill') || 'transparent';
        
        if (d) {
          const pathPoints = parsePathData(d);
          
          // Find the starting position (first move command)
          const startPoint = pathPoints.find(p => p.type === 'move');
          const startX = startPoint?.x || 0;
          const startY = startPoint?.y || 0;
          
          // Make all coordinates relative to the starting position and apply scale
          const relativePoints = pathPoints.map(point => ({
            ...point,
            x: (point.x - startX) * scale,
            y: (point.y - startY) * scale,
            controlPoint1: point.controlPoint1 ? {
              x: (point.controlPoint1.x - startX) * scale,
              y: (point.controlPoint1.y - startY) * scale
            } : undefined,
            controlPoint2: point.controlPoint2 ? {
              x: (point.controlPoint2.x - startX) * scale,
              y: (point.controlPoint2.y - startY) * scale
            } : undefined,
          }));
          
          newElements.push({
            id: generateId(),
            type: 'path',
            x: startX * scale + offsetX,
            y: startY * scale + offsetY,
            path: {
              id: generateId(),
              points: relativePoints,
              stroke,
              strokeWidth: strokeWidth * scale,
              fill,
              isSelected: false,
            },
            stroke,
            strokeWidth: strokeWidth * scale,
            fill,
            isSelected: false,
          });
        }
      });
      
      // Parse rectangle elements
      const rects = svgDoc.querySelectorAll('rect');
      rects.forEach(rect => {
        const x = parseFloat(rect.getAttribute('x') || '0');
        const y = parseFloat(rect.getAttribute('y') || '0');
        const width = parseFloat(rect.getAttribute('width') || '100');
        const height = parseFloat(rect.getAttribute('height') || '100');
        const stroke = rect.getAttribute('stroke') || '#000000';
        const strokeWidth = parseFloat(rect.getAttribute('stroke-width') || '1');
        const fill = rect.getAttribute('fill') || 'transparent';
        
        newElements.push({
          id: generateId(),
          type: 'rect',
          x: x * scale + offsetX,
          y: y * scale + offsetY,
          width: width * scale,
          height: height * scale,
          stroke,
          strokeWidth: strokeWidth * scale,
          fill,
          isSelected: false,
        });
      });
        // Parse circle elements
      const circles = svgDoc.querySelectorAll('circle');
      circles.forEach(circle => {
        const cx = parseFloat(circle.getAttribute('cx') || '0');
        const cy = parseFloat(circle.getAttribute('cy') || '0');
        const r = parseFloat(circle.getAttribute('r') || '50');
        const stroke = circle.getAttribute('stroke') || '#000000';
        const strokeWidth = parseFloat(circle.getAttribute('stroke-width') || '1');
        const fill = circle.getAttribute('fill') || 'transparent';
        
        newElements.push({
          id: generateId(),
          type: 'circle',
          x: cx * scale + offsetX,
          y: cy * scale + offsetY,
          radius: r * scale,
          stroke,
          strokeWidth: strokeWidth * scale,
          fill,
          isSelected: false,
        });
      });

      // Parse ellipse elements
      const ellipses = svgDoc.querySelectorAll('ellipse');
      ellipses.forEach(ellipse => {
        const cx = parseFloat(ellipse.getAttribute('cx') || '0');
        const cy = parseFloat(ellipse.getAttribute('cy') || '0');
        const rx = parseFloat(ellipse.getAttribute('rx') || '50');
        const ry = parseFloat(ellipse.getAttribute('ry') || '30');
        const stroke = ellipse.getAttribute('stroke') || '#000000';
        const strokeWidth = parseFloat(ellipse.getAttribute('stroke-width') || '1');
        const fill = ellipse.getAttribute('fill') || 'transparent';
        
        newElements.push({
          id: generateId(),
          type: 'ellipse',
          x: cx * scale + offsetX,
          y: cy * scale + offsetY,
          radiusX: rx * scale,
          radiusY: ry * scale,
          stroke,
          strokeWidth: strokeWidth * scale,
          fill,
          isSelected: false,
        });
      });
      
      // Clear existing elements and set new ones atomically
      setState(prev => ({
        ...prev,
        elements: newElements,
        selectedElementId: null,
        selectedElementIds: [],
      }));
      
      console.log(`Imported ${newElements.length} SVG elements`);
    } catch (error) {
      console.error('Error parsing SVG:', error);
      // Re-throw the error so the FileUpload component can handle it
      throw error;
    }
  }, []);

  const clearCanvas = useCallback(() => {
    setState(initialState);
  }, []);

  const exportSVG = useCallback(() => {
    const svgElements = state.elements.map(element => {
      const rotation = element.rotation ? ` transform="rotate(${element.rotation} ${element.x + (element.width || element.radius || 50)/2} ${element.y + (element.height || element.radius || 50)/2})"` : '';
      
      switch (element.type) {
        case 'rect':
          return `<rect x="${element.x}" y="${element.y}" width="${element.width || 100}" height="${element.height || 100}" fill="${element.fill}" stroke="${element.stroke}" stroke-width="${element.strokeWidth}"${rotation} />`;
        case 'circle':
          const radius = element.radius || 50;
          return `<circle cx="${element.x}" cy="${element.y}" r="${radius}" fill="${element.fill}" stroke="${element.stroke}" stroke-width="${element.strokeWidth}"${rotation} />`;
        case 'ellipse':
          const rx = element.radiusX || 50;
          const ry = element.radiusY || 30;
          return `<ellipse cx="${element.x}" cy="${element.y}" rx="${rx}" ry="${ry}" fill="${element.fill}" stroke="${element.stroke}" stroke-width="${element.strokeWidth}"${rotation} />`;
        case 'path':
          if (element.path) {
            // Convert relative coordinates back to absolute for export
            const absolutePoints = element.path.points.map(point => ({
              ...point,
              x: point.x + element.x,
              y: point.y + element.y,
              controlPoint1: point.controlPoint1 ? {
                x: point.controlPoint1.x + element.x,
                y: point.controlPoint1.y + element.y
              } : undefined,
              controlPoint2: point.controlPoint2 ? {
                x: point.controlPoint2.x + element.x,
                y: point.controlPoint2.y + element.y
              } : undefined,
            }));
            
            const pathData = pathPointsToString(absolutePoints);
            return `<path d="${pathData}" fill="${element.fill}" stroke="${element.stroke}" stroke-width="${element.strokeWidth}"${rotation} />`;
          }
          return '';
        case 'drawing':
          // For drawing lines, export as polyline
          if (element.points && element.points.length > 0) {
            // Convert points array [x1, y1, x2, y2, ...] to string "x1,y1 x2,y2 ..."
            const pointPairs = [];
            for (let i = 0; i < element.points.length; i += 2) {
              pointPairs.push(`${element.points[i]},${element.points[i + 1]}`);
            }
            return `<polyline points="${pointPairs.join(' ')}" fill="none" stroke="${element.stroke}" stroke-width="${element.strokeWidth}"${rotation} />`;
          }
          return '';
        case 'line':
          // For straight lines, export as line element
          if (element.x2 !== undefined && element.y2 !== undefined) {
            return `<line x1="${element.x}" y1="${element.y}" x2="${element.x2}" y2="${element.y2}" stroke="${element.stroke}" stroke-width="${element.strokeWidth}"${rotation} />`;
          }
          return '';
        default:
          return '';
          return '';
      }
    }).filter(Boolean);

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  ${svgElements.join('\n  ')}
</svg>`;

    // Create and trigger download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edited-svg.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.elements]);

  const getElementsInRectangle = useCallback((rectStart: Point, rectEnd: Point): string[] => {
    const minX = Math.min(rectStart.x, rectEnd.x);
    const maxX = Math.max(rectStart.x, rectEnd.x);
    const minY = Math.min(rectStart.y, rectEnd.y);
    const maxY = Math.max(rectStart.y, rectEnd.y);

    return state.elements.filter(element => {
      // Check if element bounds intersect with selection rectangle
      let elementMinX = element.x;
      let elementMaxX = element.x;
      let elementMinY = element.y;
      let elementMaxY = element.y;

      if (element.type === 'rect') {
        elementMaxX += element.width || 100;
        elementMaxY += element.height || 100;
      } else if (element.type === 'circle') {
        const radius = element.radius || 50;
        elementMinX -= radius;
        elementMaxX += radius;
        elementMinY -= radius;
        elementMaxY += radius;
      } else if (element.type === 'ellipse') {
        const rx = element.radiusX || 50;
        const ry = element.radiusY || 30;
        elementMinX -= rx;
        elementMaxX += rx;
        elementMinY -= ry;
        elementMaxY += ry;
      } else if (element.type === 'path' && element.path) {
        // For paths, find the bounding box of all points
        const points = element.path.points;
        if (points.length > 0) {
          const xs = points.map(p => element.x + p.x);
          const ys = points.map(p => element.y + p.y);
          elementMinX = Math.min(...xs);
          elementMaxX = Math.max(...xs);
          elementMinY = Math.min(...ys);
          elementMaxY = Math.max(...ys);
        }
      } else if (element.type === 'drawing' && element.points) {
        // For drawing elements, find bounding box from points array
        if (element.points.length >= 2) {
          const xs = [];
          const ys = [];
          for (let i = 0; i < element.points.length; i += 2) {
            xs.push(element.points[i]);
            ys.push(element.points[i + 1]);
          }
          elementMinX = Math.min(...xs);
          elementMaxX = Math.max(...xs);
          elementMinY = Math.min(...ys);
          elementMaxY = Math.max(...ys);
        }
      } else if (element.type === 'line' && element.x2 !== undefined && element.y2 !== undefined) {
        // For line elements, find bounding box from endpoints
        elementMinX = Math.min(element.x, element.x2);
        elementMaxX = Math.max(element.x, element.x2);
        elementMinY = Math.min(element.y, element.y2);
        elementMaxY = Math.max(element.y, element.y2);
      }

      // Check if rectangles intersect
      return !(elementMaxX < minX || elementMinX > maxX || elementMaxY < minY || elementMinY > maxY);
    }).map(el => el.id);
  }, [state.elements]);

  const selectAllElements = useCallback(() => {
    const allElementIds = state.elements.map(el => el.id);
    
    // For large selections, process in chunks to prevent blocking
    if (allElementIds.length > 100) {
      // Show loading state for very large selections
      setState(prev => ({
        ...prev,
        selectedElementIds: allElementIds,
        selectedElementId: null,
      }));
      
      // Update element selection states in chunks
      const chunkSize = 50;
      let processedCount = 0;
      
      const processChunk = () => {
        setState(prev => {
          const chunk = prev.elements.slice(processedCount, processedCount + chunkSize);
          const updatedElements = prev.elements.map((el, index) => {
            if (index >= processedCount && index < processedCount + chunkSize) {
              return { ...el, isSelected: true, selectionMode: 'transform' as const };
            }
            return el;
          });
          
          return {
            ...prev,
            elements: updatedElements,
          };
        });
        
        processedCount += chunkSize;
        
        if (processedCount < allElementIds.length) {
          requestAnimationFrame(processChunk);
        }
      };
      
      requestAnimationFrame(processChunk);
    } else {
      // For smaller selections, update all at once
      selectMultipleElements(allElementIds);
    }
  }, [state.elements, selectMultipleElements]);

  // Add a new drawing line
  const addDrawingLine = useCallback((points: number[], stroke: string, strokeWidth: number) => {
    const newElement: SVGElement = {
      id: generateId(),
      type: 'drawing',
      x: 0, // Drawing lines use absolute coordinates in points array
      y: 0,
      points,
      stroke,
      strokeWidth,
      fill: 'transparent',
      isSelected: false,
    };
    
    setState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    
    return newElement.id;
  }, [setState]);

  // Update an existing drawing line (for live drawing)
  const updateDrawingLine = useCallback((elementId: string, points: number[]) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, points } : el
      ),
    }));
  }, [setState]);

  // Flip selected elements horizontally
  const flipHorizontally = useCallback(() => {
    const selectedElements = state.elements.filter(el => el.isSelected);
    if (selectedElements.length === 0) return;

    // Calculate the bounding box of all selected elements
    let minX = Infinity, maxX = -Infinity;
    
    selectedElements.forEach(element => {
      if (element.type === 'drawing' && element.points) {
        // For drawing elements, calculate bounding box from points
        for (let i = 0; i < element.points.length; i += 2) {
          const x = element.points[i];
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
        }
      } else if (element.type === 'line' && element.x2 !== undefined) {
        // For line elements
        minX = Math.min(minX, element.x, element.x2);
        maxX = Math.max(maxX, element.x, element.x2);
      } else if (element.type === 'path' && element.path) {
        // For path elements, calculate bounding box from all path points
        element.path.points.forEach(point => {
          minX = Math.min(minX, element.x + point.x);
          maxX = Math.max(maxX, element.x + point.x);
          if (point.controlPoint1) {
            minX = Math.min(minX, element.x + point.controlPoint1.x);
            maxX = Math.max(maxX, element.x + point.controlPoint1.x);
          }
          if (point.controlPoint2) {
            minX = Math.min(minX, element.x + point.controlPoint2.x);
            maxX = Math.max(maxX, element.x + point.controlPoint2.x);
          }
        });
      } else if (element.type === 'text') {
        // For text elements
        const elementWidth = element.width || 200;
        minX = Math.min(minX, element.x);
        maxX = Math.max(maxX, element.x + elementWidth);
      } else {
        // For regular elements (rect, circle, ellipse)
        const elementWidth = element.width || (element.radius ? element.radius * 2 : 0) || (element.radiusX ? element.radiusX * 2 : 0) || 100;
        minX = Math.min(minX, element.x);
        maxX = Math.max(maxX, element.x + elementWidth);
      }
    });

    const centerX = (minX + maxX) / 2;

    // Apply horizontal flip to each selected element
    const updates = selectedElements.map(element => {
      if (element.type === 'drawing' && element.points) {
        // Flip drawing points horizontally
        const flippedPoints = [];
        for (let i = 0; i < element.points.length; i += 2) {
          const x = element.points[i];
          const y = element.points[i + 1];
          const flippedX = centerX + (centerX - x);
          flippedPoints.push(flippedX, y);
        }
        return { id: element.id, updates: { points: flippedPoints } };
      } else if (element.type === 'line' && element.x2 !== undefined && element.y2 !== undefined) {
        // Flip line endpoints horizontally
        const flippedX1 = centerX + (centerX - element.x);
        const flippedX2 = centerX + (centerX - element.x2);
        return { id: element.id, updates: { x: flippedX1, x2: flippedX2 } };
      } else if (element.type === 'path' && element.path) {
        // Flip path points horizontally
        const elementCenterX = element.x;
        const flippedPath = {
          ...element.path,
          points: element.path.points.map(point => ({
            ...point,
            x: -point.x, // Flip relative to element origin
            controlPoint1: point.controlPoint1 ? { 
              x: -point.controlPoint1.x, 
              y: point.controlPoint1.y 
            } : undefined,
            controlPoint2: point.controlPoint2 ? { 
              x: -point.controlPoint2.x, 
              y: point.controlPoint2.y 
            } : undefined,
          }))
        };
        // Also flip the element's position relative to center
        const flippedElementX = centerX + (centerX - element.x);
        return { id: element.id, updates: { x: flippedElementX, path: flippedPath } };
      } else if (element.type === 'text') {
        // Flip text element horizontally
        const elementWidth = element.width || 200;
        const flippedX = centerX + (centerX - (element.x + elementWidth));
        return { id: element.id, updates: { x: flippedX } };
      } else {
        // Flip regular elements horizontally
        const elementWidth = element.width || (element.radius ? element.radius * 2 : 0) || (element.radiusX ? element.radiusX * 2 : 0) || 100;
        const flippedX = centerX + (centerX - (element.x + elementWidth));
        return { id: element.id, updates: { x: flippedX } };
      }
    });

    updateMultipleElements(updates);
  }, [state.elements, updateMultipleElements]);

  // Flip selected elements vertically
  const flipVertically = useCallback(() => {
    const selectedElements = state.elements.filter(el => el.isSelected);
    if (selectedElements.length === 0) return;

    // Calculate the bounding box of all selected elements
    let minY = Infinity, maxY = -Infinity;
    
    selectedElements.forEach(element => {
      if (element.type === 'drawing' && element.points) {
        // For drawing elements, calculate bounding box from points
        for (let i = 1; i < element.points.length; i += 2) {
          const y = element.points[i];
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      } else if (element.type === 'line' && element.y2 !== undefined) {
        // For line elements
        minY = Math.min(minY, element.y, element.y2);
        maxY = Math.max(maxY, element.y, element.y2);
      } else if (element.type === 'path' && element.path) {
        // For path elements, calculate bounding box from all path points
        element.path.points.forEach(point => {
          minY = Math.min(minY, element.y + point.y);
          maxY = Math.max(maxY, element.y + point.y);
          if (point.controlPoint1) {
            minY = Math.min(minY, element.y + point.controlPoint1.y);
            maxY = Math.max(maxY, element.y + point.controlPoint1.y);
          }
          if (point.controlPoint2) {
            minY = Math.min(minY, element.y + point.controlPoint2.y);
            maxY = Math.max(maxY, element.y + point.controlPoint2.y);
          }
        });
      } else if (element.type === 'text') {
        // For text elements - approximate height based on font size
        const elementHeight = (element.fontSize || 16) * (element.lineHeight || 1.2);
        minY = Math.min(minY, element.y);
        maxY = Math.max(maxY, element.y + elementHeight);
      } else {
        // For regular elements (rect, circle, ellipse)
        const elementHeight = element.height || (element.radius ? element.radius * 2 : 0) || (element.radiusY ? element.radiusY * 2 : 0) || 100;
        minY = Math.min(minY, element.y);
        maxY = Math.max(maxY, element.y + elementHeight);
      }
    });

    const centerY = (minY + maxY) / 2;

    // Apply vertical flip to each selected element
    const updates = selectedElements.map(element => {
      if (element.type === 'drawing' && element.points) {
        // Flip drawing points vertically
        const flippedPoints = [];
        for (let i = 0; i < element.points.length; i += 2) {
          const x = element.points[i];
          const y = element.points[i + 1];
          const flippedY = centerY + (centerY - y);
          flippedPoints.push(x, flippedY);
        }
        return { id: element.id, updates: { points: flippedPoints } };
      } else if (element.type === 'line' && element.x2 !== undefined && element.y2 !== undefined) {
        // Flip line endpoints vertically
        const flippedY1 = centerY + (centerY - element.y);
        const flippedY2 = centerY + (centerY - element.y2);
        return { id: element.id, updates: { y: flippedY1, y2: flippedY2 } };
      } else if (element.type === 'path' && element.path) {
        // Flip path points vertically
        const flippedPath = {
          ...element.path,
          points: element.path.points.map(point => ({
            ...point,
            y: -point.y, // Flip relative to element origin
            controlPoint1: point.controlPoint1 ? { 
              x: point.controlPoint1.x, 
              y: -point.controlPoint1.y 
            } : undefined,
            controlPoint2: point.controlPoint2 ? { 
              x: point.controlPoint2.x, 
              y: -point.controlPoint2.y 
            } : undefined,
          }))
        };
        // Also flip the element's position relative to center
        const flippedElementY = centerY + (centerY - element.y);
        return { id: element.id, updates: { y: flippedElementY, path: flippedPath } };
      } else if (element.type === 'text') {
        // Flip text element vertically
        const elementHeight = (element.fontSize || 16) * (element.lineHeight || 1.2);
        const flippedY = centerY + (centerY - (element.y + elementHeight));
        return { id: element.id, updates: { y: flippedY } };
      } else {
        // Flip regular elements vertically
        const elementHeight = element.height || (element.radius ? element.radius * 2 : 0) || (element.radiusY ? element.radiusY * 2 : 0) || 100;
        const flippedY = centerY + (centerY - (element.y + elementHeight));
        return { id: element.id, updates: { y: flippedY } };
      }
    });

    updateMultipleElements(updates);
  }, [state.elements, updateMultipleElements]);

  return {
    state,
    actions: {
      addElement,
      selectElement,
      selectMultipleElements,
      selectAllElements,
      clearSelection,
      updateElement,
      updateMultipleElements,
      deleteElement,
      setTool,
      setZoom,
      setPan,
      importSVG,
      clearCanvas,
      exportSVG,
      getElementsInRectangle,
      addDrawingLine,
      updateDrawingLine,
      // Undo/Redo actions
      undo,
      redo,
      clearHistory,
      // Flip actions
      flipHorizontally,
      flipVertically,
    },
    undoRedo: {
      canUndo,
      canRedo,
    },
  };
};
