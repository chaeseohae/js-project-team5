const ADMIN_PAGE_SIZE = 5;
let adminCurrentSort = 'newest';
let adminCurrentFilter = 'all';
let adminCurrentPage = 1;

// ─── localStorage ───
function loadAdminReports() {
  try {
    const stored = localStorage.getItem('reports');
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveAdminReports(list) {
  localStorage.setItem('reports', JSON.stringify(list));
}

function adminStatusText(status) {
  switch (status) {
    case 'pending':    return '신고 접수';
    case 'processing': return '처리 중';
    case 'done':       return '처리 완료';
    default: return '';
  }
}

// ─── map.html에서만 동작 ───
if (document.getElementById('hiddenAdminBtn')) {
  document.getElementById('hiddenAdminBtn').addEventListener('click', () => {
    openSlide("../admin.html");
  });
}

// ─── 정렬 드롭박스 ───
function initAdminSort() {
  const sortSelect = document.getElementById('adminSortSelect');
  if (!sortSelect) return;
  sortSelect.addEventListener('change', () => {
    adminCurrentSort = sortSelect.value;
    adminCurrentPage = 1;
    renderAdminCards();
  });
}

// ─── 필터 탭 초기화 (한 번만 실행) ───
function initAdminFilter() {
  const filterArea = document.getElementById('adminFilter');
  if (!filterArea) return;

  const deleteDoneBtn = document.getElementById('deleteDoneBtn');
  const sortContainer = document.querySelector('.sort-container');

  // 초기 상태 적용
  if (deleteDoneBtn && sortContainer) {
    deleteDoneBtn.style.display = 'none';
    sortContainer.style.justifyContent = 'flex-end';
  }

  filterArea.querySelectorAll('.admin-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      adminCurrentFilter = btn.dataset.filter;
      adminCurrentPage = 1;
      renderAdminCards();
      updateAdminFilterUI();

      if (deleteDoneBtn) {
        const isDone = adminCurrentFilter === 'done';
        deleteDoneBtn.style.display = isDone ? 'block' : 'none';
        if (sortContainer) {
          sortContainer.style.justifyContent = isDone ? 'space-between' : 'flex-end';
        }
      }
    });
  });
}

// ─── 필터 버튼 active + 뱃지 업데이트 ───
function updateAdminFilterUI() {
  const allReports = loadAdminReports();
  const filterArea = document.getElementById('adminFilter');
  if (!filterArea) return;

  filterArea.querySelectorAll('.admin-filter-btn').forEach(btn => {
    const filter = btn.dataset.filter;

    btn.classList.toggle('active', filter === adminCurrentFilter);

    const existing = btn.querySelector('.count-badge');
    if (existing) existing.remove();

    const count = filter === 'all'
      ? allReports.length
      : allReports.filter(r => r.status === filter).length;

    const badge = document.createElement('span');
    badge.className = 'count-badge';
    badge.textContent = count;
    btn.appendChild(badge);
  });
}

