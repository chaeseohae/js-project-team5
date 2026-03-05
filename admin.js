// ─── 더미 데이터 (나중에 localStorage로 교체) ───
let adminReports = [
  { id: 1,  status: 'pending',    title: '점자블록 방해 주차', description: '점자블록 위에 공유 킥보드가 방치',    date: '2026.03.03', address: '서울시 마포구 홍익로', image: 'images/dont2.jpg' },
  { id: 2,  status: 'processing', title: '보행로 방해',        description: '보행로 중앙에 공유 킥보드 방치',      date: '2026.03.01', address: '서울시 서대문구',     image: 'images/dont3.jpg' },
  { id: 3,  status: 'completed',  title: '횡단보도 방해',      description: '횡단보도 앞 킥보드 방치',             date: '2026.02.28', address: '서울시 강남구',       image: 'images/dont1.jpg' },
  { id: 4,  status: 'pending',    title: '자전거 도로 방해',   description: '자전거 도로 위에 킥보드 방치',        date: '2026.02.27', address: '서울시 송파구',       image: 'images/dont2.jpg' },
  { id: 5,  status: 'processing', title: '소화전 앞 주차',     description: '소화전 앞에 킥보드 방치',             date: '2026.02.26', address: '서울시 용산구',       image: 'images/dont3.jpg' },
  { id: 6,  status: 'completed',  title: '버스정류장 방해',    description: '버스정류장 앞에 킥보드 방치',         date: '2026.02.25', address: '서울시 중구',         image: 'images/dont1.jpg' },
  { id: 7,  status: 'pending',    title: '지하철 입구 방해',   description: '지하철 입구 앞에 킥보드 방치',        date: '2026.02.24', address: '서울시 노원구',       image: 'images/dont2.jpg' },
  { id: 8,  status: 'processing', title: '경사로 방해',        description: '장애인 경사로 위에 킥보드 방치',      date: '2026.02.23', address: '서울시 은평구',       image: 'images/dont3.jpg' },
  { id: 9,  status: 'completed',  title: '주차금지 구역',      description: '주차금지 구역에 킥보드 방치',         date: '2026.02.22', address: '서울시 동작구',       image: 'images/dont1.jpg' },
  { id: 10, status: 'pending',    title: '어린이 보호구역',    description: '어린이 보호구역 내 킥보드 방치',      date: '2026.02.21', address: '서울시 성북구',       image: 'images/dont2.jpg' },
  { id: 11, status: 'processing', title: '도로변 불법주차',    description: '도로변에 킥보드 방치',                date: '2026.02.20', address: '서울시 광진구',       image: 'images/dont3.jpg' },
  { id: 12, status: 'completed',  title: '공원 내 방치',       description: '공원 내 통행로에 킥보드 방치',        date: '2026.02.19', address: '서울시 관악구',       image: 'images/dont1.jpg' },
];

const ADMIN_PAGE_SIZE = 10;
let adminCurrentFilter = 'all';
let adminCurrentPage = 1;

function adminStatusText(status) {
  switch (status) {
    case 'pending':    return '신고 접수';
    case 'processing': return '처리 중';
    case 'completed':  return '처리 완료';
    default: return '';
  }
}

// ─── map.html에서만 동작 (hiddenAdminBtn) ───
if (document.getElementById('hiddenAdminBtn')) {
  document.getElementById('hiddenAdminBtn').addEventListener('click', () => {
    openSlide("../admin.html");
  });
}

// ─── 필터링된 목록 반환 ───
function getFilteredReports() {
  return adminCurrentFilter === 'all'
    ? adminReports
    : adminReports.filter(r => r.status === adminCurrentFilter);
}

// ─── 렌더링 ───
function renderAdmin() {
  const body = document.getElementById('adminBody');
  if (!body) return;
  body.innerHTML = '';

  // 필터 탭
  const filterArea = document.createElement('div');
  filterArea.className = 'admin-filter';
  filterArea.innerHTML = `
    <button class="admin-filter-btn ${adminCurrentFilter === 'all'        ? 'active' : ''}" data-filter="all">전체</button>
    <button class="admin-filter-btn ${adminCurrentFilter === 'pending'    ? 'active' : ''}" data-filter="pending">신고 접수</button>
    <button class="admin-filter-btn ${adminCurrentFilter === 'processing' ? 'active' : ''}" data-filter="processing">처리 중</button>
    <button class="admin-filter-btn ${adminCurrentFilter === 'completed'  ? 'active' : ''}" data-filter="completed">처리 완료</button>
  `;
  body.appendChild(filterArea);

  filterArea.querySelectorAll('.admin-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      adminCurrentFilter = btn.dataset.filter;
      adminCurrentPage = 1;
      renderAdmin();
    });
  });

  const filtered = getFilteredReports();

  if (filtered.length === 0) {
    body.innerHTML += `<p class="admin-empty">신고 내역이 없습니다.</p>`;
    return;
  }

  // 페이지네이션 계산
  const totalPages = Math.ceil(filtered.length / ADMIN_PAGE_SIZE);
  const start = (adminCurrentPage - 1) * ADMIN_PAGE_SIZE;
  const paginated = filtered.slice(start, start + ADMIN_PAGE_SIZE);

  paginated.forEach(report => {
    const card = document.createElement('div');
    card.className = `admin-card status-${report.status}`;
    card.innerHTML = `
      <div class="admin-card-top">
        <div class="admin-card-img-wrap">
          <img src="${report.image}" class="admin-card-img" alt="">
        </div>
        <div class="admin-card-info">
          <div class="admin-report-status">${adminStatusText(report.status)}</div>
          <div class="admin-card-title">${report.title}</div>
          <div class="admin-card-desc">${report.description}</div>
          <div class="admin-card-meta">${report.address} · ${report.date}</div>
        </div>
      </div>
      <div class="admin-card-actions">
        <select class="status-select" id="admin-select-${report.id}">
          <option value="" disabled selected>처리상태를 선택하세요</option>
          <option value="pending">신고 접수</option>
          <option value="processing">처리 중</option>
          <option value="completed">처리 완료</option>
        </select>
        <button class="confirm-btn" onclick="updateAdminStatus(${report.id})">확인</button>
      </div>
    `;
    body.appendChild(card);
  });

  // 페이지네이션 버튼
  if (totalPages > 1) {
    const pagination = document.createElement('div');
    pagination.className = 'admin-pagination';

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = `admin-page-btn ${i === adminCurrentPage ? 'active' : ''}`;
      btn.textContent = i;
      btn.addEventListener('click', () => {
        adminCurrentPage = i;
        renderAdmin();
        window.scrollTo(0, 0);
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
  const report = adminReports.find(r => r.id === id);
  if (report) {
    report.status = newStatus;
    // localStorage 연동 후: localStorage.setItem('reports', JSON.stringify(adminReports));
    renderAdmin();
  }
}

// ─── 페이지 로드 시 렌더링 ───
renderAdmin();