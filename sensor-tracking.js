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
            createCompass();
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
      createCompass();
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
    updateCompass(heading);
  }

  // ---------- 모바일 나침반 UI (동서남북, 실시간 연동) ----------
  let compassEl = null;
  let compassNeedleEl = null;
  let compassDirectionEl = null;

  function getDirectionLabel(deg) {
    if (deg >= 337.5 || deg < 22.5) return "북";
    if (deg >= 22.5 && deg < 67.5) return "북동";
    if (deg >= 67.5 && deg < 112.5) return "동";
    if (deg >= 112.5 && deg < 157.5) return "남동";
    if (deg >= 157.5 && deg < 202.5) return "남";
    if (deg >= 202.5 && deg < 247.5) return "남서";
    if (deg >= 247.5 && deg < 292.5) return "서";
    return "북서";
  }

  function createCompass() {
    if (compassEl) return;

    var style = document.createElement("style");
    style.textContent =
      ".sensor-compass{" +
      "position:fixed;bottom:90px;left:16px;z-index:100;" +
      "width:72px;height:72px;border-radius:50%;" +
      "background:rgba(255,255,255,0.95);box-shadow:0 4px 16px rgba(0,0,0,0.2);" +
      "display:flex;align-items:center;justify-content:center;" +
      "font-family:'Pretendard',sans-serif;}" +
      ".sensor-compass-rose{position:relative;width:56px;height:56px;}" +
      ".sensor-compass-needle{position:absolute;left:50%;top:50%;width:4px;height:24px;" +
      "margin-left:-2px;margin-top:-24px;background:linear-gradient(to top,#c00 0%,#c00 40%,#333 40%);" +
      "border-radius:2px;transform-origin:center bottom;transition:transform 0.1s ease-out;}" +
      ".sensor-compass-labels{position:absolute;inset:0;pointer-events:none;font-size:10px;font-weight:700;color:#333;}" +
      ".sensor-compass-labels .n{position:absolute;top:0;left:50%;transform:translateX(-50%);}" +
      ".sensor-compass-labels .e{position:absolute;right:0;top:50%;transform:translateY(-50%);}" +
      ".sensor-compass-labels .s{position:absolute;bottom:0;left:50%;transform:translateX(-50%);}" +
      ".sensor-compass-labels .w{position:absolute;left:0;top:50%;transform:translateY(-50%);}" +
      ".sensor-compass-direction{position:absolute;bottom:-22px;left:50%;transform:translateX(-50%);" +
      "font-size:11px;font-weight:700;color:#7B5CFF;}";
    document.head.appendChild(style);

    compassEl = document.createElement("div");
    compassEl.className = "sensor-compass";
    compassEl.setAttribute("aria-label", "나침반");
    compassEl.innerHTML =
      '<div class="sensor-compass-rose">' +
      '<div class="sensor-compass-needle" id="sensorCompassNeedle"></div>' +
      '<div class="sensor-compass-labels">' +
      '<span class="n">북</span><span class="e">동</span><span class="s">남</span><span class="w">서</span>' +
      "</div>" +
      '<span class="sensor-compass-direction" id="sensorCompassDirection">북</span>';
    document.body.appendChild(compassEl);

    compassNeedleEl = document.getElementById("sensorCompassNeedle");
    compassDirectionEl = document.getElementById("sensorCompassDirection");
  }

  function updateCompass(headingDeg) {
    if (!compassNeedleEl) return;
    compassNeedleEl.style.transform = "rotate(" + headingDeg + "deg)";
    if (compassDirectionEl) {
      compassDirectionEl.textContent = getDirectionLabel(headingDeg);
    }
  }

})();

