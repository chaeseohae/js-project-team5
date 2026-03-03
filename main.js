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
      const lat = position.coords.latitude.toFixed(5);
      const lng = position.coords.longitude.toFixed(5);

      // 실제 서비스에서는 여기에서 지도 API(카카오 등)로 좌표 -> 주소 변환 가능
      locationInput.value = `위도 ${lat}, 경도 ${lng}`;
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

// 위치 인풋 초기화
function handleLocationReset() {
  const locationInput = document.getElementById("report-location-input");
  if (locationInput) {
    locationInput.value = "";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const gpsButton = document.getElementById("btn-current-location");
  const resetButton = document.getElementById("btn-location-reset");

  if (gpsButton) {
    gpsButton.addEventListener("click", handleCurrentLocationClick);
  }

  if (resetButton) {
    resetButton.addEventListener("click", handleLocationReset);
  }
});

