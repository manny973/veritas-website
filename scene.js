/* ============================================================
   VERITAS — WebGL 3D scene (Three.js r128, global THREE)
   Exposes window.VeritasScene.init(canvas, { mode })
   mode: 'hero'    → full shield + chevron + particles + wireframe
         'ambient' → lightweight particles + faint wireframe (interior heroes)
   Fails gracefully: returns null and flags <html class="no-webgl">.
   ============================================================ */
window.VeritasScene = (function () {
  'use strict';

  var COL = {
    red:   0xe01e37,
    gold:  0xe8b24a,
    steel: 0x1a1f2a,
    dark:  0x0a0b0e
  };

  function init(canvas, opts) {
    opts = opts || {};
    var mode = opts.mode || 'hero';

    if (!window.THREE || !canvas) {
      document.documentElement.classList.add('no-webgl');
      return null;
    }
    var THREE = window.THREE;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) {
      document.documentElement.classList.add('no-webgl');
      return null;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, mode === 'hero' ? 7.2 : 9);

    var root = new THREE.Group();
    scene.add(root);

    /* ---------- lights ---------- */
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    var key = new THREE.DirectionalLight(0xffffff, 0.95);
    key.position.set(0.5, 2, 8);
    scene.add(key);
    var rimRed = new THREE.PointLight(COL.red, 0.9, 30);
    rimRed.position.set(-6, 1, 3);
    scene.add(rimRed);
    var rimGold = new THREE.PointLight(COL.gold, 0.8, 30);
    rimGold.position.set(6, -2, 4);
    scene.add(rimGold);

    var shieldGroup = null;

    if (mode === 'hero') {
      /* ---------- real logo emblem (stacked layers = faux 3D extrusion) ---------- */
      var tex = new THREE.TextureLoader().load('assets/veritas-mark.png');
      if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

      var markAspect = 452 / 612;        // cropped mark dimensions
      var ph = 2.7, pw = ph * markAspect;
      var planeGeo = new THREE.PlaneGeometry(pw, ph);

      shieldGroup = new THREE.Group();
      var layers = 11, depth = 0.36;
      var cNear = new THREE.Color(0x7a1019), cFar = new THREE.Color(0x230409);
      for (var li = layers - 1; li >= 0; li--) {     // build back-to-front
        var f = li / (layers - 1);                   // 1 = back, 0 = front face
        var isFront = (li === 0);
        var mat = new THREE.MeshBasicMaterial({
          map: tex, transparent: true, alphaTest: 0.5,
          color: isFront ? 0xffffff : cNear.clone().lerp(cFar, f),
          depthWrite: true
        });
        var pl = new THREE.Mesh(planeGeo, mat);
        pl.position.z = -f * depth;
        shieldGroup.add(pl);
      }
      shieldGroup.position.set(0.15, 0.05, 0);
      root.add(shieldGroup);
    }

    /* ---------- particle field ---------- */
    var pCount = mode === 'hero' ? 700 : 420;
    var positions = new Float32Array(pCount * 3);
    var colors = new Float32Array(pCount * 3);
    var cGold = new THREE.Color(COL.gold);
    var cRed = new THREE.Color(COL.red);
    var rIn = mode === 'hero' ? 3.0 : 3.5;
    for (var i = 0; i < pCount; i++) {
      var r = rIn + Math.random() * 5.5;
      var th = Math.random() * Math.PI * 2;
      var ph = Math.acos(2 * Math.random() - 1);
      positions[i*3]   = r * Math.sin(ph) * Math.cos(th);
      positions[i*3+1] = r * Math.sin(ph) * Math.sin(th) * 0.7;
      positions[i*3+2] = r * Math.cos(ph) * 0.7 - 1.5;
      var c = Math.random() > 0.5 ? cGold : cRed;
      colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
    }
    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    var pMat = new THREE.PointsMaterial({
      size: 0.045, vertexColors: true, transparent: true,
      opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false
    });
    var points = new THREE.Points(pGeo, pMat);
    root.add(points);

    /* ---------- faint wireframe shell ---------- */
    var shell = new THREE.LineSegments(
      new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(mode === 'hero' ? 4.2 : 4.8, 1)),
      new THREE.LineBasicMaterial({ color: COL.gold, transparent: true, opacity: 0.045 })
    );
    root.add(shell);

    /* ---------- interaction / loop ---------- */
    var targetX = 0, targetY = 0, curX = 0, curY = 0;
    var raf = null, running = true, t0 = performance.now();

    function onMove(e) {
      var nx = (e.clientX / window.innerWidth) * 2 - 1;
      var ny = (e.clientY / window.innerHeight) * 2 - 1;
      targetX = nx * 0.5;
      targetY = ny * 0.35;
    }
    window.addEventListener('pointermove', onMove, { passive: true });

    function fitCamera() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      var pr = renderer.getPixelRatio();
      if (canvas.width !== Math.round(w * pr) || canvas.height !== Math.round(h * pr)) {
        renderer.setSize(w, h, false);
      }
      var aspect = w / h;
      camera.aspect = aspect;
      var vt = Math.tan(camera.fov * Math.PI / 360); // tan(vfov/2)
      // region to keep in frame (half-extents) + optional right-offset for the shield
      var H = mode === 'hero' ? 1.55 : 2.4;
      var W = mode === 'hero' ? 1.15 : 2.4;
      var wide = aspect > 1.2;
      var offset = (mode === 'hero' && shieldGroup && wide) ? 1.15 : 0;
      var distH = H / vt;
      var distW = (W + offset) / (vt * aspect);
      camera.position.z = Math.max(distH, distW) + 0.6;
      camera.position.x = -offset;
      camera.updateProjectionMatrix();
    }

    function frame(now) {
      if (!running) return;
      var t = (now - t0) / 1000;
      fitCamera();
      curX += (targetX - curX) * 0.05;
      curY += (targetY - curY) * 0.05;

      if (shieldGroup) {
        shieldGroup.rotation.y = curX * 0.5 + Math.sin(t * 0.45) * 0.22;
        shieldGroup.rotation.x = curY * 0.35 + Math.sin(t * 0.4) * 0.04;
        shieldGroup.position.y = 0.05 + Math.sin(t * 0.6) * 0.08;
      }
      points.rotation.y = t * 0.03 + curX * 0.15;
      points.rotation.x = curY * 0.1;
      shell.rotation.y = -t * 0.04;
      shell.rotation.x = t * 0.02;
      root.rotation.y += ((curX * 0.25) - root.rotation.y) * 0.04;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    window.__vdbg = function () {
      return {
        mode: mode, z: +camera.position.z.toFixed(2), x: +camera.position.x.toFixed(2),
        aspect: +camera.aspect.toFixed(3),
        cw: canvas.clientWidth, ch: canvas.clientHeight, bw: canvas.width, bh: canvas.height,
        hasShield: !!shieldGroup
      };
    };

    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running && !raf) { t0 = performance.now(); raf = requestAnimationFrame(frame); }
      if (!running && raf) { cancelAnimationFrame(raf); raf = null; }
    });

    return {
      destroy: function () {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', onMove);
        renderer.dispose();
      }
    };
  }

  return { init: init };
})();
