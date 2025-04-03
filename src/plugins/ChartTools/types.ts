import { Time } from 'lightweight-charts';

export interface CandleData {
    time: Time;
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface Point {
    x: number;
    y: number;
    time?: Time | null;
    price?: number | null;
    type?: 'open' | 'high' | 'low' | 'close' | null;
    originalTime?: Time | null;  // 添加原始时间存储
    originalPrice?: number | null;  // 添加原始价格存储
}

export interface LineToolOptions {
    color?: string;     // 线条颜色
    lineStyle?: 'solid' | 'dashed' | 'dotted';     // 线条样式
    lineWidth?: number;     // 线宽
    snap?: boolean;     // 是否启用磁吸点
}

export interface IRenderer {
    draw(ctx: CanvasRenderingContext2D): void;
}

export interface DrawingPoint {
    x: number;
    y: number;
    coordinate: number;
}

export interface DrawingState {
    startPoint: DrawingPoint | null;
    endPoint: DrawingPoint | null;
}
