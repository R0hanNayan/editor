// Performance utilities for handling large numbers of SVG elements

// Chunk array processing to prevent blocking the main thread
export const processInChunks = async <T, R>(
  items: T[],
  processor: (item: T) => R,
  chunkSize: number = 50
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = chunk.map(processor);
    results.push(...chunkResults);
    
    // Yield to the main thread after each chunk
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
};

// Debounce function for batch operations
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

// Throttle with requestAnimationFrame for smooth updates
export const throttleRaf = <T extends (...args: any[]) => any>(
  func: T
): T => {
  let rafId: number | null = null;
  let lastArgs: any[] = [];
  
  return ((...args: any[]) => {
    lastArgs = args;
    
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func(...lastArgs);
        rafId = null;
      });
    }
  }) as T;
};

// Virtual rendering utility for large lists
export const getVisibleElements = <T extends { x: number; y: number; width?: number; height?: number; radius?: number }>(
  elements: T[],
  viewBox: { x: number; y: number; width: number; height: number },
  zoom: number,
  padding: number = 100
): T[] => {
  const scaledViewBox = {
    x: (viewBox.x - padding) / zoom,
    y: (viewBox.y - padding) / zoom,
    width: (viewBox.width + padding * 2) / zoom,
    height: (viewBox.height + padding * 2) / zoom,
  };
  
  return elements.filter(element => {
    const elementWidth = element.width || element.radius || 50;
    const elementHeight = element.height || element.radius || 50;
    
    // Check if element intersects with visible area
    return !(
      element.x + elementWidth < scaledViewBox.x ||
      element.y + elementHeight < scaledViewBox.y ||
      element.x > scaledViewBox.x + scaledViewBox.width ||
      element.y > scaledViewBox.y + scaledViewBox.height
    );
  });
};

// Enhanced batch state updates to prevent excessive re-renders
export class BatchUpdater {
  private updates: Array<() => void> = [];
  private rafId: number | null = null;
  private highPriorityUpdates: Array<() => void> = [];
  
  add(update: () => void, highPriority = false) {
    if (highPriority) {
      this.highPriorityUpdates.push(update);
    } else {
      this.updates.push(update);
    }
    this.schedule();
  }
  
  private schedule() {
    if (this.rafId !== null) return;
    
    this.rafId = requestAnimationFrame(() => {
      // Process high priority updates first
      const currentHighPriorityUpdates = [...this.highPriorityUpdates];
      this.highPriorityUpdates = [];
      
      const currentUpdates = [...this.updates];
      this.updates = [];
      this.rafId = null;
      
      // Execute high priority updates immediately
      currentHighPriorityUpdates.forEach(update => update());
      
      // Batch regular updates for better performance
      if (currentUpdates.length > 0) {
        // If we have many updates, process them in smaller batches
        if (currentUpdates.length > 100) {
          const batchSize = 50;
          for (let i = 0; i < currentUpdates.length; i += batchSize) {
            const batch = currentUpdates.slice(i, i + batchSize);
            batch.forEach(update => update());
            
            // Yield to browser if more batches to process
            if (i + batchSize < currentUpdates.length) {
              setTimeout(() => {}, 0);
            }
          }
        } else {
          // Execute all updates in a single batch for smaller sets
          currentUpdates.forEach(update => update());
        }
      }
    });
  }
  
  clear() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.updates = [];
    this.highPriorityUpdates = [];
  }
}

// Optimized chunked processing for heavy operations with better performance
export class ChunkedProcessor {
  private isProcessing = false;
  private cancelRequested = false;

