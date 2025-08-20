/* ====== 設定（あなたの値に置換） ====== */
const USER_POOL_DOMAIN = "https://titti.auth.ap-northeast-1.amazoncognito.com";
const CLIENT_ID        = "5138394cla6q4mnvber6p9i2af";
const REDIRECT_URI     = "https://d271qmc6nzrst9.cloudfront.net/auth/callback.html";
const LOGOUT_REDIRECT  = "https://d271qmc6nzrst9.cloudfront.net/";
/* ====================================== */

// 年表示
document.getElementById('y')?.append(document.createTextNode(new Date().getFullYear()));

// モバイルメニュー
const hamburger = document.getElementById('hamburger');
const menuPanel = document.getElementById('menuPanel');
hamburger?.addEventListener('click', ()=> menuPanel.classList.toggle('open'));

// base64url → JSON
function b64urlDecode(s){ s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4)s+='='; return atob(s); }
function parseJwt(t){ const p=t.split('.'); if(p.length!==3) throw new Error('bad jwt'); return JSON.parse(b64urlDecode(p[1])); }

// サインイン状態を反映（単一のstatus / loginBtn / logoutBtnのみ）
function reflectSignin(){
  const t = localStorage.getItem("id_token");
  const status   = document.getElementById("status");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn= document.getElementById("logoutBtn");

  if(!t){
    status.textContent = "Not signed in";
    loginBtn.classList.remove("hidden");
    logoutBtn.classList.add("hidden");
    return;
  }
  try{
    const p = parseJwt(t);
    const who = p.email || p["cognito:username"] || p.sub;
    status.textContent = `Signed in as ${who}`;
  }catch{
    status.textContent = "Signed in";
  }
  loginBtn.classList.add("hidden");
  logoutBtn.classList.remove("hidden");
}
reflectSignin();

// PKCEユーティリティ
const rand = (len)=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(len)))).replace(/[^a-zA-Z0-9]/g,"").slice(0,len);
async function sha256b64url(str){
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

// Sign in（Hosted UIへ）
document.getElementById("loginBtn")?.addEventListener("click", async ()=>{
  localStorage.removeItem("pkce_verifier");
  localStorage.removeItem("oauth_state");

  const verifier = rand(64);
  const challenge = await sha256b64url(verifier);
  const state = rand(24);
  localStorage.setItem("pkce_verifier", verifier);
  localStorage.setItem("oauth_state", state);

  const url = new URL(USER_POOL_DOMAIN + "/oauth2/authorize");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("state", state);
  window.location.href = url.toString();
});

// Sign out（Hosted UI経由）
document.getElementById("logoutBtn")?.addEventListener("click", ()=>{
  localStorage.removeItem("id_token");
  const url = new URL(USER_POOL_DOMAIN + "/logout");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("logout_uri", LOGOUT_REDIRECT);
  window.location.href = url.toString();
});
