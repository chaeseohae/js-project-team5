// 지도 영역 가져오기
const container = document.getElementById('map');

// 지도 옵션
const options = {
  center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울시청
  level: 3
};

// 지도 생성
const map = new kakao.maps.Map(container, options);

//클릭 위치 마커 생성
kakao.maps.event.addListener(map, 'click', function(mouseEvent) {

  let latLng = mouseEvent.latLng;

  console.log(latLng.getLat(), latLng.getLng());

  let marker = new kakao.maps.Marker({
    position: latLng
  });

  marker.setMap(map);
});

// 확대
document.getElementById("zoomIn").addEventListener("click", function() {
    map.setLevel(map.getLevel() - 1);
});

// 축소
document.getElementById("zoomOut").addEventListener("click", function() {
    map.setLevel(map.getLevel() + 1);
});