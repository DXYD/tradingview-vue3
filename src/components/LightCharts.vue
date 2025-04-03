<script setup>
import {
    ref,
    onMounted,
    onUnmounted,
    watch,
    defineExpose,
    defineProps,
} from 'vue';
import {
    createChart,
    LineSeries,
    AreaSeries,
    BarSeries,
    CandlestickSeries,
    HistogramSeries,
    BaselineSeries,
} from 'lightweight-charts';
import ToolBar from '../plugins/ChartTools/ToolBar.vue';
import { LineManager } from '../plugins/ChartTools/LineManager';

const props = defineProps({
    type: {
        type: String,
        default: 'line',
    },
    data: {
        type: Array,
        required: true,
    },
    autosize: {
        default: true,
        type: Boolean,
    },
    chartOptions: {
        type: Object,
    },
    seriesOptions: {
        type: Object,
    },
    timeScaleOptions: {
        type: Object,
    },
    priceScaleOptions: {
        type: Object,
    },
});

function getChartSeriesDefinition(type) {
    switch (type.toLowerCase()) {
        case 'line':
            return LineSeries;
        case 'area':
            return AreaSeries;
        case 'bar':
            return BarSeries;
        case 'candlestick':
            return CandlestickSeries;
        case 'histogram':
            return HistogramSeries;
        case 'baseline':
            return BaselineSeries;
    }
    return LineSeries;
}

// Lightweight Charts™ instances are stored as normal JS variables
// If you need to use a ref then it is recommended that you use `shallowRef` instead
let series;
let chart;

const chartContainer = ref();

const fitContent = () => {
    if (!chart) return;
    chart.timeScale().fitContent();
};

// 使用 ref 来存储 lineManager
const lineManagerRef = ref(null);

const getChart = () => {
    return {
        chart,
        lineManager: lineManagerRef.value  // 使用 ref 中的值
    };
};

defineExpose({ fitContent, getChart });

// Auto resizes the chart when the browser window is resized.
const resizeHandler = () => {
    if (!chart || !chartContainer.value) return;
    const dimensions = chartContainer.value.getBoundingClientRect();
    chart.resize(dimensions.width, dimensions.height);
};

// 添加响应式状态，增加日期和名称
const currentData = ref({
    name: 'BTC/USDT',  // 可以通过props传入
    date: '',
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    volume: 0,
    visible: false
});

const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
};

// 添加鼠标坐标状态
const mousePosition = ref({
    x: 0,
    y: 0,
    price: 0,
    time: '',
    visible: false
});

// 修复鼠标位置更新函数
const updateMousePosition = (point) => {
    mousePosition.value = {
        x: Math.round(point.x),
        y: Math.round(point.y),
        price: point.price !== undefined ? point.price.toFixed(2) : '',
        time: point.time ? formatDate(point.time) : '',
        visible: true
    };
};

// 添加空格按下状态追踪
const isSpacePressed = ref(false);
const lastMouseX = ref(0);

// 添加空格键按下和释放的处理函数
const handleKeyDown = (e) => {
    if (e.code === 'Space' && currentTool && !isSpacePressed.value) {
        isSpacePressed.value = true;
        e.preventDefault(); // 阻止页面滚动
        chartContainer.value.style.cursor = 'grab';
    }
};

const handleKeyUp = (e) => {
    if (e.code === 'Space') {
        isSpacePressed.value = false;
        chartContainer.value.style.cursor = 'default';
    }
};

// 添加吸附状态
const isSnapEnabled = ref(false);

const handleSnapChange = (snap) => {
    isSnapEnabled.value = snap;
    if (currentTool && typeof currentTool !== 'string') {
        currentTool.options.snap = snap;
    }
};

