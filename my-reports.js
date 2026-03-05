const filterButtons = document.querySelectorAll('.filter-btn');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const status = button.dataset.status;

    // 버튼 active 처리
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    currentFilter = status;
    renderReports();
  });
});

// function loadReports() {
//   return [ /* 기존 하드코딩 배열 */ ];
// }

// function saveReports() {}

// let reports = loadReports(); // 기존 let reports = [...] 를 이걸로 교체


let reports = [
  {
    id: 1,
    status: 'pending',
    title: '점자블록 방해 주차',
    description: '점자블록 위에 공유 킥보드가 방치',
    date: '2026.03.03',
    address: '서울시 마포구 홍익로',
    image: 'images/dont2.jpg'
  },
  {
    id: 2,
    status: 'processing',
    title: '보행로 방해',
    description: '보행로 중앙에 공유 킥보드 방치',
    date: '2026.03.01',
    address: '서울시 서대문구',
    image: 'images/dont3.jpg'
  },
  {
    id: 3,
    status: 'completed',
    title: '횡단보도 방해',
    description: '횡단보도 앞 킥보드 방치',
    date: '2026.02.28',
    address: '서울시 강남구',
    image: 'images/dont1.jpg'
  }
];

function loadReportsFromStorage() {
  try {
    const stored = localStorage.getItem('reports');
    if (!stored) return defaultReports;
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return defaultReports;
  } catch (e) {
    return defaultReports;
  }
}

const reports = loadReportsFromStorage();

function statusText(status) {
  switch (status) {
    case 'pending': return '신고 중';
    case 'processing': return '처리 중';
    case 'completed': return '처리 완료';
    default: return '';
  }
}

// 빈 상태 메시지 - 필터별 분기
function emptyMessage(status) {
  switch (status) {
    case 'pending': return '신고 내역이 없습니다.';
    case 'processing': return '처리 중인 내역이 없습니다.';
    case 'completed': return '처리 완료된 내역이 없습니다.';
    default: return '신고 내역이 없습니다.';
  }
}


// 신고 취소 함수
function cancelReport(id) {
  const confirmed = confirm('신고를 취소하시겠습니까?');
  if (!confirmed) return;

  reports = reports.filter(report => report.id !== id);
  renderReports();
}

const container = document.querySelector('.my-reports-container');

function renderReports(list) {
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = `<p class="text-muted">신고 내역이 없습니다.</p>`;
    return;
  }

  list.forEach(report => {
    const card = document.createElement('div');
    card.className = `card status-${report.status}`;

    card.innerHTML = `
      <div class="row g-0">
        <div class="col-12 col-md-4">
          <img src="${report.image}" class="img-fluid w-100 report-img" alt="">
        </div>
        <div class="col-12 col-md-8">
          <div class="card-body">
            <div class="report-status">${statusText(report.status)}</div>
            <div class="fw-semibold report-title">${report.title}</div>
            <div class="text-muted small report-desc">
              ${report.description}
            </div>
            <div class="d-flex gap-2 text-muted small">
              <span>${report.date}</span>
              <span>${report.address}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

renderReports(reports);

const filterButtons = document.querySelectorAll('.filter-btn');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const status = button.dataset.status;

    // 버튼 active 처리
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // 데이터 필터링
    const filtered =
      status === 'all'
        ? reports
        : reports.filter(report => report.status === status);

    renderReports(filtered);
  });
});
