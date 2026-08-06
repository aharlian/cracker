export const nebulaVertex = /* glsl */`
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const nebulaFragment = /* glsl */`
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec3 vPosition;
  varying vec2 vUv;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + .1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                   mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                   mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = .52;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p = p * 2.03 + 7.17;
      amplitude *= .48;
    }
    return value;
  }

  void main() {
    vec3 p = normalize(vPosition) * 2.2;
    float slow = uTime * .012;
    float n1 = fbm(p + vec3(slow, -slow * .45, slow * .22));
    float n2 = fbm(p * 1.65 - vec3(slow * .4, slow * .2, 0.0));
    float cloud = smoothstep(.50, .86, n1 * .74 + n2 * .36);
    float veil = smoothstep(.38, .77, n1) * .34;
    vec3 color = mix(vec3(.004,.006,.008), uColorA, cloud);
    color = mix(color, uColorB, veil * .45);
    float stars = step(.9965, hash(floor(p * 360.0))) * .65;
    gl_FragColor = vec4(color + stars, 1.0);
  }
`;

export const beamVertex = /* glsl */`
  varying vec2 vUv;
  varying vec3 vPosition;
  void main(){
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`;

export const beamFragment = /* glsl */`
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vPosition;
  float random(vec2 st){return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);}
  void main(){
    float edge = smoothstep(.0,.38,vUv.x) * smoothstep(1.0,.62,vUv.x);
    float vertical = smoothstep(1.0,.08,vUv.y);
    float pulse = .78 + .22*sin(uTime*1.35 + vUv.y*18.0);
    float grain = random(floor(vUv*vec2(70.0,130.0))+floor(uTime*4.0))*.08;
    float alpha = edge * vertical * (.12 + grain) * pulse;
    vec3 color = mix(vec3(.18,.40,.58),vec3(.74,.61,.34),vUv.y*.35);
    gl_FragColor = vec4(color,alpha);
  }
`;

export const chromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 0.00028 },
    angle: { value: 0.0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform float angle;
    varying vec2 vUv;
    void main(){
      vec2 offset=amount*vec2(cos(angle),sin(angle));
      vec4 cr=texture2D(tDiffuse,vUv+offset);
      vec4 cga=texture2D(tDiffuse,vUv);
      vec4 cb=texture2D(tDiffuse,vUv-offset);
      gl_FragColor=vec4(cr.r,cga.g,cb.b,cga.a);
    }
  `,
};
