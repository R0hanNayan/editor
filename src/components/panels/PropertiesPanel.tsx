'use client';

import React, { useState, useEffect } from 'react';
import { SVGElement } from '@/types/svg';
import { useNumberInput } from '@/hooks/useNumberInput';

interface PropertiesPanelProps {
  selectedElement: SVGElement | null;
  onUpdateElement: (updates: Partial<SVGElement>) => void;
  onAlignLeft?: () => void;
  onAlignRight?: () => void;
  onAlignTop?: () => void;
  onAlignBottom?: () => void;
  onAlignCenterHorizontally?: () => void;
  onAlignCenterVertically?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
  onAlignLeft,
  onAlignRight,
  onAlignTop,
  onAlignBottom,
  onAlignCenterHorizontally,
  onAlignCenterVertically,
}) => {
  // Local state for font size input to allow clearing
  const [fontSizeInput, setFontSizeInput] = useState<string>('');

  // Update local font size input when selected element changes
  useEffect(() => {
    if (selectedElement?.type === 'text') {
      setFontSizeInput(String(selectedElement.fontSize || 16));
    }
  }, [selectedElement]);

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

        {selectedElement.type === 'path' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Path Points</label>
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              {selectedElement.path?.points ? `${selectedElement.path.points.length} points` : 'No points'}
            </div>
            <div className="text-xs text-gray-400 mt-1 space-y-1">
              <div><strong>Drawing:</strong> Click to add points</div>
              <div><strong>Finish:</strong> Double-click, Right-click, or press Enter/Escape</div>
              <div><strong>Close path:</strong> Press 'C' while drawing</div>
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

        {/* Alignment */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Alignment</label>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={onAlignLeft}
              disabled={!onAlignLeft}
              className="px-2 py-1 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Align Left"
            >
              ←
            </button>
            <button
              onClick={onAlignCenterHorizontally}
              disabled={!onAlignCenterHorizontally}
              className="px-2 py-1 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Center Horizontally"
            >
              ↔
            </button>
            <button
              onClick={onAlignRight}
              disabled={!onAlignRight}
              className="px-2 py-1 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Align Right"
            >
              →
            </button>
            <button
              onClick={onAlignTop}
              disabled={!onAlignTop}
              className="px-2 py-1 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Align Top"
            >
              ↑
            </button>
            <button
              onClick={onAlignCenterVertically}
              disabled={!onAlignCenterVertically}
              className="px-2 py-1 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Center Vertically"
            >
              ↕
            </button>
            <button
              onClick={onAlignBottom}
              disabled={!onAlignBottom}
              className="px-2 py-1 text-xs font-medium rounded border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Align Bottom"
            >
              ↓
            </button>
          </div>
          <div className="text-xs text-gray-400">
            Aligns selected elements to the bounds of other elements
          </div>
        </div>

        {/* Text Properties */}
        {selectedElement.type === 'text' && (
          <div className="space-y-4">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Text</label>
            
            {/* Text Content */}
            <div className="space-y-2">
              <label className="block text-xs text-gray-500">Content</label>
              <textarea
                value={selectedElement.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Enter text content..."
              />
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <label className="block text-xs text-gray-500">Font Family</label>
              <select
                value={selectedElement.fontFamily || 'Arial, sans-serif'}
                onChange={(e) => handleChange('fontFamily', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Arial, sans-serif">Arial</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Courier New', monospace">Courier New</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                <option value="Impact, sans-serif">Impact</option>
              </select>
            </div>

            {/* Font Size and Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                <input
                  type="number"
                  value={fontSizeInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFontSizeInput(value);
                    
                    if (value === '') {
                      // Allow empty input temporarily, don't update element yet
                      return;
                    }
                    
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                      // Clamp value between 1 and 200
                      const clampedValue = Math.max(1, Math.min(200, numValue));
                      handleChange('fontSize', clampedValue);
                    }
                  }}
                  onBlur={(e) => {
                    // Ensure valid value on blur
                    const value = e.target.value;
                    if (value === '' || isNaN(parseInt(value))) {
                      const defaultSize = 16;
                      setFontSizeInput(String(defaultSize));
                      handleChange('fontSize', defaultSize);
                    } else {
                      const numValue = parseInt(value);
                      const clampedValue = Math.max(1, Math.min(200, numValue));
                      setFontSizeInput(String(clampedValue));
                      handleChange('fontSize', clampedValue);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8-200"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Weight</label>
                <select
                  value={selectedElement.fontWeight || 'normal'}
                  onChange={(e) => handleChange('fontWeight', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="lighter">Light</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                  <option value="300">300</option>
                  <option value="400">400</option>
                  <option value="500">500</option>
                  <option value="600">600</option>
                  <option value="700">700</option>
                  <option value="800">800</option>
                  <option value="900">900</option>
                </select>
              </div>
            </div>

            {/* Text Alignment */}
            <div className="space-y-2">
              <label className="block text-xs text-gray-500">Text Alignment</label>
              <div className="flex gap-2">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => handleChange('textAlign', align)}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      (selectedElement.textAlign || 'left') === align
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {align.charAt(0).toUpperCase() + align.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Style */}
            <div className="space-y-2">
              <label className="block text-xs text-gray-500">Style</label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleChange('fontStyle', selectedElement.fontStyle === 'italic' ? 'normal' : 'italic')}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    selectedElement.fontStyle === 'italic'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <em>Italic</em>
                </button>
                <button
                  onClick={() => handleChange('textDecoration', selectedElement.textDecoration === 'underline' ? '' : 'underline')}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    selectedElement.textDecoration === 'underline'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <u>Underline</u>
                </button>
              </div>
            </div>

            {/* Line Height and Letter Spacing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Line Height</label>
                <input
                  type="number"
                  value={selectedElement.lineHeight || 1.2}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') return;
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue >= 0.5 && numValue <= 3) {
                      handleChange('lineHeight', numValue);
                    }
                  }}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value);
                    if (isNaN(value) || value < 0.5) {
                      handleChange('lineHeight', 0.5);
                    } else if (value > 3) {
                      handleChange('lineHeight', 3);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.1"
                  placeholder="0.5-3"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Letter Spacing</label>
                <input
                  type="number"
                  value={selectedElement.letterSpacing || 0}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') return;
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue >= -5 && numValue <= 10) {
                      handleChange('letterSpacing', numValue);
                    }
                  }}
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value);
                    if (isNaN(value) || value < -5) {
                      handleChange('letterSpacing', -5);
                    } else if (value > 10) {
                      handleChange('letterSpacing', 10);
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.1"
                  placeholder="-5 to 10"
                />
              </div>
            </div>

            {/* Text Width */}
            <div className="space-y-2">
              <label className="block text-xs text-gray-500">Text Width</label>
              <input
                type="number"
                value={selectedElement.width || 200}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') return;
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 50 && numValue <= 1000) {
                    handleChange('width', numValue);
                  }
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value);
                  if (isNaN(value) || value < 50) {
                    handleChange('width', 50);
                  } else if (value > 1000) {
                    handleChange('width', 1000);
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="50-1000"
              />
            </div>
          </div>
        )}

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
