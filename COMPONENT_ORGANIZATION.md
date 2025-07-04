# SVG Editor - Component Organization

## Overview
The components have been reorganized into a clean, modular structure for better maintainability and development experience.

## Directory Structure

```
src/components/
├── index.ts                 # Main barrel export
├── core/                    # Core editor functionality
│   ├── index.ts
│   ├── SVGEditor.tsx        # Main editor component
│   └── MultiSelectionGroup.tsx
├── elements/                # SVG element renderers
│   ├── index.ts
│   ├── DrawingElement.tsx   # Free drawing/pencil tool
│   ├── LineElement.tsx      # Straight line tool
│   ├── PathElement.tsx      # Path/bezier curves
│   └── ShapeElement.tsx     # Rectangles, circles, ellipses
├── panels/                  # UI panels and toolbars
│   ├── index.ts
│   ├── Toolbar.tsx          # Main toolbar with tools
│   └── PropertiesPanel.tsx  # Properties editing panel
├── common/                  # Reusable UI components
│   ├── index.ts
│   ├── FileUpload.tsx       # SVG file import
│   └── TransformableWrapper.tsx # Transform controls
└── performance/             # Performance optimization
    ├── index.ts
    ├── PerformanceMonitor.tsx
    └── VirtualizedElementList.tsx
```

## Component Categories

### Core Components
- **SVGEditor**: Main editor component that orchestrates everything
- **MultiSelectionGroup**: Handles multi-element selection and group transforms

### Element Components
Each element type has its own component for rendering and interaction:
- **DrawingElement**: Handles free-hand drawing (pencil tool)
- **LineElement**: Handles straight lines
- **PathElement**: Handles complex paths and bezier curves
- **ShapeElement**: Handles basic shapes (rect, circle, ellipse)

### Panel Components
- **Toolbar**: Main toolbar with tool selection, undo/redo, flip controls
- **PropertiesPanel**: Properties editing with color controls, opacity, etc.

### Common Components
- **FileUpload**: SVG file import functionality
- **TransformableWrapper**: Reusable transform controls

### Performance Components
- **PerformanceMonitor**: Performance tracking and optimization
- **VirtualizedElementList**: Efficient rendering for large element lists

## Import Structure

All components can be imported from the main barrel export:

```typescript
import { 
  SVGEditor, 
  Toolbar, 
  PropertiesPanel,
  DrawingElement,
  // ... other components
} from '@/components';
```

Or from specific categories:

```typescript
import { SVGEditor } from '@/components/core';
import { DrawingElement, LineElement } from '@/components/elements';
import { Toolbar } from '@/components/panels';
```

## Benefits

1. **Better Organization**: Related components are grouped together
2. **Easier Navigation**: Clear separation of concerns
3. **Scalability**: Easy to add new components in appropriate categories
4. **Maintainability**: Easier to find and modify specific functionality
5. **Clean Imports**: Barrel exports provide clean import statements

## Features Implemented

### Color Control System
- Full color control for fill and stroke properties
- Opacity controls for both fill and stroke
- Color picker integration
- Support for transparent/none colors
- Color presets and swatches

### Element Support
All element types support:
- Selection and multi-selection
- Drag and transform operations
- Color and opacity controls
- Flip operations (horizontal/vertical)
- Undo/redo functionality

### Performance Optimizations
- Virtualized rendering for large element lists
- Throttled mouse events
- Memoized components
- Efficient update batching
