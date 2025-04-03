import { IChartApi } from 'lightweight-charts';
import { LineTool } from './LineTool';
import { Point, LineToolOptions } from './types';

export class LineManager {
    private lines: Array<{
        tool: LineTool,
        startPoint: Point,
        endPoint: Point
    }> = [];
    private currentLine: LineTool | null = null;
    private currentStartPoint: Point | null = null;
    private onLinesChanged: (() => void) | null = null;

    private updateLines = () => {
        // 立即更新所有线段位置，无延迟
        if (!this.mainSeries || !this.lines.length) return;

        this.lines.forEach(line => {
            const { startPoint, endPoint } = line;

            // 每次变化都重新计算坐标
            const startX = this.chart.timeScale().timeToCoordinate(startPoint.time!);
            const endX = this.chart.timeScale().timeToCoordinate(endPoint.time!);
            const startY = this.mainSeries.priceToCoordinate(startPoint.price!);
            const endY = this.mainSeries.priceToCoordinate(endPoint.price!);

            if (startX !== null && startY !== null && endX !== null && endY !== null) {
                // 直接更新，不使用requestAnimationFrame
                line.tool.redraw({
                    start: {
                        ...startPoint,
                        x: startX,
                        y: startY,
                        price: startPoint.price
                    },
                    end: {
                        ...endPoint,
                        x: endX,
                        y: endY,
                        price: endPoint.price
                    }
                });
            }
        });
    };

    constructor(private chart: IChartApi, private mainSeries: any) {
        // 捕获任何细微变化
        chart.timeScale().subscribeVisibleTimeRangeChange(this.updateLines);
        chart.timeScale().subscribeVisibleLogicalRangeChange(this.updateLines);
        chart.subscribeCrosshairMove(this.updateLines); // 添加十字线移动监听
        mainSeries.subscribeDataChanged(this.updateLines);
    }

    public startNewLine(options: LineToolOptions): LineTool {
        this.currentLine = new LineTool(this.chart, this.mainSeries, options);  // 修改这里，添加 mainSeries 参数
        return this.currentLine;
    }

    public getCurrentLine(): LineTool | null {
        return this.currentLine;
    }

    public setStartPoint(point: Point): void {
        if (!this.currentLine) return;
        this.currentStartPoint = {
            ...point,
            originalTime: point.time,
            originalPrice: point.price
        };
        console.log('Start point saved:', this.currentStartPoint);
    }

    public setOnLinesChanged(callback: () => void): void {
        this.onLinesChanged = callback;
    }

    public finishCurrentLine(endPoint: Point): void {
        if (!this.currentLine || !this.currentStartPoint) return;

        if (this.currentStartPoint.time && this.currentStartPoint.price &&
            endPoint.time && endPoint.price) {

            const savedLine = {
                tool: this.currentLine,
                startPoint: { ...this.currentStartPoint },
                endPoint: {
                    ...endPoint,
                    originalTime: endPoint.time,
                    originalPrice: endPoint.price
                }
            };

            this.lines.push(savedLine);

            // 触发线段变化事件
            this.onLinesChanged?.();

            console.log('Line saved:', {
                start: savedLine.startPoint,
                end: savedLine.endPoint,
                totalLines: this.lines.length
            });
        } else {
            this.currentLine.remove();
        }

        this.currentLine = null;
        this.currentStartPoint = null;
    }

    public removeAllLines(): void {
        this.lines.forEach(line => line.tool.remove());
        this.lines = [];
        if (this.currentLine) {
            this.currentLine.remove();
            this.currentLine = null;
        }
        this.currentStartPoint = null;
        this.onLinesChanged?.();

        // 移除所有监听
        if (this.chart) {
            this.chart.timeScale().unsubscribeVisibleTimeRangeChange(this.updateLines);
            this.chart.timeScale().unsubscribeVisibleLogicalRangeChange(this.updateLines);
            this.chart.unsubscribeCrosshairMove(this.updateLines);
            if (this.mainSeries) {
                this.mainSeries.unsubscribeDataChanged(this.updateLines);
            }
        }
    }

    public getLines(): Array<{
        tool: LineTool,
        startPoint: Point,
        endPoint: Point
    }> {
        return this.lines;
    }

    public removeLine(index: number): void {
        if (index >= 0 && index < this.lines.length) {
            const line = this.lines[index];
            line.tool.remove();
            this.lines.splice(index, 1);
            this.onLinesChanged?.();
        }
    }

    public getLineAtPosition(x: number, y: number, tolerance: number = 5): number {
        // 查找距离点击位置最近的线段
        for (let i = 0; i < this.lines.length; i++) {
            const line = this.lines[i];
            if (this.isPointNearLine(x, y, line.startPoint, line.endPoint, tolerance)) {
                return i;
            }
        }
        return -1;
    }

    private isPointNearLine(x: number, y: number, start: Point, end: Point, tolerance: number): boolean {
        const A = x - start.x;
        const B = y - start.y;
        const C = end.x - start.x;
        const D = end.y - start.y;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        const param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = start.x;
            yy = start.y;
        } else if (param > 1) {
            xx = end.x;
            yy = end.y;
        } else {
            xx = start.x + param * C;
            yy = start.y + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < tolerance;
    }
}
