// ============================================================
// CONFIGURATION
// ============================================================
const SUPABASE_URL = 'https://muzxububwlpnfovmrkrg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5agpmPQAwxkup_NYH5uOvQ_wFKYamKS';
const REFRESH_INTERVAL_MS = 30000;
const CHART_HISTORY_LIMIT = 50;

const READINGS_PAGE_SIZE = 10;
let readingsOffset = 0;
let readingsTotalCount = 0;

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================
// NULL-SAFE DOM HELPERS
// ============================================================
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
    else console.warn(`[ORCHID] Missing element: #${id}`);
}
function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
    else console.warn(`[ORCHID] Missing element: #${id}`);
}
function setClass(id, className) {
    const el = document.getElementById(id);
    if (el) el.className = className;
    else console.warn(`[ORCHID] Missing element: #${id}`);
}
function setStyle(id, prop, value) {
    const el = document.getElementById(id);
    if (el) el.style[prop] = value;
    else console.warn(`[ORCHID] Missing element: #${id}`);
}

// ============================================================
// SVG ICON LIBRARY
// ============================================================
const ICONS = {
    temperature: `<svg class="icon" width="30" height="30" viewBox="0 0 24 24"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>`,
    humidity:    `<svg class="icon" width="30" height="30" viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
    heat_index:  `<svg class="icon" width="30" height="30" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    pressure:    `<svg class="icon" width="30" height="30" viewBox="0 0 24 24"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg>`,
    trend:       `<svg class="icon" width="30" height="30" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    battery:     `<svg class="icon" width="30" height="30" viewBox="0 0 24 24"><rect x="2" y="7" width="16" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="9" y1="10" x2="9" y2="14"/><line x1="12" y1="10" x2="12" y2="14"/></svg>`,

    'Sunny':         `<svg class="icon" width="52" height="52" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
    'Partly Cloudy': `<svg class="icon" width="52" height="52" viewBox="0 0 24 24"><path d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M20 12h2M17.66 6.34l1.41-1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>`,
    'Cloudy':        `<svg class="icon" width="52" height="52" viewBox="0 0 24 24"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`,
    'Rainy':         `<svg class="icon" width="52" height="52" viewBox="0 0 24 24"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6M8 14v6M12 16v6"/></svg>`,
    'Stormy':        `<svg class="icon" width="52" height="52" viewBox="0 0 24 24"><path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973"/><path d="m13 12-3 5h4l-3 5"/></svg>`,

    'rising':        `<svg class="icon" width="14" height="14" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    'falling':       `<svg class="icon" width="14" height="14" viewBox="0 0 24 24"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>`,
    'steady':        `<svg class="icon" width="14" height="14" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,

    'ok':            `<svg class="icon" width="12" height="12" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
    'low_battery':   `<svg class="icon" width="12" height="12" viewBox="0 0 24 24"><rect x="2" y="7" width="16" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/><line x1="6" y1="11" x2="6" y2="13"/></svg>`,
    'sensor_error':  `<svg class="icon" width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    'calibrating':   `<svg class="icon" width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    'stale':         `<svg class="icon" width="12" height="12" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
};

function icon(name, size) {
    let svg = ICONS[name] || '';
    if (size && svg) {
        svg = svg.replace(/width="[^"]+"/, `width="${size}"`)
                 .replace(/height="[^"]+"/, `height="${size}"`);
    }
    return svg;
}

// ============================================================
// WEATHER STYLES
// ============================================================
const WEATHER_COLORS = {
    'Sunny':         '#fbbf24',
    'Partly Cloudy': '#38bdf8',
    'Cloudy':        '#94a3b8',
    'Rainy':         '#3b82f6',
    'Stormy':        '#a855f7'
};
function getWeatherColor(name) { return WEATHER_COLORS[name] || '#94a3b8'; }
function getWeatherIcon(name)  { return ICONS[name] || ICONS['Cloudy']; }

