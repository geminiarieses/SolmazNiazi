/* "Longing for Union" (تمنای وصال), the brooch, rebuilt in code and seen
   from straight above. Ray-marched in a fragment shader:
   - a dark sanded base and a thin silver band at the rim,
   - folded, labyrinth-like walls of asphalt-black Alumide (the contour lines
     of a ruffled field, so the walls meander and close like a maze),
   - a mirror-polished silver dome at the centre that reflects the sky:
     a black hole with its glowing ring, and stars.
   The light stays fixed while the brooch turns, so it slides along the folds.
   Usage: Brooch(canvas, state) where state(now) -> { rot, tiltX, tiltY, time } */
(function () {
  "use strict";
  var VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes; uniform float uRot; uniform float uTime; uniform vec2 uTilt; uniform float uSteps; uniform float uZoom;",
    "const float PI = 3.14159265;",
    "float hash(vec3 p){ p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }",
    // the ruffled field whose zero-lines are the walls
    "float field(vec2 q){",
    "  float r = length(q); float a = atan(q.y, q.x);",
    "  return sin(r * 17.0 + 1.9 * sin(6.0 * a + 0.6 + r * 3.0) + 1.1 * sin(11.0 * a + r * 9.0) + 0.6 * sin(17.0 * a - 3.0 * r));",
    "}",
    "float wallTop(vec2 q){ float a = atan(q.y, q.x); return 0.21 + 0.04 * sin(7.0 * a + length(q) * 9.0) + 0.025 * sin(19.0 * a); }",
    "vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }",
    // returns (distance, material)
    "vec2 map(vec3 p){",
    "  vec3 o = vec3(rot(p.xz, uRot), 0.0); o = vec3(o.x, p.y, o.y);",
    "  float r = length(o.xz);",
    "  vec2 res = vec2(1e5, 0.0);",
    // base (sanded) and silver band
    "  float base = max(r - 0.985, abs(o.y + 0.20) - 0.06);",
    "  if (base < res.x) res = vec2(base, 5.0);",
    "  float band = max(abs(r - 0.99) - 0.012, abs(o.y + 0.115) - 0.03);",
    "  if (band < res.x) res = vec2(band, 2.0);",
    // floor between the walls
    "  float floorD = max(r - 0.975, abs(o.y + 0.11) - 0.02);",
    "  if (floorD < res.x) res = vec2(floorD, 1.0);",
    // walls: contour of the ruffled field, inside the annulus
    "  vec2 q = o.xz; float e = 0.004;",
    "  float g = field(q);",
    "  vec2 gr = vec2(field(q + vec2(e, 0.0)) - field(q - vec2(e, 0.0)), field(q + vec2(0.0, e)) - field(q - vec2(0.0, e))) / (2.0 * e);",
    "  float w2 = abs(g) / max(length(gr), 1.0) - 0.009;",
    "  float wall = max(w2, max(o.y - wallTop(q), -o.y - 0.10));",
    "  wall = max(wall, max(0.335 - r, r - 0.955));",
    "  if (wall < res.x) res = vec2(wall, 3.0);",
    // the mirror dome
    "  float dome = max(length(o - vec3(0.0, -0.13, 0.0)) - 0.33, -o.y - 0.10);",
    "  if (dome < res.x) res = vec2(dome, 4.0);",
    "  return res;",
    "}",
    "vec3 calcNormal(vec3 p){ vec2 e = vec2(0.0015, 0.0);",
    "  return normalize(vec3(map(p + e.xyy).x - map(p - e.xyy).x, map(p + e.yxy).x - map(p - e.yxy).x, map(p + e.yyx).x - map(p - e.yyx).x)); }",
    // the sky the mirror sees: a black hole overhead, stars, one soft studio light
    "vec3 env(vec3 d){",
    "  vec3 col = vec3(0.0);",
    "  vec3 c = floor(d * 120.0); if (hash(c) > 0.987) col += vec3(1.0, 0.92, 0.82) * smoothstep(0.45, 0.0, length(fract(d * 120.0) - 0.5));",
    "  vec3 bh = normalize(vec3(0.15, 1.0, -0.1));",
    "  float ang = acos(clamp(dot(d, bh), -1.0, 1.0));",
    "  float ring = exp(-pow((ang - 0.36) / 0.05, 2.0)) * (0.8 + 0.6 * sin(atan(d.z, d.x) * 3.0 + uTime * 0.6));",
    "  col += vec3(1.0, 0.55, 0.22) * ring * 1.4 + vec3(1.0, 0.85, 0.65) * exp(-pow((ang - 0.31) / 0.012, 2.0)) * 1.6;",
    "  col *= smoothstep(0.27, 0.30, ang);",                        // the shadow
    "  vec3 L = normalize(vec3(-0.55, 0.75, 0.38));",
    "  col += vec3(1.0, 0.97, 0.92) * pow(max(dot(d, L), 0.0), 90.0) * 6.0;",
    "  col += vec3(0.55, 0.5, 0.48) * pow(max(dot(d, L), 0.0), 6.0) * 0.35;",
    "  col += vec3(0.30, 0.29, 0.28) * smoothstep(0.1, 0.9, d.y) * smoothstep(0.26, 0.6, ang) + vec3(0.05) * smoothstep(-0.4, 0.2, d.y);",
    "  return col;",
    "}",
    "float shadow(vec3 ro, vec3 rd){ float res = 1.0, t = 0.02;",
    "  for (int i = 0; i < 28; i++){ float h = map(ro + rd * t).x; res = min(res, 9.0 * h / t); t += clamp(h, 0.01, 0.08); if (res < 0.02 || t > 1.5) break; }",
    "  return clamp(res, 0.0, 1.0); }",
    "float ao(vec3 p, vec3 n){ float o = 0.0, s = 1.0; for (int i = 1; i < 5; i++){ float h = 0.03 * float(i); o += (h - map(p + n * h).x) * s; s *= 0.6; } return clamp(1.0 - 3.5 * o, 0.0, 1.0); }",
    "void main(){",
    "  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);",
    "  vec3 ro = vec3(uTilt.x / uZoom, 3.4 / uZoom, uTilt.y / uZoom);",
    "  vec3 fw = normalize(-ro); vec3 rt = normalize(cross(fw, vec3(0.0, 0.0, -1.0))); vec3 up = cross(rt, fw);",
    "  vec3 rd = normalize(fw * 3.0 + uv.x * rt * 2.1 + uv.y * up * 2.1);",
    "  float t = max(0.02, ro.y - 0.8); float tMax = ro.y + 1.2; vec2 h = vec2(0.0); bool hit = false;",
    "  for (int i = 0; i < 160; i++){",
    "    if (float(i) >= uSteps) break;",
    "    h = map(ro + rd * t);",
    "    if (h.x < 0.0008) { hit = true; break; }",
    "    t += h.x * 0.75; if (t > tMax) break;",
    "  }",
    "  if (!hit) { gl_FragColor = vec4(0.0); return; }",
    "  vec3 p = ro + rd * t, n = calcNormal(p);",
    "  vec3 L = normalize(vec3(-0.55, 0.75, 0.38));",
    "  float dif = max(dot(n, L), 0.0), sh = shadow(p + n * 0.004, L), oc = ao(p, n);",
    "  vec3 refl = reflect(rd, n);",
    "  vec3 o = vec3(rot(p.xz, uRot), 0.0); o = vec3(o.x, p.y, o.y);",  // object space, so the grain turns with the brooch
    "  vec3 col;",
    "  float m = h.y;",
    "  if (m > 3.5 && m < 4.5) {",                                       // mirror dome
    "    float fr = 0.75 + 0.25 * pow(1.0 - max(dot(-rd, n), 0.0), 5.0);",
    "    col = env(refl) * fr * mix(0.6, 1.0, oc);",
    "  } else if (m > 1.5 && m < 2.5) {",                                // silver band
    "    col = env(refl) * 0.8 * (0.4 + 0.6 * sh) + vec3(0.12) * dif;",
    "  } else {",
    "    float grain = hash(floor(o * 260.0));",
    "    vec3 alb = m > 2.5 ? vec3(0.035, 0.034, 0.036) : (m > 4.5 ? vec3(0.06) : vec3(0.005));",
    "    alb *= 0.75 + 0.5 * grain;",
    "    float spec = pow(max(dot(refl, L), 0.0), 24.0) * (m > 2.5 && m < 3.5 ? 0.55 : 0.15);",
    "    float glit = (m > 2.5 && m < 3.5 ? 1.0 : 0.15) * step(0.985, grain) * pow(max(dot(refl, L), 0.0), 4.0) * 2.5;", // Alumide sparkle
    "    col = alb * (0.08 + 1.6 * dif * sh) * oc + (spec + glit) * sh * vec3(1.0, 0.95, 0.9);",
    "    col += vec3(0.02, 0.018, 0.017) * max(n.y, 0.0) * oc * (m > 2.5 ? 1.0 : 0.3);",
    "  }",
    "  col = pow(col, vec3(0.4545));",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  function compile(gl, type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  window.Brooch = function (canvas, state, opts) {
    opts = opts || {};
    var gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) return null;
    var prog = gl.createProgram();
    try {
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    } catch (e) { console.warn(e); return null; }
    gl.linkProgram(prog); gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ["uRes", "uRot", "uTime", "uTilt", "uSteps", "uZoom"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    var scale = opts.scale || Math.min(window.devicePixelRatio || 1, 1.5), steps = opts.steps || 130, running = false, slow = 0, last = 0;
    function size() {
      // layout size, not the on-screen size: the canvas may be scaled down by a CSS transform while it appears
      var w = canvas.clientWidth, h = canvas.clientHeight;
      canvas.width = Math.max(2, Math.round(w * scale)); canvas.height = Math.max(2, Math.round(h * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    function draw(now) {
      var s = state(now);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uRot, s.rot || 0);
      gl.uniform1f(U.uTime, (s.time || now) * 0.001);
      gl.uniform2f(U.uTilt, s.tiltX || 0, s.tiltY || 0);
      gl.uniform1f(U.uSteps, steps);
      gl.uniform1f(U.uZoom, s.zoom || 1);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function frame(now) {
      if (!running) return;
      if (last && now - last > 45) { if (++slow > 20 && scale > .5) { scale *= .8; steps = Math.max(80, steps - 20); size(); slow = 0; } } else slow = Math.max(0, slow - 1);
      last = now;
      if (!opts.active || opts.active()) draw(now);
      requestAnimationFrame(frame);
    }
    size();
    var to; window.addEventListener("resize", function () { clearTimeout(to); to = setTimeout(function () { size(); draw(performance.now()); }, 150); });
    if (opts.still) { draw(performance.now()); return { redraw: function () { draw(performance.now()); } }; }
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { if (!running) { running = true; last = 0; requestAnimationFrame(frame); } } else running = false;
    }).observe(canvas);
    return { redraw: function () { draw(performance.now()); } };
  };
})();
