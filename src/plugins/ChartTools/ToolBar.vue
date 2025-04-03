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
    </div>
</template>

<script setup>
import { ref, defineEmits, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['tool-change', 'snap-change']);
const currentTool = ref('');
const snap = ref(false);

// 添加 props 以支持初始状态
defineProps({
    initialSnap: {
        type: Boolean,
        default: false
    }
});

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
        case 'escape':  // ESC 键取消当前工具
            if (currentTool.value) {
                selectTool('');
            }
            break;
    }
};

onMounted(() => {
    window.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress);
});

const selectTool = (tool) => {
    currentTool.value = currentTool.value === tool ? '' : tool;
    emit('tool-change', currentTool.value);
};

const toggleSnap = () => {
    snap.value = !snap.value;
    emit('snap-change', snap.value);
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
</style>
