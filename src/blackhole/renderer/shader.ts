export const vertexShader = `#version 300 es
in vec2 aPos;
void main()
{
gl_Position = vec4(aPos, 0.0, 1.0);
}

`

export const fragmentShader = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  resolution;
uniform float time;
uniform float frame;
uniform float hue;
uniform float saturation;
uniform float drift;
uniform float exposure;
uniform float contrast;
uniform float innerRadius;
uniform float outerRadius;
uniform float spin;
uniform float density;
uniform float detail;
uniform float doppler;
uniform float diskGlow;
uniform float inclination;
uniform float azimuth;
uniform float distance;
uniform float roll;
uniform float fieldOfView;
uniform float starAmount;
uniform float starBrightness;
uniform float nebulosity;
uniform float steps;
uniform float stepScale;
uniform float offsetX;
uniform float offsetY;
uniform float clickPass;
uniform float warp;
uniform float tidal;
uniform float lookTurn;


float hash13(vec3 p3)
{
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}

vec3 hash33(vec3 p3)
{
    p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yxx) * p3.zyx);
}

float vnoise(vec3 x)
{
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash13(i + vec3(0.0, 0.0, 0.0));
    float b = hash13(i + vec3(1.0, 0.0, 0.0));
    float c = hash13(i + vec3(0.0, 1.0, 0.0));
    float d = hash13(i + vec3(1.0, 1.0, 0.0));
    float e = hash13(i + vec3(0.0, 0.0, 1.0));
    float g = hash13(i + vec3(1.0, 0.0, 1.0));
    float h = hash13(i + vec3(0.0, 1.0, 1.0));
    float k = hash13(i + vec3(1.0, 1.0, 1.0));

    return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
                mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);
}

float fbm(vec3 p)
{
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++)
    {
        v += a * vnoise(p);
        p = p * 2.02;
        p.xz = mat2(0.80, 0.60, -0.60, 0.80) * p.xz;
        a *= 0.5;
    }
    return v;
}

