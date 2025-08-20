/* ====== 設定（index.html の app.js と同じ値に揃える） ====== */
const USER_POOL_DOMAIN = "https://titti.auth.ap-northeast-1.amazoncognito.com";
const CLIENT_ID        = "5138394cla6q4mnvber6p9i2af";
const REDIRECT_URI     = "https://d271qmc6nzrst9.cloudfront.net/auth/callback.html";
const HOME             = "https://d271qmc6nzrst9.cloudfront.net/";
/* ========================================================== */

(async () => {
  // 1) code / state を取得
  const q = new URLSearchParams(location.search);
  const code  = q.get("code");
  const state = q.get("state");
  if (!code || !state) { location.replace(HOME); return; }

  // 2) PKCE 検証（保存分と一致するか）
  const verifier       = localStorage.getItem("pkce_verifier");
  const expectedState  = localStorage.getItem("oauth_state");
  if (!verifier || state !== expectedState) { location.replace(HOME); return; }

  // 3) トークン交換
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier
  });

  try {
    const res = await fetch(`${USER_POOL_DOMAIN}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    if (!res.ok) { location.replace(HOME); return; }
    const json = await res.json();

    // 4) 後片付け & 保存
    localStorage.removeItem("pkce_verifier");
    localStorage.removeItem("oauth_state");
    if (json.id_token)     localStorage.setItem("id_token", json.id_token);
    if (json.access_token) localStorage.setItem("access_token", json.access_token);

    // 5) ホームへ（絶対URLで同一オリジンへ戻す）
    location.replace(HOME);
  } catch {
    location.replace(HOME);
  }
})();
