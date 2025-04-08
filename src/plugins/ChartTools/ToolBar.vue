<template>
    <div class="toolbar">
        <div class="tool-button" 
             :class="{ active: currentTool === 'line' }"
             @click="selectTool('line')">
            <i class="tool-icon">╱</i>
            <span class="shortcut">L</span>
        </div>
        <div class="tool-button" 
             :class="{ active: currentTool === 'eraser' }"
             @click="selectTool('eraser')">
            <i class="tool-icon">🗃</i>
            <span class="shortcut">E</span>
        </div>
        <div class="tool-button" 
             :class="{ active: snap }"
             @click="toggleSnap">
            <i class="tool-icon">⌖</i>
            <span class="shortcut">S</span>
        </div>
        <div class="tool-button" 
             :class="{ active: currentTool === 'select' }"
             @click="selectTool('select')">
            <i class="tool-icon">👆</i>
            <span class="shortcut">V</span>
        </div>
        <div class="tool-button" 
             :class="{ active: currentTool === 'rectangle' }"
             @click="selectTool('rectangle')">
            <i class="tool-icon">▢</i>
            <span class="shortcut">R</span>
        </div>
        <!-- 添加设置按钮 -->
        <div class="tool-button settings-button" @click="toggleSettings">
            <i class="tool-icon">⚙</i>
            <span class="shortcut">P</span>
        </div>
        
        <!-- 修改设置面板 -->
        <div v-if="showSettings" class="settings-panel" @mousedown.stop>
            <div class="settings-header">
                <!-- <h3>默认样式设置</h3> -->
                默认样式设置
                <button class="close-btn" @click="showSettings = false">×</button>
            </div>
            <div class="settings-content">
                <!-- 线段工具设置 -->
                <div class="tool-section">
                    <h4>线段默认样式</h4>
                    <div class="setting-item">
                        <label>线条颜色</label>
                        <input 
                            type="color" 
                            :value="defaultStyles.line.color"
                            @input="e => updateDefaultStyle('line', { color: e.target.value })"
                        >
                    </div>
                    <div class="setting-item">
                        <label>线条宽度</label>
                        <input 
                            type="range" 
                            min="1" 
                            max="5" 
                            :value="defaultStyles.line.lineWidth"
                            @input="e => updateDefaultStyle('line', { lineWidth: Number(e.target.value) })"
                        >
                    </div>
                    <div class="setting-item">
                        <label>线条样式</label>
                        <select 
                            :value="defaultStyles.line.lineStyle"
                            @change="e => updateDefaultStyle('line', { lineStyle: e.target.value })"
                        >
                            <option value="solid">实线</option>
                            <option value="dashed">虚线</option>
                            <option value="dotted">点线</option>
                        </select>
                    </div>
                </div>
                
                <!-- 矩形工具设置 -->
                <div class="tool-section">
                    <h4>矩形默认样式</h4>
                    <div class="setting-item">
                        <label>边框颜色</label>
                        <input 
                            type="color" 
                            :value="defaultStyles.rect.color"
                            @input="e => updateDefaultStyle('rect', { color: e.target.value })"
                        >
                    </div>
                    <div class="setting-item">
                        <label>填充颜色</label>
                        <input 
                            type="color" 
                            :value="defaultStyles.rect.fillColor"
                            @input="e => updateDefaultStyle('rect', { fillColor: e.target.value })"
                        >
                    </div>
                    <div class="setting-item">
                        <label>填充透明度</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            :value="(defaultStyles.rect.fillOpacity || 0.2) * 100"
                            @input="e => updateDefaultStyle('rect', { fillOpacity: Number(e.target.value) / 100 })"
                        >
                    </div>
                    <div class="setting-item">
                        <label>边框样式</label>
                        <select 
                            :value="defaultStyles.rect.borderStyle"
                            @change="e => updateDefaultStyle('rect', { borderStyle: e.target.value })"
                        >
                            <option value="solid">实线</option>
                            <option value="dashed">虚线</option>
                            <option value="dotted">点线</option>
                        </select>
                    </div>    
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, defineEmits, onMounted, onUnmounted } from 'vue';
import { ToolStyleManager } from './config/toolStyles';

const styleManager = ToolStyleManager.getInstance();
const emit = defineEmits(['tool-change', 'snap-change', 'style-change']);
const currentTool = ref('');
const snap = ref(false);

// 添加 props 以支持初始状态
defineProps({
    initialSnap: {
        type: Boolean,
        default: false
    }
});

// 添加当前工具样式状态
const currentStyle = ref({
  line: styleManager.getDefaultStyle('line'),
  rect: styleManager.getDefaultStyle('rect')
});

