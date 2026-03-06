// ─── localStorage ───
function loadReports() {
  try {
    const stored = localStorage.getItem('reports');
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveReports() {
  localStorage.setItem('reports', JSON.stringify(reports));
}

// ─── 상태 변수 ───
let reports = loadReports();
let currentFilter = 'all';
let currentPage = 1;
let currentSort = 'newest';
const PAGE_SIZE = 5;

// ─── 필터 버튼 ───
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentFilter = button.dataset.status;
    currentPage = 1;
    renderReports();
  });
});

// ─── 정렬 드롭박스 ───
const sortSelect = document.getElementById('sortSelect');
if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    currentPage = 1;
    renderReports();
  });
}

// ─── 유틸 함수 ───
function statusText(status) {
  switch (status) {
    case 'pending':    return '신고 접수';
    case 'processing': return '처리 중';
    case 'done':       return '처리 완료';
    default: return '';
  }
}

function emptyMessage(status) {
  switch (status) {
    case 'pending':    return '신고 접수된 내역이 없습니다.';
    case 'processing': return '처리 중인 신고가 없습니다.';
    case 'done':       return '처리 완료된 신고가 없습니다.';
    default:           return '신고 내역이 없습니다.';
  }
}

// ─── 신고 취소 ───
function cancelReport(id) {
  const confirmed = confirm('신고를 취소하시겠습니까?');
  if (!confirmed) return;
  reports = reports.filter(report => report.id !== id);
  saveReports();
  renderReports();
}

// ─── 뱃지 ───
function updateBadges() {
  reports = loadReports();
  filterButtons.forEach(btn => {
    const status = btn.dataset.status;
    const count = status === 'all'
      ? reports.length
      : reports.filter(r => r.status === status).length;

    const existing = btn.querySelector('.count-badge');
    if (existing) existing.remove();

    const badge = document.createElement('span');
    badge.className = 'count-badge';
    badge.textContent = count;
    btn.appendChild(badge);
  });
}

// ─── 렌더링 ───
const container = document.querySelector('.my-reports-container');

const renderReports = () => {
  reports = loadReports();

  const base = currentFilter === 'all'
    ? reports
    : reports.filter(r => r.status === currentFilter);

  const sorted = base.slice().sort((a, b) => {
    return currentSort === 'newest' ? b.id - a.id : a.id - b.id;
  });

  container.innerHTML = '';

  if (sorted.length === 0) {
    container.innerHTML = `<p class="text-muted empty-message">${emptyMessage(currentFilter)}</p>`;
    updateBadges();
    return;
  }

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginated = sorted.slice(start, start + PAGE_SIZE);

  paginated.forEach(report => {
    const card = document.createElement('div');
    card.className = `card status-${report.status}`;

    const cancelBtn = report.status === 'pending'
      ? `<button class="cancel-btn" onclick="cancelReport(${report.id})">신고 취소</button>`
      : '';

    const imgSrc = report.image || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqEWgS0uxxEYJ0PsOb2OgwyWvC0Gjp8NUdPw&usqp=CAU";

    card.innerHTML = `
      <div class="row g-0">
        <div class="col-12 col-md-4">
          <img src="${imgSrc}" class="img-fluid w-100 report-img" alt="">
        </div>
        <div class="col-12 col-md-8">
          <div class="card-body">
            <div class="status-cancel-row">
              <div class="report-status">${statusText(report.status)}</div>
              ${cancelBtn}
            </div>
            <div class="fw-semibold report-title">${report.title || '제목 없음'}</div>
            <div class="report-bottom">${report.address || '주소 없음'}</div>
            <div class="report-bottom">${report.date || ''}</div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  if (totalPages > 1) {
    const pagination = document.createElement('div');
    pagination.className = 'reports-pagination';

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = `reports-page-btn ${i === currentPage ? 'active' : ''}`;
      btn.textContent = i;
      btn.addEventListener('click', () => {
        currentPage = i;
        renderReports();
        const panel = document.querySelector('.side-panel');
        if (panel) panel.scrollTo({ top: 0, behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      pagination.appendChild(btn);
    }

    container.appendChild(pagination);
  }

  updateBadges();
};

renderReports();