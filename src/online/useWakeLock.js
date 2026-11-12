import { useEffect } from 'react'

// Giữ màn hình luôn sáng khi active (Screen Wake Lock API, có trên Chrome
// Android và Safari iOS 16.4+). Trình duyệt tự nhả khóa khi chuyển tab hay khóa
// máy, nên xin lại mỗi khi trang hiện lại. Không hỗ trợ thì thôi, không báo lỗi.
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined
    let lock = null
    let stopped = false

    const request = async () => {
      if (document.visibilityState !== 'visible' || (lock && !lock.released)) return
      try {
        lock = await navigator.wakeLock.request('screen')
        if (stopped) lock.release()
      } catch {
        // Bị từ chối (pin yếu, chế độ tiết kiệm pin...): màn hình tắt như bình thường.
      }
    }

    request()
    document.addEventListener('visibilitychange', request)
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', request)
      lock?.release().catch(() => {})
    }
  }, [active])
}
