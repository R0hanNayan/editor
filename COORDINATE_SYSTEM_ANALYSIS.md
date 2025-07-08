# Coordinate System Issues Analysis

## Current Problems

### 1. Duplicate Component Files
- Legacy files in `src/components/`: Simple coordinate handling
- New files in `src/components/elements/`: Complex Group-based handling
- SVGEditor uses new files, but legacy files still exist causing confusion

### 2. Inconsistent Coordinate Systems

#### Legacy System (src/components/):
```tsx
// DrawingElement.tsx - Direct point manipulation
onDragEnd={(e) => {
  const deltaX = node.x();
  const deltaY = node.y();
  node.position({ x: 0, y: 0 });
  
  const newPoints = element.points!.map((point, index) => {
    if (index % 2 === 0) {
      return point + deltaX; // x coordinate
    } else {
      return point + deltaY; // y coordinate
    }
  });
  onUpdate(element.id, { points: newPoints });
}}
```

#### New System (src/components/elements/):
```tsx
// DrawingElement.tsx - Complex Group with center offsets
const centerOffset = getDrawingCenterOffset();
const adjustedPoints = element.points.map((coord, index) => {
  if (index % 2 === 0) {
    return coord - centerOffset.x; // X coordinate
  } else {
    return coord - centerOffset.y; // Y coordinate
  }
});

<Group
  x={element.x + centerOffset.x}
  y={element.y + centerOffset.y}
  offsetX={centerOffset.x}
  offsetY={centerOffset.y}
  onDragEnd={(e) => {
    const pos = node.position();
    onUpdate(element.id, { 
      x: pos.x - centerOffset.x,
      y: pos.y - centerOffset.y
    });
  }}
>
```

### 3. MultiSelectionGroup Conflicts

MultiSelectionGroup updates drawing elements by directly modifying points:
```tsx
if (element.type === 'drawing' && element.points) {
  const newPoints = element.points.map((point, index) => {
    if (index % 2 === 0) {
      return point + deltaX; // x coordinate
    } else {
      return point + deltaY; // y coordinate
    }
  });
  return { id: element.id, updates: { points: newPoints } };
}
```

But individual DrawingElement uses Group positioning with center offsets, creating inconsistency.

### 4. Redundant Transformations

Current system applies multiple transforms:
1. Center offset calculation
2. Group positioning
3. Offset properties
4. Point adjustments
5. Transform matrices for rotation/skew

## Recommended Solutions

### 1. Remove Legacy Files
Delete duplicate files to eliminate confusion:
- `src/components/DrawingElement.tsx`
- `src/components/LineElement.tsx` 
- `src/components/ShapeElement.tsx`
- `src/components/PathElement.tsx`

### 2. Unified Coordinate System
Standardize on one approach:

**Option A: Simple Direct Coordinates (Recommended)**
- Store absolute coordinates in element state
- No center offset calculations
- Direct coordinate updates
- Simpler mental model

**Option B: Group-based with Center Offsets**
- Current complex system
- More suitable for complex transforms
- Requires consistent implementation across all elements

### 3. Consistent Multi-Selection Handling
Ensure MultiSelectionGroup and individual elements use the same coordinate system.

### 4. Simplified Transform Pipeline
Remove redundant transformations and use a single, clear transform pipeline.

## Implementation Priority

1. **High Priority**: Remove legacy duplicate files
2. **High Priority**: Fix MultiSelectionGroup coordinate inconsistency
3. **Medium Priority**: Standardize drag handling across all elements
4. **Medium Priority**: Simplify transform calculations
5. **Low Priority**: Performance optimizations

## Testing Requirements

After fixes:
1. Test single element drag for all types
2. Test multi-selection drag
3. Test rotation/skew transforms
4. Test undo/redo with coordinates
5. Test import/export coordinate preservation
