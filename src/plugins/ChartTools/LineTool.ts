import { IChartApi, ISeriesPrimitive, IPrimitivePaneView, IPrimitivePaneRenderer } from 'lightweight-charts';
import { Point, LineToolOptions, CandleData } from './types';
import { LineRenderer } from './LineRenderer';

export class LineTool {
    private chart: IChartApi;
    private options: LineToolOptions;
    private primitive: LinePrimitive | null = null;
    private previewPrimitive: LinePrimitive | null = null;
    private startPoint: Point | null = null;
    private endPoint: Point | null = null;
    private mainSeries: any = null; 
    private finished: boolean = false;
    private started: boolean = false;

    constructor(chart: IChartApi, mainSeries: any, options: LineToolOptions) {
        this.chart = chart;
        this.options = options;
        this.primitive = new LinePrimitive(chart, options);
        this.previewPrimitive = new LinePrimitive(chart, {
            ...options,
            lineWidth: 1,
            color: options.color + '80' // 半透明
        });
        this.mainSeries = mainSeries;
        
        // 确保原语被正确添加到图表
        if (this.primitive) {
            this.mainSeries.attachPrimitive(this.primitive);
            console.log('Primitive attached to series');
        }

        if (this.previewPrimitive) {
            this.mainSeries.attachPrimitive(this.previewPrimitive);
        }
    }

    public setPoints(start: Point, end: Point): void {
        if (this.primitive) {
            this.primitive.setPoints(start, end);
            this.chart.timeScale().fitContent();
        }
    }

    public getPrimitive(): ISeriesPrimitive | null {
        return this.primitive;
    }

    public isFinished(): boolean {
        return this.finished && this.startPoint !== null && this.endPoint !== null;
    }

    public isValid(): boolean {
        return this.startPoint !== null && this.endPoint !== null &&
            this.startPoint.x !== this.endPoint.x && this.startPoint.y !== this.endPoint.y;
    }

    public isStarted(): boolean {
        return this.started;
    }

    public start(point: Point): void {
        if (this.finished) return;

        // 移除预览点
        if (this.previewPrimitive) {
            this.mainSeries.detachPrimitive(this.previewPrimitive);
            this.previewPrimitive = null;
        }

        const newPoint = this.createPoint(point);
        this.startPoint = newPoint;
        this.endPoint = { ...newPoint };
        this.started = true;  // 标记已开始绘制

        console.log('Starting line at:', newPoint);

        if (this.primitive) {
            this.primitive.setPoints(newPoint, newPoint);
            this.subscribe();
            this.render(); // 强制渲染
        }
    }

    private subscribe() {
        // 只订阅时间轴变化，因为价格轴订阅不可用
        this.chart.timeScale().subscribeVisibleTimeRangeChange(this.handleScaleChange);
    }

    public move(point: Point, data?: CandleData): void {
        if (this.finished || !this.startPoint || !this.primitive) return;

        const newPoint = this.createPoint(point);
        
        // 如果是吸附点，保持原始价格
        if (point.type) {
            newPoint.price = point.price;
            newPoint.type = point.type;
        }
        
        this.endPoint = newPoint;
        
        // 直接更新线段并渲染
        this.primitive.setPoints(this.startPoint, newPoint);
        this.render();
    }

    public stop(point: Point): void {
        if (!this.startPoint || !this.primitive) return;

        const newPoint = this.createPoint(point);
        this.endPoint = newPoint;
        this.finished = true;
        this.started = false;  // 重置开始状态

        // 保存最终线段位置并渲染
        this.primitive.setPoints(this.startPoint, newPoint);
        this.render();  // 确保线段显示
        
        console.log('Line completed:', { start: this.startPoint, end: newPoint });
    }

    public getPoints(): { start: Point | null, end: Point | null } {
        return {
            start: this.startPoint,
            end: this.endPoint
        };
    }

    private render(): void {
        if (!this.primitive || !this.startPoint || !this.endPoint) return;

        requestAnimationFrame(() => {
            this.primitive?.setPoints(this.startPoint!, this.endPoint!);
        });
    }

    private createPoint(point: Point): Point {
        const devicePixelRatio = window.devicePixelRatio;
        const time = this.chart.timeScale().coordinateToTime(point.x);
        const price = this.mainSeries.coordinateToPrice(point.y);

        if (time && price !== null) {
            // 修正坐标计算
            return {
                x: Math.round(point.x * devicePixelRatio) / devicePixelRatio,
                y: Math.round(point.y * devicePixelRatio) / devicePixelRatio,
                time,
                price,
                originalTime: time,
                originalPrice: price
            };
        }

        return point;
    }