// ============================================================
// FORECAST COLORS
// ============================================================
const FORECAST_COLORS = {
    'Clear': '#10b981', 'Sunny': '#10b981', 'Mostly Sunny': '#22c55e',
    'Sun->Rain': '#eab308', 'Showers': '#eab308', 'Rain Soon': '#f97316',
    'Rain->Worse': '#f97316', 'Heavy Rain': '#ef4444', 'Stormy': '#a855f7',
    'Maybe Rain': '#22c55e', 'Sun+Showers': '#eab308', 'Rain & Sun': '#eab308',
    'Changeable': '#eab308', 'On/Off Rain': '#f97316', 'Frequent Rain': '#f97316',
    'Very Rainy': '#ef4444', 'Storm': '#a855f7', 'Clearing': '#22c55e',
    'Improving': '#22c55e', 'AM Showers': '#eab308', 'Better Soon': '#22c55e',
    'Sun Breaks': '#eab308', 'Mostly Rain': '#ef4444', 'Storm->Clear': '#a855f7',
    'Heavy Storm': '#a855f7', 'Calibrating': '#94a3b8', 'Calibrating...': '#94a3b8'
};
function getForecastColor(text) {
    if (!text) return '#94a3b8';
    for (const key in FORECAST_COLORS) {
        if (text.startsWith(key)) return FORECAST_COLORS[key];
    }
    return '#f1f5f9';
}

// ============================================================
// STATUS FLAGS
// ============================================================
const STATUS_FLAGS = [
    { bit: 0x01, label: 'Sensor OK',    icon: 'ok',           cssClass: 'ok' },
    { bit: 0x02, label: 'Low Battery',  icon: 'low_battery',  cssClass: 'error' },
    { bit: 0x04, label: 'Sensor Error', icon: 'sensor_error', cssClass: 'error' },
    { bit: 0x08, label: 'Calibrating',  icon: 'calibrating',  cssClass: 'warning' }
];
function renderFlagBadges(flags) {
    if (flags === null || flags === undefined) {
        return '<span class="flag-badge neutral">No Data</span>';
    }
    const active = STATUS_FLAGS.filter(f => (flags & f.bit) !== 0);
    if (active.length === 0) return '<span class="flag-badge neutral">No Flags</span>';
    return active.map(f =>
        `<span class="flag-badge ${f.cssClass}">${icon(f.icon, 12)} ${f.label}</span>`
    ).join('');
}

// ============================================================
// TIME HELPERS
// ============================================================
function formatShortTimePH(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}
function formatTimeOnlyPH(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-PH', {
        timeZone: 'Asia/Manila',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}
function timeAgo(iso) {
    if (!iso) return '—';
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60)    return `${s}s ago`;
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}
function formatUptime(cycles) {
    if (cycles === null || cycles === undefined) return '—';
    const seconds = cycles * 60;
    const days    = Math.floor(seconds / 86400);
    const hours   = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0)  return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

// ============================================================
// STATUS INDICATOR
// ============================================================
function setStatus(online, ageText) {
    const dot = document.getElementById('statusDot');
    const txt = document.getElementById('statusText');
    if (dot) {
        if (online) dot.classList.remove('offline');
        else dot.classList.add('offline');
    }
    if (txt) {
        if (online) txt.textContent = ageText ? `Live • ${ageText}` : 'Online';
        else        txt.textContent = ageText ? `Offline • ${ageText}` : 'No data';
    }
}
function showError(msg) {
    const box = document.getElementById('errorBox');
    if (!box) return;
    box.textContent = msg;
    box.style.display = 'block';
}
function hideError() {
    const box = document.getElementById('errorBox');
    if (box) box.style.display = 'none';
}

// ============================================================
// CHART CONFIGURATION
// ============================================================
const METRIC_CONFIG = {
    temperature: { label: 'Temperature', unit: '°C', color: '#fbbf24',
        gradient: ['rgba(251, 191, 36, 0.35)', 'rgba(251, 191, 36, 0)'],
        extract: d => d.temperature, decimals: 1 },
    humidity: { label: 'Humidity', unit: '%', color: '#3b82f6',
        gradient: ['rgba(59, 130, 246, 0.35)', 'rgba(59, 130, 246, 0)'],
        extract: d => d.humidity, decimals: 1 },
    heat_index: { label: 'Heat Index', unit: '°C', color: '#ef4444',
        gradient: ['rgba(239, 68, 68, 0.35)', 'rgba(239, 68, 68, 0)'],
        extract: d => d.heat_index, decimals: 1 },
    pressure: { label: 'Pressure', unit: 'hPa', color: '#a855f7',
        gradient: ['rgba(168, 85, 247, 0.35)', 'rgba(168, 85, 247, 0)'],
        extract: d => d.pressure, decimals: 1 },
    battery: { label: 'Battery', unit: 'V', color: '#10b981',
        gradient: ['rgba(16, 185, 129, 0.35)', 'rgba(16, 185, 129, 0)'],
        extract: d => d.battery_mv != null ? d.battery_mv / 1000 : null, decimals: 2 }
};

