<template>
    <div class="app-container">
        <div class="chart-container">
            <LWChart
                ref="chartRef"
                :type="chartType"
                :data="data"
                :autosize="true"
                :chart-options="chartOptions"
                :series-options="seriesOptions"
                :price-scale-options="priceScaleOptions"
                :time-scale-options="timeScaleOptions"
            />
        </div>
        <div class="controls">
            <button type="button" @click="changeData">Change Data</button>
            <div class="line-list">
                <h3>已绘制线段列表：({{ lines.length }}) 
                    <button @click="debugLines" class="debug-btn">Debug</button>
                </h3>
                <div v-if="lines.length === 0" class="no-lines">
                    暂无线段
                </div>
                <div v-else class="lines-container">
                    <div v-for="(line, index) in lines" :key="index" class="line-item">
                        <div class="line-header">
                            线段 #{{index + 1}}
                            <button class="delete-btn" @click="removeLine(index)">删除</button>
                        </div>
                        <div class="line-details">
                            <div class="point-info">
                                <span>起点：</span>
                                <div>时间: {{formatDate(line.startPoint.time)}}</div>
                                <div>价格: {{formatPrice(line.startPoint.price)}}</div>
                            </div>
                            <div class="point-info">
                                <span>终点：</span>
                                <div>时间: {{formatDate(line.endPoint.time)}}</div>
                                <div>价格: {{formatPrice(line.endPoint.price)}}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { createChart } from 'lightweight-charts';
import { ref, onMounted, onUnmounted } from 'vue';
import LWChart from './components/LightCharts.vue';

function generateSampleData(ohlc) {
    const randomFactor = 25 + Math.random() * 25;
    function samplePoint(i) {
        return (
            i *
                (0.5 +
                    Math.sin(i / 10) * 0.2 +
                    Math.sin(i / 20) * 0.4 +
                    Math.sin(i / randomFactor) * 0.8 +
                    Math.sin(i / 500) * 0.5) +
            200
        );
    }

    function generateVolume(price, prevPrice) {
        let baseVolume = Math.round(Math.random() * 5000 + 1000);
        if (prevPrice) {
            const priceChange = Math.abs(price - prevPrice);
            const volumeAdjustment = Math.round(priceChange * 1000);
            baseVolume += volumeAdjustment;
        }
        return Math.max(100, Math.round(baseVolume * (0.5 + Math.random())));
    }

    const res = [];
    let date = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
    const numberOfPoints = ohlc ? 100 : 500;
    let prevClose = null;

    for (var i = 0; i < numberOfPoints; ++i) {
        const time = date.getTime() / 1000;
        const value = samplePoint(i);

        if (ohlc) {
            const randomRanges = [
                -1 * Math.random(),
                Math.random(),
                Math.random(),
            ].map(i => i * 10);
            const sign = Math.sin(Math.random() - 0.5);
            const close = samplePoint(i + 1);
            const volume = generateVolume(close, prevClose);
            prevClose = close;

            res.push({
                time,
                low: value + randomRanges[0],
                high: value + randomRanges[1],
                open: value + sign * randomRanges[2],
                close: close,
                volume: volume
            });
        } else {
            res.push({
                time,
                value,
            });
        }

        date.setUTCDate(date.getUTCDate() + 1);
    }

    return res;
}

const chartOptions = ref({});
const data = ref(generateSampleData(true));
const seriesOptions = ref({
    upColor: '#ef5350',
    downColor: '#26a69a',
    borderUpColor: '#ef5350',
    borderDownColor: '#26a69a',
    wickUpColor: '#ef5350',
    wickDownColor: '#26a69a'
});
const priceScaleOptions = ref({});
const timeScaleOptions = ref({});
const chartType = ref('candlestick');
const lwChart = ref();

const chartRef = ref(null);
const lines = ref([]);

const formatPrice = (price) => {
    return price ? price.toFixed(2) : 'N/A';
};

