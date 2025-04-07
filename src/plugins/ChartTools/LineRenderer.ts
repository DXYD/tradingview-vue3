import { IChartApi, IPrimitivePaneRenderer } from 'lightweight-charts';
import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { Point, LineToolOptions } from './types';

export class LineRenderer implements IPrimitivePaneRenderer {
    constructor(
        private readonly startPoint: Point,
        private readonly endPoint: Point,
        private readonly options: LineToolOptions,
        private readonly chart: IChartApi
    ) {}

    public draw(target: CanvasRenderingTarget2D): void {
        const devicePixelRatio = window.devicePixelRatio;
        target.useBitmapCoordinateSpace(({ context: ctx }) => {
            ctx.save();
            
            const startX = Math.round(this.startPoint.x * devicePixelRatio);
            const startY = Math.round(this.startPoint.y * devicePixelRatio);
            const endX = Math.round(this.endPoint.x * devicePixelRatio);
            const endY = Math.round(this.endPoint.y * devicePixelRatio);

            // 设置线条样式
            ctx.strokeStyle = this.options.color || '#2196F3';
            ctx.lineWidth = (this.options.lineWidth || 2) * devicePixelRatio;
            
            // 绘制线段
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // 只在线段未完成时绘制端点
            if (!this.options.finished) {
                this.drawPoint(ctx, startX, startY, devicePixelRatio);
                this.drawPoint(ctx, endX, endY, devicePixelRatio);
            }
            
            ctx.restore();
        });
    }

    private drawPoint(ctx: CanvasRenderingContext2D, x: number, y: number, ratio: number): void {
        ctx.beginPath();
        ctx.arc(x, y, 4 * ratio, 0, 2 * Math.PI);
        ctx.fillStyle = this.options.color || '#2196F3';
        ctx.fill();
    }
}
