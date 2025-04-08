<template>
    <div class="rect-settings" :style="positionStyle" @mousedown.stop>
        <div class="settings-content">
            <div class="setting-item">
                <label>边框颜色</label>
                <input 
                    type="color" 
                    :value="settings.color"
                    @input="e => updateSetting('color', e.target.value)"
                >
            </div>
            <div class="setting-item">
                <label>填充颜色</label>
                <input 
                    type="color" 
                    :value="settings.fillColor"
                    @input="e => updateSetting('fillColor', e.target.value)"
                >
            </div>
            <div class="setting-item">
                <label>填充透明度</label>
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    :value="settings.fillOpacity * 100"
                    @input="e => updateSetting('fillOpacity', Number(e.target.value) / 100)"
                >
            </div>
            <div class="setting-item">
                <label>边框样式</label>
                <select 
                    :value="settings.borderStyle"
                    @change="e => updateSetting('borderStyle', e.target.value)"
                >
                    <option value="solid">实线</option>
                    <option value="dashed">虚线</option>
                    <option value="dotted">点线</option>
                </select>
            </div>
            <button class="delete-btn" @click="$emit('delete')">删除</button>
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
    }
});

const emit = defineEmits(['update', 'delete']);

const settings = ref({
    color: props.options.color || '#2196F3',
    fillColor: props.options.fillColor || '#2196F3',
    fillOpacity: props.options.fillOpacity || 0.2,
    borderStyle: props.options.borderStyle || 'solid'
});

const positionStyle = computed(() => ({
    left: `${props.position.x}px`,
    top: `${props.position.y}px`
}));

watch(() => props.options, (newOptions) => {
    settings.value = {
        color: newOptions.color || '#2196F3',
        fillColor: newOptions.fillColor || '#2196F3',
        fillOpacity: newOptions.fillOpacity || 0.2,
        borderStyle: newOptions.borderStyle || 'solid'
    };
}, { immediate: true });

const updateSetting = (key, value) => {
    settings.value[key] = value;
    emit('update', { ...settings.value });
};
</script>

<style scoped>
.rect-settings {
    position: absolute;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    padding: 16px;
    z-index: 1000;
    min-width: 200px;
}

</style>
