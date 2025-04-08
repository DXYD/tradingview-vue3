import { IChartApi, ISeriesPrimitive, IPrimitivePaneView } from 'lightweight-charts';
import { Point, RectToolOptions } from './types';
import { RectRenderer } from './RectRenderer';

export class RectTool {
    private primitive: RectPrimitive | null = null;
    private startPoint: Point | null = null;
    private endPoint: Point | null = null;
    private finished: boolean = false;
    private started: boolean = false;

    constructor(
        private readonly chart: IChartApi,
        private readonly mainSeries: any,
        private options: RectToolOptions
    ) {
        this.primitive = new RectPrimitive(chart, options);
        this.mainSeries.attachPrimitive(this.primitive);
    }

    public start(point: Point): void {
        if (this.finished) return;
        this.started = true;
        this.startPoint = point;
        this.endPoint = { ...point };
        if (this.primitive) {
            this.primitive.setPoints(point, point);
            this.render();
        }
    }

    public move(point: Point): void {
        if (!this.started || this.finished) return;
        this.endPoint = point;
        if (this.primitive && this.startPoint) {
            this.primitive.setPoints(this.startPoint, point);
            this.render();
        }
    }

    public stop(point: Point): void {
        if (!this.started) return;
        this.endPoint = point;
        this.finished = true;
        this.started = false;
        if (this.primitive && this.startPoint) {
            this.primitive.setPoints(this.startPoint, point);
            this.render();
        }
    }

    public isStarted(): boolean {
        return this.started;
    }

    public isFinished(): boolean {
        return this.finished;
    }

    private render(): void {
        requestAnimationFrame(() => {
            if (this.primitive && this.startPoint && this.endPoint) {
                this.primitive.setPoints(this.startPoint, this.endPoint);
            }
        });
    }

    public remove(): void {
        if (this.mainSeries && this.primitive) {
            this.mainSeries.detachPrimitive(this.primitive);
        }
        this.primitive = null;
        this.startPoint = null;
        this.endPoint = null;
    }

    public getPoints(): { start: Point | null, end: Point | null } {
        return {
            start: this.startPoint,
            end: this.endPoint
        };
    }

    public getOptions(): RectToolOptions {
        return { ...this.options };
    }

    public updateOptions(newOptions: RectToolOptions): void {
        this.options = { ...this.options, ...newOptions };
        if (this.primitive) {
            this.primitive.updateOptions(this.options);
            // 强制重新渲染
            this.render();
        }
    }
}

class RectPrimitive implements ISeriesPrimitive {
    private paneView: RectPaneView | null = null;
    
    constructor(chart: IChartApi, options: RectToolOptions) {
        this.paneView = new RectPaneView(chart, options);
    }

    public paneViews(): readonly IPrimitivePaneView[] {
        return this.paneView ? [this.paneView] : [];
    }

    public setPoints(start: Point, end: Point): void {
        if (this.paneView) {
            this.paneView.setPoints(start, end);
        }
    }

    public updateOptions(options: RectToolOptions): void {
        if (this.paneView) {
            this.paneView.updateOptions(options);
        }
    }
}

class RectPaneView implements IPrimitivePaneView {
    private startPoint: Point | null = null;
    private endPoint: Point | null = null;

    constructor(
        private readonly chart: IChartApi,
        private options: RectToolOptions
    ) {}

    public updateOptions(options: RectToolOptions): void {
        this.options = { ...this.options, ...options };
    }

    public setPoints(start: Point, end: Point): void {
        this.startPoint = start;
        this.endPoint = end;
    }

    public zOrder(): 'top' {
        return 'top';
    }

    public renderer() {
        if (!this.startPoint || !this.endPoint) return null;
        return new RectRenderer(this.startPoint, this.endPoint, this.options, this.chart);
    }
}
