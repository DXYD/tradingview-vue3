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

            // 计算线段斜率和延长线
            const dx = endX - startX;
            const dy = endY - startY;
            
            // 设置线条样式
            ctx.beginPath();
            ctx.strokeStyle = this.options.color || '#2196F3';
            ctx.lineWidth = (this.options.lineWidth || 2) * devicePixelRatio;
            
            if (this.options.lineStyle === 'dashed') {
                ctx.setLineDash([5 * devicePixelRatio, 5 * devicePixelRatio]);
            } else if (this.options.lineStyle === 'dotted') {
                ctx.setLineDash([2 * devicePixelRatio, 2 * devicePixelRatio]);
            }

            // 获取画布尺寸以计算延长线长度
            const canvasWidth = ctx.canvas.width;
            const canvasHeight = ctx.canvas.height;

            // 计算延长线的斜率和距离
            const slope = dy / dx;
            let leftExtendX, leftExtendY, rightExtendX, rightExtendY;

            if (dx === 0) {
                // 垂直线的情况
                leftExtendX = startX;
                leftExtendY = 0;
                rightExtendX = endX;
                rightExtendY = canvasHeight;
            } else {
                // 计算与画布边界的交点
                // 左边界
                leftExtendX = 0;
                leftExtendY = startY - slope * startX;
                // 右边界
                rightExtendX = canvasWidth;
                rightExtendY = endY + slope * (canvasWidth - endX);

                // 如果线段倾斜较大，也需要考虑上下边界
                if (Math.abs(slope) > 1) {
                    // 上边界
                    const topX = startX - startY / slope;
                    const topY = 0;
                    // 下边界
                    const bottomX = startX + (canvasHeight - startY) / slope;
                    const bottomY = canvasHeight;

                    // 选择合适的交点
                    if (topY >= 0 && topX >= 0 && topX <= canvasWidth) {
                        leftExtendX = topX;
                        leftExtendY = topY;
                    }
                    if (bottomY <= canvasHeight && bottomX >= 0 && bottomX <= canvasWidth) {
                        rightExtendX = bottomX;
                        rightExtendY = bottomY;
                    }
                }
            }

            // 绘制主线段
            ctx.beginPath();
            
            // 绘制左延长线
            if (this.options.leftExtend) {
                ctx.moveTo(leftExtendX, leftExtendY);
                ctx.lineTo(startX, startY);
            }
            
            // 绘制中间主线段
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            
            // 绘制右延长线
            if (this.options.rightExtend) {
                ctx.moveTo(endX, endY);
                ctx.lineTo(rightExtendX, rightExtendY);
            }
            
            ctx.stroke();

            // 绘制扩大的点击区域
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.01)';
            ctx.lineWidth = 20 * devicePixelRatio;
            ctx.setLineDash([]); // 清除线条样式
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
