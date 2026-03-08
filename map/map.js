// 카카오맵은 SVG 미지원 → 기본 마커 사용. 커스텀 아이콘은 PNG로 map/images/에 두고 아래 주석 해제
// const redMarkerImage = new kakao.maps.MarkerImage("./images/marker-red.png", new kakao.maps.Size(40, 40));
// const orangeMarkerImage = new kakao.maps.MarkerImage("./images/marker-orange.png", new kakao.maps.Size(40, 40));
const USE_DEFAULT_MARKER = true; // SVG 대신 기본 마커로 표시 (마커가 안 보이던 문제 해결)

let markers = [];
// 신고 위치 선택 시 클릭한 곳에 잠깐 표시하는 마커 (한 번에 하나만)
let selectionMarker = null;

// 지도 영역 가져오기
const mapArea = document.getElementById("map");

// 지도 옵션
const mapOptions = {
  center: new kakao.maps.LatLng(37.5665, 126.978), // 서울시청좌표
  level: 3,
};

// 지도 생성
const drawMap = new kakao.maps.Map(mapArea, mapOptions);

// ------------------------------
// 현재 위치(유저 위치) 동그란 점 표시 + sensor-tracking.js 연동
// ------------------------------

let currentLocationOverlay = null;
let lastHeadingDeg = null; // 방향 값(동서남북) - 나중에 사용할 수 있도록 저장
let lastLocationLatLng = null; // 최근 유저 위치 좌표 (현위치 버튼에서 사용)

if (window.SensorTracking) {
  // 위치가 바뀔 때마다 호출
  window.SensorTracking.onLocationChange = function (position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const latLng = new kakao.maps.LatLng(lat, lng);
    lastLocationLatLng = latLng;

    // 처음 한 번만 오버레이 생성, 이후에는 위치만 갱신
    if (!currentLocationOverlay) {
      const content = '<div class="current-location-dot"></div>';

      currentLocationOverlay = new kakao.maps.CustomOverlay({
        position: latLng,
        content: content,
        yAnchor: 0.5,
        xAnchor: 0.5,
      });

      currentLocationOverlay.setMap(drawMap);
    } else {
      currentLocationOverlay.setPosition(latLng);
    }

    // 필요하면 주석 해제 → 항상 내 위치가 화면 중앙 근처에 보이게
    // drawMap.setCenter(latLng);
  };

  // 위치 에러
  window.SensorTracking.onLocationError = function (error) {
    console.warn("현재 위치 추적 에러:", error);
  };

  // 방향(heading) 값도 받아서 저장해두기 (동서남북 회전용)
  window.SensorTracking.onHeadingChange = function (headingDeg) {
    lastHeadingDeg = headingDeg;
    // 나중에 방향 화살표를 그릴 때 이 값을 사용하면 됨
  };

  // 실제 추적 시작
  window.SensorTracking.startLocationTracking();
  window.SensorTracking.startHeadingTracking();
} else {
  console.warn("SensorTracking 모듈이 로드되지 않았습니다.");
}

// 홈 (map=홈 / 새로고침 & map.html로 이동)
document.getElementById("homeBtn").addEventListener("click", function () {
  location.href = "./map.html";
});

// 슬라이드
const sidebar = document.getElementById("sidebar");
const slideBtn = document.getElementById("slideBtn");
const slideFrame = document.getElementById("slideFrame");
const topMenu = document.querySelector(".top-menu");

// 상단 버튼 → 슬라이드 열고 iframe 연결
document.getElementById("reportBtn").addEventListener("click", function () {
  openSlide("../index.html");
});

document.getElementById("myReportsBtn").addEventListener("click", function () {
  openSlide("../my-reports.html");
});

document.getElementById("guideBtn").addEventListener("click", function () {
  openSlide("../guide.html");
});

//슬라이드 열기
function openSlide(url) {
  // 모바일이면 페이지 이동
  if (window.innerWidth <= 768) {
    location.href = url;
    return;
  }

  // PC면 슬라이드
  sidebar.classList.add("open");
  slideBtn.textContent = "<";
  slideFrame.src = url;
}
//슬라이드 닫기
function closeSlide() {
  sidebar.classList.remove("open");
  slideBtn.textContent = ">";
  slideFrame.src = "";
}

// 슬라이드 버튼 클릭
slideBtn.addEventListener("click", function () {
  if (sidebar.classList.contains("open")) {
    closeSlide();
  } else {
    openSlide("../index.html");
  }
});

//클릭 위치 마커 생성
const geoCoder = new kakao.maps.services.Geocoder();

kakao.maps.event.addListener(drawMap, "click", function (mouseEvent) {

  const latLng = mouseEvent.latLng;
  const lat = latLng.getLat();
  const lng = latLng.getLng();

  // 클릭한 위치에 선택 마커 바로 표시 (딱 튀어오르는 느낌)
  if (selectionMarker) {
    selectionMarker.setMap(null);
    selectionMarker = null;
  }
  selectionMarker = new kakao.maps.Marker({ position: latLng });
  selectionMarker.setMap(drawMap);

  geoCoder.coord2Address(lng, lat, function (result, status) {

    if (status === kakao.maps.services.Status.OK) {

      const address = result[0].address.address_name;

      const selectedLocation = {
        lat: lat,
        lng: lng,
        address: address
      };

      localStorage.setItem(
        "selectedLocation",
        JSON.stringify(selectedLocation)
      );

      openSlide("../index.html");

    }

  });

});