  async processInChunks<T, R>(
    items: T[],
    processor: (item: T, index: number) => R,
    chunkSize: number = 50, // Increased default chunk size
    onProgress?: (processed: number, total: number) => void
  ): Promise<R[]> {
    if (this.isProcessing) {
      throw new Error('ChunkedProcessor is already processing');
    }

    this.isProcessing = true;
    this.cancelRequested = false;
    const results: R[] = [];
    
    try {
      const startTime = performance.now();
      let lastYield = startTime;
      
      for (let i = 0; i < items.length; i += chunkSize) {
        if (this.cancelRequested) {
          throw new Error('Processing was cancelled');
        }
        
        const chunk = items.slice(i, i + chunkSize);
        
        // Process chunk synchronously
        const chunkResults = chunk.map((item, index) => 
          processor(item, i + index)
        );
        
        results.push(...chunkResults);
        
        // Report progress
        if (onProgress) {
          onProgress(Math.min(i + chunkSize, items.length), items.length);
        }
        
        // Adaptive yielding - only yield if we've been processing for too long
        const now = performance.now();
        if (now - lastYield > 16 && i + chunkSize < items.length) { // 16ms ≈ 60fps
          await new Promise(resolve => {
            setTimeout(resolve, 0); // Use setTimeout instead of requestAnimationFrame for faster processing
          });
          lastYield = performance.now();
        }
      }
      
      return results;
    } finally {
      this.isProcessing = false;
      this.cancelRequested = false;
    }
  }

  cancel() {
    this.cancelRequested = true;
    this.isProcessing = false;
  }
}

// Global chunked processor instance
export const chunkedProcessor = new ChunkedProcessor();