// Creates the chart series and sets the data.
const addSeriesAndData = props => {
    // Convert the candlestick data for use with a line series
    const volumeData = props.data.map(datapoint => ({
        time: datapoint.time,
        value: datapoint.volume,
        color: datapoint.close > datapoint.open ? '#ef5350' : '#26a69a' // 涨红跌绿
    }));

    // Add volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
        priceScaleId: 'volume',
        priceFormat: {
            type: 'volume',
        },
        scaleMargins: {
            top: 0.5,
            bottom: 0.2,
        },
    });
    volumeSeries.setData(volumeData);

    // Add candlestick series
    const seriesDefinition = getChartSeriesDefinition(props.type);
    series = chart.addSeries(seriesDefinition, props.seriesOptions);
    series.setData(props.data);

    // 创建 LineManager
    lineManagerRef.value = new LineManager(chart, series);

    // 修改鼠标移动事件处理
    chart.subscribeCrosshairMove(param => {
        const validCrosshairPoint = !(
            param === undefined || 
            param.time === undefined || 
            param.point.x < 0 || 
            param.point.y < 0
        );

        if (validCrosshairPoint && series) {
            const data = param.seriesData.get(series);
            const volumeData = param.seriesData.get(volumeSeries);
            
            if (data) {
                const { open, high, low, close } = data;
                const volume = volumeData ? volumeData.value : 0;
                
                currentData.value = {
                    name: 'BTC/USDT',  // 可以通过props传入
                    date: formatDate(param.time),
                    open,
                    high,
                    low,
                    close,
                    volume,
                    visible: true
                };
            }
        } else {
            currentData.value.visible = false;
        }
    });
};

// 使用 LineManager 替代原有的管理方式
let currentTool = null;

const handleToolChange = (tool) => {
    if (tool === 'line') {
        if (!lineManagerRef.value) {
            lineManagerRef.value = new LineManager(chart, series);
        }
        currentTool = lineManagerRef.value.startNewLine({
            color: '#2196F3',
            lineStyle: "solid",
            lineWidth: 1,
            snap: isSnapEnabled.value  // 使用当前的吸附状态
        });
    } else {
        // 清理当前的绘制状态
        if (lineManagerRef.value && currentTool) {
            if (currentTool.isStarted() && !currentTool.isFinished()) {
                currentTool.remove();
            }
            currentTool = null;
        }
    }
};

// 添加鼠标事件处理
const snapPoint = (point) => {
    if (!currentTool || !currentTool.options.snap) return point;

    const mouseTime = chart.timeScale().coordinateToTime(point.x);
    const mousePrice = series.coordinateToPrice(point.y);

    if (!mouseTime || mousePrice === null) return point;

    // 寻找最近的 K 线
    let nearestCandle = null;
    let minTimeDistance = Infinity;

    props.data.forEach(candle => {
        const candleX = chart.timeScale().timeToCoordinate(candle.time);
        if (candleX !== null) {
            const distance = Math.abs(point.x - candleX);
            if (distance < minTimeDistance && distance < 20) {
                minTimeDistance = distance;
                nearestCandle = candle;
            }
        }
    });

    if (nearestCandle) {
        // 水平吸附
        const snapX = chart.timeScale().timeToCoordinate(nearestCandle.time);
        if (snapX !== null) {
            point.x = snapX;
            point.time = nearestCandle.time;
        }

        // 垂直吸附到 OHLC
        const prices = [
            { price: nearestCandle.open, type: 'open' },
            { price: nearestCandle.high, type: 'high' },
            { price: nearestCandle.low, type: 'low' },
            { price: nearestCandle.close, type: 'close' }
        ];

        const nearest = prices.reduce((nearest, current) => {
            const diff = Math.abs(current.price - mousePrice);
            const percentDiff = (diff / mousePrice) * 100;
            return percentDiff < nearest.diff ? 
                { diff: percentDiff, point: current } : 
                nearest;
        }, { diff: Infinity, point: null });

        if (nearest.diff < 0.5 && nearest.point) {
            const snappedY = series.priceToCoordinate(nearest.point.price);
            if (snappedY !== null) {
                point.y = snappedY;
                point.price = nearest.point.price;
                point.type = nearest.point.type;
            }
        }
    }

    return point;
};

const handleMouseDown = (e) => {
    if (!chart || !series || !currentTool) return;
    
    lastMouseX.value = e.clientX;
    
    if (isSpacePressed.value) {
        chartContainer.value.style.cursor = 'grabbing';
        return;
    }

    const rect = chartContainer.value.getBoundingClientRect();
    let point = createPoint(e, rect);
    
    // 在用户点击时应用吸附
    point = snapPoint(point);

    if (currentTool === 'eraser') {
        const lineIndex = lineManagerRef.value?.getLineAtPosition(point.x, point.y);
        if (lineIndex !== -1) {
            lineManagerRef.value?.removeLine(lineIndex);
        }
        return;
    }

    if (!currentTool.isStarted()) {
        currentTool.start(point);
        lineManagerRef.value?.setStartPoint(point);
    } else {
        currentTool.stop(point);
        lineManagerRef.value?.finishCurrentLine(point);
        handleToolChange('line');
    }

    e.preventDefault();
};

