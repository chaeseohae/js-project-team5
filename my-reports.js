const filterButtons = document.querySelectorAll('.filter-btn');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const status = button.dataset.status;

    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    currentFilter = status;
    renderReports();
  });
});

// ─── localStorage에서 불러오기 ───
// 실제 데이터 연동. 없으면 빈 배열.
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

let reports = loadReports();

// 현재 필터 상태 추적
let currentFilter = 'all';

function statusText(status) {
  switch (status) {
    case 'pending':    return '신고 접수';
    case 'processing': return '처리 중';
    case 'completed':  return '처리 완료';
    default: return '';
  }
}

// 빈 상태 메시지 - 필터별 분기
function emptyMessage(status) {
  switch (status) {
    case 'pending':    return '신고 접수된 내역이 없습니다.';
    case 'processing': return '처리 중인 신고가 없습니다.';
    case 'completed':  return '처리 완료된 신고가 없습니다.';
    default:           return '신고 내역이 없습니다.';
  }
}

// 신고 취소 - localStorage에서도 삭제
function cancelReport(id) {
  const confirmed = confirm('신고를 취소하시겠습니까?');
  if (!confirmed) return;

  reports = reports.filter(report => report.id !== id);
  saveReports();
  renderReports();
}

// ─── 창 닫기 버튼 (데스크톱: 슬라이드 닫기, 모바일: 지도 화면으로 이동) ───
function handleCloseMyReports() {
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

  // 모바일 등 단독 페이지로 열렸을 때
  window.location.href = 'map/map.html';
}

// 신고 건수 뱃지
function updateBadges() {
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

const container = document.querySelector('.my-reports-container');

function renderReports() {
  // 최신 데이터 다시 불러오기 (관리자가 상태 변경했을 수 있으므로)
  reports = loadReports();

  const filtered =
    currentFilter === 'all'
      ? reports
      : reports.filter(report => report.status === currentFilter);

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-muted empty-message">${emptyMessage(currentFilter)}</p>`;
    updateBadges();
    return;
  }

  filtered.forEach(report => {
    const card = document.createElement('div');
    card.className = `card status-${report.status}`;

    // 신고 취소 버튼은 'pending' 상태일 때만 표시
    const cancelBtn = report.status === 'pending'
      ? `<button class="cancel-btn" onclick="cancelReport(${report.id})">신고 취소</button>`
      : '';

    // 이미지 없으면 기본 이미지
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
            <div class="fw-semibold report-title">${report.title || '내용 없음'}</div>
            <div class="report-bottom">${report.address || '주소 없음'} · ${report.date || ''}</div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  updateBadges();
}

renderReports();

// DOM 로드 후 닫기 버튼 이벤트 연결
document.addEventListener('DOMContentLoaded', function () {
  const closeBtn = document.getElementById('btn-close-my-reports');
  if (closeBtn) {
    closeBtn.addEventListener('click', handleCloseMyReports);
  }
});