// Transform calculation utility that can be used in chunks
export const calculateElementTransform = (
  element: any,
  transform: { scaleX: number; scaleY: number; rotation: number },
  center: { x: number; y: number }
) => {
  // Handle drawing elements differently - they use points array instead of x,y,width,height
  if (element.type === 'drawing' && element.points) {
    // Calculate bounding box of the drawing
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < element.points.length; i += 2) {
      const x = element.points[i];
      const y = element.points[i + 1];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    
    const drawingCenterX = (minX + maxX) / 2;
    const drawingCenterY = (minY + maxY) / 2;
    
    // Apply transformation relative to the group center
    const relativeX = drawingCenterX - center.x;
    const relativeY = drawingCenterY - center.y;

    // Apply scaling first
    let newRelativeX = relativeX * transform.scaleX;
    let newRelativeY = relativeY * transform.scaleY;
    
    // Apply rotation if present
    if (Math.abs(transform.rotation) > 0.001) {
      const rotationRadians = transform.rotation * (Math.PI / 180);
      const cos = Math.cos(rotationRadians);
      const sin = Math.sin(rotationRadians);
      const rotatedX = newRelativeX * cos - newRelativeY * sin;
      const rotatedY = newRelativeX * sin + newRelativeY * cos;
      newRelativeX = rotatedX;
      newRelativeY = rotatedY;
    }

    const newDrawingCenterX = center.x + newRelativeX;
    const newDrawingCenterY = center.y + newRelativeY;
    
    // Calculate the offset to apply to each point
    const offsetX = newDrawingCenterX - drawingCenterX;
    const offsetY = newDrawingCenterY - drawingCenterY;
    
    // Transform each point
    const newPoints = [];
    for (let i = 0; i < element.points.length; i += 2) {
      let x = element.points[i];
      let y = element.points[i + 1];
      
      // Apply scaling relative to drawing center
      x = drawingCenterX + (x - drawingCenterX) * transform.scaleX;
      y = drawingCenterY + (y - drawingCenterY) * transform.scaleY;
      
      // Apply rotation relative to drawing center
      if (Math.abs(transform.rotation) > 0.001) {
        const rotationRadians = transform.rotation * (Math.PI / 180);
        const cos = Math.cos(rotationRadians);
        const sin = Math.sin(rotationRadians);
        const relX = x - drawingCenterX;
        const relY = y - drawingCenterY;
        x = drawingCenterX + (relX * cos - relY * sin);
        y = drawingCenterY + (relX * sin + relY * cos);
      }
      
      // Apply final offset
      newPoints.push(x + offsetX, y + offsetY);
    }
    
    return {
      id: element.id,
      updates: {
        points: newPoints,
        strokeWidth: Math.max(0.5, (element.strokeWidth || 2) * Math.max(transform.scaleX, transform.scaleY)),
      },
    };
  }

  // Handle line elements - they use x, y, x2, y2 coordinates
  if (element.type === 'line' && element.x2 !== undefined && element.y2 !== undefined) {
    // Calculate line center
    const lineCenterX = (element.x + element.x2) / 2;
    const lineCenterY = (element.y + element.y2) / 2;
    
    // Apply transformation relative to the group center
    const relativeX = lineCenterX - center.x;
    const relativeY = lineCenterY - center.y;

    // Apply scaling first
    let newRelativeX = relativeX * transform.scaleX;
    let newRelativeY = relativeY * transform.scaleY;
    
    // Apply rotation if present
    if (Math.abs(transform.rotation) > 0.001) {
      const rotationRadians = transform.rotation * (Math.PI / 180);
      const cos = Math.cos(rotationRadians);
      const sin = Math.sin(rotationRadians);
      const rotatedX = newRelativeX * cos - newRelativeY * sin;
      const rotatedY = newRelativeX * sin + newRelativeY * cos;
      newRelativeX = rotatedX;
      newRelativeY = rotatedY;
    }

    const newLineCenterX = center.x + newRelativeX;
    const newLineCenterY = center.y + newRelativeY;
    
    // Calculate the offset to apply to both points
    const offsetX = newLineCenterX - lineCenterX;
    const offsetY = newLineCenterY - lineCenterY;
    
    // Transform both endpoints
    let x1 = element.x;
    let y1 = element.y;
    let x2 = element.x2;
    let y2 = element.y2;
    
    // Apply scaling relative to line center
    x1 = lineCenterX + (x1 - lineCenterX) * transform.scaleX;
    y1 = lineCenterY + (y1 - lineCenterY) * transform.scaleY;
    x2 = lineCenterX + (x2 - lineCenterX) * transform.scaleX;
    y2 = lineCenterY + (y2 - lineCenterY) * transform.scaleY;
    
    // Apply rotation relative to line center
    if (Math.abs(transform.rotation) > 0.001) {
      const rotationRadians = transform.rotation * (Math.PI / 180);
      const cos = Math.cos(rotationRadians);
      const sin = Math.sin(rotationRadians);
      
      // Rotate first point
      const rel1X = x1 - lineCenterX;
      const rel1Y = y1 - lineCenterY;
      x1 = lineCenterX + (rel1X * cos - rel1Y * sin);
      y1 = lineCenterY + (rel1X * sin + rel1Y * cos);
      
      // Rotate second point
      const rel2X = x2 - lineCenterX;
      const rel2Y = y2 - lineCenterY;
      x2 = lineCenterX + (rel2X * cos - rel2Y * sin);
      y2 = lineCenterY + (rel2X * sin + rel2Y * cos);
    }
    
    // Apply final offset
    return {
      id: element.id,
      updates: {
        x: x1 + offsetX,
        y: y1 + offsetY,
        x2: x2 + offsetX,
        y2: y2 + offsetY,
        strokeWidth: Math.max(0.5, (element.strokeWidth || 2) * Math.max(transform.scaleX, transform.scaleY)),
      },
    };
  }

  // Calculate element's center position for other element types
  const elementWidth = element.width || (element.radius ? element.radius * 2 : 0) || (element.radiusX ? element.radiusX * 2 : 0) || 100;
  const elementHeight = element.height || (element.radius ? element.radius * 2 : 0) || (element.radiusY ? element.radiusY * 2 : 0) || 100;
  
  const elementCenterX = element.x + elementWidth / 2;
  const elementCenterY = element.y + elementHeight / 2;

  // Apply transformation relative to the group center
  const relativeX = elementCenterX - center.x;
  const relativeY = elementCenterY - center.y;

  // Apply scaling first
  let newRelativeX = relativeX * transform.scaleX;
  let newRelativeY = relativeY * transform.scaleY;
  
  // Apply rotation if present
  if (Math.abs(transform.rotation) > 0.001) {
    // Convert degrees to radians for the math calculations
    const rotationRadians = transform.rotation * (Math.PI / 180);
    const cos = Math.cos(rotationRadians);
    const sin = Math.sin(rotationRadians);
    const rotatedX = newRelativeX * cos - newRelativeY * sin;
    const rotatedY = newRelativeX * sin + newRelativeY * cos;
    newRelativeX = rotatedX;
    newRelativeY = rotatedY;
  }

  const newCenterX = center.x + newRelativeX;
  const newCenterY = center.y + newRelativeY;

  // Calculate new element dimensions
  const newElementWidth = elementWidth * transform.scaleX;
  const newElementHeight = elementHeight * transform.scaleY;

  // Normalize rotation
  const normalizeRotation = (rotation: number): number => {
    rotation = rotation % 360;
    if (rotation > 180) rotation -= 360;
    if (rotation < -180) rotation += 360;
    return rotation;
  };

  let elementUpdates: any = {
    x: newCenterX - newElementWidth / 2,
    y: newCenterY - newElementHeight / 2,
    rotation: normalizeRotation((element.rotation || 0) + transform.rotation),
  };

  // Scale element dimensions based on type
  if (element.type === 'rect') {
    elementUpdates.width = Math.max(1, (element.width || 100) * transform.scaleX);
    elementUpdates.height = Math.max(1, (element.height || 100) * transform.scaleY);
  } else if (element.type === 'circle') {
    elementUpdates.radius = Math.max(1, (element.radius || 50) * Math.max(transform.scaleX, transform.scaleY));
  } else if (element.type === 'ellipse') {
    elementUpdates.radiusX = Math.max(1, (element.radiusX || 50) * transform.scaleX);
    elementUpdates.radiusY = Math.max(1, (element.radiusY || 30) * transform.scaleY);
  }

  return {
    id: element.id,
    updates: elementUpdates,
  };
};