const handleMouseMove = (e) => {
    if (!chart || !series) return;
    
    const rect = chartContainer.value.getBoundingClientRect();
    let point = createPoint(e, rect);

    // 即使在未开始绘制前，也应用吸附逻辑
    if (currentTool && typeof currentTool !== 'string' && currentTool.options.snap) {
        point = snapPoint(point);
    }

    // 更新鼠标位置显示
    updateMousePosition(point);
    
    if (isSpacePressed.value) {
        // 计算鼠标移动距离
        const deltaX = e.clientX - lastMouseX.value;
        if (deltaX !== 0) {
            // 移动时间轴
            const timeScale = chart.timeScale();
            const visibleRange = timeScale.getVisibleLogicalRange();
            if (visibleRange !== null) {
                timeScale.scrollPosition().moveTo(timeScale.scrollPosition().position() - deltaX);
            }
        }
        lastMouseX.value = e.clientX;
        return;
    }
    
    // 如果正在绘制，则移动线段
    if (currentTool && typeof currentTool !== 'string' && currentTool.isStarted() && !currentTool.isFinished()) {
        currentTool.move(point);
    }
    // 如果未开始绘制但已选择工具，显示预览点
    else if (currentTool && typeof currentTool !== 'string') {
        currentTool.showPreviewPoint?.(point);
    }

    e.preventDefault();
};

// 辅助函数：创建点位对象
const createPoint = (e, rect) => {
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = chart.timeScale().coordinateToTime(x);
    const price = series.coordinateToPrice(y);

    return {
        x,
        y,
        time: time || undefined,
        price: price !== null ? price : undefined
    };
};

const handleMouseUp = (e) => {
    if (!currentTool || !lineManagerRef.value) return;
    
    if (currentTool.isFinished()) {
        lineManagerRef.value.finishCurrentLine();
        // 创建新的线段工具
        handleToolChange('line');
    }
    
    e.preventDefault();
};

const handleMouseLeave = () => {
    mousePosition.value.visible = false;
};