// 获取预设样式列表
const presets = {
  line: styleManager.getPresetNames('line'),
  rect: styleManager.getPresetNames('rect')
};

// 添加快捷键处理
const handleKeyPress = (e) => {
    // 忽略输入框中的按键事件
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
    }

    switch (e.key.toLowerCase()) {
        case 'l':  // 线段工具
            selectTool('line');
            break;
        case 'e':  // 橡皮擦工具
            selectTool('eraser');
            break;
        case 's':  // 切换吸附
            toggleSnap();
            break;
        case 'v':  // 选择工具
            selectTool('select');
            break;
        case 'r':  // 矩形工具
            selectTool('rectangle');
            break;
        case 'escape':  // ESC 键取消当前工具
            if (currentTool.value) {
                selectTool('');
            }
            break;
    }
};

onMounted(() => {
    window.addEventListener('keydown', handleKeyPress);
    const handleEsc = (e) => {
        if (e.key === 'Escape' && showSettings.value) {
            showSettings.value = false;
        }
    };
    window.addEventListener('keydown', handleEsc);
    onUnmounted(() => {
        window.removeEventListener('keydown', handleEsc);
    });
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress);
});

const selectTool = (tool, preset = '') => {
    currentTool.value = currentTool.value === tool ? '' : tool;
    
    if (preset) {
        const style = styleManager.getPresetStyle(tool, preset);
        if (style) {
            currentStyle.value[tool] = style;
            emit('style-change', { tool, style });
        }
    } else {
        emit('tool-change', currentTool.value);
    }
};

const toggleSnap = () => {
    snap.value = !snap.value;
    emit('snap-change', snap.value);
};

const showSettings = ref(false);
const defaultStyles = ref({
    line: styleManager.getDefaultStyle('line'),
    rect: styleManager.getDefaultStyle('rect')
});

const toggleSettings = () => {
    showSettings.value = !showSettings.value;
};

// 修改更新默认样式的处理函数
const updateDefaultStyle = (toolType, newStyleProp) => {
    console.log('Updating style:', toolType, newStyleProp);
    
    // 更新本地状态
    defaultStyles.value[toolType] = {
        ...defaultStyles.value[toolType],
        ...newStyleProp
    };
    
    // 更新全局默认样式
    styleManager.updateDefaultStyle(toolType, defaultStyles.value[toolType]);
    
    // 如果当前工具是被修改的类型，则重新创建工具
    if (currentTool.value === toolType) {
        emit('tool-change', toolType);
    }
    
    // 触发样式更新事件
    emit('style-change', {
        tool: toolType,
        style: defaultStyles.value[toolType],
        isDefault: true
    });
};
</script>

<style scoped>
.toolbar {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: #fff;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tool-button {
    position: relative;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
}

.tool-button:hover {
    background: #f0f0f0;
}

.tool-button.active {
    background: #e6f4ff;
    color: #1890ff;
}

.tool-icon {
    font-style: normal;
    font-size: 18px;
}

.shortcut {
    position: absolute;
    bottom: -2px;
    right: -2px;
    font-size: 10px;
    color: #999;
    background: rgba(0,0,0,0.1);
    padding: 1px 3px;
    border-radius: 2px;
    pointer-events: none;
}

.tool-button.active .shortcut {
    color: #1890ff;
    background: rgba(24,144,255,0.1);
}

.tool-group {
    margin-bottom: 8px;
    padding: 4px;
}

select {
    width: 100%;
    padding: 4px;
    border-radius: 4px;
    border: 1px solid #ddd;
    background: white;
}

.settings-button {
    margin-top: auto;  /* 将设置按钮推到底部 */
}

.settings-panel {
    position: absolute;
    left: 100%;
    bottom: 0;
    margin-left: 10px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    width: 280px;
    z-index: 1000;
}

.tool-section {
    padding: 16px;
    border-bottom: 1px solid #eee;
}

.tool-section:last-child {
    border-bottom: none;
}

.tool-section h4 {
    margin-top: 4px;
    margin-bottom: 12px;
    color: #333;
    font-weight: 500;
}

.settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #eee;
}

.settings-content {
    padding: 12px;
}

.tool-settings {
    background: white;
    border-radius: 4px;
    padding: 12px;
    margin-bottom: 12px;
}

.tool-settings h4 {
    margin-bottom: 8px;
    color: #666;
}

.close-btn {
    padding: 4px 8px;
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
}

.close-btn:hover {
    color: #333;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
}

.setting-item label {
    flex: 1;
    color: #666;
}

.setting-item input[type="color"],
.setting-item input[type="range"],
.setting-item select {
    width: 100px;
}

.setting-item select {
    padding: 4px;
    border-radius: 4px;
    border: 1px solid #ddd;
}
</style>
