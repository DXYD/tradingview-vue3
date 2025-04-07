<template>
    <div class="settings-bar" :style="positionStyle">
        <div class="settings-content">
            <!-- 线段工具设置 -->
            <LineToolSettings
                v-if="tool.type === 'line'"
                :options="tool.options"
                @update="updateToolSettings"
            />
            
            <!-- 通用操作 -->
            <div class="common-actions">
                <button class="delete-btn" @click="deleteTool">删除</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits } from 'vue';
import { LineToolInfo, LineToolOptions } from '../types';

const props = defineProps<{
    tool: LineToolInfo; // 修改类型为 LineToolInfo
    position: { x: number; y: number };
}>();

const emit = defineEmits<{
    (e: 'update', data: { id: number; options: LineToolOptions }): void;
    (e: 'delete', id: number): void;
}>();

const positionStyle = computed(() => ({
    left: `${props.position.x}px`,
    top: `${props.position.y}px`
}));

const updateToolSettings = (options: LineToolOptions) => {
    if (props.tool.type === 'line') {
        // 创建一个新的对象而不是直接修改props
        const newOptions = { ...props.tool.options, ...options };
        emit('update', {
            id: props.tool.id,
            options: newOptions
        });
    }
};

const deleteTool = () => {
    emit('delete', props.tool.id);
};
</script>

<style scoped>
.settings-bar {
    position: absolute;
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    padding: 12px;
    z-index: 1000;
    min-width: 200px;
}

.settings-content {
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

.delete-btn {
    margin-top: 8px;
    padding: 4px 8px;
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