onMounted(() => {
    // Create the Lightweight Charts Instance using the container ref.
    chart = createChart(chartContainer.value, {
        ...props.chartOptions,
        layout: {
            textColor: '#333',
        },
        crosshair: {
            mode: 0,
            vertLine: {
                color: '#C3BCDB44',
                style: 0,
                labelBackgroundColor: '#9B7DFF',
            },
            horzLine: {
                color: '#9B7DFF',
                labelBackgroundColor: '#9B7DFF',
            },
        },
        // 添加价格刻度配置
        rightPriceScale: {
            visible: true,
            borderColor: '#2B2B43',
        },
        localization: {
            priceFormatter: price => Math.round(price * 100) / 100,
        },
    });

    addSeriesAndData(props);

    // 更新价格刻度配置
    if (props.priceScaleOptions) {
        chart.priceScale('right').applyOptions(props.priceScaleOptions);
    }
    
    // 配置成交量刻度
    chart.priceScale('volume').applyOptions({
        scaleMargins: {
            top: 0.9,
            bottom: 0,
        },
        visible: true,
    });

    if (props.timeScaleOptions) {
        chart.timeScale().applyOptions(props.timeScaleOptions);
    }

    chart.timeScale().fitContent();

    if (props.autosize) {
        window.addEventListener('resize', resizeHandler);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
});

onUnmounted(() => {
    if (chart) {
        chart.remove();
        chart = null;
    }
    if (series) {
        series = null;
    }
    // 清理所有线段工具
    if (lineManagerRef.value) {
        lineManagerRef.value.removeAllLines();
        lineManagerRef.value = null;
    }
    window.removeEventListener('resize', resizeHandler);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
});

/*
 * Watch for changes to any of the component properties.

 * If an options property is changed then we will apply those options
 * on top of any existing options previously set (since we are using the
 * `applyOptions` method).
 *
 * If there is a change to the chart type, then the existing series is removed
 * and the new series is created, and assigned the data.
 *
 */
watch(
    () => props.autosize,
    enabled => {
        if (!enabled) {
            window.removeEventListener('resize', resizeHandler);
            return;
        }
        window.addEventListener('resize', resizeHandler);
    }
);

watch(
    () => props.type,
    newType => {
        if (series && chart) {
            chart.removeSeries(series);
        }
        addSeriesAndData(props);
    }
);

watch(
    () => props.data,
    newData => {
        if (!series) return;
        series.setData(newData);
    }
);

watch(
    () => props.chartOptions,
    newOptions => {
        if (!chart) return;
        chart.applyOptions(newOptions);
    }
);

watch(
    () => props.seriesOptions,
    newOptions => {
        if (!series) return;
        series.applyOptions(newOptions);
    }
);

watch(
    () => props.priceScaleOptions,
    newOptions => {
        if (!chart) return;
        // 确保使用 'right' 作为 id
        chart.priceScale('right').applyOptions(newOptions);
    }
);

watch(
    () => props.timeScaleOptions,
    newOptions => {
        if (!chart) return;
        chart.timeScale().applyOptions(newOptions);
    }
);

</script>

<template>
    <div class="lw-chart" 
         ref="chartContainer"
         @mousedown="handleMouseDown"
         @mousemove="handleMouseMove"
         @mouseup="handleMouseUp"
         @mouseleave="handleMouseLeave">
        <!-- 工具栏组件 -->
        <ToolBar
            class="chart-toolbar"
            @tool-change="handleToolChange"
            @snap-change="handleSnapChange"
        />
        <!-- 数据信息面板 -->
        <div v-if="currentData.visible" 
             class="chart-info"
             :class="{ 'up': currentData.close > currentData.open, 'down': currentData.close <= currentData.open }">
            <div class="symbol-name">{{ currentData.name }}</div>
            <div class="price">{{ currentData.close?.toFixed(2) }}</div>
            <div class="date">{{ currentData.date }}</div>
            <div class="info-container">
                <div class="info-item">
                    <span class="label">O</span>
                    <span class="value">{{ currentData.open?.toFixed(2) }}</span>
                </div>
                <div class="info-item">
                    <span class="label">High</span>
                    <span class="value">{{ currentData.high?.toFixed(2) }}</span>
                </div>
                <div class="info-item">
                    <span class="label">Low</span>
                    <span class="value">{{ currentData.low?.toFixed(2) }}</span>
                </div>
                <div class="info-item">
                    <span class="label">Close</span>
                    <span class="value">{{ currentData.close?.toFixed(2) }}</span>
                </div>
                <div class="info-item">
                    <span class="label">Volume</span>
                    <span class="value">{{ currentData.volume?.toLocaleString() }}</span>
                </div>
            </div>
        </div>
        <!-- 添加鼠标坐标显示 -->
        <div v-if="mousePosition.visible" 
             class="mouse-position">
            <div class="coordinate">
                <span>X: {{ mousePosition.x }}</span>
                <span>Y: {{ mousePosition.y }}</span>
            </div>
            <div class="values">
                <span>Price: {{ mousePosition.price }}</span>
                <span>Time: {{ mousePosition.time }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.lw-chart {
    height: 100%;
    position: relative;
    overflow: visible;  /* 确保工具栏不会被裁剪 */
    user-select: none; /* 防止拖动时选中文本 */
}

.chart-info {
    position: absolute;
    left: 12px;
    top: 12px;
    transform: none;  
    background: rgba(255, 255, 255, 0.95);
    padding: 12px 15px;
    border-radius: 6px;
    font-family: system-ui, -apple-system, sans-serif;
    z-index: 100;
    box-shadow: 0 3px 10px rgba(0,0,0,0.15);
    border: 1px solid #e0e0e0;
    min-width: 200px;
}

.chart-info.up {
    border-left: 4px solid #ef5350;
    color: #ef5350;
}

.chart-info.down {
    border-left: 4px solid #26a69a;
    color: #26a69a;
}

.symbol-name {
    font-size: 24px;
    margin: 4px 0;
    font-weight: 500;
}

.price {
    font-size: 22px;
    margin: 4px 0;
    font-weight: 500;
}

.date {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
}

.info-container {
    display: flex;
    gap: 20px;
    align-items: center;
}

.info-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 60px;
}

.info-item .label {
    font-size: 12px;
    font-weight: bold;
    color: #666;
    margin-bottom: 2px;
}

.info-item .value {
    font-weight: 500;
    font-size: 15px;
}

.chart-info.up .value {
    color: #ef5350;
}

.chart-info.down .value {
    color: #26a69a;
}

/* 移除之前的样式 */
.info-row {
    display: none;
}

/* 添加工具栏定位样式 */
.chart-toolbar {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
}

.mouse-position {
    position: absolute;
    top: 12px;
    right: 70px;
    background: rgba(255, 255, 255, 0.95);
    padding: 8px 12px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    z-index: 100;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    border: 1px solid #e0e0e0;
}

.mouse-position .coordinate,
.mouse-position .values {
    display: flex;
    gap: 12px;
}

.mouse-position span {
    white-space: nowrap;
}
</style>