    public updatePosition(points?: { start: Point, end: Point }): void {
        const devicePixelRatio = window.devicePixelRatio;

        if (points) {
            // 使用传入的点位信息更新
            if (this.primitive) {
                // 使用时间和价格重新计算坐标
                const startX = this.chart.timeScale().timeToCoordinate(points.start.time!);
                const startY = this.mainSeries.priceToCoordinate(points.start.price!);
                const endX = this.chart.timeScale().timeToCoordinate(points.end.time!);
                const endY = this.mainSeries.priceToCoordinate(points.end.price!);

                if (startX === null || startY === null || endX === null || endY === null) return;

                const newStart = {
                    ...points.start,
                    x: Math.round(startX * devicePixelRatio) / devicePixelRatio,
                    y: Math.round(startY * devicePixelRatio) / devicePixelRatio
                };

                const newEnd = {
                    ...points.end,
                    x: Math.round(endX * devicePixelRatio) / devicePixelRatio,
                    y: Math.round(endY * devicePixelRatio) / devicePixelRatio
                };
                
                this.startPoint = newStart;
                this.endPoint = newEnd;
                
                // 使用新坐标更新图形
                this.primitive.setPoints(newStart, newEnd);
                requestAnimationFrame(() => this.render());
            }
            return;
        }

        // 如果没有传入点位信息，使用当前保存的时间和价格重新计算
        if (!this.startPoint?.time || !this.startPoint.price || 
            !this.endPoint?.time || !this.endPoint.price) return;

        const startX = this.chart.timeScale().timeToCoordinate(this.startPoint.time);
        const startY = this.mainSeries.priceToCoordinate(this.startPoint.price);
        const endX = this.chart.timeScale().timeToCoordinate(this.endPoint.time);
        const endY = this.mainSeries.priceToCoordinate(this.endPoint.price);

        if (startX === null || startY === null || endX === null || endY === null) return;

        // 更新坐标并保持精度
        const newStartPoint = {
            ...this.startPoint,
            x: Math.round(startX * devicePixelRatio) / devicePixelRatio,
            y: Math.round(startY * devicePixelRatio) / devicePixelRatio
        };

        const newEndPoint = {
            ...this.endPoint,
            x: Math.round(endX * devicePixelRatio) / devicePixelRatio,
            y: Math.round(endY * devicePixelRatio) / devicePixelRatio
        };

        if (this.primitive) {
            this.primitive.setPoints(newStartPoint, newEndPoint);
            requestAnimationFrame(() => this.render());
        }
    }

    private handleScaleChange = () => {
        if (!this.startPoint?.time || !this.startPoint.price || 
            !this.endPoint?.time || !this.endPoint.price) return;

        // 使用时间和价格重新计算坐标
        const startX = this.chart.timeScale().timeToCoordinate(this.startPoint.time);
        const startY = this.mainSeries.priceToCoordinate(this.startPoint.price);
        const endX = this.chart.timeScale().timeToCoordinate(this.endPoint.time);
        const endY = this.mainSeries.priceToCoordinate(this.endPoint.price);

        if (startX === null || startY === null || endX === null || endY === null) return;

        const devicePixelRatio = window.devicePixelRatio;
        
        // 更新坐标
        const newStartPoint = {
            ...this.startPoint,
            x: Math.round(startX * devicePixelRatio) / devicePixelRatio,
            y: Math.round(startY * devicePixelRatio) / devicePixelRatio
        };

        const newEndPoint = {
            ...this.endPoint,
            x: Math.round(endX * devicePixelRatio) / devicePixelRatio,
            y: Math.round(endY * devicePixelRatio) / devicePixelRatio
        };

        // 使用完整的点信息更新位置
        this.updatePosition({
            start: newStartPoint,
            end: newEndPoint
        });
    };

    public finish(): void {
        if (!this.startPoint || !this.endPoint) {
            this.remove();
            return;
        }

        // 更新最终位置并标记完成
        this.finished = true;
        console.log('Line finished:', { start: this.startPoint, end: this.endPoint });
        
        // 确保最终位置正确
        this.render();  // 使用 render 替代 updateLine
    }

    public remove(): void {
        if (this.mainSeries && this.primitive) {
            this.chart.timeScale().unsubscribeVisibleTimeRangeChange(this.handleScaleChange);
            this.mainSeries.detachPrimitive(this.primitive);
        }
        if (this.previewPrimitive) {
            this.mainSeries.detachPrimitive(this.previewPrimitive);
            this.previewPrimitive = null;
        }
        this.startPoint = null;
        this.endPoint = null;
        this.primitive = null;
    }

    // 添加一个公共方法来获取价格坐标
    public priceToCoordinate(price: number): number | null {
        // 移除异步逻辑，直接返回坐标
        if (!this.mainSeries) return null;
        
        let coordinate = this.mainSeries.priceToCoordinate(price);
        
        // 如果坐标无效，尝试最多3次
        let attempts = 0;
        while (coordinate === null && attempts < 3) {
            coordinate = this.mainSeries.priceToCoordinate(price);
            attempts++;
        }
        
        return coordinate;
    }

