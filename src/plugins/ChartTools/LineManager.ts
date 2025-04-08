import { IChartApi } from 'lightweight-charts';
import { LineTool } from './LineTool';
import { Point, LineToolOptions, RectToolOptions} from './types';
import { RectTool } from './RectTool';

export class LineManager {
    private lines: Array<{
        tool: LineTool,
        startPoint: Point,
        endPoint: Point
    }> = [];
    private currentLine: LineTool | null = null;
    private currentStartPoint: Point | null = null;
    private onLinesChanged: (() => void) | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private animationFrameId: number | null = null;
    private isAnimating: boolean = false;
    private targetPositions: Map<number, { start: Point, end: Point }> = new Map();

    private updateLines = () => {
        if (!this.mainSeries || !this.lines.length) return;

        // 取消之前的动画帧
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // 计算目标位置
        this.lines.forEach((line, index) => {
            const { startPoint, endPoint } = line;
            const startX = this.chart.timeScale().timeToCoordinate(startPoint.time!);
            const endX = this.chart.timeScale().timeToCoordinate(endPoint.time!);
            const startY = this.mainSeries.priceToCoordinate(startPoint.price!);
            const endY = this.mainSeries.priceToCoordinate(endPoint.price!);

            if (startX !== null && startY !== null && endX !== null && endY !== null) {
                this.targetPositions.set(index, {
                    start: { ...startPoint, x: startX, y: startY },
                    end: { ...endPoint, x: endX, y: endY }
                });
            }
        });

        // 开始动画
        this.startAnimation();
    };

    private startAnimation = () => {
        const animate = () => {
            let needsNextFrame = false;

            this.lines.forEach((line, index) => {
                const target = this.targetPositions.get(index);
                if (!target) return;

                const currentStart = line.tool.getPoints().start!;
                const currentEnd = line.tool.getPoints().end!;

                // 平滑插值
                const newStart = {
                    ...currentStart,
                    x: this.lerp(currentStart.x, target.start.x, 0.3),
                    y: this.lerp(currentStart.y, target.start.y, 0.3)
                };
                const newEnd = {
                    ...currentEnd,
                    x: this.lerp(currentEnd.x, target.end.x, 0.3),
                    y: this.lerp(currentEnd.y, target.end.y, 0.3)
                };

                // 检查是否需要继续动画
                if (
                    Math.abs(newStart.x - target.start.x) > 0.1 ||
                    Math.abs(newStart.y - target.start.y) > 0.1 ||
                    Math.abs(newEnd.x - target.end.x) > 0.1 ||
                    Math.abs(newEnd.y - target.end.y) > 0.1
                ) {
                    needsNextFrame = true;
                }

                line.tool.redraw({ start: newStart, end: newEnd });
            });

            if (needsNextFrame) {
                this.animationFrameId = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                this.targetPositions.clear();
            }
        };

        this.isAnimating = true;
        this.animationFrameId = requestAnimationFrame(animate);
    };

    // 线性插值辅助函数
    private lerp(start: number, end: number, t: number): number {
        return start + (end - start) * t;
    }

    private handleZoom = (e: WheelEvent) => {
        // 阻止事件冒泡，自己处理缩放
        e.preventDefault();

        if (!this.mainSeries || !this.lines.length) return;

        // 计算缩放中心点
        const rect = this.chart.chartElement().getBoundingClientRect();
        const centerX = e.clientX - rect.left;
        const centerY = e.clientY - rect.top;

        // 立即更新线段位置
        this.lines.forEach(line => {
            const { startPoint, endPoint } = line;
            const startX = this.chart.timeScale().timeToCoordinate(startPoint.time!);
            const endX = this.chart.timeScale().timeToCoordinate(endPoint.time!);
            const startY = this.mainSeries.priceToCoordinate(startPoint.price!);
            const endY = this.mainSeries.priceToCoordinate(endPoint.price!);

            if (startX !== null && startY !== null && endX !== null && endY !== null) {
                // 更新线段位置，使用动画
                this.animateLinePosition(line, {
                    start: { ...startPoint, x: startX, y: startY },
                    end: { ...endPoint, x: endX, y: endY }
                }, centerX, centerY);
            }
        });
    };

