// 신고 내역을 저장하는 배열 (초기 더미 데이터 포함)
const reports = [
  {
    id: 1,
    status: "pending",
    title: "점자블록 방해 주차",
    description: "점자블록 위에 공유 킥보드가 방치되어 있어요.",
    date: "2026-03-01",
    address: "서울특별시 성동구 성수동",
    image: null,
  },
  {
    id: 2,
    status: "done",
    title: "횡단보도 앞 방치",
    description: "횡단보도 앞 출입을 가로막고 있던 킥보드가 치워졌습니다.",
    date: "2026-03-02",
    address: "서울특별시 마포구 홍익로",
    image: null,
  },
];

let nextReportId = 3;
let currentReportFilter = "all";

// 팀원이 마커 클릭 시 이 함수를 호출해서 신고창에 정보 채우기
function openReportPanel(locationText) {
  const panel = document.getElementById("report-panel");
  const locationInput = document.getElementById("report-location-input");
  if (locationText) {
    locationInput.value = locationText;
  }
  panel.classList.add("is-open"); // CSS에서 열릴 때 스타일 다르게
}

// 필요하면 닫는 함수도 미리 만들어두기
function closeReportPanel() {
  const panel = document.getElementById("report-panel");
  panel.classList.remove("is-open");
}

// 현재 위치(GPS) 버튼 클릭 시 위치 인풋을 자동으로 채우기
function handleCurrentLocationClick() {
  const locationInput = document.getElementById("report-location-input");

  if (!navigator.geolocation) {
    alert("이 브라우저에서는 위치 정보를 사용할 수 없습니다.");
    return;
  }

  locationInput.value = "현재 위치를 불러오는 중...";

  navigator.geolocation.getCurrentPosition(
    function (position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      updateLocationFromCoords(lat, lng);
    },
    function (error) {
      locationInput.value = "";
      let message = "위치 정보를 가져오지 못했습니다.";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "위치 정보 권한이 거부되었습니다.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "위치 정보를 사용할 수 없습니다.";
          break;
        case error.TIMEOUT:
          message = "위치 정보 요청이 시간 초과되었습니다.";
          break;
      }

      alert(message);
    }
  );
}

// 좌표를 받아서 주소(도시/동 이름 등)로 변환 후 인풋에 표시
// - 카카오 지도 JS SDK가 로드되어 있으면 역지오코딩 사용
// - 없으면 위도/경도 텍스트로 fallback
function updateLocationFromCoords(lat, lng) {
  const locationInput = document.getElementById("report-location-input");
  if (!locationInput) return;

  const latText = lat.toFixed(5);
  const lngText = lng.toFixed(5);

  // Kakao Maps JS SDK (services 라이브러리) 가 있는 경우
  if (
    window.kakao &&
    window.kakao.maps &&
    window.kakao.maps.services &&
    typeof window.kakao.maps.services.Geocoder === "function"
  ) {
    const geocoder = new window.kakao.maps.services.Geocoder();
    const coord = new window.kakao.maps.LatLng(lat, lng);

    geocoder.coord2Address(
      coord.getLng(),
      coord.getLat(),
      function (result, status) {
        if (
          status === window.kakao.maps.services.Status.OK &&
          Array.isArray(result) &&
          result.length > 0
        ) {
          const road =
            result[0].road_address && result[0].road_address.address_name;
          const jibun = result[0].address && result[0].address.address_name;
          const address = road || jibun;

          if (address) {
            locationInput.value = address;
            return;
          }
        }

        // 주소를 못 가져온 경우 위도/경도 표기로 fallback
        locationInput.value = `위도 ${latText}, 경도 ${lngText}`;
      }
    );
  } else {
    // Kakao SDK가 없는 경우 단순 위도/경도 출력
    locationInput.value = `위도 ${latText}, 경도 ${lngText}`;
  }
}