//신고데이터 불러오기
function loadReports() {
  return JSON.parse(localStorage.getItem("reports")) || [];
}

// 확대
document.getElementById("zoomIn").addEventListener("click", function () {
  drawMap.setLevel(drawMap.getLevel() - 1);
});

// 축소
document.getElementById("zoomOut").addEventListener("click", function () {
  drawMap.setLevel(drawMap.getLevel() + 1);
});

// 현위치 버튼: 최근 위치 좌표로 지도 이동
const myLocationBtn = document.getElementById("myLocationBtn");
if (myLocationBtn) {
  myLocationBtn.addEventListener("click", function () {
    if (lastLocationLatLng) {
      drawMap.setCenter(lastLocationLatLng);
    } else {
      alert("아직 현재 위치를 가져오는 중입니다.\n잠시 후 다시 눌러주세요.");
    }
  });
}

// 햄버거 메뉴
const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");

menuToggle.addEventListener("click", function () {
  mobileMenu.classList.toggle("open");
});

// 모바일 메뉴 페이지 이동
document.getElementById("mReportBtn").addEventListener("click", function () {
  location.href = "../index.html";
});

document.getElementById("mMyReportsBtn").addEventListener("click", function () {
  location.href = "../my-reports.html";
});

document.getElementById("mGuideBtn").addEventListener("click", function () {
  location.href = "../guide.html";
});

// 로컬스토리지
let reports = JSON.parse(localStorage.getItem("reports")) || [];

function saveReport(lat, lng, address) {
  let reports = JSON.parse(localStorage.getItem("reports")) || [];

  const newReport = {
    id: Date.now(),
    lat: lat,
    lng: lng,
    address: address,
    status: "pending",
  };

  console.log("dddd", newReport);

  reports.push(newReport);

  localStorage.setItem("reports", JSON.stringify(reports));

  return newReport;
}

//id 받아와서 done으로 상태변경
function completeReport(id) {
  let reports = JSON.parse(localStorage.getItem("reports")) || [];

  const updatedReports = reports.map((report) => {
    if (report.id === id) {
      report.status = "done";
    }

    return report;
  });

  localStorage.setItem("reports", JSON.stringify(updatedReports));
}

// processing 상태 변경
function processingReport(id) {
  let reports = JSON.parse(localStorage.getItem("reports")) || [];

  const updatedReports = reports.map((report) => {
    if (report.id === id) {
      report.status = "processing";
    }

    return report;
  });

  localStorage.setItem("reports", JSON.stringify(updatedReports));
}

//위 내용 가지고 렌더 (*>status = "done" 관리자 페이지에서 바꾸면 마커 사라짐)
function renderReports() {

  markers.forEach(marker => marker.setMap(null));
  markers = [];

  const reports = JSON.parse(localStorage.getItem("reports")) || [];
  const withCoords = reports.filter(
    (r) =>
      typeof r.lat === "number" &&
      typeof r.lng === "number" &&
      r.status !== "done"
  );
  console.log("[지도] 신고 수:", reports.length, "| 좌표 있고 미처리:", withCoords.length);

  reports.forEach(report => {
    // lat/lng가 없으면 마커 표시 불가 (예: 예전에 GPS만 쓰고 지도 클릭 안 했을 때)
    const hasValidCoords =
      typeof report.lat === "number" &&
      typeof report.lng === "number" &&
      !Number.isNaN(report.lat) &&
      !Number.isNaN(report.lng);

    if (report.status !== "done" && hasValidCoords) {
      const markerOptions = {
        position: new kakao.maps.LatLng(report.lat, report.lng),
      };
      if (!USE_DEFAULT_MARKER) {
        const markerImage =
          report.status === "processing" ? orangeMarkerImage : redMarkerImage;
        if (markerImage) markerOptions.image = markerImage;
      }
      const marker = new kakao.maps.Marker(markerOptions);
      marker.setMap(drawMap);
      markers.push(marker);

      marker.reportId = report.id;
      kakao.maps.event.addListener(marker, "click", function () {
        openSlide(`../my-reports.html?id=${report.id}`);
      });
    }
  });

}

renderReports();

function updateReportStatus(id, status) {
  let reports = loadReports();

  reports = reports.map((report) => {
    if (report.id === id) {
      report.status = status;
    }
    return report;
  });

  localStorage.setItem("reports", JSON.stringify(reports));

}

// iframe에서 호출할 수 있도록 전역으로 노출
window.onReportSubmitted = function () {
  if (selectionMarker) {
    selectionMarker.setMap(null);
    selectionMarker = null;
  }
  renderReports();
};

window.moveToMarker = function(lat, lng) {
  const latLng = new kakao.maps.LatLng(lat, lng);
  drawMap.setCenter(latLng);
  drawMap.setLevel(3);
}