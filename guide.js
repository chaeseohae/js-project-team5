// 신고 가이드 창 닫기 버튼
function handleCloseGuide() {
  try {
    if (
      window.parent &&
      window.parent !== window &&
      typeof window.parent.closeSlide === 'function'
    ) {
      window.parent.closeSlide();
      return;
    }
  } catch (e) {
    // 무시
  }

  // 모바일 등 단독 페이지로 열렸을 때
  window.location.href = 'map/map.html';
}

document.addEventListener('DOMContentLoaded', function () {
  const closeBtn = document.getElementById('btn-close-guide');
  if (closeBtn) {
    closeBtn.addEventListener('click', handleCloseGuide);
  }
});