// ─── 카드 렌더링 ───
function renderAdminCards() {
  const body = document.getElementById('adminBody');
  if (!body) return;
  body.innerHTML = '';

  const allReports = loadAdminReports();
  const base = adminCurrentFilter === 'all'
    ? allReports
    : allReports.filter(r => r.status === adminCurrentFilter);

  const filtered = base.slice().sort((a, b) =>
    adminCurrentSort === 'oldest' ? a.id - b.id : b.id - a.id
  );

  if (filtered.length === 0) {
    body.innerHTML = `<p class="admin-empty">신고 내역이 없습니다.</p>`;
    return;
  }

  const totalPages = Math.ceil(filtered.length / ADMIN_PAGE_SIZE);
  const start = (adminCurrentPage - 1) * ADMIN_PAGE_SIZE;
  const paginated = filtered.slice(start, start + ADMIN_PAGE_SIZE);

  paginated.forEach(report => {
    const imgSrc = report.image || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRqEWgS0uxxEYJ0PsOb2OgwyWvC0Gjp8NUdPw&usqp=CAU";
    const card = document.createElement('div');
    card.className = `admin-card status-${report.status}`;
    card.innerHTML = `
      <div class="admin-card-top">
        <div class="admin-card-img-wrap">
          <img src="${imgSrc}" class="admin-card-img" alt="">
        </div>
        <div class="admin-card-info">
          <div class="admin-report-status">${adminStatusText(report.status)}</div>
          <div class="admin-card-title">${report.title || '제목 없음'}</div>
          <div class="admin-card-desc">${report.description || ''}</div>
          <div class="admin-card-meta">${report.address || '주소 없음'} · ${report.date || ''}</div>
        </div>
      </div>
      <div class="admin-card-actions">
  <select class="status-select" id="admin-select-${report.id}">
    <option value="" disabled selected>처리상태를 선택하세요</option>
    <option value="processing">처리 중</option>
    <option value="done">처리 완료</option>
  </select>
  <button class="confirm-btn" onclick="updateAdminStatus(${report.id})">확인</button>
  ${report.status === 'done'
    ? `<button class="delete-btn" onclick="deleteAdminReport(${report.id})">삭제</button>`
    : ''
  }
</div>
    `;

    if (report.status !== 'done') {
      card.style.cursor = 'pointer';
      card.addEventListener('click', function(e) {
        if (e.target.classList.contains('confirm-btn') || e.target.classList.contains('status-select')) return;
        try {
          if (window.parent && window.parent !== window && typeof window.parent.moveToMarker === 'function') {
            window.parent.moveToMarker(report.lat, report.lng);
          }
        } catch(e) {}
      });
    }

    body.appendChild(card);
  });

  // 페이지네이션
  if (totalPages > 1) {
    const pagination = document.createElement('div');
    pagination.className = 'admin-pagination';

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = `admin-page-btn ${i === adminCurrentPage ? 'active' : ''}`;
      btn.textContent = i;
      btn.addEventListener('click', () => {
        adminCurrentPage = i;
        renderAdminCards();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      pagination.appendChild(btn);
    }

    body.appendChild(pagination);
  }
}

// ─── 상태 변경 ───
function updateAdminStatus(id) {
  const select = document.getElementById(`admin-select-${id}`);
  const newStatus = select.value;

  if (!newStatus) {
    alert('처리상태를 선택해주세요.');
    return;
  }

  const list = loadAdminReports();
  const report = list.find(r => r.id === id);

  if (report) {
    report.status = newStatus;

    saveAdminReports(list);

    renderAdminCards();
    updateAdminFilterUI();

    if (window.parent && window.parent !== window) {
      if (typeof window.parent.renderReports === 'function') {
        window.parent.renderReports();
      }
      if (typeof window.parent.moveToMarker === 'function' && report.lat && report.lng) {
        window.parent.moveToMarker(report.lat, report.lng);
      }
    }
  }
}

function deleteAdminReport(id) {
  const confirmed = confirm('신고를 삭제하시겠습니까?');
  if (!confirmed) return;
  const list = loadAdminReports().filter(r => r.id !== id);
  saveAdminReports(list);
  renderAdminCards();
  updateAdminFilterUI();
}

function deleteAllDone() {
  const confirmed = confirm('처리 완료된 신고를 모두 삭제하시겠습니까?');
  if (!confirmed) return;
  const list = loadAdminReports().filter(r => r.status !== 'done');
  saveAdminReports(list);
  renderAdminCards();
  updateAdminFilterUI();
}

// ─── 창 닫기 (데스크톱: 슬라이드 닫기, 모바일: 지도로 이동) ───
function handleCloseAdmin() {
  try {
    if (
      window.parent &&
      window.parent !== window &&
      typeof window.parent.closeSlide === 'function'
    ) {
      window.parent.closeSlide();
      return;
    }
  } catch (e) {
    // 무시
  }
  window.location.href = 'map/map.html';
}

// ─── 페이지 로드 시 ───
initAdminSort();
initAdminFilter();
updateAdminFilterUI();
renderAdminCards();

const adminCloseBtn = document.getElementById('btn-close-admin');
if (adminCloseBtn) {
  adminCloseBtn.addEventListener('click', handleCloseAdmin);
}