// 지도 영역 가져오기
const mapArea = document.getElementById('map');

// 지도 옵션
const mapOptions = {
  center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울시청좌표
  level: 3
};

// 지도 생성
const drawMap = new kakao.maps.Map(mapArea, mapOptions);

//클릭 위치 마커 생성
kakao.maps.event.addListener(drawMap, 'click', function(mouseEvent) {

  let latLng = mouseEvent.latLng;

  console.log(latLng.getLat(), latLng.getLng());

  let marker = new kakao.maps.Marker({
    position: latLng
  });

  marker.setMap(drawMap);
});

// 확대
document.getElementById("zoomIn").addEventListener("click", function() {
    drawMap.setLevel(drawMap.getLevel() - 1);
});

// 축소
document.getElementById("zoomOut").addEventListener("click", function() {
    drawMap.setLevel(drawMap.getLevel() + 1);
});