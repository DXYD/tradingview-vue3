import { IChartApi, IPrimitivePaneRenderer } from 'lightweight-charts';
import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { Point, RectToolOptions } from './types';

export class RectRenderer implements IPrimitivePaneRenderer {
    constructor(
        private readonly startPoint: Point,
        private readonly endPoint: Point,
        private readonly options: RectToolOptions,
        private readonly chart: IChartApi
    ) {}

    public draw(target: CanvasRenderingTarget2D): void {
        const devicePixelRatio = window.devicePixelRatio;
        target.useBitmapCoordinateSpace(({ context: ctx }) => {
            ctx.save();
            
            const x1 = Math.round(this.startPoint.x * devicePixelRatio);
            const y1 = Math.round(this.startPoint.y * devicePixelRatio);
            const x2 = Math.round(this.endPoint.x * devicePixelRatio);
            const y2 = Math.round(this.endPoint.y * devicePixelRatio);

            // 填充矩形
            ctx.fillStyle = this.getRGBA(this.options.fillColor || this.options.color, this.options.fillOpacity || 0.2);
            ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

            // 绘制边框
            ctx.strokeStyle = this.options.color;
            ctx.lineWidth = (this.options.lineWidth || 1) * devicePixelRatio;
            
            if (this.options.borderStyle === 'dashed') {
                ctx.setLineDash([5 * devicePixelRatio, 5 * devicePixelRatio]);
            } else if (this.options.borderStyle === 'dotted') {
                ctx.setLineDash([2 * devicePixelRatio, 2 * devicePixelRatio]);
            }
            
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
            
            ctx.restore();
        });
    }

    private getRGBA(color: string, opacity: number): string {
        const r = parseInt(color.substr(1,2), 16);
        const g = parseInt(color.substr(3,2), 16);
        const b = parseInt(color.substr(5,2), 16);
        return `rgba(${r},${g},${b},${opacity})`;
    }
}