    private animateLinePosition(
        line: { tool: LineTool, startPoint: Point, endPoint: Point },
        target: { start: Point, end: Point },
        centerX: number,
        centerY: number
    ) {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        const animate = () => {
            const current = line.tool.getPoints();
            if (!current.start || !current.end) return;

            const easeAmount = 0.25;

            // 对于每个点，计算与缩放中心点的相对位置
            const newStart = {
                ...current.start,
                x: this.lerp(current.start.x, target.start.x, easeAmount),
                y: this.lerp(current.start.y, target.start.y, easeAmount)
            };

            const newEnd = {
                ...current.end,
                x: this.lerp(current.end.x, target.end.x, easeAmount),
                y: this.lerp(current.end.y, target.end.y, easeAmount)
            };

            // 检查是否需要继续动画
            if (
                Math.abs(newStart.x - target.start.x) > 0.1 ||
                Math.abs(newStart.y - target.start.y) > 0.1 ||
                Math.abs(newEnd.x - target.end.x) > 0.1 ||
                Math.abs(newEnd.y - target.end.y) > 0.1
            ) {
                line.tool.redraw({ start: newStart, end: newEnd });
                this.animationFrameId = requestAnimationFrame(animate);
            } else {
                // 最后一帧，确保精确位置
                line.tool.redraw({ start: target.start, end: target.end });
            }
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }

    constructor(private chart: IChartApi, private mainSeries: any) {
        // 监听滚动和缩放事件，使用同步更新
        chart.timeScale().subscribeVisibleTimeRangeChange(() => {
            // 立即同步更新线段位置
            this.immediateUpdateLines();
            // 触发线段变化事件，以便更新UI状态
            this.onLinesChanged?.();
        });

        chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
            // 立即同步更新线段位置
            this.immediateUpdateLines();
            // 触发线段变化事件，以便更新UI状态
            this.onLinesChanged?.();
        });
        
        // 其他事件使用普通动画更新
        chart.subscribeCrosshairMove(this.updateLines);
        mainSeries.subscribeDataChanged(this.updateLines);

        // 监听图表尺寸变化
        const resizeObserver = new ResizeObserver(() => {
            this.immediateUpdateLines();
        });
        resizeObserver.observe(chart.chartElement());

        this.resizeObserver = resizeObserver;
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

    // 添加一个即时更新方法，不使用动画
    private immediateUpdateLines = () => {
        if (!this.mainSeries || !this.lines.length) return;

        // 取消任何正在进行的动画
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        requestAnimationFrame(() => {
            this.lines.forEach(line => {
                const { startPoint, endPoint } = line;
                const startX = this.chart.timeScale().timeToCoordinate(startPoint.time!);
                const endX = this.chart.timeScale().timeToCoordinate(endPoint.time!);
                const startY = this.mainSeries.priceToCoordinate(startPoint.price!);
                const endY = this.mainSeries.priceToCoordinate(endPoint.price!);

                if (startX !== null && startY !== null && endX !== null && endY !== null) {
                    line.tool.redraw({
                        start: {
                            ...startPoint,
                            x: startX,
                            y: startY
                        },
                        end: {
                            ...endPoint,
                            x: endX,
                            y: endY
                        }
                    });
                }
            });
        });
    };

