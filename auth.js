/* In Smoke We Trust — prijava i veza sa Supabase bazom.
 * Dashboard (index.html) traži bazu preko window.claude.use("db"). Ovaj fajl pravi taj most:
 * - prijava emailom (jednokratni link), samo za emailove iz tabele "members"
 * - čitanje i čuvanje meseci u tabeli "months", uživo osvežavanje
 * - preuzimanje Excel fajla direktno u pregledaču
 */
(function () {
  "use strict";
  var cfg = window.ISWT_CONFIG || {};
  var configured = !!(cfg.supabaseUrl && cfg.supabaseAnonKey &&
    cfg.supabaseUrl.indexOf("TVOJ") < 0 && cfg.supabaseAnonKey.indexOf("TVOJ") < 0 && window.supabase);
  var sb = configured ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }) : null;

  var session = null;          // {email, role}
  var resolveReady;
  var ready = new Promise(function (r) { resolveReady = r; });

  /* ---------------- ekran za prijavu ---------------- */
  var css = "" +
    "#gate{position:fixed;inset:0;z-index:50;background:var(--bg,#0c0a0b);color:var(--fg,#f5f2f3);display:grid;place-items:center;padding:24px 16px;font-family:var(--body,Montserrat,Helvetica,Arial,sans-serif)}" +
    "#gate .box{width:100%;max-width:420px;display:grid;gap:16px}" +
    "#gate .wm{font-family:var(--display,'Bebas Neue',Impact,sans-serif);font-size:44px;line-height:.85}" +
    "#gate .wm b{display:block;font-family:var(--drip,'Rubik Wet Paint',Impact,sans-serif);font-weight:400;color:var(--pink,#f172a5)}" +
    "#gate h1{font-family:var(--display,'Bebas Neue',Impact,sans-serif);font-weight:400;font-size:28px;margin:0;letter-spacing:.02em}" +
    "#gate p{margin:0;color:var(--muted,#9d9396);font-size:14px;line-height:1.5}" +
    "#gate p b{color:var(--fg,#f5f2f3)}" +
    "#gate input{background:var(--panel-2,#1e1a1b);border:1px solid var(--line,#2d2728);color:var(--fg,#f5f2f3);border-radius:6px;padding:12px;font:500 15px var(--body,Montserrat,sans-serif);width:100%}" +
    "#gate input:focus{outline:2px solid var(--pink,#f172a5);outline-offset:1px}" +
    "#gate button{background:var(--pink,#f172a5);color:var(--bg,#0c0a0b);border:0;border-radius:6px;padding:12px;font:700 13px var(--body,Montserrat,sans-serif);letter-spacing:.08em;text-transform:uppercase;cursor:pointer}" +
    "#gate button:disabled{opacity:.6;cursor:default}" +
    "#gate .msg{font-size:13px;min-height:1.5em}" +
    "#gate .err{color:var(--neg,#ff6b6b)}" +
    "#gate .ghost{background:none;color:var(--muted,#9d9396);border:1px solid var(--line,#2d2728)}" +
    ".logout{font:600 11px var(--body,Montserrat,sans-serif);letter-spacing:.06em;text-transform:uppercase;background:none;border:1px solid var(--line,#2d2728);color:var(--muted,#9d9396);border-radius:99px;padding:4px 10px;cursor:pointer;align-self:center;white-space:nowrap}" +
    ".logout:hover{color:var(--fg,#f5f2f3)}";
  function el(tag, attrs, html) { var e = document.createElement(tag); for (var k in attrs || {}) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function gate(inner) {
    var g = document.getElementById("gate");
    if (!g) { g = el("div", { id: "gate", role: "dialog", "aria-modal": "true" }); document.body.appendChild(g); }
    g.innerHTML = '<div class="box"><div class="wm" aria-label="In Smoke We Trust">IN<b>SMOKE</b>WE TRUST</div>' + inner + "</div>";
    g.hidden = false;
    return g;
  }
  function hideGate() { var g = document.getElementById("gate"); if (g) g.hidden = true; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function showNotConfigured() {
    gate('<h1>Alat još nije povezan sa bazom</h1><p>Upiši Supabase adresu i javni ključ u fajl <b>config.js</b>, pa osveži stranicu. Uputstvo je u README.md.</p>');
  }
  function showLogin(note) {
    var g = gate('<h1>Finansijski dashboard</h1>' +
      '<p>Upiši svoj email. Poslaćemo ti link za prijavu — otvori ga <b>na ovom uređaju, u ovom pregledaču</b>.</p>' +
      '<form id="gateForm" novalidate><div style="display:grid;gap:10px">' +
      '<label for="gateEmail" style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--muted,#9d9396)">Email</label>' +
      '<input id="gateEmail" type="email" autocomplete="email" inputmode="email" required placeholder="ime@primer.rs">' +
      '<button id="gateBtn" type="submit">Pošalji link za prijavu</button></div></form>' +
      '<p class="msg" id="gateMsg" role="status">' + (note || "") + "</p>");
    g.querySelector("#gateForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      var email = g.querySelector("#gateEmail").value.trim().toLowerCase();
      var msg = g.querySelector("#gateMsg"), btn = g.querySelector("#gateBtn");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.className = "msg err"; msg.textContent = "Upiši ispravan email, npr. ime@primer.rs."; return; }
      btn.disabled = true; msg.className = "msg"; msg.textContent = "Šaljem…";
      var res = await sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true } });
      btn.disabled = false;
      if (res.error) {
        msg.className = "msg err";
        msg.textContent = /rate|limit|seconds/i.test(res.error.message) ? "Previše pokušaja. Sačekaj minut pa probaj ponovo." : "Slanje nije uspelo: " + res.error.message;
      } else {
        msg.className = "msg";
        msg.innerHTML = "Link je poslat na <b>" + esc(email) + "</b>. Otvori mejl i klikni na link. Ako ga ne vidiš, proveri Spam.";
      }
    });
  }
  function showDenied(email) {
    var g = gate('<h1>Nemaš pristup</h1><p>Nalog <b>' + esc(email) + '</b> nije na spisku članova ovog alata. Zamoli administratora da te doda, pa se prijavi ponovo.</p>' +
      '<button class="ghost" id="gateOut" type="button">Prijavi se drugim emailom</button>');
    g.querySelector("#gateOut").onclick = async function () { await sb.auth.signOut(); showLogin(); };
  }
  function addLogout(email) {
    var nav = document.querySelector("nav.tabs");
    if (!nav || document.querySelector(".logout")) return;
    var b = el("button", { type: "button", class: "logout", title: email }, "Odjava");
    b.onclick = async function () { await sb.auth.signOut(); location.reload(); };
    nav.appendChild(b);
  }

  async function check() {
    var s = await sb.auth.getSession();
    var sess = s && s.data && s.data.session;
    if (!sess) { showLogin(); return; }
    var email = String(sess.user.email || "").toLowerCase();
    var r = await sb.from("members").select("role").eq("email", email).maybeSingle();
    if (r.error) { showLogin('<span class="err">Veza sa bazom nije uspela: ' + esc(r.error.message) + "</span>"); return; }
    if (!r.data) { showDenied(email); return; }
    session = { email: email, role: r.data.role };
    hideGate(); addLogout(email); resolveReady(session);
  }

  function boot() {
    var st = el("style", null, css); document.head.appendChild(st);
    if (!configured) { showNotConfigured(); return; }
    gate('<p>Proveravam prijavu…</p>');
    sb.auth.onAuthStateChange(function (ev) { if (ev === "SIGNED_IN" && !session) setTimeout(check, 0); });
    check();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  /* ---------------- most prema dashboardu ---------------- */
  function dbError(e) {
    var denied = e && (e.code === "42501" || /row-level security|permission denied/i.test(e.message || ""));
    return { code: denied ? "invalid_argument" : "unavailable", message: (e && e.message) || "" };
  }
  function toDoc(r) { return { key: r.key, period: r.period, state: r.state, summary: r.summary, updatedAt: r.updated_at, by: r.client }; }
  function snapOf(rows) { return { docs: rows.map(function (r) { return { data: function () { return toDoc(r); } }; }), metadata: { fromCache: false } }; }

  var db = {
    collection: function () {
      var q = {
        get: async function () {
          var r = await sb.from("months").select("*");
          if (r.error) throw dbError(r.error);
          return snapOf(r.data || []);
        },
        onSnapshot: function (next, onErr) {
          var busy = false;
          var refetch = async function () {
            if (busy) return; busy = true;
            try { next(await q.get()); } catch (e) { if (onErr) onErr(e); }
            busy = false;
          };
          var ch = sb.channel("months-live")
            .on("postgres_changes", { event: "*", schema: "public", table: "months" }, refetch)
            .subscribe();
          var iv = setInterval(refetch, 60000);
          return function () { sb.removeChannel(ch); clearInterval(iv); };
        }
      };
      return q;
    },
    doc: function (path) {
      var parts = path.split("/"), col = parts[0], id = parts[1];
      if (col === "months") return {
        get: async function () {
          var r = await sb.from("months").select("*").eq("key", id).maybeSingle();
          if (r.error) throw dbError(r.error);
          return { exists: !!r.data, data: function () { return r.data ? toDoc(r.data) : undefined; } };
        },
        set: async function (b) {
          var r = await sb.from("months").upsert({
            key: id, period: b.period, state: b.state, summary: b.summary,
            updated_at: b.updatedAt, client: b.by, updated_by: session ? session.email : null
          });
          if (r.error) throw dbError(r.error);
        }
      };
      if (col === "meta") return {
        get: async function () {
          var r = await sb.from("app_meta").select("current").eq("id", 1).maybeSingle();
          if (r.error) throw dbError(r.error);
          return { exists: !!r.data, data: function () { return r.data || undefined; } };
        },
        set: async function (b) {
          var r = await sb.from("app_meta").upsert({ id: 1, current: b.current });
          if (r.error) throw dbError(r.error);
        }
      };
      throw new TypeError("Nepoznata putanja: " + path);
    }
  };

  var downloads = {
    save: async function (o) {
      var blob = o.data instanceof Blob ? o.data : new Blob([o.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a"); a.href = url; a.download = o.filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
      return { status: "saved" };
    }
  };

  window.claude = {
    use: async function (name) {
      if (name === "downloads") return downloads;
      if (!configured) return null;
      var s = await ready;
      if (name === "db") return s ? db : null;
      if (name === "user") return {
        can: async function (k) { return k === "data.write" ? s.role === "editor" : null; },
        canEdit: async function () { return s.role === "editor"; },
        isOwner: async function () { return false; }
      };
      return null;
    }
  };
})();
