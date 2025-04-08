import { LineToolOptions, RectToolOptions } from '../types';

type ToolOptions = LineToolOptions | RectToolOptions;

// 工具样式配置
export const ToolStyleConfigs = {
  line: {
    default: {
      color: '#2196F3',
      lineWidth: 1,
      lineStyle: 'solid',
      leftExtend: false,
      rightExtend: false,
      snap: true
    } as LineToolOptions,
    presets: {
      trend: {
        color: '#FF4444',
        lineWidth: 2,
        lineStyle: 'solid',
        leftExtend: true,
        rightExtend: true,
        snap: true
      },
      support: {
        color: '#4CAF50',
        lineWidth: 1,
        lineStyle: 'dashed',
        snap: true
      }
    }
  },
  rect: {
    default: {
      color: '#2196F3',
      fillColor: '#2196F3',
      fillOpacity: 0.2,
      borderStyle: 'solid',
      lineWidth: 1,
      snap: true
    } as RectToolOptions,
    presets: {
      highlight: {
        color: '#FFC107',
        fillColor: '#FFC107',
        fillOpacity: 0.3,
        borderStyle: 'dashed',
        lineWidth: 2
      },
      zone: {
        color: '#9C27B0',
        fillColor: '#9C27B0',
        fillOpacity: 0.1,
        borderStyle: 'dotted',
        lineWidth: 1
      }
    }
  }
} as const;

// 重新定义类型
type PresetKey = keyof typeof ToolStyleConfigs;
type ConfigType<T extends PresetKey> = typeof ToolStyleConfigs[T];
type DefaultStyle<T extends PresetKey> = ConfigType<T>['default'];
type PresetStyles<T extends PresetKey> = keyof ConfigType<T>['presets'];

// 获取预设名称的类型
type PresetStyleNames<T extends PresetKey> = keyof typeof ToolStyleConfigs[T]['presets'];

// 获取预设样式的类型
type PresetStyleType<T extends PresetKey> = typeof ToolStyleConfigs[T]['presets'][PresetStyleNames<T>];

// 工具样式管理器
export class ToolStyleManager {
  private static instance: ToolStyleManager;
  private customStyles = new Map<PresetKey, Map<string, ToolOptions>>();
  private listeners = new Map<string, Function[]>();
  // 添加默认样式存储
  private defaultStyles = new Map<PresetKey, any>();

  private constructor() {
    // 初始化默认样式
    Object.entries(ToolStyleConfigs).forEach(([key, value]) => {
      this.defaultStyles.set(key as PresetKey, { ...value.default });
    });
  }

  static getInstance(): ToolStyleManager {
    if (!ToolStyleManager.instance) {
      ToolStyleManager.instance = new ToolStyleManager();
    }
    return ToolStyleManager.instance;
  }

  getDefaultStyle<T extends PresetKey>(toolType: T): DefaultStyle<T> {
    return { ...this.defaultStyles.get(toolType) };
  }

  getPresetStyle<T extends PresetKey>(
    toolType: T,
    presetName: PresetStyleNames<T>
  ): PresetStyleType<T> | null {
    const config = ToolStyleConfigs[toolType];
    const preset = config.presets[presetName as keyof typeof config.presets] as PresetStyleType<T>;
    return preset ? { ...preset } : null;
  }

  // 使用泛型约束自定义样式的类型
  addCustomStyle<T extends PresetKey>(
    toolType: T,
    styleName: string,
    style: Partial<DefaultStyle<T>>
  ): void {
    if (!this.customStyles.has(toolType)) {
      this.customStyles.set(toolType, new Map());
    }
    const baseStyle = this.getDefaultStyle(toolType);
    const existingStyles = this.customStyles.get(toolType)!;
    existingStyles.set(styleName, {
      ...baseStyle,
      ...style
    } as ToolOptions);
  }

  // 获取自定义样式，返回类型安全的结果
  getCustomStyle<T extends PresetKey>(toolType: T, styleName: string): DefaultStyle<T> | null {
    const styles = this.customStyles.get(toolType);
    const style = styles?.get(styleName);
    return style ? (style as DefaultStyle<T>) : null;
  }

  // 获取预设名称列表
  getPresetNames<T extends PresetKey>(toolType: T): PresetStyleNames<T>[] {
    return Object.keys(ToolStyleConfigs[toolType].presets) as PresetStyleNames<T>[];
  }

  // 获取所有可用的工具类型
  getToolTypes(): PresetKey[] {
    return Object.keys(ToolStyleConfigs) as PresetKey[];
  }

  // 添加更新默认样式的方法
  updateDefaultStyle<T extends PresetKey>(
    toolType: T,
    newStyle: Partial<DefaultStyle<T>>
  ): void {
    const currentDefault = this.defaultStyles.get(toolType);
    this.defaultStyles.set(toolType, {
      ...currentDefault,
      ...newStyle
    });
    
    // 触发事件通知其他组件默认样式已更新
    this.emit('defaultStyleChanged', { 
      toolType, 
      style: this.getDefaultStyle(toolType) 
    });
  }

  // 添加简单的事件系统
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}
