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

// 工具基础接口
export interface BaseToolOptions {
    color: string;
    lineWidth: number;
    lineStyle: 'solid' | 'dashed' | 'dotted';
    snap?: boolean;
    finished?: boolean;
}

// 线段工具特有配置
export interface LineToolOptions extends BaseToolOptions {
    // 线段特有的属性可以在这里添加
    leftExtend?: boolean;  // 左延长线
    rightExtend?: boolean; // 右延长线
}

export interface RectToolOptions extends BaseToolOptions {
    fillColor?: string;
    fillOpacity?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted';
}

// 工具类型定义
export type ToolType = 'line' | 'rectangle' | 'select' | 'eraser';

// 通用工具信息接口
export interface ToolInfo {
    type: ToolType;
    id: number;
    options: BaseToolOptions;
}

// 线段工具特定信息接口
export interface LineToolInfo extends ToolInfo {
    type: 'line';
    options: LineToolOptions;
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

// 选中工具状态接口
export interface SelectedTool {
    type: ToolType;
    index: number;
    tool: any; // Line or Rect tool .etc
    position: {
        x: number;
        y: number;
    };
}
