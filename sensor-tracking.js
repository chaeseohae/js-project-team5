// sensor-tracking.js
// 위치(GPS)와 기기 방향(동서남북) 센서를 다루는 헬퍼 모듈

(function () {
  // 내부 상태
  let watchId = null;
  let headingListenerAdded = false;

  // 휴대폰 / 태블릿 여부 간단 판별
  function isHandheldDevice() {
    const ua = navigator.userAgent || navigator.vendor || window.opera;

    // 안드로이드
    if (/android/i.test(ua)) return true;

    // iOS (아이폰/아이패드/아이팟)
    if (/iPhone|iPad|iPod/i.test(ua)) return true;

    // 터치 기반 포인터가 기본인 기기 (보조 체크)
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
      return true;
    }

    // 나머지는 데스크톱/노트북으로 간주
    return false;
  }

  // 외부에서 사용할 전역 객체
  const SensorTracking = {
    // 콜백: 필요할 때 다른 파일에서 설정해서 사용
    // onLocationChange(position: GeolocationPosition)
    onLocationChange: null,
    // onLocationError(error: GeolocationPositionError | Error)
    onLocationError: null,
    // onHeadingChange(headingDeg: number) - 0~360, 북쪽 기준
    onHeadingChange: null,

    // 공개 메서드
    startLocationTracking,
    stopLocationTracking,
    startHeadingTracking,
  };

  // 전역으로 노출
  window.SensorTracking = SensorTracking;

  // ---------- 위치 추적 ----------

  function startLocationTracking() {
    if (!navigator.geolocation) {
      console.warn("이 브라우저에서는 위치 정보를 사용할 수 없습니다.");
      if (SensorTracking.onLocationError) {
        SensorTracking.onLocationError(new Error("Geolocation not supported"));
      }
      return;
    }

    // 이미 추적 중이면 다시 시작하지 않음
    if (watchId !== null) {
      return;
    }

    watchId = navigator.geolocation.watchPosition(
      function (position) {
        if (SensorTracking.onLocationChange) {
          SensorTracking.onLocationChange(position);
        }
      },
      function (error) {
        if (SensorTracking.onLocationError) {
          SensorTracking.onLocationError(error);
        } else {
          console.warn("위치 추적 에러:", error);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000, // 1초 이내 캐시 허용
        timeout: 10000, // 10초 안에 응답 없으면 실패
      }
    );
  }

  function stopLocationTracking() {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  // ---------- 방향(heading) 추적 ----------

  function startHeadingTracking() {
    if (headingListenerAdded) return;

    // 데스크톱/노트북에서는 방향 센서 기능을 끈다
    if (!isHandheldDevice()) {
      console.info("기기 방향 추적은 모바일/태블릿에서만 활성화됩니다.");
      return;
    }

    if (typeof DeviceOrientationEvent === "undefined") {
      console.warn("기기 방향 센서를 지원하지 않습니다.");
      return;
    }

    // iOS Safari의 경우 권한 요청 필요 가능성
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission()
        .then(function (response) {
          if (response === "granted") {
            window.addEventListener(
              "deviceorientation",
              handleOrientation,
              true
            );
            headingListenerAdded = true;
          } else {
            console.warn("기기 방향 센서 권한이 거부되었습니다.");
          }
        })
        .catch(function (err) {
          console.warn("기기 방향 센서 권한 요청 중 에러:", err);
        });
    } else {
      // 안드로이드 등
      window.addEventListener("deviceorientation", handleOrientation, true);
      headingListenerAdded = true;
    }
  }

  function handleOrientation(event) {
    const alpha = event.alpha;
    if (alpha == null) return;

    // 0~360 범위로 정규화, 북쪽=0 기준
    const heading = (360 - alpha + 360) % 360;

    if (SensorTracking.onHeadingChange) {
      SensorTracking.onHeadingChange(heading);
    }
  }
})();

