// =========================
//  RAIN SHADER BACKGROUND
//  WebGL2 ping-pong port of the Shadertoy falling-rain simulation.
//  Buffer pass simulates particles (R = intensity, GB = direction, A = trail),
//  display pass colorizes the buffer to the screen.
// =========================

(function () {
  "use strict";

  const VERT_SRC = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

  // Shared helpers (Shadertoy "Common" tab) — must precede their use in GLSL.
  const COMMON_SRC = `
float randFloat(float n)
{
  return fract(sin(n*64.19)*4200.82);
}
vec2 randVec2(vec2 n)
{
  return vec2(randFloat(n.x*12.95+n.y*43.72),randFloat(n.x*16.21+n.y*90.23));
}

float worley(vec2 n, float s)
{
    float dist = 2.0;
    for(int x=-1;x<=1;x++)
    {
        for(int y=-1;y<=1;y++)
        {
            vec2 p = floor(n/s)+vec2(x,y);
            float d = length(randVec2(p)+vec2(x,y)-fract(n/s));
            if (d < dist)
            {
                dist = d;
            }
        }
    }
    return dist;
}`;

  const SIM_SRC = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D iChannel0;
uniform vec2 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;

out vec4 fragColor;
${COMMON_SRC}

const float GRAVITY = 10.0;
const vec2 GRAVITY_DIRS[3] = vec2[3](vec2(-1.0,-1.0), vec2(0.0,-1.0), vec2(1.0,-1.0));
const vec2 OFFSETS[8] = vec2[8](vec2(-1.0,-1.0),  vec2(0.0,-1.0), vec2(1.0,-1.0),
                                vec2(-1.0,0.0),                   vec2(1.0,0.0),
                                vec2(-1.0,1.0),   vec2(0.0,1.0),  vec2(1.0,1.0));
const float DECAY = 0.00015;
const float TRAIL_FADE = 0.996;
const float WIND_MIN = 0.3;
const float WIND_MAX = 1.0;
const float WIND_CHANGE = 1.0;

void main()
{
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = fragCoord/iResolution.xy;
    vec4 currColor = texture(iChannel0, uv);
    fragColor = currColor;
    bool cannotMove = false;
    vec2 off = OFFSETS[iFrame % 8];
    if (currColor.r > 0.0)
    {
        vec2 dir = round(currColor.gb);
        bool hasCompetition = false;
        for(int i=0; i<8; i++)
        {
            if (OFFSETS[i] != -dir)
            {
                vec4 neighborSamp = texture(iChannel0, (fragCoord+dir+OFFSETS[i])/iResolution.xy);
                if (neighborSamp.r > 0.0 && OFFSETS[i] == -round(neighborSamp.gb))
                {
                    hasCompetition = true;
                }
            }
        }
        if (!hasCompetition || dir == off)
        {
            vec4 targetSamp = texture(iChannel0, (fragCoord+dir)/iResolution.xy);
            if (targetSamp.r <= 0.0)
            {
                fragColor.rgb = vec3(0.0);
            }
            else
            {
                cannotMove = true;
            }
        }
    }
    else
    {
        int numSources = 0;
        vec4 sourceSamp = vec4(0.0);
        bool offValid = false;
        for(int i=0; i<8; i++)
        {
            vec2 neighborOff = OFFSETS[i];
            vec4 neighborSamp = texture(iChannel0, (fragCoord+neighborOff)/iResolution.xy);
            if (neighborSamp.r > 0.0 && neighborOff == -round(neighborSamp.gb))
            {
                numSources++;
                sourceSamp = neighborSamp;
                if (neighborOff == -off)
                {
                    offValid = true;
                }
            }
        }
        if (numSources > 1)
        {
            if (offValid)
            {
                sourceSamp = texture(iChannel0, (fragCoord-off)/iResolution.xy);
            }
            else
            {
                sourceSamp = vec4(0.0);
            }
        }
        if (sourceSamp.r > 0.0)
        {
            fragColor.rgb = sourceSamp.rgb;
            float noise = (1.0-worley(fragCoord*0.25+vec2(40.42*iTime,-20.0*iTime), 64.0)+0.15);
            noise = 10.0*worley(fragCoord*0.1+vec2(923.324-2.2*iTime,10.234+10.42*iTime), 8.0-noise*0.08);
            fragColor.gb += mix(WIND_MIN, WIND_MAX, 0.5*sin(iTime*WIND_CHANGE)+0.5)*vec2(2.0*(worley(fragCoord*0.02*(1.0+0.2*noise)+vec2(90.1921,403.32), 4.0+noise*0.02)-0.25), 2.0*(worley(fragCoord*0.02+vec2(90.1921,4.2182), 4.0+0.02*noise)-0.5));
        }
    }

    if (fragCoord.y > iResolution.y-1.0)
    {
        float time = fract(iTime*42.0);
        float val = randFloat(time+fragCoord.x*0.00837+fragCoord.y*0.0004232);
        float wave = 0.5*sin(iTime*0.5)+0.5;
        val = clamp((pow(val, 2.0)-(0.4+0.5*wave))*(2.0-wave), 0.0, 1.0)*val;
        fragColor.r = val;
        fragColor.gb = vec2(0.0, -1.0);
    }

    if (cannotMove && fragCoord.y > 2.0)
    {
        fragColor.gb = GRAVITY_DIRS[(int(fragCoord.x*4.0)+iFrame) % 3];
    }
    else
    {
        fragColor.gb = normalize(mix(fragColor.gb, vec2(0.0, -1.0), GRAVITY*iTimeDelta));
    }
    if (fragColor.gb == vec2(0.0))
    {
        fragColor.gb = vec2(0.0, -1.0);
    }

    fragColor.r = max(0.0, fragColor.r-DECAY);
    fragColor.a = max((fragColor.a * TRAIL_FADE), fragColor.r);
}`;

  const DISPLAY_SRC = `#version 300 es
precision highp float;

uniform sampler2D iChannel0;
uniform vec2 iResolution;
uniform float iTime;

out vec4 fragColor;

void main()
{
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = fragCoord/iResolution.xy;

    vec4 buf = texture(iChannel0, uv);

    vec3 col = (0.8 + (0.2*buf.r+0.1)*cos(buf.a*8.0+iTime+uv.xyx+vec3(0.2,3.2,4)))*((0.2*buf.a)+(1.2*buf.r)+0.2);

    fragColor = vec4(col,1.0);
}`;

  // ----- GL state -----
  let canvas = null;
  let gl = null;
  let simProg = null;
  let dispProg = null;
  let textures = [];
  let framebuffers = [];
  let texFormat = null;
  let readIdx = 0;
  let frame = 0;
  let startTime = 0;
  let lastTime = 0;
  let rafId = null;
  let initialized = false;
  let failed = false;
  let resizeTimer = null;

  function compileShader(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function buildProgram(fragSrc, uniformNames) {
    const vs = compileShader(gl.VERTEX_SHADER, VERT_SRC);
    const fs = compileShader(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(prog));
      return null;
    }
    const uniforms = {};
    uniformNames.forEach((name) => {
      uniforms[name] = gl.getUniformLocation(prog, name);
    });
    return { prog, uniforms };
  }

  function releaseTargets() {
    if (!gl) return;
    textures.forEach((t) => gl.deleteTexture(t));
    framebuffers.forEach((f) => gl.deleteFramebuffer(f));
    textures = [];
    framebuffers = [];
  }

  function allocTargets(w, h) {
    releaseTargets();

    for (let i = 0; i < 2; i++) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // Simulation depends on exact texel reads of neighbors: NEAREST + CLAMP.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, texFormat.internal, w, h, 0, gl.RGBA, texFormat.type, null);

      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return false;
      }
      textures.push(tex);
      framebuffers.push(fbo);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    readIdx = 0;
    frame = 0;
    return true;
  }

  function sizeCanvas() {
    // Run sim + display at CSS pixel resolution (dpr 1): particles move one
    // texel per frame, so this keeps rain speed consistent and cost down.
    canvas.width = Math.max(1, window.innerWidth);
    canvas.height = Math.max(1, window.innerHeight);
  }

  function initGL() {
    if (initialized || failed) return !failed;

    canvas = document.getElementById("shader-bg");
    if (!canvas) {
      failed = true;
      return false;
    }

    gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      failed = true;
      return false;
    }

    // Float render targets: 32F preferred (16F quantizes the slow R decay).
    if (gl.getExtension("EXT_color_buffer_float")) {
      texFormat = { internal: gl.RGBA32F, type: gl.FLOAT };
    } else if (gl.getExtension("EXT_color_buffer_half_float")) {
      texFormat = { internal: gl.RGBA16F, type: gl.HALF_FLOAT };
    } else {
      failed = true;
      return false;
    }

    simProg = buildProgram(SIM_SRC, ["iChannel0", "iResolution", "iTime", "iTimeDelta", "iFrame"]);
    dispProg = buildProgram(DISPLAY_SRC, ["iChannel0", "iResolution", "iTime"]);
    if (!simProg || !dispProg) {
      failed = true;
      return false;
    }

    sizeCanvas();
    if (!allocTargets(canvas.width, canvas.height)) {
      failed = true;
      return false;
    }

    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Only realloc while running; start() re-sizes on the next enable.
        if (!initialized || rafId == null) return;
        sizeCanvas();
        allocTargets(canvas.width, canvas.height);
      }, 200);
    });

    initialized = true;
    return true;
  }

  function render(nowMs) {
    rafId = requestAnimationFrame(render);

    const now = nowMs * 0.001;
    // Clamp dt so tab switches don't blow up the gravity mix.
    const dt = Math.min(Math.max(now - lastTime, 0.001), 0.05);
    lastTime = now;
    const t = now - startTime;
    const w = canvas.width;
    const h = canvas.height;

    // Simulation pass: read previous frame, write the other buffer.
    gl.useProgram(simProg.prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[1 - readIdx]);
    gl.viewport(0, 0, w, h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures[readIdx]);
    gl.uniform1i(simProg.uniforms.iChannel0, 0);
    gl.uniform2f(simProg.uniforms.iResolution, w, h);
    gl.uniform1f(simProg.uniforms.iTime, t);
    gl.uniform1f(simProg.uniforms.iTimeDelta, dt);
    gl.uniform1i(simProg.uniforms.iFrame, frame);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Display pass: colorize the freshly written buffer to the screen.
    gl.useProgram(dispProg.prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.bindTexture(gl.TEXTURE_2D, textures[1 - readIdx]);
    gl.uniform1i(dispProg.uniforms.iChannel0, 0);
    gl.uniform2f(dispProg.uniforms.iResolution, w, h);
    gl.uniform1f(dispProg.uniforms.iTime, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    readIdx = 1 - readIdx;
    frame++;
  }

  function start() {
    if (rafId != null) return;
    // Targets are released on stop() to reclaim GPU memory, so rebuild them
    // (and pick up any window resize that happened while off).
    sizeCanvas();
    if (textures.length === 0) {
      if (!allocTargets(canvas.width, canvas.height)) return;
    }
    const now = performance.now() * 0.001;
    if (!startTime) startTime = now;
    lastTime = now;
    rafId = requestAnimationFrame(render);
  }

  function stop() {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    releaseTargets();
  }

  function setEnabled(on, toggle) {
    if (on && !initGL()) {
      // WebGL2 or float buffers unavailable: hide the toggle entirely.
      if (toggle) toggle.style.display = "none";
      document.body.classList.remove("shader-on");
      return;
    }
    document.body.classList.toggle("shader-on", on);
    if (toggle) toggle.setAttribute("aria-pressed", String(on));
    if (on) {
      start();
    } else {
      stop();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("shader-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", () => {
      setEnabled(!document.body.classList.contains("shader-on"), toggle);
    });

    // Leaving dark mode forces the shader off. Entering dark mode never
    // auto-starts it — the leaf must be clicked explicitly.
    new MutationObserver(() => {
      if (
        !document.body.classList.contains("dark-mode") &&
        document.body.classList.contains("shader-on")
      ) {
        setEnabled(false, toggle);
      }
    }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  });
})();
