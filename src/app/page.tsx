import { SVGEditor, PerformanceMonitor } from '@/components';

export default function Home() {
  return (
    <main className="min-h-screen">
      <SVGEditor />
      <PerformanceMonitor />
    </main>
  );
}
