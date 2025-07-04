'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { SVGElement } from '@/types/svg';
import { Square, Circle, Move, Pencil, Minus } from 'lucide-react';

interface VirtualizedElementListProps {
  elements: SVGElement[];
  selectedElementIds: string[];
  onElementSelect: (elementId: string, ctrlKey: boolean) => void;
  onElementDelete: (elementId: string) => void;
  itemHeight?: number;
  maxVisibleItems?: number;
}

export const VirtualizedElementList: React.FC<VirtualizedElementListProps> = ({
  elements,
  selectedElementIds,
  onElementSelect,
  onElementDelete,
  itemHeight = 40,
  maxVisibleItems = 10,
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (elements.length <= maxVisibleItems) {
      return { start: 0, end: elements.length };
    }
    
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(start + maxVisibleItems + 1, elements.length);
    
    return { start, end };
  }, [elements.length, scrollTop, itemHeight, maxVisibleItems]);
  
  const visibleElements = useMemo(() => {
    return elements.slice(visibleRange.start, visibleRange.end);
  }, [elements, visibleRange]);
  
  const totalHeight = elements.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  // Helper function to get icon for element type
  const getElementIcon = (type: SVGElement['type']) => {
    switch (type) {
      case 'rect':
        return Square;
      case 'circle':
        return Circle;
      case 'path':
        return Move;
      case 'drawing':
        return Pencil;
      case 'line':
        return Minus;
      default:
        return Square;
    }
  };
  
  return (
    <div 
      className="overflow-auto"
      style={{ height: Math.min(maxVisibleItems * itemHeight, totalHeight) }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleElements.map((element, index) => {
            const actualIndex = visibleRange.start + index;
            const Icon = getElementIcon(element.type);
            return (
              <div
                key={element.id}
                className={`p-2 text-sm rounded cursor-pointer flex justify-between items-center ${
                  element.isSelected 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'hover:bg-gray-100'
                }`}
                style={{ height: itemHeight }}
                onClick={(e) => onElementSelect(element.id, e.ctrlKey)}
              >
                <div className="flex flex-col">
                  <span className="flex items-center">
                    <Icon className="w-4 h-4 mr-1" />
                    <span className="capitalize">{element.type}</span> #{element.id.slice(-6)}
                  </span>
                  {element.isSelected && (
                    <span className={`text-xs ${
                      element.selectionMode === 'transform' 
                        ? 'text-blue-600' 
                        : 'text-green-600'
                    }`}>
                      {element.selectionMode === 'transform' ? 'Transform' : 'Edit'}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onElementDelete(element.id);
                  }}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
