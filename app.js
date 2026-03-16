/* ========================================
   MoneyManager - Application Logic
   ======================================== */

'use strict';

// ----------------------------------------
// Constants & Config
// ----------------------------------------
const STORAGE_KEY = 'moneymanager_transactions_v2';

const CATEGORY_COLORS = {
  '食費':     '#F59E0B',
  '交通費':   '#3B82F6',
  '娯楽':     '#8B5CF6',
  '光熱費':   '#EF4444',
  '住居費':   '#06B6D4',
  '医療費':   '#10B981',
  '衣服費':   '#EC4899',
  '通信費':   '#6366F1',
  'その他':   '#94A3B8',
  '給与':     '#10B981',
  '副収入':   '#059669',
  'ボーナス': '#34D399',
  'その他収入': '#6EE7B7',
};

const CATEGORY_ICONS = {
  '食費': '🍽️',
  '交通費': '🚃',
  '娯楽': '🎮',
  '光熱費': '💡',
  '住居費': '🏠',
  '医療費': '🏥',
  '衣服費': '👕',
  '通信費': '📱',
  'その他': '📦',
  '給与': '💼',
  '副収入': '💰',
  'ボーナス': '🎁',
  'その他収入': '💵',
};

// ----------------------------------------
// State
// ----------------------------------------
let transactions = loadTransactions();
let monthlyChart = null;

// ----------------------------------------
// Storage
// ----------------------------------------
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getSampleData();
  } catch (e) {
    console.error('Failed to load transactions:', e);
    return [];
  }
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save transactions:', e);
    showToast('データの保存に失敗しました', 'error');
  }
}

function getSampleData() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  return [
    { id: genId(), type: 'income',  date: `${y}-${m}-01`, category: '給与',   amount: 280000, memo: '月給' },
    { id: genId(), type: 'expense', date: `${y}-${m}-03`, category: '食費',   amount: 4200,  memo: 'スーパー' },
    { id: genId(), type: 'expense', date: `${y}-${m}-05`, category: '交通費', amount: 1540,  memo: '定期代' },
    { id: genId(), type: 'expense', date: `${y}-${m}-08`, category: '娯楽',   amount: 3000,  memo: '映画' },
    { id: genId(), type: 'expense', date: `${y}-${m}-10`, category: '光熱費', amount: 8500,  memo: '電気代' },
    { id: genId(), type: 'expense', date: `${y}-${m}-12`, category: '食費',   amount: 5800,  memo: '外食' },
    { id: genId(), type: 'expense', date: `${y}-${m}-15`, category: '通信費', amount: 3980,  memo: '携帯代' },
    { id: genId(), type: 'expense', date: `${y}-${m}-18`, category: '住居費', amount: 75000, memo: '家賃' },
  ];
}