let activeMetric = 'temperature';
let trendChart = null;
let chartData = [];

// ============================================================
// INJECT STATIC ICONS
// ============================================================
function injectStaticIcons() {
    setHTML('iconTemperature', icon('temperature'));
    setHTML('iconHumidity',    icon('humidity'));
    setHTML('iconHeatIndex',   icon('heat_index'));
    setHTML('iconPressure',    icon('pressure'));

    setHTML('tabIconTemp',  icon('temperature', 14));
    setHTML('tabIconHum',   icon('humidity', 14));
    setHTML('tabIconHI',    icon('heat_index', 14));
    setHTML('tabIconPres',  icon('pressure', 14));
    setHTML('tabIconBatt',  icon('battery', 14));
}

// ============================================================
// CHART
// ============================================================
function initChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) {
        console.warn('[ORCHID] Missing chart canvas');
        return;
    }
    const ctx = canvas.getContext('2d');
    const cfg = METRIC_CONFIG[activeMetric];
    const gradient = ctx.createLinearGradient(0, 0, 0, 340);
    gradient.addColorStop(0, cfg.gradient[0]);
    gradient.addColorStop(1, cfg.gradient[1]);

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: cfg.label,
                data: [],
                borderColor: cfg.color,
                backgroundColor: gradient,
                borderWidth: 2.5,
                fill: true,
                tension: 0.35,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: cfg.color,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(10, 14, 26, 0.95)',
                    borderColor: '#232b45',
                    borderWidth: 1,
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    padding: 12,
                    cornerRadius: 10,
                    titleFont: { family: 'Inter', size: 12, weight: '600' },
                    bodyFont: { family: 'Inter', size: 12 },
                    callbacks: {
                        label: function(context) {
                            const cfg = METRIC_CONFIG[activeMetric];
                            const val = context.parsed.y;
                            return `${cfg.label}: ${val.toFixed(cfg.decimals)} ${cfg.unit}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(148, 163, 184, 0.06)', drawBorder: false },
                    ticks: { color: '#64748b', font: { family: 'Inter', size: 10 },
                             maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }
                },
                y: {
                    grid: { color: 'rgba(148, 163, 184, 0.06)', drawBorder: false },
                    ticks: {
                        color: '#64748b',
                        font: { family: 'Inter', size: 10 },
                        callback: function(value) {
                            const cfg = METRIC_CONFIG[activeMetric];
                            return `${value}${cfg.unit ? ' ' + cfg.unit : ''}`;
                        }
                    }
                }
            }
        }
    });
}

function updateChart() {
    if (!trendChart) return;
    const cfg = METRIC_CONFIG[activeMetric];
    const ctx = trendChart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 340);
    gradient.addColorStop(0, cfg.gradient[0]);
    gradient.addColorStop(1, cfg.gradient[1]);

    const labels = chartData.map(d =>
        new Date(d.created_at).toLocaleString('en-PH', {
            timeZone: 'Asia/Manila',
            hour: '2-digit', minute: '2-digit', hour12: false
        })
    );
    const values = chartData.map(d => {
        const v = cfg.extract(d);
        return (v === null || v === undefined) ? null : parseFloat(v);
    });

    trendChart.data.labels = labels;
    trendChart.data.datasets[0].label = cfg.label;
    trendChart.data.datasets[0].data = values;
    trendChart.data.datasets[0].borderColor = cfg.color;
    trendChart.data.datasets[0].backgroundColor = gradient;
    trendChart.update('none');

    updateChartStats(values, cfg);
}

function updateChartStats(values, cfg) {
    const valid = values.filter(v => v !== null && !isNaN(v));
    const stats = document.getElementById('chartStats');
    if (!stats) return;
    if (valid.length === 0) { stats.innerHTML = ''; return; }

    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
    const latest = valid[valid.length - 1];
    const unit = cfg.unit ? ' ' + cfg.unit : '';

    stats.innerHTML = `
        <div class="chart-stat"><div class="stat-label">Min</div>
            <div class="stat-value">${min.toFixed(cfg.decimals)}${unit}</div></div>
        <div class="chart-stat"><div class="stat-label">Max</div>
            <div class="stat-value">${max.toFixed(cfg.decimals)}${unit}</div></div>
        <div class="chart-stat"><div class="stat-label">Average</div>
            <div class="stat-value">${avg.toFixed(cfg.decimals)}${unit}</div></div>
        <div class="chart-stat"><div class="stat-label">Latest</div>
            <div class="stat-value" style="color: ${cfg.color}">${latest.toFixed(cfg.decimals)}${unit}</div></div>
    `;
}

function setupChartTabs() {
    document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeMetric = tab.dataset.metric;
            updateChart();
        });
    });
}

// ============================================================
// FETCH LATEST
// ============================================================
async function fetchLatest() {
    const { data, error } = await db
        .from('sensor_readings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) {
        setStatus(false);
        showError('Could not load data: ' + (error?.message || 'No readings found'));
        return null;
    }

    hideError();

    const ageSeconds = Math.floor((Date.now() - new Date(data.created_at).getTime()) / 1000);
    const stale = ageSeconds > 20 * 60;
    setStatus(!stale, timeAgo(data.created_at));

    // Hero
    const weatherName = data.current_weather || '—';
    const weatherColor = getWeatherColor(weatherName);

    const heroCard = document.getElementById('currentWeatherCard');
    if (heroCard) heroCard.style.color = weatherColor;

    setHTML('weatherIcon', getWeatherIcon(weatherName));
    setText('weatherName', weatherName);
    setStyle('weatherName', 'color', weatherColor);
    setText('weatherDesc',
        `Node ${data.node_id} • ${data.temperature?.toFixed(1)}°C • ${data.humidity?.toFixed(1)}% RH`);
    setText('weatherTime',
        `Updated ${formatTimeOnlyPH(data.created_at)} (${timeAgo(data.created_at)})`);

    // Forecast
    setText('forecastText', data.forecast || '—');
    setStyle('forecastText', 'color', getForecastColor(data.forecast));

    // Trend
    const trendMap = {
        '-2': { text: 'Falling Fast', cls: 'falling', arrow: 'falling' },
        '-1': { text: 'Falling',      cls: 'falling', arrow: 'falling' },
        '0':  { text: 'Steady',       cls: 'steady',  arrow: 'steady'  },
        '1':  { text: 'Rising',       cls: 'rising',  arrow: 'rising'  },
        '2':  { text: 'Rising Fast',  cls: 'rising',  arrow: 'rising'  }
    };
    const trend = trendMap[String(data.pressure_trend)] || { text: '— Trend —', cls: 'steady', arrow: 'steady' };
    setHTML('trendPill', `${icon(trend.arrow, 14)} ${trend.text}`);
    setClass('trendPill', `trend-pill ${trend.cls}`);

    // Metrics
    setText('temperature', data.temperature?.toFixed(1) ?? '—');
    setText('humidity',    data.humidity?.toFixed(1) ?? '—');
    setText('heatIndex',   data.heat_index?.toFixed(1) ?? '—');
    setText('pressure',    data.pressure?.toFixed(1) ?? '—');

    // Badges
    let badgesHtml = renderFlagBadges(data.status_flags);
    if (stale) badgesHtml += `<span class="flag-badge warning">${icon('stale', 12)} Stale Data</span>`;
    setHTML('liveStatusBadges', badgesHtml);

    setText('lastUpdate', timeAgo(data.created_at));
    return data;
}

// ============================================================
// FETCH CHART DATA
// ============================================================
async function fetchChartData() {
    const { data, error } = await db
        .from('sensor_readings')
        .select('created_at, temperature, humidity, heat_index, pressure, battery_mv')
        .order('created_at', { ascending: false })
        .limit(CHART_HISTORY_LIMIT);

    if (error || !data) return;
    chartData = data.reverse();
    updateChart();
}

// ============================================================
// FETCH HISTORY TABLE (paginated)
// ============================================================
async function fetchHistory() {
    const from = readingsOffset;
    const to   = readingsOffset + READINGS_PAGE_SIZE - 1;

    const { data, error, count } = await db
        .from('sensor_readings')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    const tbody = document.getElementById('historyBody');
    if (!tbody) return;

    if (error || !data) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-text">Could not load readings</td></tr>';
        updatePaginationControls(0);
        return;
    }

    readingsTotalCount = count || 0;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-text">No readings on this page</td></tr>';
        updatePaginationControls(0);
        return;
    }

    tbody.innerHTML = data.map(row => {
        const weatherColor = getWeatherColor(row.current_weather);
        const forecastColor = getForecastColor(row.forecast);
        const batteryV = row.battery_mv != null ? (row.battery_mv / 1000).toFixed(2) + ' V' : '—';
        return `
            <tr>
                <td>${formatShortTimePH(row.created_at)}</td>
                <td>${row.temperature?.toFixed(1) ?? '—'} °C</td>
                <td>${row.humidity?.toFixed(1) ?? '—'} %</td>
                <td style="color:#f87171; font-weight:600;">${row.heat_index?.toFixed(1) ?? '—'} °C</td>
                <td>${row.pressure?.toFixed(1) ?? '—'} hPa</td>
                <td style="color:#34d399; font-weight:600;">${batteryV}</td>
                <td style="color:${weatherColor}; font-weight:600;">${row.current_weather ?? '—'}</td>
                <td style="color:${forecastColor}; font-weight:500;">${row.forecast ?? '—'}</td>
                <td>${renderFlagBadges(row.status_flags)}</td>
            </tr>
        `;
    }).join('');

    updatePaginationControls(data.length);
}

// ============================================================
// PAGINATION
// ============================================================
function updatePaginationControls(rowsOnPage) {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const infoEl  = document.getElementById('pageInfo');

    const totalPages = Math.max(1, Math.ceil(readingsTotalCount / READINGS_PAGE_SIZE));
    const currentPage = Math.floor(readingsOffset / READINGS_PAGE_SIZE) + 1;

    if (prevBtn) prevBtn.disabled = readingsOffset === 0;

    const hasMore = (readingsOffset + rowsOnPage) < readingsTotalCount;
    if (nextBtn) nextBtn.disabled = !hasMore;

    if (infoEl) {
        if (readingsTotalCount === 0) {
            infoEl.textContent = 'No readings';
        } else {
            const start = readingsOffset + 1;
            const end = Math.min(readingsOffset + rowsOnPage, readingsTotalCount);
            infoEl.innerHTML =
                `Showing <strong>${start}–${end}</strong> of <strong>${readingsTotalCount}</strong>` +
                ` &nbsp;·&nbsp; Page <strong>${currentPage}</strong> of <strong>${totalPages}</strong>`;
        }
    }
}

function setupPagination() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (readingsOffset >= READINGS_PAGE_SIZE) {
                readingsOffset -= READINGS_PAGE_SIZE;
                fetchHistory();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            readingsOffset += READINGS_PAGE_SIZE;
            fetchHistory();
        });
    }
}

// ============================================================
// FETCH NODE STATUS
// ============================================================
async function fetchNodeStatus() {
    const { data, error } = await db
        .from('node_status')
        .select('*')
        .order('node_id', { ascending: true });

    const container = document.getElementById('nodeStatusList');
    if (!container) return;

    if (error || !data || data.length === 0) {
        container.innerHTML = '<p class="empty-text">No nodes reporting yet.</p>';
        return;
    }

    const ONLINE_THRESHOLD_SEC = 3 * 60;

    container.innerHTML = data.map(node => {
        const ageSeconds = node.last_seen
            ? Math.floor((Date.now() - new Date(node.last_seen).getTime()) / 1000)
            : Infinity;
        const online = ageSeconds < ONLINE_THRESHOLD_SEC;
        const battery = node.last_battery_mv
            ? (node.last_battery_mv / 1000).toFixed(2) + ' V' : '—';
        const uptime = formatUptime(node.uptime_counter);
        const lastSeen = formatShortTimePH(node.last_seen);
        const ago = timeAgo(node.last_seen);

        return `
            <div class="node-card">
                <div class="node-header">
                    <span class="node-dot ${online ? '' : 'offline'}"></span>
                    <strong>Node ${node.node_id}</strong>
                    <span class="node-badge ${online ? 'online' : 'offline'}">
                        ${online ? 'ONLINE' : 'OFFLINE'}
                    </span>
                </div>
                <div class="node-details">
                    <div><span class="detail-label">Battery</span><span class="detail-value">${battery}</span></div>
                    <div><span class="detail-label">Uptime</span><span class="detail-value">${uptime}</span></div>
                    <div><span class="detail-label">Last Seen</span><span class="detail-value">${lastSeen} (${ago})</span></div>
                </div>
                <div>${renderFlagBadges(node.status_flags)}</div>
            </div>
        `;
    }).join('');
}

// ============================================================
// MAIN REFRESH
// ============================================================
async function refresh() {
    await Promise.all([
        fetchLatest(),
        fetchChartData(),
        fetchNodeStatus()
    ]);

    // Only auto-refresh the readings table on page 1
    if (readingsOffset === 0) {
        await fetchHistory();
    }
}

// ============================================================
// START
// ============================================================
injectStaticIcons();
initChart();
setupChartTabs();
setupPagination();
refresh();
setInterval(refresh, REFRESH_INTERVAL_MS);