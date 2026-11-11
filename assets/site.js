// Trang cá nhân: đổi ngôn ngữ, HUD, Chillbara pixel 3D ở hero (Three.js), tia warp khi cuộn.
(function () {
  var root = document.documentElement;
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Ngôn ngữ ----------
  var buttons = document.querySelectorAll(".lang button");
  function setLang(lang, save) {
    root.dataset.lang = lang;
    root.lang = lang;
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.set === lang)); });
    if (save) {
      try { localStorage.setItem("lang", lang); } catch (e) {}
      document.querySelectorAll('.scr[data-l="' + lang + '"]').forEach(scramble);
    }
  }
  var saved = null;
  try { saved = localStorage.getItem("lang"); } catch (e) {}
  setLang(saved === "vi" || saved === "en" ? saved : "en", false);
  buttons.forEach(function (b) { b.addEventListener("click", function () { setLang(b.dataset.set, true); }); });

  // ---------- Chữ giải mã dần ----------
  var GLYPHS = "■▪▮░▒<>/[]{}=+*#01";
  function scramble(el) {
    if (calm) return;
    var text = el.dataset.text || (el.dataset.text = el.textContent);
    var start = performance.now(), dur = Math.min(1800, 500 + text.length * 12);
    (function step(now) {
      var k = Math.min(1, (now - start) / dur), shown = Math.floor(text.length * k), out = text.slice(0, shown);
      for (var i = shown; i < Math.min(text.length, shown + 6); i++) {
        out += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (k < 1) requestAnimationFrame(step); else el.textContent = text;
    })(start);
  }
  setTimeout(function () {
    document.querySelectorAll('.scr[data-l="' + root.dataset.lang + '"]').forEach(scramble);
  }, 700);

  // ---------- HUD: lưới, đồng hồ, tọa độ ----------
  var grid = document.querySelector(".grid");
  function crosses() {
    grid.innerHTML = "";
    var pad = parseFloat(getComputedStyle(root).getPropertyValue("--pad")) || 56;
    var w = window.innerWidth, h = window.innerHeight, cols = w > 900 ? 3 : 1;
    for (var c = 0; c <= cols; c++) {
      for (var r = 1; r <= 2; r++) {
        var i = document.createElement("i");
        i.style.left = pad + ((w - pad * 2) / cols) * c + "px";
        i.style.top = (h / 3) * r + "px";
        grid.appendChild(i);
      }
    }
  }
  crosses();
  window.addEventListener("resize", crosses);

  var clock = document.getElementById("clock");
  function tick() {
    var t = new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });
    clock.textContent = "GMT+7 VN " + t;
  }
  tick();
  setInterval(tick, 20000);

  var coords = document.getElementById("coords");
  var mouse = { x: 0, y: 0, nx: 0, ny: 0, on: false };
  function pad4(n) { return ("0000" + Math.max(0, Math.round(n))).slice(-4); }
  window.addEventListener("pointermove", function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true;
    mouse.nx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ny = -(e.clientY / window.innerHeight) * 2 + 1;
    coords.textContent = pad4(e.clientX) + " X " + pad4(e.clientY) + " Y";
  }, { passive: true });

  // ---------- Tranh pixel Chillbara (13 x 13) cho hero 3D ----------
  var N = 13;
  var ART = [
    ".....YY......",
    "....OYYYY....",
    ".DD..YYYY.DD.",
    ".DBBBBBBBBBD.",
    ".BBBBBBBBBBB.",
    "BBKKBBBBBKKBB",
    "BBBBBBBBBBBBB",
    "BBBBSSSSSBBBB",
    "BBBSSKSKSSBBB",
    "BBBSSSSSSSBBB",
    "BBBBSSSSSBBBB",
    "WFBBBBBBBBBFW",
    "WWWFWWWWWFWWW"
  ];
  var PALETTE = { B: 0xc07a3e, D: 0x8a5327, S: 0x9a5f30, K: 0x24160b, Y: 0xffc531, O: 0xff7a2e, W: 0x7fb6dc, F: 0xffffff };

  // ---------- Hero 3D: các khối bay vào ghép thành Chillbara ----------
  (function hero() {
    var canvas = document.getElementById("gl"), T = window.THREE;
    if (!canvas || !T) return;
    var renderer;
    try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new T.Scene();
    var cam = new T.PerspectiveCamera(35, 1, 0.1, 100);
    cam.position.set(0, 0, 14);
    scene.add(new T.AmbientLight(0xffffff, 0.5));
    var key = new T.DirectionalLight(0xffffff, 0.62); key.position.set(-4, 6, 8); scene.add(key);
    var lime = new T.PointLight(0xffe2a8, 0.45, 30); lime.position.set(7, -3, 5); scene.add(lime);
    var blue = new T.PointLight(0x8fa2ff, 0.5, 30); blue.position.set(-7, 2, 4); scene.add(blue);

    var cells = [];
    ART.forEach(function (row, ry) {
      row.split("").forEach(function (ch, rx) {
        if (ch === ".") return;
        var x = rx - (N - 1) / 2, y = (N - 1) / 2 - ry;
        var a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1), rad = 14 + Math.random() * 14;
        cells.push({
          hx: x, hy: y, color: PALETTE[ch],
          sx: Math.sin(b) * Math.cos(a) * rad, sy: Math.sin(b) * Math.sin(a) * rad, sz: Math.cos(b) * rad,
          rx: Math.random() * 6 - 3, ry: Math.random() * 6 - 3, rz: Math.random() * 6 - 3,
          delay: Math.random() * 0.9 + Math.hypot(x, y) * 0.05, lift: 0
        });
      });
    });

    var mesh = new T.InstancedMesh(
      new T.BoxGeometry(0.84, 0.84, 0.84),
      new T.MeshStandardMaterial({ roughness: 0.45, metalness: 0.05 }),
      cells.length
    );
    mesh.frustumCulled = false;
    var tint = new T.Color();
    cells.forEach(function (c, i) { mesh.setColorAt(i, tint.setHex(c.color)); });
    mesh.instanceColor.needsUpdate = true;

    var group = new T.Group();
    group.add(mesh);
    scene.add(group);

    var baseX = 0, baseY = 0;
    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      var visH = 2 * 14 * Math.tan((35 * Math.PI) / 360), visW = visH * cam.aspect;
      var wide = w > 900;
      group.scale.setScalar(Math.min(0.36, (visW * (wide ? 0.3 : 0.74)) / N));
      baseX = wide ? visW * 0.24 : 0;
      baseY = wide ? -0.1 : 0.7;
    }
    resize();
    window.addEventListener("resize", resize);

    var visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(canvas);
    }

    var dummy = new T.Object3D(), ray = new T.Raycaster(), plane = new T.Plane(), hit = new T.Vector3();
    var normal = new T.Vector3(), ndc = new T.Vector2(), local = new T.Vector3(1e6, 1e6, 0);
    var tiltX = 0, tiltY = 0, t0 = performance.now();
    function ease(k) { return k < 0 ? 0 : k > 1 ? 1 : 1 - Math.pow(1 - k, 4); }

    function frame(now) {
      if (!calm) requestAnimationFrame(frame);
      if (!visible && !calm) return;
      var t = calm ? 10 : (now - t0) / 1000;
      var scatter = Math.min(1, window.scrollY / (window.innerHeight * 0.9));

      tiltX += ((mouse.on ? mouse.ny : 0) * 0.28 - tiltX) * 0.05;
      tiltY += ((mouse.on ? mouse.nx : 0) * 0.42 - tiltY) * 0.05;
      group.rotation.set(-0.3 - tiltX + Math.sin(t * 0.5) * 0.05, -0.38 + tiltY + Math.cos(t * 0.4) * 0.08, 0.06);
      group.position.set(baseX, baseY + Math.sin(t * 0.8) * 0.12, 0);
      group.updateMatrixWorld();

      // Con trỏ chiếu lên mặt phẳng tranh: khối ở gần sẽ trồi lên.
      local.set(1e6, 1e6, 0);
      if (mouse.on) {
        ndc.set(mouse.nx, mouse.ny);
        ray.setFromCamera(ndc, cam);
        normal.set(0, 0, 1).transformDirection(group.matrixWorld);
        plane.setFromNormalAndCoplanarPoint(normal, group.position);
        if (ray.ray.intersectPlane(plane, hit)) { local.copy(hit); group.worldToLocal(local); }
      }

      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        var a = ease((t - c.delay) / 1.8) * (1 - ease(scatter * 1.15 - c.delay * 0.12));
        var dx = c.hx - local.x, dy = c.hy - local.y;
        var target = Math.exp(-(dx * dx + dy * dy) / 5) * 1.6;
        c.lift += (target - c.lift) * 0.12;
        var wave = Math.sin(Math.hypot(c.hx, c.hy) * 0.7 - t * 1.6) * 0.22;
        dummy.position.set(
          c.sx + (c.hx - c.sx) * a,
          c.sy + (c.hy - c.sy) * a,
          c.sz + ((wave + c.lift) * a - c.sz) * a
        );
        dummy.rotation.set(c.rx * (1 - a) * 2, c.ry * (1 - a) * 2, c.rz * (1 - a) * 2);
        dummy.scale.setScalar(0.35 + 0.65 * a + c.lift * 0.08);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, cam);
    }
    requestAnimationFrame(frame);
  })();

  // ---------- Warp: tia sáng tỏa từ tâm, nhanh dần theo cuộn ----------
  (function warp() {
    var section = document.querySelector(".warp"), canvas = document.getElementById("warp");
    if (!section || !canvas) return;
    var ctx = canvas.getContext("2d"), shout = section.querySelector(".shout"), rules = section.querySelector(".rules");
    var COLORS = ["#7df9ff", "#7b5cff", "#3a6cff", "#b388ff", "#ffffff", "#c8f031"];
    var w = 0, h = 0, dpr = 1, rays = [], visible = false, last = 0;
    function spawn(r) {
      r.a = Math.random() * Math.PI * 2;
      r.d = Math.random() * 0.25;
      r.v = 0.12 + Math.random() * 0.35;
      r.len = 0.04 + Math.random() * 0.12;
      r.c = COLORS[(Math.random() * (COLORS.length - (Math.random() > 0.12 ? 1 : 0))) | 0];
      r.w = 1 + Math.random() * 2.2;
      return r;
    }
    for (var i = 0; i < 420; i++) { var r = spawn({}); r.d = Math.random(); rays.push(r); }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
    }
    resize();
    window.addEventListener("resize", resize);
    function smooth(a, b, x) { var k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); }

    function frame(now) {
      if (!calm) requestAnimationFrame(frame);
      if (!visible && !calm) { last = now; return; }
      var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
      var rect = section.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, -rect.top / (rect.height - window.innerHeight)));
      shout.style.setProperty("--a", (1 - smooth(0.3, 0.5, p)).toFixed(3));
      shout.style.setProperty("--s", (1 + p * 0.5).toFixed(3));
      rules.style.setProperty("--b", smooth(0.5, 0.7, p).toFixed(3));

      var speed = 0.35 + p * 2.6, count = Math.round(140 + p * 280);
      var cx = w / 2, cy = h / 2, R = Math.hypot(w, h) / 2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = "round";
      for (var i = 0; i < count; i++) {
        var r = rays[i];
        r.d += r.v * speed * dt * (0.25 + r.d * 1.8);
        if (r.d > 1.15) spawn(r);
        var d0 = r.d * r.d, d1 = d0 + r.len * (0.4 + r.d * 2) * (0.6 + p);
        var cs = Math.cos(r.a), sn = Math.sin(r.a);
        ctx.globalAlpha = Math.min(1, r.d * 3);
        ctx.strokeStyle = r.c;
        ctx.lineWidth = r.w * (0.4 + r.d * 1.4);
        ctx.beginPath();
        ctx.moveTo(cx + cs * d0 * R, cy + sn * d0 * R);
        ctx.lineTo(cx + cs * d1 * R, cy + sn * d1 * R);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(section);
    } else { visible = true; }
    requestAnimationFrame(frame);
  })();

  // ---------- Hiện dần khi cuộn ----------
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach(function (el) { io.observe(el); });
})();
