<template>
    <div class="line-settings" :style="positionStyle" @mousedown.stop>
        <div class="settings-header" v-if="isDefault">
            <span>默认线段样式</span>
        </div>
        <div class="settings-content">
            <div class="setting-item">
                <label>线条颜色</label>
                <input 
                    type="color" 
                    :value="settings.color"
                    @input="e => {
                        settings.color = e.target.value;
                        updateSettings();
                    }"
                >
            </div>
            <div class="setting-item">
                <label>线条宽度</label>
                <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    :value="settings.lineWidth"
                    @input="e => {
                        settings.lineWidth = Number(e.target.value);
                        updateSettings();
                    }"
                >
            </div>
            <div class="setting-item">
                <label>线条样式</label>
                <select 
                    :value="settings.lineStyle"
                    @change="e => {
                        settings.lineStyle = e.target.value;
                        updateSettings();
                    }"
                >
                    <option value="solid">实线</option>
                    <option value="dashed">虚线</option>
                    <option value="dotted">点线</option>
                </select>
            </div>
            <div class="setting-item">
                <label>左延长线</label>
                <input 
                    type="checkbox" 
                    :checked="settings.leftExtend"
                    @change="e => {
                        settings.leftExtend = e.target.checked;
                        updateSettings();
                    }"
                >
            </div>
            <div class="setting-item">
                <label>右延长线</label>
                <input 
                    type="checkbox" 
                    :checked="settings.rightExtend"
                    @change="e => {
                        settings.rightExtend = e.target.checked;
                        updateSettings();
                    }"
                >
            </div>
            <button class="delete-btn" @click="$emit('delete')">删除线段</button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
    options: {
        type: Object,
        required: true
    },
    position: {
        type: Object,
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update', 'delete']);

const settings = ref({
    color: props.options.color || '#2196F3',
    lineWidth: props.options.lineWidth || 2,
    lineStyle: props.options.lineStyle || 'solid',
    leftExtend: props.options.leftExtend || false,
    rightExtend: props.options.rightExtend || false
});

const positionStyle = computed(() => ({
    left: `${props.position.x}px`,
    top: `${props.position.y}px`
}));

// 监听 props 变化
watch(
    () => props.options,
    (newOptions) => {
        // 同步更新本地状态
        settings.value = {
            color: newOptions.color || '#2196F3',
            lineWidth: newOptions.lineWidth || 2,
            lineStyle: newOptions.lineStyle || 'solid',
            leftExtend: newOptions.leftExtend || false,
            rightExtend: newOptions.rightExtend || false
        };
    },
    { immediate: true }
);

const updateSettings = () => {
    console.log('Settings update triggered:', settings.value);
    // 立即emit更新事件
    requestAnimationFrame(() => {
        emit('update', { ...settings.value });
    });
};
</script>

<style scoped>
.line-settings {
    position: absolute;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    padding: 16px;
    z-index: 1000;
    min-width: 200px;
}

.settings-header {
    font-weight: bold;
    margin-bottom: 12px;
}

.settings-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}

.setting-item label {
    color: #666;
    font-size: 14px;
}

.delete-btn {
    margin-top: 8px;
    padding: 6px 12px;
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.delete-btn:hover {
    background: #ff6666;
}
</style>
