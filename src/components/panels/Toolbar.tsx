'use client';

import React from 'react';
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
  AlignEndVertical
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
            
            {/* Flip Actions - only show when elements are selected */}
            {hasSelection && (
              <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
                <button
                  onClick={onFlipHorizontal}
                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  title="Flip Horizontally (Ctrl+H)"
                >
                  <FlipHorizontal size={16} />
                </button>
                <button
                  onClick={onFlipVertical}
                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  title="Flip Vertically (Ctrl+V)"
                >
                  <FlipVertical size={16} />
                </button>
              </div>
            )}

            {/* Alignment Actions - only show when elements are selected */}
            {hasSelection && (
              <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
                <button
                  onClick={onAlignLeft}
                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  title="Align Left (Ctrl+←)"
                >
                  <AlignLeft size={16} />
                </button>
                <button
                  onClick={onAlignCenterHorizontally}
                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  title="Center Horizontally (Ctrl+-)"
                >
                  <AlignCenterHorizontal size={16} />
                </button>
                <button
                  onClick={onAlignRight}
                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  title="Align Right (Ctrl+→)"
                >
                  <AlignRight size={16} />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button
                  onClick={onAlignTop}
                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  title="Align Top (Ctrl+↑)"
                >
                  <AlignStartVertical size={16} />
                </button>
                <button
                  onClick={onAlignCenterVertically}
                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  title="Center Vertically (Ctrl+|)"
                >
                  <AlignCenterVertical size={16} />
                </button>
                <button
                  onClick={onAlignBottom}
                  className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                  title="Align Bottom (Ctrl+↓)"
                >
                  <AlignEndVertical size={16} />
                </button>
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
