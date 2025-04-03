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
            
            // 使用设备像素比进行坐标转换
            const startX = Math.round(this.startPoint.x * devicePixelRatio);
            const startY = Math.round(this.startPoint.y * devicePixelRatio);
            const endX = Math.round(this.endPoint.x * devicePixelRatio);
            const endY = Math.round(this.endPoint.y * devicePixelRatio);

            // 绘制线段
            ctx.beginPath();
            ctx.strokeStyle = this.options.color || '#2196F3';
            ctx.lineWidth = (this.options.lineWidth || 2) * devicePixelRatio;
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // 绘制端点
            this.drawPoint(ctx, startX, startY, devicePixelRatio);
            this.drawPoint(ctx, endX, endY, devicePixelRatio);

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
