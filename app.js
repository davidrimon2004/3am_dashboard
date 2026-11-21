// --- Tailwind Palette Extender ---
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['IBM Plex Sans Arabic', 'sans-serif'],
            },
            colors: {
                parchment: {
                    50: '#FDFBF7',
                    100: '#F7F4EB',
                    200: '#EAE5D9',
                    300: '#D6CDB5',
                    800: '#3D3728',
                },
                tabernacle: {
                    royal: '#1E3A8A',
                    purple: '#5B21B6',
                    crimson: '#991B1B',
                    gold: '#B45309',
                    sage: '#2F593E',
                    softSage: '#EBF5F0'
                }
            }
        }
    }
};

// --- 1. STATE ---
let readings = [];
let userProgress = {};
let currentFilter = 'all';

// --- 2. LOCAL STORAGE ---
const STORAGE_KEY = 'church_reading_tracker_v2_tabernacle';

function loadProgress() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            userProgress = JSON.parse(saved);
        } catch (e) {
            userProgress = {};
        }
    } else {
        userProgress = {};
    }
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
    updateDashboard();
}

function toggleChapter(dayNum, chapIndex) {
    const key = `day_${dayNum}_chap_${chapIndex}`;
    userProgress[key] = !userProgress[key];
    saveProgress();
}

