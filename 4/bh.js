/* A Schwarzschild black hole, ray-traced in a fragment shader.
   Units: Schwarzschild radius rs = 1. Each pixel's light ray is bent with the
   standard trick for null geodesics: a = -1.5 * h^2 * x / r^5 (h = |x × v|).
   The accretion disc lies in the y = 0 plane between r = 2.6 and r = 13 and is
   textured as spiralling, labyrinth-like copper filaments, after the brooch
   "Longing for Union". Light from the far side of the disc is bent over the
   top of the shadow automatically, as in the real thing. */
(function () {
  "use strict";

  var VERT = "attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";

  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes; uniform float uTime; uniform vec3 uCam; uniform vec3 uFwd; uniform vec3 uRight; uniform vec3 uUp;",
    "uniform float uFov; uniform float uInside; uniform int uSteps; uniform vec2 uOff;",
    "float hash(vec3 p){ p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }",
    "float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
    "float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);",
    "  return mix(mix(hash2(i), hash2(i+vec2(1,0)), f.x), mix(hash2(i+vec2(0,1)), hash2(i+vec2(1,1)), f.x), f.y); }",
    "float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a*noise(p); p = p*2.03 + 7.1; a *= 0.5; } return v; }",
    // stars: a sparse hashed grid on the sphere of directions
    "vec3 stars(vec3 d){",
    "  vec3 col = vec3(0.0);",
    "  for (int k = 0; k < 2; k++){",
    "    float sc = k == 0 ? 90.0 : 220.0;",
    "    vec3 c = floor(d * sc); vec3 f = fract(d * sc) - 0.5;",
    "    float h = hash(c + float(k) * 13.0);",
    "    if (h > (k == 0 ? 0.985 : 0.992)) { float b = smoothstep(0.32, 0.0, length(f)); col += b * mix(vec3(1.0,0.86,0.72), vec3(0.8,0.88,1.0), hash(c*1.7)) * (k == 0 ? 0.9 : 0.5); }",
    "  }",
    "  float neb = fbm(d.xy * 2.5 + d.z) * fbm(d.yz * 3.0 - 2.0);",
    "  col += vec3(0.20, 0.08, 0.05) * pow(neb, 2.2) * 0.6;",
    "  return col;",
    "}",
    // disc emission at a crossing point
    "vec4 disc(vec3 p, vec3 rayDir){",
    "  float r = length(p.xz);",
    "  if (r < 2.6 || r > 13.0) return vec4(0.0);",
    "  float phi = atan(p.z, p.x);",
    "  float om = 0.9 * pow(r, -1.5);",            // Keplerian: the inside turns faster
    "  float a = phi + uTime * om * 4.0;",
    "  float lr = log(r);",
    "  float s = a + 2.4 * lr;",                    // spiral coordinate
    "  float lab = fbm(vec2(s * 2.2, lr * 7.0));",
    "  float fil = 1.0 - abs(sin(lab * 26.0 + lr * 3.0));", // thin folded filaments
    "  fil = pow(fil, 6.0);",
    "  float fold = smoothstep(0.35, 0.75, fbm(vec2(s * 1.3 + 3.0, lr * 4.0)));",
    "  float k = clamp((r - 2.6) / 10.4, 0.0, 1.0);",
    "  vec3 hot = vec3(1.0, 0.93, 0.82), copper = vec3(0.86, 0.40, 0.17), deep = vec3(0.35, 0.10, 0.04);",
    "  vec3 base = mix(hot, copper, smoothstep(0.0, 0.45, k)); base = mix(base, deep, smoothstep(0.45, 1.0, k));",
    "  vec3 vel = normalize(vec3(-sin(phi), 0.0, cos(phi)));",
    "  float dop = 1.0 + 0.75 * dot(vel, -rayDir);",   // approaching side brighter
    "  dop = pow(max(dop, 0.15), 2.6);",
    "  float edge = smoothstep(2.6, 3.4, r) * (1.0 - smoothstep(9.0, 13.0, r));",
    "  float inten = (0.35 + 1.4 * fil + 0.5 * fold) * edge * dop * (1.25 - k);",
    "  float alpha = clamp((0.25 + 0.9 * fil + 0.4 * fold) * edge, 0.0, 1.0);",
    "  return vec4(base * inten, alpha);",
    "}",
    "void main(){",
    "  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y - uOff;",
    "  if (uInside > 0.999) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }",
    "  vec3 dir = normalize(uFwd + uv.x * uFov * uRight + uv.y * uFov * uUp);",
    "  vec3 pos = uCam; vec3 vel = dir;",
    "  vec3 hv = cross(pos, vel); float h2 = dot(hv, hv);",
    "  vec3 col = vec3(0.0); float alpha = 0.0; bool absorbed = false;",
    "  for (int i = 0; i < 260; i++){",
    "    if (i >= uSteps) break;",
    "    float r2 = dot(pos, pos); float r = sqrt(r2);",
    "    float dt = clamp(0.09 * r, 0.03, 1.2);",
    "    vec3 acc = -1.5 * h2 * pos / (r2 * r2 * r);",
    "    vel += acc * dt;",
    "    vec3 np = pos + vel * dt;",
    "    if (pos.y * np.y < 0.0){",
    "      float t = pos.y / (pos.y - np.y);",
    "      vec4 d = disc(mix(pos, np, t), normalize(vel));",
    "      col += (1.0 - alpha) * d.rgb * d.a; alpha += (1.0 - alpha) * d.a;",
    "      if (alpha > 0.98) break;",
    "    }",
    "    pos = np;",
    "    if (dot(pos, pos) < 1.0) { absorbed = true; break; }",
    "    if (r > 60.0 && dot(pos, vel) > 0.0) break;",
    "  }",
    "  if (!absorbed) col += (1.0 - alpha) * stars(normalize(vel));",
    "  col = 1.0 - exp(-col * 1.35);",                 // gentle tone map
    "  col = mix(col, vec3(0.0), uInside);",
    "  float vig = smoothstep(1.25, 0.35, length(uv));",
    "  gl_FragColor = vec4(col * (0.55 + 0.45 * vig), 1.0);",
    "}"
  ].join("\n");

  function compile(gl, type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  /* state(): returns { dist, yaw, pitch, inside, time } */
  window.BlackHole = function (canvas, state, opts) {
    var gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
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
    var U = {}; ["uRes", "uTime", "uCam", "uFwd", "uRight", "uUp", "uFov", "uInside", "uSteps", "uOff"].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    var scale = opts.scale || .6, steps = opts.steps || 180, running = false, slowFrames = 0;
    function size() {
      var r = canvas.getBoundingClientRect();
      canvas.width = Math.max(2, Math.round(r.width * scale)); canvas.height = Math.max(2, Math.round(r.height * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    var last = 0;
    function frame(now) {
      if (!running) return;
      // keep it smooth: lower the resolution once if frames are slow
      if (last && now - last > 45) { if (++slowFrames > 20 && scale > .34) { scale *= .8; steps = Math.max(110, steps - 30); size(); slowFrames = 0; } } else slowFrames = Math.max(0, slowFrames - 1);
      last = now;
      draw(now);
      requestAnimationFrame(frame);
    }
    function draw(now) {
      var s = state(now);
      var cp = Math.cos(s.pitch), sp = Math.sin(s.pitch), cy = Math.cos(s.yaw), sy = Math.sin(s.yaw);
      var cam = [s.dist * cp * sy, s.dist * sp, -s.dist * cp * cy];
      var len = Math.hypot(cam[0], cam[1], cam[2]);
      var f = [-cam[0] / len, -cam[1] / len, -cam[2] / len];
      // tilt the view a touch so the disc lies at a slant, like the brooch on the body
      var roll = s.roll || 0, wu = [Math.sin(roll), Math.cos(roll), 0];
      var rgt = [f[1] * wu[2] - f[2] * wu[1], f[2] * wu[0] - f[0] * wu[2], f[0] * wu[1] - f[1] * wu[0]];
      var rl = Math.hypot(rgt[0], rgt[1], rgt[2]); rgt = [rgt[0] / rl, rgt[1] / rl, rgt[2] / rl];
      var up = [rgt[1] * f[2] - rgt[2] * f[1], rgt[2] * f[0] - rgt[0] * f[2], rgt[0] * f[1] - rgt[1] * f[0]];
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, s.time);
      gl.uniform3fv(U.uCam, cam); gl.uniform3fv(U.uFwd, f); gl.uniform3fv(U.uRight, rgt); gl.uniform3fv(U.uUp, up);
      gl.uniform1f(U.uFov, s.fov || 1.0);
      gl.uniform1f(U.uInside, s.inside || 0);
      gl.uniform1i(U.uSteps, steps);
      gl.uniform2f(U.uOff, (s.offX || 0) * canvas.width / canvas.height, s.offY || 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    size();
    var to; window.addEventListener("resize", function () { clearTimeout(to); to = setTimeout(size, 150); });
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !opts.still) { if (!running) { running = true; last = 0; requestAnimationFrame(frame); } } else running = false;
    }).observe(canvas);
    if (opts.still) draw(performance.now());
    return { redraw: function () { draw(performance.now()); } };
  };
})();
