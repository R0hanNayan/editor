'use client';

import React, { useState, useEffect } from 'react';

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  lastUpdate: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    renderTime: 0,
    lastUpdate: Date.now(),
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measurePerformance = () => {
      const currentTime = performance.now();
      frameCount++;

      // Update FPS every second
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({
          ...prev,
          fps,
          lastUpdate: Date.now(),
        }));
        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measurePerformance);
    };

    measurePerformance();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 z-50"
      >
        Show Performance
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs font-mono z-50 min-w-48">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Performance</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={metrics.fps < 30 ? 'text-red-400' : metrics.fps < 50 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.fps}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Memory:</span>
          <span className="text-blue-400">
            {Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024) || 'N/A'} MB
          </span>
        </div>
      </div>
    </div>
  );
};
