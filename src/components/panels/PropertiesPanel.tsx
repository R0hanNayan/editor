'use client';

import React from 'react';
import { SVGElement } from '@/types/svg';

interface PropertiesPanelProps {
  selectedElement: SVGElement | null;
  onUpdateElement: (updates: Partial<SVGElement>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
}) => {
  if (!selectedElement) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Properties</h3>
        <div className="text-center py-6 text-gray-500">
          <div className="text-sm">No element selected</div>
          <div className="text-xs mt-1">Select an element to edit properties</div>
        </div>
      </div>
    );
  }

  const handleChange = (property: keyof SVGElement, value: any) => {
    onUpdateElement({ [property]: value });
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Properties</h3>
      
      {/* Element Type and Mode */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 capitalize">
            {selectedElement.type} Element
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            selectedElement.selectionMode === 'transform' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {selectedElement.selectionMode === 'transform' ? 'Transform' : 'Edit'}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {selectedElement.selectionMode === 'transform' 
            ? 'Resize, rotate, and move the element'
            : 'Edit individual points and curves'
          }
        </p>
      </div>
      
      <div className="space-y-4">
        {/* Position */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Position</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">X</label>
              <input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => handleChange('x', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => handleChange('y', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Size for rectangles and circles */}
        {selectedElement.type === 'rect' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Size</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Width</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.width || 100)}
                  onChange={(e) => handleChange('width', parseFloat(e.target.value) || 100)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Height</label>
                <input
                  type="number"
                  value={Math.round(selectedElement.height || 100)}
                  onChange={(e) => handleChange('height', parseFloat(e.target.value) || 100)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {selectedElement.type === 'circle' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Radius</label>
            <input
              type="number"
              value={Math.round(selectedElement.radius || 50)}
              onChange={(e) => handleChange('radius', parseFloat(e.target.value) || 50)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {selectedElement.type === 'drawing' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Drawing Points</label>
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              {selectedElement.points ? `${selectedElement.points.length / 2} points` : 'No points'}
            </div>
          </div>
        )}

        {selectedElement.type === 'line' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Start X</label>
                <input
                  type="number"
                  value={selectedElement.x}
                  onChange={(e) => handleChange('x', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Start Y</label>
                <input
                  type="number"
                  value={selectedElement.y}
                  onChange={(e) => handleChange('y', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">End X</label>
                <input
                  type="number"
                  value={selectedElement.x2 || 0}
                  onChange={(e) => handleChange('x2', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">End Y</label>
                <input
                  type="number"
                  value={selectedElement.y2 || 0}
                  onChange={(e) => handleChange('y2', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rotation */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Rotation</label>
          <input
            type="range"
            value={selectedElement.rotation || 0}
            onChange={(e) => handleChange('rotation', parseFloat(e.target.value) || 0)}
            className="w-full"
            step="1"
            min="-180"
            max="180"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>-180°</span>
            <span className="font-medium">{Math.round(selectedElement.rotation || 0)}°</span>
            <span>180°</span>
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Colors</label>
          
          {/* Fill Color */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs text-gray-500">Fill</label>
              <button
                onClick={() => handleChange('fill', 'transparent')}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                title="Remove fill"
              >
                None
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="color"
                  value={selectedElement.fill === 'transparent' || selectedElement.fill === 'none' 
                    ? '#000000' 
                    : selectedElement.fill.startsWith('rgba') || selectedElement.fill.startsWith('rgb')
                      ? '#3b82f6' 
                      : selectedElement.fill}
                  onChange={(e) => handleChange('fill', e.target.value)}
                  className="w-12 h-10 rounded-md border border-gray-200 cursor-pointer"
                />
                {(selectedElement.fill === 'transparent' || selectedElement.fill === 'none') && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-0.5 bg-red-500 rotate-45"></div>
                  </div>
                )}
              </div>
              <input
                type="text"
                value={selectedElement.fill}
                onChange={(e) => handleChange('fill', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="transparent, #hex, rgb(), rgba()"
              />
            </div>
            
            {/* Fill Opacity */}
            {selectedElement.fill !== 'transparent' && selectedElement.fill !== 'none' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Opacity</label>
                  <span className="text-xs text-gray-500">
                    {Math.round((selectedElement.fillOpacity || 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={selectedElement.fillOpacity || 1}
                  onChange={(e) => handleChange('fillOpacity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Stroke Color */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs text-gray-500">Stroke</label>
              <button
                onClick={() => handleChange('stroke', 'transparent')}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                title="Remove stroke"
              >
                None
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="color"
                  value={selectedElement.stroke === 'transparent' || selectedElement.stroke === 'none'
                    ? '#000000'
                    : selectedElement.stroke.startsWith('rgba') || selectedElement.stroke.startsWith('rgb')
                      ? '#333333'
                      : selectedElement.stroke}
                  onChange={(e) => handleChange('stroke', e.target.value)}
                  className="w-12 h-10 rounded-md border border-gray-200 cursor-pointer"
                />
                {(selectedElement.stroke === 'transparent' || selectedElement.stroke === 'none') && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-0.5 bg-red-500 rotate-45"></div>
                  </div>
                )}
              </div>
              <input
                type="text"
                value={selectedElement.stroke}
                onChange={(e) => handleChange('stroke', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="transparent, #hex, rgb(), rgba()"
              />
            </div>
            
            {/* Stroke Width */}
            {selectedElement.stroke !== 'transparent' && selectedElement.stroke !== 'none' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Width</label>
                  <span className="text-xs text-gray-500">{selectedElement.strokeWidth || 1}px</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={selectedElement.strokeWidth || 1}
                  onChange={(e) => handleChange('strokeWidth', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Stroke Opacity */}
            {selectedElement.stroke !== 'transparent' && selectedElement.stroke !== 'none' && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Stroke Opacity</label>
                  <span className="text-xs text-gray-500">
                    {Math.round((selectedElement.strokeOpacity || 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={selectedElement.strokeOpacity || 1}
                  onChange={(e) => handleChange('strokeOpacity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Color Presets */}
          <div className="space-y-2">
            <label className="block text-xs text-gray-400">Quick Colors</label>
            <div className="grid grid-cols-8 gap-1">
              {[
                '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', 
                '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#f3f4f6', '#fee2e2',
                '#fed7aa', '#fef3c7', '#dcfce7', '#dbeafe', '#e9d5ff', '#fce7f3'
              ].map((color, index) => (
                <div key={color} className="relative group">
                  <button
                    onClick={() => handleChange('fill', color)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleChange('stroke', color);
                    }}
                    className="w-6 h-6 rounded border border-gray-200 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: color }}
                    title={`Left click: Fill, Right click: Stroke\n${color}`}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">Left click: Fill • Right click: Stroke</p>
          </div>
        </div>
      </div>
    </div>
  );
};
