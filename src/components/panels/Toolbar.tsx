'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  MousePointer, 
  Move, 
  Square, 
  Circle, 
  ZoomIn, 
  ZoomOut, 
  Trash2,
  RotateCcw,
  Download,
  Pencil,
  Minus,
  Undo,
  Redo,
  FlipHorizontal,
  FlipVertical,
  Type,
  PenTool,
  AlignLeft,
  AlignRight,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignStartVertical,
  AlignEndVertical,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { EditorState } from '@/types/svg';

interface ToolbarProps {
  currentTool: EditorState['tool'];
  onToolChange: (tool: EditorState['tool']) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onClear: () => void;
  onExport: () => void;
  onSelectAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onAlignLeft: () => void;
  onAlignRight: () => void;
  onAlignTop: () => void;
  onAlignBottom: () => void;
  onAlignCenterHorizontally: () => void;
  onAlignCenterVertically: () => void;
  hasSelection: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  zoom,
  onZoomChange,
  onClear,
  onExport,
  onSelectAll,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onFlipHorizontal,
  onFlipVertical,
  onAlignLeft,
  onAlignRight,
  onAlignTop,
  onAlignBottom,
  onAlignCenterHorizontally,
  onAlignCenterVertically,
  hasSelection,
}) => {
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [showTransformMenu, setShowTransformMenu] = useState(false);
  const alignMenuRef = useRef<HTMLDivElement>(null);
  const transformMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alignMenuRef.current && !alignMenuRef.current.contains(event.target as Node)) {
        setShowAlignMenu(false);
      }
      if (transformMenuRef.current && !transformMenuRef.current.contains(event.target as Node)) {
        setShowTransformMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tools = [
    { id: 'select' as const, icon: MousePointer, label: 'Select' },
    { id: 'pencil' as const, icon: Pencil, label: 'Pencil' },
    { id: 'line' as const, icon: Minus, label: 'Line' },
    { id: 'path' as const, icon: PenTool, label: 'Path' },
    { id: 'rect' as const, icon: Square, label: 'Rectangle' },
    { id: 'circle' as const, icon: Circle, label: 'Circle' },
    { id: 'text' as const, icon: Type, label: 'Text' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 p-3">
      <div className="flex items-center justify-between">
        {/* Left Section - Tools and Selection */}
        <div className="flex items-center gap-4">
          {/* Drawing Tools */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {tools.map(tool => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => onToolChange(tool.id)}
                  className={`p-2 rounded-md transition-colors ${
                    currentTool === tool.id
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  title={tool.label}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>

          {/* Selection Tools */}
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`px-3 py-2 text-sm font-medium transition-colors border-r border-gray-200 ${
                  canUndo 
                    ? 'text-gray-700 bg-white hover:bg-gray-50' 
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo size={16} className="mr-1" />
                Undo
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  canRedo 
                    ? 'text-gray-700 bg-white hover:bg-gray-50' 
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Y)"
              >
                <Redo size={16} className="mr-1" />
                Redo
              </button>
            </div>
            
            <button
              onClick={onSelectAll}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors border border-gray-200"
              title="Select All Elements"
            >
              Select All
            </button>
            
            {/* Transform & Alignment Actions - only show when elements are selected */}
            {hasSelection && (
              <div className="flex items-center gap-1">
                {/* Transform Dropdown */}
                <div className="relative" ref={transformMenuRef}>
                  <button
                    onClick={() => setShowTransformMenu(!showTransformMenu)}
                    className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors border border-gray-200"
                    title="Transform Options"
                  >
                    <MoreHorizontal size={16} />
                    <ChevronDown size={12} />
                  </button>
                  
                  {showTransformMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]">
                      <div className="p-1">
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                          Transform
                        </div>
                        <button
                          onClick={() => {
                            onFlipHorizontal();
                            setShowTransformMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                        >
                          <FlipHorizontal size={16} />
                          Flip Horizontally
                          <span className="ml-auto text-xs text-gray-400">Ctrl+H</span>
                        </button>
                        <button
                          onClick={() => {
                            onFlipVertical();
                            setShowTransformMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                        >
                          <FlipVertical size={16} />
                          Flip Vertically
                          <span className="ml-auto text-xs text-gray-400">Ctrl+Shift+V</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Align Dropdown */}
                <div className="relative" ref={alignMenuRef}>
                  <button
                    onClick={() => setShowAlignMenu(!showAlignMenu)}
                    className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors border border-gray-200"
                    title="Alignment Options"
                  >
                    <AlignCenterHorizontal size={16} />
                    <ChevronDown size={12} />
                  </button>
                  
                  {showAlignMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
                      <div className="p-1">
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                          Horizontal Alignment
                        </div>
                        <button
                          onClick={() => {
                            onAlignLeft();
                            setShowAlignMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                        >
                          <AlignLeft size={16} />
                          Align Left
                          <span className="ml-auto text-xs text-gray-400">Ctrl+←</span>
                        </button>
                        <button
                          onClick={() => {
                            onAlignCenterHorizontally();
                            setShowAlignMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                        >
                          <AlignCenterHorizontal size={16} />
                          Center Horizontally
                          <span className="ml-auto text-xs text-gray-400">Ctrl+-</span>
                        </button>
                        <button
                          onClick={() => {
                            onAlignRight();
                            setShowAlignMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                        >
                          <AlignRight size={16} />
                          Align Right
                          <span className="ml-auto text-xs text-gray-400">Ctrl+→</span>
                        </button>
                        
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <div className="px-3 py-2 text-xs font-medium text-gray-500">
                            Vertical Alignment
                          </div>
                          <button
                            onClick={() => {
                              onAlignTop();
                              setShowAlignMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                          >
                            <AlignStartVertical size={16} />
                            Align Top
                            <span className="ml-auto text-xs text-gray-400">Ctrl+↑</span>
                          </button>
                          <button
                            onClick={() => {
                              onAlignCenterVertically();
                              setShowAlignMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                          >
                            <AlignCenterVertical size={16} />
                            Center Vertically
                            <span className="ml-auto text-xs text-gray-400">Ctrl+|</span>
                          </button>
                          <button
                            onClick={() => {
                              onAlignBottom();
                              setShowAlignMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                          >
                            <AlignEndVertical size={16} />
                            Align Bottom
                            <span className="ml-auto text-xs text-gray-400">Ctrl+↓</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Section - Zoom Controls */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1">
          <button
            onClick={() => onZoomChange(zoom / 1.2)}
            className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          
          <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={() => onZoomChange(zoom * 1.2)}
            className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          
          <button
            onClick={() => onZoomChange(1)}
            className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title="Reset Zoom"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors border border-green-200"
            title="Export SVG"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-200"
            title="Clear Canvas"
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
