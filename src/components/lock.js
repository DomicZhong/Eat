/**
 * 密码锁屏 — 应用级访问控制
 *
 * 输入正确密码才能进入，SHA-256 验证，不联网。
 * 验证通过后自动记住，再次打开无需重复输入。
 */
/** 正确密码的 SHA-256 哈希（不在源码中暴露明文） */
const CORRECT_HASH = "a7a07e92f1ef764b6cbb49f0a2fb54eb934c92094e254eda52a8757d1aa6a116";

/** localStorage 持久化标记 */
const UNLOCKED_KEY = "ustime_unlocked";

/**
 * SHA-256 哈希
 * @param {string} str
 * @returns {Promise<string>}
 */
const sha256 = async (str) => {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

/**
 * 检查是否已解锁（当前会话或持久化）
 * @returns {boolean}
 */
export const isUnlocked = () => {
  if (sessionStorage.getItem(UNLOCKED_KEY)) return true;
  if (localStorage.getItem(UNLOCKED_KEY)) {
    sessionStorage.setItem(UNLOCKED_KEY, "1");
    return true;
  }
  return false;
};

/**
 * 显示导航栏
 */
export const showNav = () => {
  const nav = document.querySelector("nav");
  if (nav) nav.style.display = "";
};

/**
 * 渲染锁屏到容器
 * @param {HTMLElement} container
 * @returns {Promise<boolean>} 是否解锁成功
 */
export const renderLock = (container) => {
  return new Promise((resolve) => {
    const nav = document.querySelector("nav");
    if (nav) nav.style.display = "none";

    container.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div class="w-full max-w-sm rounded-2xl border p-8 text-center" style="border-color:var(--border);background-color:var(--bg-card);">
          <p class="text-4xl mb-4">🔐</p>
          <h2 class="text-lg font-bold mb-2" style="color:var(--text);">UsTime</h2>
          <p class="text-sm mb-6" style="color:var(--text-muted);">属于两个人的秘密空间</p>
          <form id="lock-form" class="space-y-3">
            <input
              type="password"
              id="lock-password"
              class="w-full rounded-lg border px-4 py-3 text-center text-lg outline-none focus:border-emerald-500 transition-colors"
              style="border-color:var(--border-light);background-color:var(--bg-input);color:var(--text);"
              placeholder="输入密码..."
              autocomplete="off"
              autofocus
            />
            <p id="lock-error" class="text-xs text-rose-400 hidden">密码错误</p>
            <button
              type="submit"
              class="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 active:scale-[0.98] transition-all"
            >
              🔓 解锁
            </button>
          </form>
        </div>
      </div>
    `;

    const form = document.getElementById("lock-form");
    const errorEl = document.getElementById("lock-error");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pwd = document.getElementById("lock-password").value;
      if (!pwd) return;

      const h = await sha256(pwd);
      if (h === CORRECT_HASH) {
        localStorage.setItem(UNLOCKED_KEY, "1");
        sessionStorage.setItem(UNLOCKED_KEY, "1");
        // 保存密码哈希作为设备标识（用于云端数据隔离）
        localStorage.setItem("ustime_device_key", h);
        resolve(true);
      } else {
        if (errorEl) errorEl.classList.remove("hidden");
      }
    });
  });
};