// 위치 인풋 초기화
function handleLocationReset() {
  const locationInput = document.getElementById("report-location-input");
  if (locationInput) {
    locationInput.value = "";
  }
}

// 현재 폼 상태로부터 신고 객체 하나 만들기
function buildReportFromForm() {
  const locationInput = document.getElementById("report-location-input");
  const etcInput = document.getElementById("report-etc");
  const selectedType = document.querySelector(
    'input[name="reportType"]:checked'
  );

  const now = new Date();
  const dateString = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return {
    id: nextReportId++,
    status: "pending",
    title: selectedType ? selectedType.nextSibling.textContent.trim() : "",
    description: etcInput ? etcInput.value : "",
    date: dateString,
    address: locationInput ? locationInput.value : "",
    image: null,
  };
}

// "이 위치 신고하기" 버튼 클릭 시 신고 데이터를 reports 배열에 추가
function handleSubmitReport() {
  const locationInput = document.getElementById("report-location-input");
  if (!locationInput || !locationInput.value) {
    alert("먼저 위치를 선택하거나 현재 위치 버튼을 눌러 주세요.");
    return;
  }

  const newReport = buildReportFromForm();
  reports.push(newReport);

  renderReports(currentReportFilter);
  alert("신고가 접수되었습니다.");
}

// reports 배열을 상태 필터에 맞춰 여러 장의 카드로 렌더링
function renderReports(filterStatus) {
  const list = document.getElementById("report-list");
  if (!list) return;

  const effectiveFilter = filterStatus && filterStatus !== "all" ? filterStatus : "all";
  currentReportFilter = effectiveFilter;

  const filtered =
    effectiveFilter === "all"
      ? reports
      : reports.filter((report) => report.status === effectiveFilter);

  if (!filtered.length) {
    list.innerHTML = `
      <div class="report-card-empty">
        아직 해당 상태의 신고 내역이 없습니다.
      </div>
    `;
    return;
  }

  const cardsHtml = filtered
    .map((report) => {
      const statusLabel =
        report.status === "pending"
          ? "접수됨"
          : report.status === "processing"
          ? "처리중"
          : report.status === "done"
          ? "해결완료"
          : report.status;

      return `
        <article class="report-card">
          <div class="report-card-header">
            <div class="report-card-title">${report.title || "신고 내역"}</div>
            <span class="report-card-status">${statusLabel}</span>
          </div>
          <div class="report-card-meta">
            ${report.date || ""} · ${report.address || "위치 정보 없음"}
          </div>
          <div class="report-card-desc">
            ${report.description || "작성된 상세 내용이 없습니다."}
          </div>
        </article>
      `;
    })
    .join("");

  list.innerHTML = cardsHtml;
}

// 상태 필터 버튼의 활성 상태를 업데이트
function updateFilterButtons(activeStatus) {
  const buttons = document.querySelectorAll(".report-filter-btn");
  buttons.forEach((btn) => {
    const status = btn.getAttribute("data-status") || "all";
    if (status === activeStatus) {
      btn.classList.add("is-active");
    } else {
      btn.classList.remove("is-active");
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const gpsButton = document.getElementById("btn-current-location");
  const resetButton = document.getElementById("btn-location-reset");
  const submitButton = document.getElementById("btn-submit-report");
  const filterButtons = document.querySelectorAll(".report-filter-btn");

  if (gpsButton) {
    gpsButton.addEventListener("click", handleCurrentLocationClick);
  }

  if (resetButton) {
    resetButton.addEventListener("click", handleLocationReset);
  }

  if (submitButton) {
    submitButton.addEventListener("click", handleSubmitReport);
  }

  if (filterButtons.length) {
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        const status = btn.getAttribute("data-status") || "all";
        currentReportFilter = status;
        updateFilterButtons(status);
        renderReports(status);
      });
    });
  }

  // 페이지 진입 시 전체 필터 기준으로 신고 리스트 렌더링
  updateFilterButtons("all");
  renderReports("all");
});