const formatDate = (time) => {
    if (!time) return 'N/A';
    const date = new Date(time * 1000);
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const formattedDate = `${year}/${month}/${day}`
    return date.toLocaleString();
	// return formattedDate;
};

const updateLineList = () => {
    if (!chartRef.value) return;
    
    const { lineManager } = chartRef.value.getChart();
    console.log('Getting LineManager:', lineManager); // 添加调试日志
    
    if (lineManager) {
        const currentLines = lineManager.getLines();
        console.log('Current lines:', currentLines);
        
        if (Array.isArray(currentLines) && currentLines.length > 0) {
            lines.value = [...currentLines];
        } else {
            lines.value = [];
        }
    }
};

onMounted(() => {
    setTimeout(() => {
        const { lineManager } = chartRef.value?.getChart() || {};
        if (lineManager) {
            console.log('Found LineManager:', lineManager);
            // 添加状态变化监听
            lineManager.setOnLinesChanged(() => {
                console.log('Lines changed, updating list');
                const currentLines = lineManager.getLines();
                console.log('Current lines:', currentLines);
                lines.value = currentLines; // 修正这里，不再使用 lines.value = [...lines]
            });
            
            // 初始化时立即获取一次数据
            lines.value = lineManager.getLines();
        }
    }, 100);
});

// 添加调试函数
const debugLines = () => {
    console.log('Current lines:', lines.value);
    const { lineManager } = chartRef.value?.getChart() || {};
    console.log('LineManager lines:', lineManager?.getLines());
};

function randomShade() {
    return Math.round(Math.random() * 255);
}

const randomColor = (alpha = 1) => {
    return `rgba(${randomShade()}, ${randomShade()}, ${randomShade()}, ${alpha})`;
};

const colorsTypeMap = {
    candlestick: [
        ['upColor', '#ef5350'],
        ['downColor', '#26a69a'],
        ['borderUpColor', '#ef5350'],
        ['borderDownColor', '#26a69a'],
        ['wickUpColor', '#ef5350'],
        ['wickDownColor', '#26a69a'],
    ],
};

const changeData = () => {
    const candlestickTypeData = ['candlestick', 'bar'].includes(chartType.value);
    const newData = generateSampleData(candlestickTypeData);
    data.value = newData;
    if (chartType.value === 'baseline') {
        const average =
            newData.reduce((s, c) => {
                return s + c.value;
            }, 0) / newData.length;
        seriesOptions.value = { baseValue: { type: 'price', price: average } };
    }
};

const removeLine = (index) => {
    const { lineManager } = chartRef.value?.getChart();
    if (lineManager) {
        lineManager.removeLine(index);
    }
};

</script>

<style scoped>
.app-container {
    display: flex;
    height: 100%;
}

.chart-container {
    flex: 1;  /* 修改为flex布局 */
    height: 95vh;
    margin-bottom: 0;
}

.controls {
    width: 300px;
    padding: 20px;
    background: #f5f5f5;
    border-left: 1px solid #ddd;
    overflow-y: auto; /* 添加滚动条 */
    max-height: 95vh;
}

.line-list {
    margin-top: 20px;
}

.line-list h3 {
    margin-bottom: 10px;
    color: #333;
}

.no-lines {
    color: #666;
    font-style: italic;
}

.lines-container {
    max-height: 100%;
    overflow-y: auto;
}

.line-item {
    background: white;
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.line-header {
    font-weight: bold;
    color: #2196F3;
    margin-bottom: 8px;
}

.line-details {
    font-size: 0.9em;
}

.point-info {
    margin: 5px 0;
    padding-left: 10px;
}

.point-info span {
    font-weight: 500;
    color: #666;
}

.point-info div {
    margin-left: 10px;
    color: #333;
}

.delete-btn {
    float: right;
    padding: 2px 8px;
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.delete-btn:hover {
    background: #ff6666;
}

.debug-btn {
    font-size: 12px;
    padding: 2px 6px;
    margin-left: 8px;
    background: #666;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
}

.debug-btn:hover {
    background: #888;
}
</style>