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

// 현재 폼 상태로부터 신고 객체 하나 만들기 (id는 나중에 부여)
function buildReportFromForm() {
  const locationInput = document.getElementById("report-location-input");
  const etcInput = document.getElementById("report-etc");
  const selectedType = document.querySelector(
    'input[name="reportType"]:checked'
  );

  const now = new Date();
  const dateString = `${now.getFullYear()}.${String(
    now.getMonth() + 1
  ).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  return {
    status: "pending",
    title: selectedType ? selectedType.nextSibling.textContent.trim() : "",
    description: etcInput ? etcInput.value : "",
    date: dateString,
    address: locationInput ? locationInput.value : "",
    image: null,
  };
}

// 로컬스토리지에서 신고 내역 불러오기
function loadReportsFromStorage() {
  try {
    const stored = localStorage.getItem("reports");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// 로컬스토리지에 신고 내역 저장
function saveReportsToStorage(list) {
  localStorage.setItem("reports", JSON.stringify(list));
}

// "이 위치 신고하기" 버튼 클릭 시 신고 데이터를 저장
function handleSubmitReport() {
  const locationInput = document.getElementById("report-location-input");
  if (!locationInput || !locationInput.value) {
    alert("먼저 위치를 선택하거나 현재 위치 버튼을 눌러 주세요.");
    return;
  }

  const newReport = buildReportFromForm();
  const reports = loadReportsFromStorage();

  const nextId =
    reports.length > 0
      ? Math.max(...reports.map((r) => (typeof r.id === "number" ? r.id : 0))) +
        1
      : 1;

  newReport.id = nextId;
  reports.push(newReport);
  saveReportsToStorage(reports);

  // 폼 초기화
  locationInput.value = "";
  const etcInput = document.getElementById("report-etc");
  if (etcInput) {
    etcInput.value = "";
  }
  const typeRadios = document.querySelectorAll('input[name="reportType"]');
  typeRadios.forEach((radio) => {
    radio.checked = radio.value === "block_crosswalk";
  });

  const success = document.getElementById("report-success");
  if (success) {
    success.classList.add("is-visible");
    setTimeout(() => {
      success.classList.remove("is-visible");
    }, 3000);
  }

  console.log("신고가 저장되었습니다.", newReport);
}

document.addEventListener("DOMContentLoaded", function () {
  const gpsButton = document.getElementById("btn-current-location");
  const resetButton = document.getElementById("btn-location-reset");
  const submitButton = document.getElementById("btn-submit-report");

  if (gpsButton) {
    gpsButton.addEventListener("click", handleCurrentLocationClick);
  }

  if (resetButton) {
    resetButton.addEventListener("click", handleLocationReset);
  }

  if (submitButton) {
    submitButton.addEventListener("click", handleSubmitReport);
  }
});