    public removeAllLines(): void {
        this.lines.forEach(line => line.tool.remove());
        this.lines = [];
        if (this.currentLine) {
            this.currentLine.remove();
            this.currentLine = null;
        }
        this.currentStartPoint = null;
        this.onLinesChanged?.();

        // 清理所有监听器
        if (this.chart) {
            this.chart.timeScale().unsubscribeVisibleTimeRangeChange(this.immediateUpdateLines);
            this.chart.timeScale().unsubscribeVisibleLogicalRangeChange(this.immediateUpdateLines);
            this.chart.unsubscribeCrosshairMove(this.updateLines);
            this.chart.chartElement().removeEventListener('wheel', this.handleZoom);
            if (this.mainSeries) {
                this.mainSeries.unsubscribeDataChanged(this.updateLines);
            }
            // 清理 ResizeObserver
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
        }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
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

    public getLineAtPosition(x: number, y: number, tolerance: number = 15): number {
        // 每次检测前更新线段位置
        this.updateCurrentPositions();

        const devicePixelRatio = window.devicePixelRatio;
        const adjustedTolerance = tolerance * devicePixelRatio;

        // 遍历所有线段，找到最近的一条
        let nearestIndex = -1;
        let minDistance = Infinity;

        this.lines.forEach((line, index) => {
            const { startPoint, endPoint } = line;
            // 使用当前的坐标系计算距离
            const currentStartX = this.chart.timeScale().timeToCoordinate(startPoint.time!);
            const currentStartY = this.mainSeries.priceToCoordinate(startPoint.price!);
            const currentEndX = this.chart.timeScale().timeToCoordinate(endPoint.time!);
            const currentEndY = this.mainSeries.priceToCoordinate(endPoint.price!);

            if (currentStartX === null || currentStartY === null || 
                currentEndX === null || currentEndY === null) return;

            const distance = this.getDistanceToLine(
                x * devicePixelRatio,
                y * devicePixelRatio,
                currentStartX * devicePixelRatio,
                currentStartY * devicePixelRatio,
                currentEndX * devicePixelRatio,
                currentEndY * devicePixelRatio
            );

            if (distance < adjustedTolerance && distance < minDistance) {
                minDistance = distance;
                nearestIndex = index;
            }
        });

        return nearestIndex;
    }

    private updateCurrentPositions(): void {
        this.lines.forEach(line => {
            const { startPoint, endPoint } = line;
            const startX = this.chart.timeScale().timeToCoordinate(startPoint.time!);
            const startY = this.mainSeries.priceToCoordinate(startPoint.price!);
            const endX = this.chart.timeScale().timeToCoordinate(endPoint.time!);
            const endY = this.mainSeries.priceToCoordinate(endPoint.price!);

            if (startX !== null && startY !== null && endX !== null && endY !== null) {
                line.tool.updatePosition({
                    start: { ...startPoint, x: startX, y: startY },
                    end: { ...endPoint, x: endX, y: endY }
                });
            }
        });
    }

    private getDistanceToLine(x: number, y: number, x1: number, y1: number, x2: number, y2: number): number {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;

        // 处理退化情况（起点和终点重合）
        if (len_sq === 0) {
            return Math.sqrt(A * A + B * B);
        }

        let param = dot / len_sq;
        param = Math.max(0, Math.min(1, param));

        const xx = x1 + param * C;
        const yy = y1 + param * D;

        const dx = x - xx;
        const dy = y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    private isPointNearLine(x: number, y: number, start: Point, end: Point, tolerance: number): boolean {
        const A = x - start.x;
        const B = y - start.y;
        const C = end.x - start.x;
        const D = end.y - start.y;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        
        // 如果线段长度为0，判断点到端点的距离
        if (len_sq === 0) {
            const dist = Math.sqrt(A * A + B * B);
            return dist < tolerance;
        }

        let param = dot / len_sq;
        param = Math.max(0, Math.min(1, param));  // 限制在线段范围内

        const xx = start.x + param * C;
        const yy = start.y + param * D;

        const dx = x - xx;
        const dy = y - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 增加调试日志
        console.log('Distance to line:', distance, 'tolerance:', tolerance);
        
        return distance < tolerance;
    }
    
    public updateLine(index: number, newOptions: LineToolOptions): void {
        if (index >= 0 && index < this.lines.length) {
            const line = this.lines[index];
            if (line && line.tool) {
                // 直接访问 tool 实例并调用其 updateOptions 方法
                line.tool.updateOptions(newOptions);
                // 获取当前点位并重新渲染
                const points = line.tool.getPoints();
                if (points.start && points.end) {
                    line.tool.redraw({
                        start: points.start,
                        end: points.end
                    });
                }
            }
        }
    }
}