// Optimized bulk transform processing for large selections
export const processBulkTransform = async (
  elements: any[],
  transform: { scaleX: number; scaleY: number; rotation: number },
  center: { x: number; y: number },
  onProgress?: (processed: number, total: number) => void
): Promise<Array<{ id: string; updates: any }>> => {
  const results: Array<{ id: string; updates: any }> = [];
  
  // For very large selections (>500), use Web Worker if available
  if (elements.length > 500 && typeof Worker !== 'undefined') {
    // TODO: Implement Web Worker for massive transforms
    // For now, fall back to chunked processing
  }
  
  // Optimized processing thresholds
  const SYNC_THRESHOLD = 100; // Process synchronously up to this many elements
  const CHUNK_SIZE = Math.min(75, Math.max(25, Math.floor(elements.length / 10))); // Dynamic chunk size
  
  if (elements.length <= SYNC_THRESHOLD) {
    // Process synchronously for smaller selections
    return elements.map(element => 
      calculateElementTransform(element, transform, center)
    );
  } else {
    // Use chunked processing for larger selections
    return await chunkedProcessor.processInChunks(
      elements,
      (element) => calculateElementTransform(element, transform, center),
      CHUNK_SIZE,
      onProgress
    );
  }
};

// Pre-compute transformation matrices for better performance
export const precomputeTransformMatrix = (
  scaleX: number,
  scaleY: number,
  rotation: number
) => {
  const rotationRadians = rotation * (Math.PI / 180);
  const cos = Math.cos(rotationRadians);
  const sin = Math.sin(rotationRadians);
  
  return {
    a: scaleX * cos,
    b: scaleX * sin,
    c: -scaleY * sin,
    d: scaleY * cos,
    rotation,
    scaleX,
    scaleY
  };
};

// Transform performance tracker
export class TransformPerformanceTracker {
  private startTime: number = 0;
  private elementCount: number = 0;
  
  start(elementCount: number) {
    this.startTime = performance.now();
    this.elementCount = elementCount;
    console.log(`🔄 Starting transform for ${elementCount} elements`);
  }
  
  finish() {
    const duration = performance.now() - this.startTime;
    const elementsPerMs = this.elementCount / duration;
    
    console.log(`✅ Transform completed in ${duration.toFixed(2)}ms (${elementsPerMs.toFixed(2)} elements/ms)`);
    
    // Warn if performance is poor
    if (duration > 100) {
      console.warn(`⚠️ Slow transform detected: ${duration.toFixed(2)}ms for ${this.elementCount} elements`);
    }
    
    return { duration, elementCount: this.elementCount, elementsPerMs };
  }
}

// Global transform performance tracker instance
export const transformTracker = new TransformPerformanceTracker();
