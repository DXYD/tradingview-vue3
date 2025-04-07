import { IChartApi, IPrimitivePaneView, IPrimitivePaneRenderer } from 'lightweight-charts';
import { Point, LineToolOptions } from './types';
import { LineRenderer } from './LineRenderer';

export class LinePaneView implements IPrimitivePaneView {
    private startPoint: Point | null = null;
    private endPoint: Point | null = null;
    private _options: LineToolOptions;

    constructor(
        private readonly chart: IChartApi,
        options: LineToolOptions
    ) {
        this._options = { ...options };
    }

    public get options(): LineToolOptions {
        return this._options;
    }

    zOrder(): 'top' {
        return 'top';
    }

    renderer(): IPrimitivePaneRenderer | null {
        if (!this.startPoint?.time || !this.startPoint?.price || 
            !this.endPoint?.time || !this.endPoint?.price) {
            return null;
        }
        return new LineRenderer(this.startPoint, this.endPoint, this._options, this.chart);
    }

    setPoints(start: Point, end: Point): void {
        this.startPoint = start;
        this.endPoint = end;
    }

    updateOptions(newOptions: LineToolOptions): void {
        this._options = { ...this._options, ...newOptions };
    }
}
