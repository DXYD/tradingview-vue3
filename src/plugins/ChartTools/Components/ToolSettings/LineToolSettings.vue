<template>
    <div class="line-settings">
        <div class="setting-item">
            <label>颜色</label>
            <input type="color" v-model="settings.color" @change="updateSettings">
        </div>
        <div class="setting-item">
            <label>线宽</label>
            <input type="range" min="1" max="5" v-model.number="settings.lineWidth" @change="updateSettings">
        </div>
        <div class="setting-item">
            <label>样式</label>
            <select v-model="settings.lineStyle" @change="updateSettings">
                <option value="solid">实线</option>
                <option value="dashed">虚线</option>
                <option value="dotted">点线</option>
            </select>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue';
import { LineToolOptions } from '../../types';

const props = defineProps<{
    options: LineToolOptions;
}>();

const emit = defineEmits<{
    (e: 'update', options: LineToolOptions): void;
}>();

// 使用完整的 LineToolOptions 类型初始化设置
const settings = ref<LineToolOptions>({
    color: props.options.color,
    lineWidth: props.options.lineWidth,
    lineStyle: props.options.lineStyle,
    snap: props.options.snap || false,
    finished: props.options.finished || false
});

// 监听 props 变化同步更新本地状态
watch(() => props.options, (newOptions) => {
    // 确保所有必需的属性都被设置
    settings.value = {
        color: newOptions.color,
        lineWidth: newOptions.lineWidth,
        lineStyle: newOptions.lineStyle,
        snap: newOptions.snap || false,
        finished: newOptions.finished || false
    };
}, { deep: true });

const updateSettings = () => {
    // 发送完整的 LineToolOptions 对象
    emit('update', {
        color: settings.value.color,
        lineWidth: settings.value.lineWidth,
        lineStyle: settings.value.lineStyle,
        snap: settings.value.snap,
        finished: settings.value.finished
    });
};
</script>

<style scoped>
.line-settings {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.setting-item label {
    font-size: 12px;
    color: #666;
}
</style>