// --- 3. LOAD READINGS FROM JSON ---
async function initApp() {
    loadProgress();
    try {
        const response = await fetch('readings.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        readings = await response.json();
        updateDashboard();
    } catch (error) {
        console.error('Failed to load readings.json:', error);
        document.getElementById('up-next-day').innerText = 'بانتظار ملف القراءات';
        document.getElementById('up-next-date').innerText = '';
        document.getElementById('up-next-chapters').innerHTML = `
            <div class="col-span-full p-4 rounded-xl bg-amber-50 dark:bg-stone-800 border border-tabernacle-gold/30 text-sm text-stone-600 dark:text-stone-300">
                تأكد من إضافة ملف <code class="font-mono font-bold">readings.json</code> في نفس المجلد وتشغيل الموقع عبر خادم محلي (مثل Live Server أو GitHub Pages).
            </div>
        `;
    }
}

// --- 4. RENDER ENGINE ---
function updateDashboard() {
    if (!readings.length) return;

    let totalChapters = readings.reduce((acc, curr) => acc + curr.chapters.length, 0);
    let checkedChapters = 0;

    readings.forEach(day => {
        day.chapters.forEach((_, idx) => {
            if (userProgress[`day_${day.day}_chap_${idx}`]) {
                checkedChapters++;
            }
        });
    });

    const percent = totalChapters > 0 ? Math.round((checkedChapters / totalChapters) * 100) : 0;
    document.getElementById('progress-percent').innerText = `${percent}%`;
    document.getElementById('progress-text').innerText = `${checkedChapters} / ${totalChapters} إصحاح مكتمل`;
    document.getElementById('progress-bar').style.width = `${percent}%`;

    const nextDay = readings.find(day => {
        return day.chapters.some((_, idx) => !userProgress[`day_${day.day}_chap_${idx}`]);
    }) || readings[readings.length - 1];

    renderUpNextCard(nextDay);
    renderGrid(nextDay);
}

function renderUpNextCard(day) {
    if (!day) return;
    document.getElementById('up-next-day').innerText = `اليوم ${day.day}`;
    document.getElementById('up-next-date').innerText = day.date;

    const chaptersContainer = document.getElementById('up-next-chapters');
    chaptersContainer.innerHTML = '';

    day.chapters.forEach((chap, idx) => {
        const isChecked = !!userProgress[`day_${day.day}_chap_${idx}`];
        const btn = document.createElement('button');
        btn.className = `w-full p-4 rounded-xl border-2 text-right transition-all flex items-center justify-between shadow-sm relative overflow-hidden ${
            isChecked
                ? 'bg-tabernacle-softSage border-tabernacle-sage text-tabernacle-sage font-medium dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-700'
                : 'bg-white dark:bg-stone-900 border-parchment-200 dark:border-stone-800 hover:border-tabernacle-gold dark:hover:border-amber-500'
        }`;
        btn.onclick = () => toggleChapter(day.day, idx);
        btn.innerHTML = `
            <span class="flex items-center gap-3 relative z-10">
                <span class="w-6 h-6 rounded-md flex items-center justify-center border-2 ${isChecked ? 'bg-tabernacle-sage border-transparent text-white' : 'border-stone-300 dark:border-stone-700'}">
                    ${isChecked ? '✓' : ''}
                </span>
                <span class="text-base font-medium">${chap}</span>
            </span>
            <span class="text-xs relative z-10 ${isChecked ? 'text-tabernacle-sage opacity-85 dark:text-emerald-400 font-bold' : 'text-stone-400'}">
                ${isChecked ? 'تمت القراءة' : 'اضغط لإنجاز القراءة'}
            </span>
        `;
        chaptersContainer.appendChild(btn);
    });
}

function renderGrid(activeDay) {
    const grid = document.getElementById('days-grid');
    grid.innerHTML = '';

    let remainingCount = 0;

    readings.forEach(day => {
        const checkedStates = day.chapters.map((_, idx) => !!userProgress[`day_${day.day}_chap_${idx}`]);
        const isCompleted = checkedStates.every(v => v);
        const isPartial = checkedStates.some(v => v) && !isCompleted;

        if (!isCompleted) remainingCount++;
        if (currentFilter === 'remaining' && isCompleted) return;

        const dayCard = document.createElement('div');
        const isActive = activeDay && activeDay.day === day.day;

        dayCard.className = `tabernacle-card flex flex-col p-5 rounded-2xl border transition-all ${
            isActive
                ? 'border-2 border-tabernacle-gold bg-parchment-50 dark:bg-stone-900/90 shadow-lg ring-2 ring-tabernacle-gold/15'
                : isCompleted
                    ? 'bg-stone-100/50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-850 opacity-75 hover:opacity-100'
                    : 'bg-white dark:bg-stone-900 border border-parchment-200 dark:border-stone-800'
        }`;

        const decoCorners = isActive ? `
            <div class="deco-corner-top-right"></div>
            <div class="deco-corner-bottom-left"></div>
        ` : '';

        dayCard.innerHTML = `
            ${decoCorners}
            <div class="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <div class="flex items-center gap-1.5">
                        <span class="font-bold text-stone-900 dark:text-stone-50 ${isCompleted ? 'line-through text-stone-400 dark:text-stone-500' : ''}">اليوم ${day.day}</span>
                        ${isActive ? '<span class="px-2 py-0.5 bg-tabernacle-gold/10 text-tabernacle-gold dark:bg-amber-400/20 dark:text-amber-400 rounded-md text-[10px] font-bold border border-tabernacle-gold/20">التالي</span>' : ''}
                    </div>
                    <span class="text-xs text-stone-700 dark:text-stone-300 font-bold">${day.date}</span>
                </div>
                <div class="text-xs font-semibold">
                    ${isCompleted
                        ? '<span class="text-tabernacle-sage dark:text-emerald-400 flex items-center gap-1 font-bold"><span>✓</span> مكتمل</span>'
                        : isPartial
                            ? '<span class="text-tabernacle-crimson dark:text-red-400 bg-tabernacle-crimson/5 px-2 py-0.5 rounded border border-tabernacle-crimson/10 font-bold text-[11px]">١ / ٢ منجز</span>'
                            : '<span class="text-stone-400 dark:text-stone-500">غير منجز</span>'
                    }
                </div>
            </div>
            
            <div class="flex flex-col gap-2 mt-auto relative z-10">
                ${day.chapters.map((chap, idx) => {
                    const isChecked = checkedStates[idx];
                    return `
                        <button onclick="toggleChapter(${day.day}, ${idx})" class="w-full text-right py-2 px-3 rounded-xl text-sm border flex items-center justify-between transition-all ${
                            isChecked
                                ? 'bg-tabernacle-softSage/60 dark:bg-emerald-950/20 border-tabernacle-sage/20 text-tabernacle-sage dark:text-emerald-400'
                                : 'bg-stone-50 dark:bg-stone-950 border-stone-150 dark:border-stone-850 hover:border-tabernacle-gold/30 dark:hover:border-stone-800'
                        }">
                            <span class="flex items-center gap-2">
                                <span class="w-4.5 h-4.5 rounded-md flex items-center justify-center text-[9px] border-2 ${isChecked ? 'bg-tabernacle-sage border-transparent text-white' : 'border-stone-300 dark:border-stone-700'}">
                                    ${isChecked ? '✓' : ''}
                                </span>
                                <span class="${isChecked ? 'line-through text-stone-400 dark:text-stone-500 font-normal' : 'font-medium'}">${chap}</span>
                            </span>
                        </button>
                    `;
                }).join('')}
            </div>
        `;

        grid.appendChild(dayCard);
    });

    document.getElementById('count-all').innerText = readings.length;
    document.getElementById('count-remaining').innerText = remainingCount;
}

// --- 5. FILTER ---
function setFilter(filterType) {
    currentFilter = filterType;
    const btnAll = document.getElementById('filter-all');
    const btnRem = document.getElementById('filter-remaining');

    if (filterType === 'all') {
        btnAll.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm bg-white text-tabernacle-gold border border-tabernacle-gold/10 dark:bg-stone-800 dark:text-amber-200 dark:border-stone-700';
        btnRem.className = 'px-4 py-1.5 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 transition-all hover:text-stone-800 dark:hover:text-stone-200';
    } else {
        btnRem.className = 'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm bg-white text-tabernacle-gold border border-tabernacle-gold/10 dark:bg-stone-800 dark:text-amber-200 dark:border-stone-700';
        btnAll.className = 'px-4 py-1.5 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 transition-all hover:text-stone-800 dark:hover:text-stone-200';
    }

    updateDashboard();
}

// --- 6. DARK MODE ---
const darkModeBtn = document.getElementById('dark-mode-toggle');

if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

darkModeBtn.addEventListener('click', () => {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
});

// Initialize
initApp();