    public clearDisplay(): void {
        if (this.primitive && this.startPoint && this.endPoint) {
            // 保存原始点位信息
            const originalStart = { ...this.startPoint };
            const originalEnd = { ...this.endPoint };
            
            // 临时清除显示
            const emptyPoint: Point = {
                x: 0,
                y: 0,
                time: null,
                price: null
            };
            this.primitive.setPoints(emptyPoint, emptyPoint);
            
            // 保存原始点位
            this.startPoint = originalStart;
            this.endPoint = originalEnd;
        }
    }

    public redraw(points: { start: Point, end: Point }): void {
        console.log('LineTool.redraw called with points:', points);
        
        if (!this.primitive) {
            console.warn('No primitive available for redraw');
            return;
        }

        const devicePixelRatio = window.devicePixelRatio;
        
        // 使用时间和价格重新计算坐标
        const startX = this.chart.timeScale().timeToCoordinate(points.start.time!);
        const startY = this.mainSeries.priceToCoordinate(points.start.price!);
        const endX = this.chart.timeScale().timeToCoordinate(points.end.time!);
        const endY = this.mainSeries.priceToCoordinate(points.end.price!);

        console.log('Calculated new coordinates:', { startX, startY, endX, endY });

        if (startX !== null && startY !== null && endX !== null && endY !== null) {
            const newStart = {
                ...points.start,
                x: Math.round(startX * devicePixelRatio) / devicePixelRatio,
                y: Math.round(startY * devicePixelRatio) / devicePixelRatio
            };
            const newEnd = {
                ...points.end,
                x: Math.round(endX * devicePixelRatio) / devicePixelRatio,
                y: Math.round(endY * devicePixelRatio) / devicePixelRatio
            };

            console.log('Setting new points:', { newStart, newEnd });

            this.startPoint = newStart;
            this.endPoint = newEnd;
            
            // 立即设置点位
            this.primitive.setPoints(newStart, newEnd);
            
            // 强制重新渲染
            requestAnimationFrame(() => {
                console.log('Rendering in animation frame');
                if (this.primitive) {
                    this.primitive.setPoints(newStart, newEnd);
                    console.log('Render complete');
                }
            });
        } else {
            console.warn('Invalid coordinates calculated');
        }
    }

    // 添加预览点方法
    public showPreviewPoint(point: Point): void {
        if (this.previewPrimitive && !this.started) {
            const newPoint = this.createPoint(point);
            // 使用相同的点创建一个小段预览
            this.previewPrimitive.setPoints(newPoint, newPoint);
        }
    }
}

// 实现图表原语
class LinePrimitive implements ISeriesPrimitive {

    private linePaneView: LinePaneView | null = null;
    startPoint: Point | null = null;
    endPoint: Point | null = null;

    constructor(
        chart: IChartApi,
        options: LineToolOptions
    ) {
        this.linePaneView = new LinePaneView(chart, options);
    }

    public updateAllViews(): void {
        // 空实现，因为视图会在setPoints时更新
    }

    public paneViews(): readonly IPrimitivePaneView[] {
        return this.linePaneView ? [this.linePaneView] : [];
    }

    setPoints(start: Point, end: Point): void {
        this.startPoint = { ...start };
        this.endPoint = { ...end };
        
        console.log('Setting primitive points:', { start, end });
        
        if (this.linePaneView) {
            this.linePaneView.setPoints(this.startPoint, this.endPoint);
        }
    }

    public clearPoints(): void {
        this.startPoint = null;
        this.endPoint = null;
        if (this.linePaneView) {
            // 使用空点代替 null
            const emptyPoint: Point = {
                x: 0,
                y: 0,
                time: null,
                price: null
            };
            this.linePaneView.setPoints(emptyPoint, emptyPoint);
        }
    }
}

// LineView class handles the actual rendering
class LinePaneView implements IPrimitivePaneView {
    private startPoint: Point | null = null;
    private endPoint: Point | null = null;

    constructor(
        private readonly chart: IChartApi,
        private readonly options: LineToolOptions
    ) {}

    zOrder(): 'top' {
        return 'top';
    }

    renderer(): IPrimitivePaneRenderer | null {
        // 如果点位无效则不渲染
        if (!this.startPoint?.time || !this.startPoint?.price || 
            !this.endPoint?.time || !this.endPoint?.price) {
            return null;
        }
        return new LineRenderer(this.startPoint, this.endPoint, this.options, this.chart);
    }

    setPoints(start: Point, end: Point): void {
        this.startPoint = start;
        this.endPoint = end;
    }
}