// ----------------------------------------
// Utilities
// ----------------------------------------
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatCurrency(amount) {
  return '¥' + Number(amount).toLocaleString('ja-JP');
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getYearMonth(dateStr) {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function labelYearMonth(ym) {
  const [y, m] = ym.split('-');
  return `${y}年${parseInt(m)}月`;
}

function getCurrentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ----------------------------------------
// Filtering & Sorting
// ----------------------------------------
function getFilteredTransactions() {
  const monthFilter = document.getElementById('month-filter').value;
  const sortOrder  = document.getElementById('sort-order').value;

  let list = [...transactions];

  if (monthFilter) {
    list = list.filter(t => getYearMonth(t.date) === monthFilter);
  }

  switch (sortOrder) {
    case 'date-desc':   list.sort((a, b) => b.date.localeCompare(a.date)); break;
    case 'date-asc':    list.sort((a, b) => a.date.localeCompare(b.date)); break;
    case 'amount-desc': list.sort((a, b) => b.amount - a.amount); break;
    case 'amount-asc':  list.sort((a, b) => a.amount - b.amount); break;
  }

  return list;
}

// ----------------------------------------
// Render: Month Filter Options
// ----------------------------------------
function renderMonthOptions() {
  const select = document.getElementById('month-filter');
  const current = select.value;
  const months = [...new Set(transactions.map(t => getYearMonth(t.date)))].sort().reverse();
  const options = ['<option value="">すべて表示</option>'];
  months.forEach(ym => {
    options.push(`<option value="${ym}" ${ym === current ? 'selected' : ''}>${labelYearMonth(ym)}</option>`);
  });
  select.innerHTML = options.join('');
}

// ----------------------------------------
// Render: Summary Cards
// ----------------------------------------
function renderSummary() {
  const monthFilter = document.getElementById('month-filter').value;
  const scope = monthFilter
    ? transactions.filter(t => getYearMonth(t.date) === monthFilter)
    : transactions.filter(t => getYearMonth(t.date) === getCurrentYearMonth());

  const income  = scope.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = scope.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  document.getElementById('total-income').textContent  = formatCurrency(income);
  document.getElementById('total-expense').textContent = formatCurrency(expense);

  const balanceEl = document.getElementById('balance');
  balanceEl.textContent = formatCurrency(balance);
  balanceEl.classList.toggle('negative', balance < 0);

  // Header label
  const label = monthFilter ? labelYearMonth(monthFilter) : labelYearMonth(getCurrentYearMonth());
  document.getElementById('current-month-label').textContent = label;
}

// ----------------------------------------
// Render: Category Breakdown
// ----------------------------------------
function renderCategoryBreakdown() {
  const monthFilter = document.getElementById('month-filter').value;
  const scope = monthFilter
    ? transactions.filter(t => getYearMonth(t.date) === monthFilter && t.type === 'expense')
    : transactions.filter(t => getYearMonth(t.date) === getCurrentYearMonth() && t.type === 'expense');

  const totals = {};
  scope.forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const maxAmount = Math.max(...Object.values(totals), 1);
  const container = document.getElementById('category-breakdown');

  if (Object.keys(totals).length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;grid-column:1/-1">支出データがありません</p>';
    return;
  }

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  container.innerHTML = sorted.map(([cat, amount]) => {
    const color = CATEGORY_COLORS[cat] || '#94A3B8';
    const pct = Math.round((amount / maxAmount) * 100);
    const icon = CATEGORY_ICONS[cat] || '📦';
    return `
      <div class="category-card">
        <div class="category-card-name">
          <span class="category-dot" style="background:${color}"></span>
          ${icon} ${cat}
        </div>
        <div class="category-card-amount">${formatCurrency(amount)}</div>
        <div class="category-bar-wrap">
          <div class="category-bar" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------
// Render: Monthly Chart
// ----------------------------------------
function renderChart() {
  const monthSet = [...new Set(transactions.map(t => getYearMonth(t.date)))].sort();
  const last6 = monthSet.slice(-6);

  const incomeData  = last6.map(ym => transactions.filter(t => t.type === 'income'  && getYearMonth(t.date) === ym).reduce((s, t) => s + t.amount, 0));
  const expenseData = last6.map(ym => transactions.filter(t => t.type === 'expense' && getYearMonth(t.date) === ym).reduce((s, t) => s + t.amount, 0));
  const labels = last6.map(ym => { const [,m] = ym.split('-'); return `${parseInt(m)}月`; });

  const ctx = document.getElementById('monthly-chart').getContext('2d');

  if (monthlyChart) {
    monthlyChart.destroy();
  }

  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '収入',
          data: incomeData,
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1.5,
          borderRadius: 4,
          borderSkipped: false,
        },
        {
          label: '支出',
          data: expenseData,
          backgroundColor: 'rgba(239, 68, 68, 0.75)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1.5,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { font: { size: 11, family: "'Inter', sans-serif" }, color: '#94A3B8' }
        },
        y: {
          grid: { color: '#F1F5F9' },
          border: { display: false, dash: [4, 4] },
          ticks: {
            font: { size: 10, family: "'Inter', sans-serif" },
            color: '#94A3B8',
            callback: v => v >= 10000 ? `${v/10000}万` : `${v/1000}k`
          }
        }
      }
    }
  });

  // Custom legend
  const legend = document.getElementById('chart-legend');
  legend.innerHTML = `
    <div class="legend-item"><span class="legend-dot" style="background:#10B981"></span>収入</div>
    <div class="legend-item"><span class="legend-dot" style="background:#EF4444"></span>支出</div>
  `;
}

// ----------------------------------------
// Render: Transaction List
// ----------------------------------------
function renderTransactionList() {
  const list = getFilteredTransactions();
  const container = document.getElementById('transaction-list');

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="#CBD5E1" stroke-width="2"/>
          <path d="M24 16v8M24 28v4" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
        <p>取引がありません</p>
        <span>フィルターを変更するか、新しい取引を追加してください</span>
      </div>`;
    return;
  }

  container.innerHTML = list.map(t => {
    const icon = CATEGORY_ICONS[t.category] || '📦';
    const amountLabel = (t.type === 'expense' ? '-' : '+') + formatCurrency(t.amount);
    return `
      <div class="transaction-item" data-id="${t.id}">
        <div class="transaction-icon ${t.type}">${icon}</div>
        <div class="transaction-details">
          <div class="transaction-category">${t.category}</div>
          ${t.memo ? `<div class="transaction-memo">${escapeHtml(t.memo)}</div>` : ''}
        </div>
        <div class="transaction-date">${formatDate(t.date)}</div>
        <div class="transaction-amount ${t.type}">${amountLabel}</div>
        <button class="delete-btn" data-id="${t.id}" title="削除" aria-label="${t.category}を削除">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3.5h10M5.5 3.5V2.5h3v1M4 3.5l.5 8h5l.5-8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ----------------------------------------
// Full Re-render
// ----------------------------------------
function renderAll() {
  renderMonthOptions();
  renderSummary();
  renderCategoryBreakdown();
  renderTransactionList();
  renderChart();
}

// ----------------------------------------
// Event: Form Submit
// ----------------------------------------
document.getElementById('transaction-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const type     = document.getElementById('transaction-type').value;
  const date     = document.getElementById('transaction-date').value;
  const category = document.getElementById('transaction-category').value;
  const amount   = parseInt(document.getElementById('transaction-amount').value, 10);
  const memo     = document.getElementById('transaction-memo').value.trim();

  if (!date || !category || !amount || amount < 1) {
    showToast('日付・カテゴリ・金額を正しく入力してください', 'error');
    return;
  }

  const newTransaction = { id: genId(), type, date, category, amount, memo };
  transactions.unshift(newTransaction);
  saveTransactions();
  renderAll();

  // Reset form (keep date & type)
  document.getElementById('transaction-category').value = '';
  document.getElementById('transaction-amount').value   = '';
  document.getElementById('transaction-memo').value     = '';

  showToast(`${category} ${formatCurrency(amount)} を追加しました`, 'success');

  // Scroll to list on mobile
  if (window.innerWidth < 768) {
    document.querySelector('.list-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// ----------------------------------------
// Event: Type Toggle
// ----------------------------------------
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('transaction-type').value = this.dataset.type;
  });
});

// ----------------------------------------
// Event: Delete (event delegation)
// ----------------------------------------
document.getElementById('transaction-list').addEventListener('click', function(e) {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;

  const id = btn.dataset.id;
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;

  const confirmed = window.confirm(
    `「${tx.category}」${formatCurrency(tx.amount)} を削除しますか？\nこの操作は元に戻せません。`
  );

  if (confirmed) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    renderAll();
    showToast('取引を削除しました', 'info');
  }
});

// ----------------------------------------
// Event: Filter / Sort change
// ----------------------------------------
document.getElementById('month-filter').addEventListener('change', () => {
  renderSummary();
  renderCategoryBreakdown();
  renderTransactionList();
});

document.getElementById('sort-order').addEventListener('change', () => {
  renderTransactionList();
});

// ----------------------------------------
// Init: Set today's date
// ----------------------------------------
(function initDate() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  document.getElementById('transaction-date').value = `${y}-${m}-${d}`;
})();

// ----------------------------------------
// Init: Render all
// ----------------------------------------
renderAll();