vec3 hsl2rgb(float h, float s, float l)
{
    vec3 k = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return l + s * (k - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}

vec3 ramp(float b)
{
    float s = saturation;
    vec3 c1 = hsl2rgb(hue - drift * 0.35, clamp(0.98 * s, 0.0, 1.0), 0.030);
    vec3 c2 = hsl2rgb(hue,                 clamp(1.00 * s, 0.0, 1.0), 0.300);
    vec3 c3 = hsl2rgb(hue + drift,        clamp(0.42 * s, 0.0, 1.0), 0.725);
    vec3 c4 = vec3(1.0);

    b = clamp(b, 0.0, 1.0);
    float t = b * 3.0;
    if (t < 1.0) return mix(c1, c2, t);
    if (t < 2.0) return mix(c2, c3, t - 1.0);
    return mix(c3, c4, t - 2.0);
}

float diskEmission(vec3 p, vec3 rd)
{
    float r = length(p.xz);
    float span = max(outerRadius - innerRadius, 0.001);
    float t = (r - innerRadius) / span;
    if (t < 0.0 || t > 1.0) return 0.0;

    float phi = atan(p.z, p.x);

    float omega = spin * 0.2;
    float a = phi + time * omega;

    vec3 q = vec3(cos(a), sin(a), 0.0) * (1.7 * detail) + vec3(0.0, 0.0, r * 2.15 * detail);

    float n1 = fbm(q);
    float n2 = fbm(q * 2.75 + vec3(11.3, 5.1, 2.2));
    float fil = mix(n1, n1 * n2 * 2.0, 0.55);
    fil = pow(clamp(fil * 1.55, 0.0, 1.7), mix(1.4, 3.2, density));

    float edgeIn  = smoothstep(0.0, 0.035, t);
    float edgeOut = 1.0 - smoothstep(0.65, 0.92, t);
    float prof = pow(1.0 - t, 1.45) * edgeIn * edgeOut;
 
    float em = prof * (0.22 + 1.4 * fil);

    em += diskGlow * 0.9 * pow(1.0 - smoothstep(0.0, 0.22, t), 2.0) * edgeIn;

    vec3 tangent = normalize(cross(vec3(0.0, 1.0, 0.0), p / max(length(p), 1e-4)));
    float beta = clamp(0.60 / sqrt(max(r, 0.5)), 0.0, 0.88);
    float cosang = dot(tangent, -normalize(rd));
    float boost = 1.0 / max(1.0 - beta * cosang, 0.16);
    boost = pow(boost, 2.3) * sqrt(max(1.0 - beta * beta, 0.0));
    em *= mix(1.0, boost * 0.62, doppler);
    em *= clamp(1.0 - 1.0 / max(r, 1.02), 0.0, 1.0);

    return em;
}

float starLayer(vec3 rd, float scale, float thresh, float size)
{
    vec3 p = rd * scale;
    vec3 id = floor(p);
    vec3 f = fract(p) - 0.5;
    vec3 h = hash33(id);
    float m = h.z;
    if (m < thresh) return 0.0;
    vec3 off = (h - 0.5) * 0.78;
    float d = length(f - off);
    float core = smoothstep(size, 0.0, d);
    float halo = smoothstep(size * 5.0, 0.0, d) * 0.22;
    float mag = pow((m - thresh) / max(1.0 - thresh, 1e-4), 2.0);
    return (core + halo) * mag;
}

float skyStars(vec3 rd)
{
    float s = 0.0;
    s += starLayer(rd,  34.0, 1.0 - 0.30 * starAmount, 0.048);
    s += starLayer(rd,  63.0, 1.0 - 0.22 * starAmount, 0.038) * 0.72;
    s += starLayer(rd, 112.0, 1.0 - 0.16 * starAmount, 0.030) * 0.46;
    return s * starBrightness;
}

float skyNebula(vec3 rd)
{
    float n = fbm(rd * 2.1 + 3.7);
    return pow(max(n - 0.44, 0.0), 2.0) * 0.75 * nebulosity;
}

float sky(vec3 rd)
{
    return skyStars(rd) + skyNebula(rd);
}

void main()
{
    vec2 uv = ((gl_FragCoord.xy - 0.5 * resolution) / resolution.y);
    uv -= vec2(offsetX, offsetY);

    if (warp > 0.001)
    {
        float radius = length(uv);
        float swirlAngle = warp * 1.6 * exp(-radius * 2.2) * (0.4 + tidal);
        float swirlCos = cos(swirlAngle), swirlSin = sin(swirlAngle);
        uv = mat2(swirlCos, swirlSin, -swirlSin, swirlCos) * uv;
        uv *= 1.0 + warp * 0.35 * radius;
        uv.x *= 1.0 + tidal * 1.6;
        uv.y *= 1.0 - tidal * 0.35;
    }

    float ci = cos(inclination), si = sin(inclination);
    float ca = cos(azimuth), sa = sin(azimuth);
    vec3 camPos = vec3(ci * ca, si, ci * sa) * distance;

    vec3 fwd = normalize(-camPos);
    vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, fwd);
    vec3 velocityDirection = fwd;
    float turnCos = cos(lookTurn), turnSin = sin(lookTurn);
    vec3 turnedForward = fwd * turnCos + right * turnSin;
    right = right * turnCos - fwd * turnSin;
    fwd = turnedForward;
    float cr = cos(roll), sr = sin(roll);
    vec3 rx =  right * cr + up * sr;
    vec3 ry = -right * sr + up * cr;

    float beta = warp > 0.001 ? clamp(inversesqrt(max(distance, 1.0)), 0.0, 0.985) * warp : 0.0;
    vec3 viewRay = normalize(fwd * fieldOfView + rx * uv.x + ry * uv.y);
    float observedCos = dot(viewRay, velocityDirection);
    float restCos = (observedCos - beta) / (1.0 - beta * observedCos);
    float restSin = sqrt(max(1.0 - restCos * restCos, 0.0));
    vec3 perpendicular = viewRay - velocityDirection * observedCos;
    perpendicular /= max(length(perpendicular), 1e-5);
    float lorentz = inversesqrt(max(1.0 - beta * beta, 1e-4));
    float shift = 1.0 / (lorentz * max(1.0 - beta * observedCos, 1e-3));

    vec3 rd = normalize(velocityDirection * restCos + perpendicular * restSin);
    vec3 viewDir = viewRay;
    vec3 pos = camPos;

    vec3 Lv = cross(pos, rd);
    float h2 = dot(Lv, Lv);

    float bright = 0.0;
    bool captured = false;
    float transmittance = 1.0;

    float jitter = hash13(vec3(gl_FragCoord.xy, frame));
    int totalSteps = int(steps);
    vec3 prev = pos;

    for (int i = 0; i < 400; i++)
    {
        if (i >= totalSteps) break;

        float rr = dot(pos, pos);
        float r = sqrt(rr);
        if (r < 1.0) { captured = true; break; }
        if (r > 55.0 && dot(pos, rd) > 0.0) break;

        float dt = clamp(r * 0.075 * stepScale, 0.018, 1.4);
        if (i == 0) dt *= 0.35 + 0.65 * jitter;

        prev = pos;
        vec3 acc = -1.5 * h2 * pos / (rr * rr * r);
        pos += rd * dt;
        rd = normalize(rd + acc * dt);

        if (prev.y * pos.y < 0.0)
        {
            float k = prev.y / (prev.y - pos.y);
            float em = diskEmission(mix(prev, pos, k), rd);
            float alpha = clamp(em, 0.0, 1.0);
            bright += transmittance * em;
            transmittance *= (1.0 - alpha);
        }
    }

    if(clickPass > 0.5)
    {
        fragColor = vec4(captured ? 1.0 : 0.0, 0.0, 0.0, 1.0);
        return;
    }

    float skyBright = captured ? 0.0 : sky(rd);
    vec3 baseColor = ramp(pow(max((bright + transmittance * skyBright) * exposure, 0.0), contrast));
    if (warp <= 0.001)
    {
        fragColor = vec4(baseColor, 1.0);
        return;
    }

    float beam = pow(clamp(shift, 0.05, 12.0), 3.0);
    vec3 warpColor = ramp(pow(max(bright * beam * exposure, 0.0), contrast));

    if (!captured)
    {
        vec3 radial = viewDir - fwd * dot(viewDir, fwd);
        radial /= max(length(radial), 1e-4);
        vec3 axis = cross(radial, fwd);
        float streak = 0.04 * warp * warp;
        float split = 0.008 * warp;
        vec3 stars = vec3(0.0);
        for (int k = 0; k < 8; k++)
        {
            vec3 tapDir = normalize(rd - radial * (streak * float(k) / 7.0));
            stars += vec3(skyStars(normalize(tapDir + axis * split)), skyStars(tapDir), skyStars(normalize(tapDir - axis * split)));
        }
        stars = stars / 8.0 * (1.0 + 5.0 * warp);
        float blueAmount = clamp(log2(shift) * 0.5, -1.0, 1.0) * 0.5 + 0.5;
        vec3 tint = mix(vec3(1.0, 0.42, 0.28), vec3(0.62, 0.84, 1.45), blueAmount);
        vec3 skyColor = (stars + vec3(skyNebula(rd))) * tint * beam * transmittance * exposure;
        skyColor = 1.0 - exp(-skyColor);
        warpColor = 1.0 - (1.0 - warpColor) * (1.0 - skyColor);
    }

    fragColor = vec4(mix(baseColor, warpColor, smoothstep(0.0, 0.35, warp)), 1.0);
}`
