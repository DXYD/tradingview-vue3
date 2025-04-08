import { IChartApi } from 'lightweight-charts';
import { Point, RectToolOptions } from './types';
import { RectTool } from './RectTool';

export class RectManager {
    private rectangles: RectTool[] = [];
    private currentRect: RectTool | null = null;

    constructor(
        private readonly chart: IChartApi,
        private readonly mainSeries: any
    ) {}

    public startNewRect(options: RectToolOptions): RectTool {
        this.currentRect = new RectTool(this.chart, this.mainSeries, options);
        this.rectangles.push(this.currentRect);
        return this.currentRect;
    }

    public finishCurrentRect(point?: Point): void {
        if (this.currentRect && point) {
            this.currentRect.stop(point);
            this.currentRect = null;
        }
    }

    public getRectAtPosition(x: number, y: number, threshold: number = 5): number {
        for (let i = this.rectangles.length - 1; i >= 0; i--) {
            const rect = this.rectangles[i];
            const points = rect.getPoints();
            if (points.start && points.end) {
                if (this.isPointNearRect(x, y, points.start, points.end, threshold)) {
                    return i;
                }
            }
        }
        return -1;
    }

    private isPointNearRect(x: number, y: number, start: Point, end: Point, threshold: number): boolean {
        const left = Math.min(start.x, end.x);
        const right = Math.max(start.x, end.x);
        const top = Math.min(start.y, end.y);
        const bottom = Math.max(start.y, end.y);

        // 判断点是否在矩形内部或边框附近
        const isInside = x >= left && x <= right && y >= top && y <= bottom;
        
        // 如果在内部，直接返回 true
        if (isInside) {
            return true;
        }
        
        // 否则检查是否在边框附近
        const nearHorizontalEdge = (y >= top - threshold && y <= top + threshold) ||
                                 (y >= bottom - threshold && y <= bottom + threshold);
        const nearVerticalEdge = (x >= left - threshold && x <= left + threshold) ||
                                (x >= right - threshold && x <= right + threshold);

        return (x >= left && x <= right && nearHorizontalEdge) ||
               (y >= top && y <= bottom && nearVerticalEdge);
    }

    public removeRect(index: number): void {
        if (index >= 0 && index < this.rectangles.length) {
            this.rectangles[index].remove();
            this.rectangles.splice(index, 1);
        }
    }

    public removeAllRects(): void {
        this.rectangles.forEach(rect => rect.remove());
        this.rectangles = [];
        this.currentRect = null;
    }

    public getRects(): RectTool[] {
        return this.rectangles;
    }

    public updateRect(index: number, newOptions: RectToolOptions): void {
        if (index >= 0 && index < this.rectangles.length) {
            const rect = this.rectangles[index];
            if (rect) {
                rect.updateOptions(newOptions);
                // 触发重绘
                const points = rect.getPoints();
                if (points.start && points.end) {
                    rect.start(points.start);
                    rect.stop(points.end);
                }
            }
        }
    }
}
