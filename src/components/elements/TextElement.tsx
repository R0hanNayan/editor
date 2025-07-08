'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Text, Group, Transformer } from 'react-konva';
import { SVGElement } from '@/types/svg';
import Konva from 'konva';
import { SkewHandles } from '../common/SkewHandles';

interface TextElementProps {
  element: SVGElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (elementId: string, updates: Partial<SVGElement>) => void;
  isMultiSelected: boolean;
}

export const TextElement: React.FC<TextElementProps> = React.memo(({
  element,
  isSelected,
  onSelect,
  onUpdate,
  isMultiSelected,
}) => {
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [isEditing, setIsEditing] = useState(false);
  const editingRef = useRef<boolean>(false);

  if (element.type !== 'text') {
    return null;
  }

  useEffect(() => {
    if (isSelected && element.selectionMode === 'transform' && !isMultiSelected) {
      // Only attach transformer if not part of multi-selection
      if (trRef.current && textRef.current) {
        trRef.current.nodes([textRef.current]);
        trRef.current.getLayer()?.batchDraw();
      }
    }
  }, [isSelected, isMultiSelected, element.selectionMode]);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onSelect();
  };

  const handleDblClick = () => {
    if (isSelected && !isMultiSelected && !editingRef.current) {
      setIsEditing(true);
      // Switch to edit mode for text editing
      onUpdate(element.id, { selectionMode: 'edit' });
      // Start editing immediately
      setTimeout(() => {
        if (!editingRef.current) {
          handleTextEdit();
        }
      }, 10);
    }
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (isMultiSelected) return;
    
    const node = e.target as Konva.Text;
    const pos = node.position();
    
    // Use requestAnimationFrame to batch the update - direct coordinates
    requestAnimationFrame(() => {
      onUpdate(element.id, { x: pos.x, y: pos.y });
    });
  };

  const handleTransformEnd = () => {
    if (textRef.current) {
      const node = textRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const rotation = node.rotation();
      
      // Batch the updates with requestAnimationFrame
      requestAnimationFrame(() => {
        // For text, we should adjust width and reset scale
        const newWidth = Math.max(50, (element.width || 200) * scaleX);
        
        // Reset scale and rotation transforms on the node
        node.scaleX(1);
        node.scaleY(1);
        node.rotation(0);

        // Normalize rotation to prevent accumulation issues
        const normalizeRotation = (rot: number) => {
          rot = rot % 360;
          if (rot > 180) rot -= 360;
          if (rot < -180) rot += 360;
          return rot;
        };

        const updates: Partial<SVGElement> = {
          x: node.x(),
          y: node.y(),
          width: newWidth,
          rotation: normalizeRotation(rotation),
        };
        
        onUpdate(element.id, updates);
      });
    }
  };

  const handleTextEdit = () => {
    console.log('handleTextEdit called', { 
      textRef: !!textRef.current, 
      editingRef: editingRef.current 
    });
    
    if (!textRef.current || editingRef.current) return;
    
    editingRef.current = true;
    const textNode = textRef.current;
    const stage = textNode.getStage();
    if (!stage) {
      editingRef.current = false;
      return;
    }

    console.log('Creating textarea for editing...');

    // Hide text node while editing
    textNode.hide();

    // Create textarea for editing
    const textPosition = textNode.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();
    const areaPosition = {
      x: stageBox.left + textPosition.x,
      y: stageBox.top + textPosition.y,
    };

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = element.text || '';
    textarea.style.position = 'absolute';
    textarea.style.top = areaPosition.y + 'px';
    textarea.style.left = areaPosition.x + 'px';
    textarea.style.width = (element.width || 200) + 'px';
    textarea.style.height = 'auto';
    textarea.style.fontSize = (element.fontSize || 16) + 'px';
    textarea.style.fontFamily = element.fontFamily || 'Arial, sans-serif';
    textarea.style.fontWeight = element.fontWeight || 'normal';
    textarea.style.fontStyle = element.fontStyle || 'normal';
    textarea.style.textAlign = element.textAlign || 'left';
    textarea.style.color = element.fill || '#000000';
    textarea.style.backgroundColor = 'transparent';
    textarea.style.border = '2px solid #3b82f6';
    textarea.style.borderRadius = '4px';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = (element.lineHeight || 1.2).toString();
    textarea.style.padding = '4px';
    textarea.style.margin = '0';
    textarea.style.overflow = 'hidden';
    textarea.style.zIndex = '1000';

    // Auto-resize textarea
    const autoResize = () => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    };

    textarea.addEventListener('input', autoResize);
    autoResize();

    textarea.focus();
    textarea.select();

    let isRemoving = false;

    const removeTextarea = () => {
      if (isRemoving) return;
      isRemoving = true;
      
      try {
        if (textarea && document.body.contains(textarea)) {
          document.body.removeChild(textarea);
        }
      } catch (error) {
        console.warn('Error removing textarea:', error);
      }
      
      textNode.show();
      setIsEditing(false);
      stage.batchDraw();
    };

    const setTextareaWidth = (newWidth: number) => {
      if (!isNaN(newWidth)) {
        textarea.style.width = newWidth + 'px';
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        // Save text on Enter (without Shift)
        e.preventDefault();
        onUpdate(element.id, { 
          text: textarea.value,
          selectionMode: 'transform'
        });
        cleanup();
      }
    };

    const handleBlur = () => {
      // Use setTimeout to allow other events to complete first
      setTimeout(() => {
        if (!isRemoving) {
          onUpdate(element.id, { 
            text: textarea.value,
            selectionMode: 'transform'
          });
          cleanup();
        }
      }, 10);
    };

    const cleanup = () => {
      if (isRemoving) return;
      isRemoving = true;
      
      // Remove event listeners
      textarea.removeEventListener('keydown', handleKeyDown);
      textarea.removeEventListener('blur', handleBlur);
      textarea.removeEventListener('input', autoResize);
      
      // Remove textarea from DOM
      try {
        if (textarea && document.body.contains(textarea)) {
          document.body.removeChild(textarea);
        }
      } catch (error) {
        console.warn('Error removing textarea:', error);
      }
      
      textNode.show();
      setIsEditing(false);
      editingRef.current = false;
      stage.batchDraw();
    };

    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('blur', handleBlur);

    // Cleanup function for component unmount or edit mode change
    return cleanup;
  };

  // Start editing when switching to edit mode
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (element.selectionMode === 'edit' && !editingRef.current) {
      setIsEditing(true);
      cleanup = handleTextEdit();
    }
    
    // Return cleanup function for useEffect
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [element.selectionMode]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      editingRef.current = false;
      setIsEditing(false);
    };
  }, []);

  return (
    <Group>
      <Text
        ref={textRef}
        id={`shape-${element.id}`}
        x={element.x}
        y={element.y}
        text={element.text || 'Double-click to edit'}
        fontSize={element.fontSize || 16}
        fontFamily={element.fontFamily || 'Arial, sans-serif'}
        fontStyle={element.fontStyle || 'normal'}
        fontWeight={element.fontWeight || 'normal'}
        fill={element.fill === 'transparent' || element.fill === 'none' ? undefined : element.fill}
        fillOpacity={element.fillOpacity}
        stroke={isSelected ? '#3b82f6' : (element.stroke === 'transparent' || element.stroke === 'none' ? undefined : element.stroke)}
        strokeOpacity={isSelected ? 1 : element.strokeOpacity}
        strokeWidth={element.strokeWidth || 0}
        align={element.textAlign || 'left'}
        verticalAlign={element.verticalAlign || 'top'}
        width={element.width || 200}
        lineHeight={element.lineHeight || 1.2}
        letterSpacing={element.letterSpacing || 0}
        textDecoration={element.textDecoration || ''}
        rotation={element.rotation || 0}
        skewX={element.skewX || 0}
        skewY={element.skewY || 0}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
        // Enable drag for single selection, disable for multi-selection
        draggable={!isMultiSelected && isSelected}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        perfectDrawEnabled={false}
        // Add visual feedback for selection
        shadowColor={isSelected ? '#3b82f6' : undefined}
        shadowBlur={isSelected ? 4 : 0}
        shadowOpacity={isSelected ? 0.3 : 0}
        shadowOffsetX={0}
        shadowOffsetY={0}
      />
      
      {/* Transformer - only show when selected and not multi-selected and in transform mode */}
      {isSelected && !isMultiSelected && element.selectionMode === 'transform' && (
        <Transformer
          ref={trRef}
          enabledAnchors={['middle-left', 'middle-right']}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 50) {
              return oldBox;
            }
            return newBox;
          }}
          onTransformEnd={handleTransformEnd}
        />
      )}
      
      {/* Skew Mode Handles */}
      {isSelected && !isMultiSelected && element.selectionMode === 'skew' && (
        <SkewHandles
          element={element}
          onUpdate={(updates) => onUpdate(element.id, updates)}
          getBounds={() => ({
            width: element.width || 200,
            height: (element.fontSize || 16) * (element.lineHeight || 1.2),
            centerX: element.x + (element.width || 200) / 2,
            centerY: element.y + ((element.fontSize || 16) * (element.lineHeight || 1.2)) / 2
          })}
        />
      )}
    </Group>
  );
});

TextElement.displayName = 'TextElement';
