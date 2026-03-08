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
      // 지도 마커용: 현재 위치도 selectedLocation에 저장 (lat/lng 있어야 지도에 마커 표시됨)
      localStorage.setItem(
        "selectedLocation",
        JSON.stringify({ lat, lng, address: "" })
      );
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
            // selectedLocation 주소도 갱신 (이미 lat/lng는 저장됨)
            try {
              const sel = JSON.parse(localStorage.getItem("selectedLocation") || "{}");
              if (sel.lat !== undefined && sel.lng !== undefined) {
                localStorage.setItem("selectedLocation", JSON.stringify({ ...sel, address }));
              }
            } catch (e) {}
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
// image는 handleSubmitReport에서 base64로 채움
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

  const labelText = selectedType
    ? (selectedType.closest("label")
        ? selectedType.closest("label").textContent.trim()
        : (selectedType.nextSibling && selectedType.nextSibling.textContent
            ? selectedType.nextSibling.textContent.trim()
            : ""))
    : "";

  return {
    status: "pending",
    title: labelText,
    description: etcInput ? etcInput.value.trim() : "",
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

// 파일을 base64 Data URL로 읽기 (로컬 저장용)
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// "이 위치 신고하기" 버튼 클릭 시 신고 데이터를 저장
async function handleSubmitReport() {
  const locationInput = document.getElementById("report-location-input");
  if (!locationInput || !locationInput.value) {
    alert("먼저 위치를 선택하거나 현재 위치 버튼을 눌러 주세요.");
    return;
  }

  const newReport = buildReportFromForm();
  const selectedLocation = JSON.parse(localStorage.getItem("selectedLocation"));
  const imageInput = document.getElementById("report-image");
  const imageNameSpan = document.getElementById("report-image-name");

  // 기타 선택 시 사유 필수
  const selectedType = document.querySelector('input[name="reportType"]:checked');
  const etcInput = document.getElementById("report-etc");
  if (selectedType && selectedType.value === 'etc' && (!etcInput || !etcInput.value.trim())) {
    alert("기타 사유를 입력해주세요.");
    return;
  }

  // 이미지 필수
  if (!imageInput || !imageInput.files || !imageInput.files[0]) {
    alert("사진을 업로드해주세요.");
    return;
  }

  if(selectedLocation){
    newReport.lat = selectedLocation.lat;
    newReport.lng = selectedLocation.lng;
  }

  if (imageInput && imageInput.files && imageInput.files[0]) {
    try {
      newReport.image = await readFileAsDataURL(imageInput.files[0]);
    } catch (e) {
      console.warn("이미지 읽기 실패:", e);
    }
  }

  const reports = loadReportsFromStorage();
  const nextId =
    reports.length > 0
      ? Math.max(...reports.map((r) => (typeof r.id === "number" ? r.id : 0))) +
        1
      : 1;

  newReport.id = nextId;
  reports.push(newReport);
  saveReportsToStorage(reports);

  // 위치 정보 초기화
localStorage.removeItem("selectedLocation");

// 지도 새로고침
if (window.parent && window.parent !== window) {
  if (typeof window.parent.onReportSubmitted === 'function') {
    window.parent.onReportSubmitted();
  }
  // closeSlide도 호출
  if (typeof window.parent.closeSlide === 'function') {
    window.parent.closeSlide();
  }
} else {
  window.location.href = "map/map.html";
}

  // 폼 초기화
  locationInput.value = "";
  if (etcInput) {
    etcInput.value = "";
  }
  const typeRadios = document.querySelectorAll('input[name="reportType"]');
  typeRadios.forEach((radio) => {
    radio.checked = radio.value === "block_crosswalk";
  });
  if (imageInput) {
    imageInput.value = "";
  }
  if (imageNameSpan) {
    imageNameSpan.textContent = "";
  }

  const success = document.getElementById("report-success");
  if (success) {
    success.classList.add("is-visible");
    setTimeout(() => {
      success.classList.remove("is-visible");
    }, 3000);
  }

  console.log("신고가 저장되었습니다.", newReport);
}

// 신고 창 닫기 버튼
function handleCloseReportWindow() {
  // 1) 데스크톱: iframe 안에서 열렸고, 부모창에 closeSlide()가 있을 때
  try {
    if (
      window.parent &&
      window.parent !== window &&
      typeof window.parent.closeSlide === "function"
    ) {
      window.parent.closeSlide();
      return;
    }
  } catch (e) {
    // cross-origin 이슈는 없겠지만, 안전하게 무시
  }

  // 2) 모바일처럼 단독으로 index.html 을 연 경우 → 지도 화면으로 이동
  window.location.href = "map/map.html";
}

document.addEventListener("DOMContentLoaded", function () {
  // 지도에서 위치 클릭 후 열렸을 때: selectedLocation으로 위치 인풋 채우기
  try {
    const stored = localStorage.getItem("selectedLocation");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.address) {
        const locationInput = document.getElementById("report-location-input");
        if (locationInput) {
          locationInput.value = parsed.address;
        }
      }
    }
  } catch (e) {
    // 무시
  }

  const gpsButton = document.getElementById("btn-current-location");
  const resetButton = document.getElementById("btn-location-reset");
  const submitButton = document.getElementById("btn-submit-report");
  const closeButton = document.getElementById("btn-close-report");

  if (gpsButton) gpsButton.addEventListener("click", handleCurrentLocationClick);
  if (resetButton) resetButton.addEventListener("click", handleLocationReset);
  if (submitButton) submitButton.addEventListener("click", handleSubmitReport);
  if (closeButton) closeButton.addEventListener("click", handleCloseReportWindow);

  // 사진 업로드 버튼 기능
  const uploadButton = document.getElementById("btn-upload-image");
  const imageInput = document.getElementById("report-image");
  const imageNameSpan = document.getElementById("report-image-name");

  if (uploadButton && imageInput) {
    // 버튼 누르면 숨겨진 파일 input 열기
    uploadButton.addEventListener("click", function () {
      imageInput.click();
    });

    // 파일을 선택했을 때 파일 이름 표시
    imageInput.addEventListener("change", function () {
      const file = imageInput.files && imageInput.files[0];
      if (!file) {
        if (imageNameSpan) imageNameSpan.textContent = "";
        return;
      }
      if (imageNameSpan) {
        imageNameSpan.textContent = file.name;
      }
    });
  }

   // 기타 아닐 때 사유 입력칸 비활성화
  const typeRadios = document.querySelectorAll('input[name="reportType"]');
  const etcInputField = document.getElementById("report-etc");

  function updateEtcInput() {
    const selected = document.querySelector('input[name="reportType"]:checked');
    if (etcInputField) {
      etcInputField.disabled = !(selected && selected.value === 'etc');
      if (etcInputField.disabled) etcInputField.value = "";
    }
  }

  typeRadios.forEach(radio => {
    radio.addEventListener('change', updateEtcInput);
  });

  updateEtcInput();
});
