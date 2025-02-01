/**
 * Ripples3
 * Nico Pr
 * https://nicopr.fr
 * https://github.com/nicopowa/ripples3
 */

const handleError = err => {

	console.error(err);

	const errorDiv = document.createElement("div");

	errorDiv.classList.add("err");
	errorDiv.innerHTML = "<div>liquify fail</div>" + "<br/>" + err;
	document.body.appendChild(errorDiv);

};

const lazy = (cb, ms = 256) =>
	setTimeout(cb,
		ms + Math.round(Math.random() * ms));

window.addEventListener("load",
	() => {

		if(DEBUG)
			console.log("ripples3");

		window.addEventListener("error",
			evt => {

				handleError(evt.error);
				return false;
	
			});

		window.addEventListener("unhandledrejection",
			evt => {

				handleError(evt.reason);
				return false;
	
			});

		try {

			const liquify = new Liquid("assets/img.webp");
			const amplify = new Params(liquify);

			liquify
			.flow(amplify,
				amplify.hashParams())
			.then(() => {

				if(DEBUG)
					console.log("flowing");

				lazy(() => {
				// if(!liquify.isTouched) liquify.dropIt();
				/*lazy(
							() => {
								if(!liquify.isTouched) liquify.curveIt();
							}, 
							1000
						);*/
				},
				500);
			
			})
			.catch(err =>
				handleError(err));
	
		}
		catch (err) {

			handleError(err);
	
		}

	});

/**
 * @class Liquid : liquify all the pixels
 */
class Liquid {

	/**
	 * @construct
	 * @param {string} imagePath : background image url
	 */
	constructor(imagePath) {

		this.sizeRef = 960; // ref size
		this.baseScale = 2.0; // ref scale

		// this.MAX_SCALE = Math.min(window.devicePixelRatio || 1, 2); // default device scale
		this.MAX_SCALE = 2.0; // hardcoded max scale
		this.MIN_SCALE = 1.0; // min scale

		// this.displayScale = this.MIN_SCALE; // start low and go up
		this.displayScale = this.MAX_SCALE; // start high and go down

		this.TARGET_FPS = 55; // downscale if less
		this.SCALE_CHECK_INTERVAL = 1000; // perf check interval
		this.SCALE_STEP = 0.5; // scale step
		this.ENABLE_UPSCALE = true; // enable auto upscale
		this.LOOPS_TO_SCALE = 3; // loops before scale (up or down)

		// DO NOT EDIT BELOW

		this.PERF_CHECK = false;
		this.LOOP_COUNT = 0; // check loops count
		this.DOWN_FROM = this.MAX_SCALE; // prevent upscale loop

		this.FIXED_TIMESTEP = 1000.0 / 60.0; // frame time 16.667
		this.DELTA_TIMESTEP = this.FIXED_TIMESTEP / 1000;

		this.ww // window.innerWidth
			= this.wh = 0; // window.innerHeight

		this.sizeBase = 0;
		this.scaleBase = this.displayScale / this.baseScale;

		this.syncSize();

		this.img = imagePath; // background image url

		this.params = {
			waveSpeed: 0.997,
			damping: 0.992,
			propagationSpeed: 8.0,
			refraction: 0.8,
			waterTint: new Float32Array([0.04, 0.06, 0.11]),
			tintStrength: 0.02,
			specularStrength: 0.56,
			roughness: 0.16,
			waterHue: 0.58,
			fresnelEffect: 0.8,
			fresnelPower: 0.35,
			specularPower: 39.0,
			reflectionFresnel: 0.6,
			reflectionBlur: 0.0,
			reflectionDistortion: 6.0,
			skyColor: new Float32Array([0.78, 0.89, 1.0]),
			skyHue: 0.62,
			depthFactor: 0.12,
			atmosphericScatter: 0.27,
			envMapIntensity: 0.08,
			touchRadius: 0.023,
			initialImpact: 0.42,
			trailStrength: 0.1,
			trailSpread: 0.2,
			causticStrength: 0.25,
			causticScale: 1.0,
			causticSpeed: 0.15,
			causticBrightness: 0.5,
			causticDetail: 3.0,
			sunDirection: new Float32Array([0.35, 0.65, 0.45]),
			// sunTheta: 0.1,
			// sunPhi: 0.1,
			secondarySunDirection: new Float32Array([-0.45, 0.55, 0.45]),
			// secondarySunTheta: 0.65,
			// secondarySunPhi: 0.3,
			sunIntensity: 5.0,
			secondaryIntensity: 2.0,
			waveReflectionStrength: 0.2,
			mirrorReflectionStrength: 0.16,
			velocityReflectionFactor: 0.05,
		};

		this.amplify
			= this.hitting
			= this.sizing
			= this.image
			= this.cvs
			= this.gl
			= this.vertexBuffer
			= this.physicsProgram
			= this.physicsUniforms
			= this.renderProgram
			= this.renderUniforms
			= this.currentTexture
			= this.previousTexture
			= this.backgroundTexture
			= this.waterTexture1
			= this.waterTexture2
			= this.currentFramebuffer
			= this.framebuffer1
			= this.framebuffer2
				= null;

		this.loop = -1;
		this.hits = false;

		this.vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
		this.touchPositions = new Float32Array(20); // 10 touches

		this.TWO_PI = Math.PI * 2;

		this.scaledPropagation = this.params.propagationSpeed;

		this.currentFPS = 0;
		this.frameTimeHistory = new Array(30)
		.fill(16.67);
		this.frameTimeIndex = 0;
		this.lastFrameTime = 0;
		this.lastScaleCheck = 0;
		this.notBefore = 0; // perf check delay

		this.isLiquid = false; // init state
		this.isRunning = false; // render loop state
		this.isVisible = true; // visibility state
		this.isTouched = false; // first touch
		this.isAutoTouching = false;

		this.isRaining = false;
		this.lastRainDrop = 0;
		this.rainDropDelay = 256;
		this.maxRaindrops = 4;
		this.activeRaindrops = null;

		this.pops = new Map(); // pointers
		this.deltaTime = 0;
		this.accumulatedTime = 0;
		this.fish = []; // underwater imgs

		this.infos = null;

		this.cvs = document.createElement("canvas");
		this.cvs.style.opacity = 0;
		document.body.appendChild(this.cvs);
	
	}

	load(preset) {

		if(DEBUG)
			console.log("load params");

		this.stopPerfCheck();

		this.renderText("load params");

		this.resetWaterState();

		this.params = {
			...this.params,
			...preset,
		};

		this.syncUniforms();

		this.startPerfCheck();
	
	}

	flow(amplify = null, params = {}) {

		this.amplify = amplify;
		this.params = {
			...this.params,
			...params,
		};

		this.infos = document.querySelector("#fps");

		if(DEBUG)
			console.log("flow");

		const initSequence = [
			this.loadBackground,
			this.loadForeground,
			this.initializeWebGL,
			DEBUG ? this.initShaders : this.initShadersZip,
			this.initUniforms,
			this.initBuffers,
			this.syncCanvas,
			this.syncViewport,
			this.initTextures,
			this.syncTextures,
			this.syncUniforms,
			this.setupEvents,
			this.startRenderLoop,
		];

		return initSequence
		.map(fn =>
			fn.bind(this))
		.reduce((prv, cur) =>
			prv.then(() =>
				cur()),
		Promise.resolve())
		.then(() => {

			return this.fadeCanvas(1)
			.then(() => {

				console.log("liquified");

				this.isLiquid = true;

				this.amplify.liquified();
			
			});
		
		})
		.catch(err => {

			throw err;
		
		});
	
	}

	async loadBackground() {

		if(DEBUG)
			console.log("load background");

		this.image = await this.loadImage(this.img);
	
	}

	async loadForeground() {

		if(DEBUG)
			console.log("load foreground");

		const imgSize = 36;
		const imgOff = 6;

		/*this.fish
		.push({
			i: await this.loadImage("assets/gear.png"),
			c: () => ({
				x: imgOff,
				y: imgOff,
				w: imgSize,
				h: imgSize
			})
		});*/

		this.fish.push({
			i: await this.loadImage("assets/github-mark-white.png"),
			c: () =>
				({
					x: this.w - (imgSize + imgOff) * this.displayScale,
					y: imgOff * this.displayScale,
					w: imgSize * this.displayScale,
					h: imgSize * this.displayScale,
				}),
		});
	
	}

	loadImage(imgSrc) {

		return new Promise(imgLoaded => {

			const i = new Image();

			i.addEventListener("load",
				() =>
					imgLoaded(i));
			i.addEventListener("error",
				() => {

					throw new Error("image load error " + imgSrc);
			
				});
			i.crossOrigin = "Anonymous";
			i.src = imgSrc;
		
		});
	
	}

	initializeWebGL() {

		if(DEBUG)
			console.log("init webgl");

		const contextOptions = {
			alpha: false,
			antialias: false,
			depth: false,
			stencil: false,
			powerPreference: "high-performance",
			preserveDrawingBuffer: false,
		};

		this.gl = this.cvs.getContext("webgl2",
			contextOptions);
		if(!this.gl)
			throw new Error("webgl2 not supported");

		const ext = this.gl.getExtension("EXT_color_buffer_float");

		if(!ext)
			throw new Error("ext_color_buffer_float not supported");

		this.gl.getExtension("OES_texture_float_linear");

		const glInitErr = this.gl.getError();

		if(glInitErr !== this.gl.NO_ERROR) {

			throw new Error("webgl init error " + glInitErr);
		
		}
	
	}

	async initShaders() {

		if(DEBUG)
			console.log("init shaders");

		const VERTEX_SHADER = `#version 300 es
in vec2 position;
out vec2 texCoord;

void main() {
	texCoord = position * 0.5 + 0.5;
	gl_Position = vec4(position, 0.0, 1.0);
}`;

		const PHYSICS_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;

uniform vec2 uResolution;
uniform float uDeltaTime;
uniform float uDisplayScale;
uniform float uSizeBase;
uniform float uWaveSpeed;
uniform float uDamping;
uniform float uPropagationSpeed;

uniform sampler2D uPreviousState;
uniform vec2 uTouch[10];
uniform int uTouchCount;

struct Touch {
	vec2 position;
	float radius;
	float strength;
	float trail;
	float spread;
};

uniform Touch uTouchParams[10];
in vec2 texCoord;
out vec4 fragColor;

float sampleHeight(vec2 coord) {
	return texture(uPreviousState, clamp(coord, 0.0, 1.0)).r;
}

float getTouchDistance(vec2 texCoord, vec2 touchPos) {
	vec2 pixelCoord = texCoord * uResolution;
	float whatSize = max(uResolution.x, uResolution.y) / uSizeBase;
	return length(pixelCoord - touchPos) / whatSize;
}

void main() {
	vec4 state = texture(uPreviousState, texCoord);
	float height = state.r;
	float oldHeight = state.g;
	
	vec2 pixel = vec2(1.0) / uResolution;

	float sum = 0.0;
	for(int i = 0; i < 8; i++) {
		float angle = float(i) * 0.785398163; // PI/4
		vec2 dir = vec2(cos(angle), sin(angle));
		vec2 sampleOffset = dir * pixel * uPropagationSpeed;
		vec2 sampleCoord = texCoord + sampleOffset;
		sum += texture(uPreviousState, sampleCoord).r;
	}
	sum *= 0.125;
	
	float newHeight = sum * 2.0 - oldHeight;
	newHeight = mix(height, newHeight, uWaveSpeed);
	newHeight *= uDamping;

	float whatSize = max(uResolution.x, uResolution.y);
	
	for(int i = 0; i < uTouchCount; i++) {
		float dist = getTouchDistance(texCoord, uTouch[i]);
		float scaledRadius = uTouchParams[i].radius;
		
		if(dist < scaledRadius) {
			float strength = smoothstep(scaledRadius, 0.0, dist);
			float impact = uTouchParams[i].strength;
			float touchEffect = impact * strength * 0.5;
			
			if(uTouchParams[i].trail > 0.0 && i > 0) {
				vec2 prevPos = uTouch[i - 1];
				vec2 moveVec = uTouch[i] - prevPos;
				float moveLen = length(moveVec) / whatSize;
				
				if(moveLen > 0.0001) {
					vec2 moveDir = moveVec / length(moveVec);
					vec2 toPoint = (texCoord * uResolution - prevPos);
					float alongTrail = dot(toPoint, moveDir);
					
					if(alongTrail < 0.0) {
						vec2 perpToTrail = toPoint - (alongTrail * moveDir);
						float perpDist = length(perpToTrail) / whatSize;
						float trailEffect = exp(-perpDist / (uTouchParams[i].spread + 0.001));
						touchEffect += uTouchParams[i].trail * trailEffect * moveLen * 0.3;
					}
				}
			}
			
			newHeight += touchEffect;
		}
	}
	
	fragColor = vec4(newHeight, height, 0.0, 1.0);
}`;

		const RENDER_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;

uniform vec2 uResolution;
uniform float uTime;
uniform float uDisplayScale;
uniform sampler2D uWaterHeight;
uniform sampler2D uBackgroundTexture;
uniform sampler2D uPreviousState;
uniform vec3 uSunDirection;
uniform vec3 uSecondarySunDirection;
uniform float uSunIntensity;
uniform float uSecondaryIntensity;
uniform float uRefraction;
uniform vec3 uWaterTint;
uniform float uTintStrength;
uniform float uSpecularStrength;
uniform float uRoughness;
uniform float uFresnelEffect;
uniform float uFresnelPower;
uniform float uSpecularPower;
uniform float uReflectionFresnel;
uniform float uReflectionDistortion;
uniform vec3 uSkyColor;
uniform float uDepthFactor;
uniform float uAtmosphericScatter;
uniform float uEnvMapIntensity;
uniform float uCausticStrength;
uniform float uCausticScale;
uniform float uCausticSpeed;
uniform float uCausticBrightness;
uniform float uCausticDetail;
uniform float uWaveReflectionStrength;
uniform float uMirrorReflectionStrength;
uniform float uVelocityReflectionFactor;
uniform float uReflectionBlur;

in vec2 texCoord;
out vec4 fragColor;

vec3 getNormal(vec2 uv, vec2 pixel) {
	vec4 data = texture(uWaterHeight, uv);
	float height = data.r;
	float oldHeight = data.g;
	float velocity = (height - oldHeight);
	
	float l = texture(uWaterHeight, clamp(uv - vec2(pixel.x, 0.0), 0.0, 1.0)).r;
	float r = texture(uWaterHeight, clamp(uv + vec2(pixel.x, 0.0), 0.0, 1.0)).r;
	float t = texture(uWaterHeight, clamp(uv - vec2(0.0, pixel.y), 0.0, 1.0)).r;
	float b = texture(uWaterHeight, clamp(uv + vec2(0.0, pixel.y), 0.0, 1.0)).r;
	
	// display and velocity scale
	float normalStrength = 1.0 + abs(velocity) * 2.0;
	return normalize(vec3(
		(l - r) * normalStrength * uDisplayScale,
		(t - b) * normalStrength * uDisplayScale,
		1.0
	));
}

vec3 sampleBlurredReflection(vec2 uv, float radius, vec2 pixel) {
	vec3 color = vec3(0.0);
	float total = 0.0;
	int samples = 9;
	
	for(int x = -1; x <= 1; x++) {
		for(int y = -1; y <= 1; y++) {
			vec2 offset = vec2(float(x), float(y)) * radius * pixel;
			vec2 sampleUv = clamp(uv + offset, 0.0, 1.0);
			sampleUv.y = 1.0 - sampleUv.y;
			
			float weight = 1.0 - length(vec2(x, y)) / 2.0;
			color += texture(uBackgroundTexture, sampleUv).rgb * weight;
			total += weight;
		}
	}
	
	return color / total;
}

float getReflection(vec3 normal, vec3 lightDir, vec3 viewDir, float velocity) {
	vec3 halfDir = normalize(lightDir + viewDir);
	float specDot = max(dot(normal, halfDir), 0.0);
	
	// specular calculation
	float roughDot = pow(specDot, uSpecularPower * (1.0 - uRoughness));
	float mirrorSpec = pow(specDot, 256.0) * 4.0 * uMirrorReflectionStrength * 2.0;
	float waveSpec = roughDot * (abs(velocity) * 12.0 + 0.8) * uWaveReflectionStrength * 1.5;
	
	float velocityFactor = 1.0 + abs(velocity) * uVelocityReflectionFactor * 4.0;
	
	return (mirrorSpec + waveSpec) * uSpecularStrength * velocityFactor;
}

void main() {
	vec2 pixel = vec2(1.0) / uResolution;
	vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
	
	vec4 heightData = texture(uWaterHeight, texCoord);
	float height = heightData.r;
	float oldHeight = heightData.g;
	float velocity = (height - oldHeight);
	
	vec3 normal = getNormal(texCoord, pixel);
	float depth = 1.0 - (height * uDepthFactor);
	
	// refraction with velocity influence
	vec2 refractOffset = normal.xy * (uRefraction + abs(velocity) * 0.5);
	vec2 bgCoord = clamp(texCoord + refractOffset, 0.0, 1.0);
	
	// blur based on depth and velocity
	float blurRadius = uReflectionBlur * (1.0 + abs(velocity) * 5.0);
	vec3 refractColor = sampleBlurredReflection(bgCoord, blurRadius, pixel);
	
	// atmospheric scattering
	float scatter = 1.0 - exp(-depth * uAtmosphericScatter);
	vec3 waterColor = mix(refractColor, uWaterTint, uTintStrength + scatter * 0.5);
	
	// caustics
	float caustic = 0.0;
	float detailScale = uCausticDetail * 10.0;
	
	for(float i = 1.0; i <= 2.0; i++) {
		vec2 causticsUV = texCoord * uCausticScale * i + normal.xy * uReflectionDistortion;
		float detailFreq = detailScale * i;
		caustic += (sin(causticsUV.x * detailFreq + uTime * uCausticSpeed * i) * 
				   sin(causticsUV.y * detailFreq + uTime * uCausticSpeed * i)) * (1.0/i);
	}
	caustic = caustic * 0.5 + 0.5;
	
	vec3 finalColor = waterColor;
	
	// fresnel effect with velocity influence
	float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uFresnelPower) * uFresnelEffect;
	
	// combine lighting
	vec3 sunRefl = vec3(1.0, 0.97, 0.92) * getReflection(normal, normalize(uSunDirection), viewDir, velocity) * uSunIntensity;
	vec3 secondaryRefl = vec3(0.98, 0.99, 1.0) * getReflection(normal, normalize(uSecondarySunDirection), viewDir, velocity) * uSecondaryIntensity;
	
	vec3 envRefl = mix(uSkyColor, vec3(1.0), fresnel) * uEnvMapIntensity;
	
	finalColor += sunRefl + secondaryRefl;
	finalColor += envRefl * fresnel * uReflectionFresnel;
	
	// depth attenuated caustics
	finalColor += vec3(1.0, 0.97, 0.9) * caustic * uCausticStrength * uCausticBrightness * (1.0 - scatter);
	
	finalColor = clamp(finalColor, 0.0, 1.0);
	fragColor = vec4(finalColor, 1.0);
}`;

		if(DEBUG)
			console.log("physics program");
		this.physicsProgram = this.createProgram(VERTEX_SHADER,
			PHYSICS_SHADER);

		if(DEBUG)
			console.log("render program");
		this.renderProgram = this.createProgram(VERTEX_SHADER,
			RENDER_SHADER);
	
	}

	async initShadersZip() {

		if(DEBUG)
			console.log("init shaders zip");

		// https://ctrl-alt-test.fr/minifier/?main
		// https://github.com/laurentlb/shader-minifier

		const VERTEX_SHADER = await this.decompress(
			"H4sIAAAAAAAAClMuSy0qzszPUzA2MFBILebKzFMoS002UijIL84syczPs84vLYGIlKRWOOfnF6VYl+VnpijkJmbmaWhWwwRtYeq19Ey19Uyt03PiA6AitmWpySYaMHkdAx1DTetaAIBqaOZ3AAAA"
		);

		const PHYSICS_SHADER = await this.decompress(
			"H4sIAAAAAAAACoVUTW+bQBC991cgVYpYvMZgJ20qQg6Ne+vBiqP2EPmwgjGMBCzaD5c04r9XuyyE2JVyY2dn3rw385bPJxASeeNtosgD+akVkKENlFiUrXesOFPJeVSyuq1ArLeJbvDIRe2dIFt7+hEkr7RC3kwXFsDTW6gUe8IaqN6ibCv2ss9YBVTv8S98ZxKo/s1OsG8Bcqq3rG6xKajeCd6yghlEezXBTgw8vRNwQq7lXjEFZ4SeuM7K5zg6THFslAs/cN2oRCqhM+XZyKstarlEK2GgLliOWrqDVAKaQpXuqATDarxqBbA86adOFtL12jHBammJYDNwU9A9cC7yhGtlItfeUbDigVdcJCeOuVczbHzyaq+k0ZYq6JQW4L+XTEck4piUgEWpUlsTdskgCjuoUvPpx2Q1X5Rjr+s0CpMjF76ZEKZRgne3CS4W5HXIYE1RQWq/fSRB+PX2ZvPtNv6ySaSuFx9xW9jWGZe+xSFUYuM+SWDJBRfLJmGX9IZYjZ0/iKJS10EYr2+CdbgcBL7MnEOC0TpO1p+SKeOwtGadP1MddnR+eiFnyucOmc0gR6nSyjrAH5UFM6ClMxweyMr/qOVq8j6h0jyG/NFaLX1nGTyEzoF49E3/u3nuSAzrlmXqonK0ayBrzlUpFbT+vJxGITWYJAhvDP55vfX3fRReXeF9RNzzEHDa8ZHlMy7jA635CX5BNsUOS5fl1mDuf0Izjs6lk9W4HtPb5dzHsLx2rUxoiyJ1+auzcqr4jmOj0v+u4j0DVvGmeDJy0pwr31VS14EYAm8pd1E4DtZO4MfxCJlKoWv95bj9AWD5VhSMWJOq1cU8h3/EIoyimJBkWNriYmu2ZzDrHLjZBOEm6fvevrehOOn76a9hXve1L3VN3VuJaEyS/h+jh5Pl4gUAAA=="
		);

		const RENDER_SHADER = await this.decompress(
			"H4sIAAAAAAAACpVWS3PbNhC+91dwphcAhGBRttp4EB5qK57mkE7GcpMzSoESJhTBgoBMJqP/3gHAB6hH655ILLmLb1/f7s8Hrmohy+h2Po94/VOleCacYCe2uyrKC8k0PZXWbF8VXC1W1JQil2ofHXi2iMwzr2VhtJDl8MEZiMyL2HNsVqKuCtauM1bw4Y/BWGS+Ms3V71xsdxqbB5Z92yppys0Lb7RRHJvPih+ENPVaM83Du28jszblSiie2duxWfNMlhum2lB8Cmptyo+l5mUtdBuoBLJnnis21fW3OaQvotTnjpZ6rRUvt3qHzbrimSmYGiXP0mx3Ja9rbJ4Ur0tefMhznunh+Fm+cjVqdsdnnhfeie63ULQStZbqAsr1t/ZRFlKdglzxSu+eWKalwuY3vZd1teNKZOuMaW2v+1AePrEqCMQjM7UW2ehHL7CpHE8V55vh9KBsIr2vnWjFNRMFNl/ZgY/4R6ufhFJSXfryhRcyE7oNAtHhHyUPhVFUlL4YNW8epVQbKo22krsoV2zrw+Gis+X6D6n2rAC+eA/YPSvR8AL+cBobplmqffWBaXUeIPXBLJ2NHmiakJj9VQOrSZqZe7QQLQhVXBtVdr+L79zeegvARetZwfYVMIeZRQQcItLgOcRzghMCIWlm/6oXX9WDaIoXTXoSvwXOHHvD7f+Ec0nvP+AkENKjS5YnCZtgxTdjxofU+VwothGmPs3jbZTZrKcu4PM+b1pqVqRzQnOpgCh11KSzhDbv04Q2cQx7aWulrZW2cezMLSKZ5zXX6dQ9ZxU00EMBLYTIw0EOSecz9bqkTRMy6987RK8uavZD4YLhnAMNbiG8WRDqnIjHcjznR28Pkqb9jrwx6ryM0+507IrQmbpx3+jRX77lehrW265UsXsvrP5KKH86CP5qD1710LUm/OHPdcWzldTpnjVgIzXo7IyV3xuLOzvQVgTsOgRU8hV0JvBi+QuB6I6gq8yAFiQONabEiUBCZiPnQoiA7c4BMUoWJCbvILrCSCghS4jOaNyajaeGrhIUuiO2iKXYRHsmStDVkCuK1GU4gTfh5AwjnJ7QxRzPXVM4dtq5pK6uclTPgH3F+//TUY00uHegk86Cjy0NqiAd2bI369sZ0t1QtrypAJglJPYiFM4ZiC4Mmh5Z5qdDOid44yaEa/90OjVQ0jWr1xFpQqh4ny4IFUNndobqP7+kPUw0GVVIxN4h0rTo8gj15j2OJ8X/TgNISNDuijitRQnG+0iDRpXY7TtoMhaRgOhEpX2DCkjIjYD02IeoeyKyjMnSZygXJSvcYEv3ogHXqNLTVR+WIAwgWHNOqpose7I+nbMXWmBJYFcTeNyP8GQj6iuDLCENM207OCGzE8bo6cGyw3Q/gmi6PdEgBt7PURC7zkkwuf8Vk/sFRFOqO2OnySYJexA4aPVwb/TWyf07TO7vcfIG65c208vXnC2ksc3vsNVh7xgMewai090NheV7vkdOowNRX1+nGx863+ocufqE9lVChx3LUttdkAWcQHr8BxvpwntuDAAA"
		);

		this.physicsProgram = this.createProgram(VERTEX_SHADER,
			PHYSICS_SHADER);

		this.renderProgram = this.createProgram(VERTEX_SHADER,
			RENDER_SHADER);
	
	}

	async decompress(b64Str, format = "gzip") {

		return await new Response(
			new Response(
				Uint8Array.from(atob(b64Str),
					c =>
						c.charCodeAt(0))
			).body.pipeThrough(new DecompressionStream(format))
		)
		.text();
	
	}

	initBuffers() {

		if(DEBUG)
			console.log("init buffers");
		this.vertexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER,
			this.vertexBuffer);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			this.vertices,
			this.gl.STATIC_DRAW
		);
	
	}

	syncSize() {

		this.ww = window.innerWidth;
		this.wh = window.innerHeight;

		this.sizeBase = Math.max(this.ww,
			this.wh) / this.sizeRef;

		this.deltaTime
			= this.DELTA_TIMESTEP * (this.baseScale / this.displayScale);

		if(DEBUG)
			console.log(
				"screen",
				this.ww + "x" + this.wh,
				"fact",
				this.sizeBase
			);
	
	}

	syncCanvas() {

		const cw = Math.round(this.ww * this.displayScale);
		const ch = Math.round(this.wh * this.displayScale);

		this.cvs.width = cw;
		this.cvs.height = ch;

		// this.cvs.style.width = this.ww + "px";
		// this.cvs.style.height = this.wh + "px";

		if(DEBUG)
			console.log("canvas",
				cw + "x" + ch);
	
	}

	fadeCanvas(op) {

		return new Promise(res => {

			this.cvs.addEventListener("transitionend",
				() =>
					res(),
				{
					once: true,
				});

			this.cvs.style.opacity = op;
		
		});
	
	}

	syncViewport() {

		this.gl.viewport(0,
			0,
			this.w,
			this.h);
	
	}

	syncUniforms() {

		if(DEBUG)
			console.log("sync uniforms");
		this.scaledPropagation = Math.round(
			(this.params.propagationSpeed * this.displayScale) / this.baseScale
		);															  
	
	}

	initTextures() {

		if(DEBUG)
			console.log("init textures");

		const gl = this.gl;

		this.waterTexture1 = this.createWaterTexture();
		this.waterTexture2 = this.createWaterTexture();
		this.backgroundTexture = this.createBackgroundTexture();

		this.framebuffer1 = this.createFramebuffer(this.waterTexture1);
		this.framebuffer2 = this.createFramebuffer(this.waterTexture2);

		this.currentFramebuffer = this.framebuffer1;
		this.currentTexture = this.waterTexture1;
		this.previousTexture = this.waterTexture2;

		gl.bindFramebuffer(gl.FRAMEBUFFER,
			null);
		gl.bindTexture(gl.TEXTURE_2D,
			null);
	
	}

	createWaterTexture() {

		const gl = this.gl;
		const texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D,
			texture);

		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA32F,
			this.w,
			this.h,
			0,
			gl.RGBA,
			gl.FLOAT,
			null
		);

		gl.texParameteri(gl.TEXTURE_2D,
			gl.TEXTURE_MIN_FILTER,
			gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D,
			gl.TEXTURE_MAG_FILTER,
			gl.NEAREST);

		gl.texParameteri(gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_S,
			gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_T,
			gl.CLAMP_TO_EDGE);

		const waterError = gl.getError();

		if(waterError !== gl.NO_ERROR) {

			throw new Error("create water texture fail");
		
		}

		return texture;
	
	}

	createBackgroundTexture() {

		const gl = this.gl;
		const texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D,
			texture);

		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			this.w,
			this.h,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			null
		);

		gl.texParameteri(gl.TEXTURE_2D,
			gl.TEXTURE_MIN_FILTER,
			gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D,
			gl.TEXTURE_MAG_FILTER,
			gl.LINEAR);

		gl.texParameteri(gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_S,
			gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_T,
			gl.CLAMP_TO_EDGE);

		return texture;
	
	}

	createFramebuffer(texture) {

		const gl = this.gl;
		const framebuffer = gl.createFramebuffer();

		gl.bindFramebuffer(gl.FRAMEBUFFER,
			framebuffer);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			texture,
			0
		);

		const frameBufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

		if(frameBufferStatus !== gl.FRAMEBUFFER_COMPLETE) {

			throw new Error(`incomplete framebuffer ${frameBufferStatus}`);
		
		}

		return framebuffer;
	
	}

	syncTextures() {

		if(DEBUG)
			console.log("sync textures");

		this.updateTextures();
		this.updateBackgroundTexture();
	
	}

	debouncedResize() {

		/*clearTimeout(this.sizing);

		this.sizing = setTimeout(() =>
			this.handleResize(),
		128);*/

		this.handleResize();
	
	}

	handleResize() {

		if(DEBUG)
			console.log("window resize");

		this.stopPerfCheck();

		this.amplify.mask(true);

		this.fadeCanvas(0)
		.then(() => {

			this.amplify.updateBounds();

			this.syncLiquid();

			this.fadeCanvas(1);

			this.amplify.mask(false);

			this.startPerfCheck();
		
		});
	
	}

	syncLiquid() {

		this.syncSize();

		this.syncCanvas();

		this.syncUniforms();

		this.syncViewport();

		this.syncTextures();
	
	}

	updateTextures() {

		if(DEBUG)
			console.log("update textures");

		const gl = this.gl;

		[this.waterTexture1, this.waterTexture2].forEach(texture => {

			gl.bindTexture(gl.TEXTURE_2D,
				texture);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA32F,
				this.w,
				this.h,
				0,
				gl.RGBA,
				gl.FLOAT,
				null
			);
		
		});

		[this.framebuffer1, this.framebuffer2].forEach(framebuffer => {

			gl.bindFramebuffer(gl.FRAMEBUFFER,
				framebuffer);

			if(
				gl.checkFramebufferStatus(gl.FRAMEBUFFER)
				!== gl.FRAMEBUFFER_COMPLETE
			) {

				throw new Error("incomplete resized framebuffer");
			
			}
		
		});

		gl.bindFramebuffer(gl.FRAMEBUFFER,
			null);
	
	}

	initUniforms() {

		if(DEBUG)
			console.log("init uniforms");

		const getUniforms = (prgm, prop) =>
			Object.keys(prop)
			.reduce(
				(uniforms, uniform) =>
					({
						...uniforms,
						[uniform]: this.gl.getUniformLocation(
							prgm,
							`u${prop[uniform]}`
						),
					}),
				{}
			);

		this.physicsUniforms = {
			...getUniforms(this.physicsProgram,
				{
					resolution: "Resolution",
					displayScale: "DisplayScale",
					sizeBase: "SizeBase",
					deltaTime: "DeltaTime",
					time: "Time",
					waveSpeed: "WaveSpeed",
					damping: "Damping",
					propagationSpeed: "PropagationSpeed",
					previousState: "PreviousState",
					touchPositions: "Touch",
					touchCount: "TouchCount",
				}),
			touches: new Array(10)
			.fill({})
			.map((_, i) => {

				const uTouch = `TouchParams[${i}].`;

				return getUniforms(this.physicsProgram,
					{
						position: `${uTouch}position`,
						radius: `${uTouch}radius`,
						damping: `${uTouch}damping`,
						strength: `${uTouch}strength`,
						trail: `${uTouch}trail`,
						spread: `${uTouch}spread`,
						angle: `${uTouch}angle`,
					});
			
			}),
		};

		this.renderUniforms = getUniforms(this.renderProgram,
			{
				resolution: "Resolution",
				time: "Time",
				displayScale: "DisplayScale",
				previousState: "PreviousState",
				waterHeight: "WaterHeight",
				backgroundTexture: "BackgroundTexture",

				sunDirection: "SunDirection",
				secondarySunDirection: "SecondarySunDirection",
				sunIntensity: "SunIntensity",
				secondaryIntensity: "SecondaryIntensity",

				refraction: "Refraction",
				waterTint: "WaterTint",
				tintStrength: "TintStrength",
				specularStrength: "SpecularStrength",
				roughness: "Roughness",

				fresnelEffect: "FresnelEffect",
				fresnelPower: "FresnelPower",
				specularPower: "SpecularPower",

				skyColor: "SkyColor",
				depthFactor: "DepthFactor",
				atmosphericScatter: "AtmosphericScatter",
				envMapIntensity: "EnvMapIntensity",

				reflectionFresnel: "ReflectionFresnel",
				reflectionBlur: "ReflectionBlur",
				reflectionDistortion: "ReflectionDistortion",

				causticStrength: "CausticStrength",
				causticScale: "CausticScale",
				causticSpeed: "CausticSpeed",
				causticBrightness: "CausticBrightness",
				causticDetail: "CausticDetail",

				waveReflectionStrength: "WaveReflectionStrength",
				mirrorReflectionStrength: "MirrorReflectionStrength",
				velocityReflectionFactor: "VelocityReflectionFactor",
			});
	
	}

	getUniformLocations(gl, program, defs) {

		const uniforms = {};

		for(const [type, locations] of Object.entries(defs)) {

			if(type === "touchParams" || type === "arrays")
				continue;

			uniforms[type] = {};
			for(const [name, loc] of Object.entries(locations)) {

				uniforms[type][name] = gl.getUniformLocation(program,
					loc);
			
			}
		
		}

		if(defs.arrays) {

			uniforms.arrays = {};
			for(const [name, def] of Object.entries(defs.arrays)) {

				uniforms.arrays[name] = {
					location: gl.getUniformLocation(program,
						def.name),
					size: def.size,
					type: def.type,
				};
			
			}
		
		}

		if(defs.touchParams) {

			uniforms.touchParams = [];

			for(let i = 0; i < defs.touchParams.count; i++) {

				const touchUniforms = {};

				for(const [type, params] of Object.entries(
					defs.touchParams.struct
				)) {

					touchUniforms[type] = {};

					for(const param of params) {

						const loc = gl.getUniformLocation(
							program,
							`uTouchParams[${i}].${param}`
						);

						touchUniforms[type][param] = loc;
					
					}
				
				}

				uniforms.touchParams.push(touchUniforms);
			
			}
		
		}

		return uniforms;
	
	}

	createProgram(vertexSource, fragmentSource) {

		const gl = this.gl;
		const program = gl.createProgram();

		const createShader = (type, source) => {

			const shader = gl.createShader(type);

			gl.shaderSource(shader,
				source);
			gl.compileShader(shader);

			if(!gl.getShaderParameter(shader,
				gl.COMPILE_STATUS)) {

				const shaderInfo = gl.getShaderInfoLog(shader);

				gl.deleteShader(shader);

				throw new Error(`compile shader fail ${shaderInfo}`);
			
			}
			return shader;
		
		};

		let vertShader, fragShader;

		try {

			vertShader = createShader(gl.VERTEX_SHADER,
				vertexSource);
			fragShader = createShader(gl.FRAGMENT_SHADER,
				fragmentSource);

			gl.attachShader(program,
				vertShader);
			gl.attachShader(program,
				fragShader);
			gl.linkProgram(program);

			if(!gl.getProgramParameter(program,
				gl.LINK_STATUS)) {

				const programInfo = gl.getProgramInfoLog(program);

				throw new Error(`link program fail ${programInfo}`);
			
			}
		
		}
		catch (programError) {

			throw programError;
		
		}
		finally {

			if(vertShader)
				gl.deleteShader(vertShader);
			if(fragShader)
				gl.deleteShader(fragShader);
		
		}

		return program;
	
	}

	physicsStep() {

		const gl = this.gl;
		const u = this.physicsUniforms;

		gl.useProgram(this.physicsProgram);
		gl.bindFramebuffer(gl.FRAMEBUFFER,
			this.currentFramebuffer);

		gl.bindBuffer(gl.ARRAY_BUFFER,
			this.vertexBuffer);
		const positionLoc = gl.getAttribLocation(
			this.physicsProgram,
			"position"
		);

		gl.enableVertexAttribArray(positionLoc);
		gl.vertexAttribPointer(positionLoc,
			2,
			gl.FLOAT,
			false,
			0,
			0);

		gl.uniform2f(u.resolution,
			this.w,
			this.h);
		gl.uniform1f(u.displayScale,
			this.displayScale);
		gl.uniform1f(u.sizeBase,
			this.sizeBase);
		gl.uniform1f(u.deltaTime,
			this.deltaTime);
		gl.uniform1f(u.time,
			this.accumulatedTime);
		gl.uniform1f(u.waveSpeed,
			this.params.waveSpeed);
		gl.uniform1f(u.damping,
			this.params.damping);
		gl.uniform1f(u.propagationSpeed,
			this.scaledPropagation);

		this.processTouches();

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D,
			this.previousTexture);
		gl.uniform1i(u.previousState,
			0);

		gl.drawArrays(gl.TRIANGLE_STRIP,
			0,
			4);
	
	}

	processTouches() {

		const touchArray = Array.from(this.pops.values());
		const touchCount = Math.min(touchArray.length,
			10);

		this.touchPositions.fill(0);
		const gl = this.gl;
		const u = this.physicsUniforms;

		for(let i = 0; i < touchCount; i++) {

			const touch = touchArray[i];

			this.touchPositions[i * 2] = touch.x;
			this.touchPositions[i * 2 + 1] = touch.y;

			this.touchPositions[(i + touchCount) * 2] = touch.prevX;
			this.touchPositions[(i + touchCount) * 2 + 1] = touch.prevY;

			gl.uniform2f(u.touches[i].position,
				touch.x,
				touch.y);
			gl.uniform1f(u.touches[i].radius,
				touch.touchRadius);
			gl.uniform1f(u.touches[i].damping,
				touch.touchDamping);
			gl.uniform1f(u.touches[i].strength,
				touch.initialImpact);
			gl.uniform1f(u.touches[i].trail,
				touch.trailStrength);
			gl.uniform1f(u.touches[i].spread,
				touch.trailSpread);
			gl.uniform1f(u.touches[i].angle,
				touch.trailAngle);
		
		}

		gl.uniform2fv(u.touchPositions,
			this.touchPositions);
		gl.uniform1i(u.touchCount,
			touchCount);
	
	}

	renderStep() {

		const gl = this.gl;

		gl.useProgram(this.renderProgram);
		gl.bindFramebuffer(gl.FRAMEBUFFER,
			null);

		gl.clearColor(0,
			0,
			0,
			1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.bindBuffer(gl.ARRAY_BUFFER,
			this.vertexBuffer);
		const positionLoc = gl.getAttribLocation(
			this.renderProgram,
			"position"
		);

		gl.enableVertexAttribArray(positionLoc);
		gl.vertexAttribPointer(positionLoc,
			2,
			gl.FLOAT,
			false,
			0,
			0);

		this.updateRenderUniforms();

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D,
			this.currentTexture);
		gl.uniform1i(this.renderUniforms.waterHeight,
			0);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D,
			this.backgroundTexture);
		gl.uniform1i(this.renderUniforms.backgroundTexture,
			1);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D,
			this.previousTexture);
		gl.uniform1i(this.renderUniforms.previousState,
			2);

		gl.drawArrays(gl.TRIANGLE_STRIP,
			0,
			4);

		const renderError = gl.getError();

		if(renderError !== gl.NO_ERROR) {

			throw new Error("render step error " + renderError);
		
		}

		const fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

		if(fbStatus !== gl.FRAMEBUFFER_COMPLETE) {

			throw new Error("incomplete framebuffer " + fbStatus);
		
		}
	
	}

	updateRenderUniforms() {

		const gl = this.gl;
		const u = this.renderUniforms;
		const p = this.params;

		gl.uniform2f(u.resolution,
			this.w,
			this.h);
		gl.uniform1f(u.time,
			this.accumulatedTime);
		gl.uniform1f(u.displayScale,
			this.displayScale);

		Object.keys(p)
		.filter(prop =>
			u[prop] && p[prop] instanceof Float32Array)
		.forEach(prop =>
			gl.uniform3fv(u[prop],
				p[prop]));

		Object.keys(p)
		.filter(prop =>
			u[prop] && typeof p[prop] === "number")
		.forEach(prop =>
			gl.uniform1f(u[prop],
				p[prop]));
	
	}

	updateBackgroundTexture() {

		if(!this.image?.complete || !this.image.naturalWidth)
			return;

		const gl = this.gl;
		let cvs = document.createElement("canvas");
		const ctx = cvs.getContext("2d",
			{ alpha: false });

		cvs.width = this.w;
		cvs.height = this.h;

		ctx.fillStyle = "#000000";
		ctx.fillRect(0,
			0,
			this.w,
			this.h);

		const imgW = this.image.naturalWidth;
		const imgH = this.image.naturalHeight;
		const screenAspect = this.w / this.h;
		const imageAspect = imgW / imgH;

		let sx, sy, sw, sh;

		if(screenAspect > imageAspect) {

			sw = imgW;
			sh = Math.round(imgW / screenAspect);
			sx = 0;
			sy = Math.round((imgH - sh) / 2);
		
		}
		else {

			sh = imgH;
			sw = Math.round(imgH * screenAspect);
			sy = 0;
			sx = Math.round((imgW - sw) / 2);
		
		}

		ctx.drawImage(this.image,
			sx,
			sy,
			sw,
			sh,
			0,
			0,
			this.w,
			this.h);

		this.fish.forEach(fish => {

			if(fish.i?.complete) {

				const { x, y, w, h } = fish.c();

				ctx.globalAlpha = 0.55;
				ctx.shadowColor = "#000000";
				ctx.shadowBlur = 16;
				ctx.drawImage(fish.i,
					x,
					y,
					w,
					h);
			
			}
		
		});

		gl.bindTexture(gl.TEXTURE_2D,
			this.backgroundTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			cvs
		);

		ctx.clearRect(0,
			0,
			this.w,
			this.h);
		cvs.width = cvs.height = 0;
		cvs = null;
	
	}

	toggleRenderLoop() {

		if(this.isRunning)
			this.stopRenderLoop();
		else
			this.startRenderLoop();
	
	}

	startRenderLoop() {

		if(this.isRunning)
			return;
		if(DEBUG)
			console.log("start render loop");

		this.renderText("liquify");

		this.isRunning = true;
		this.amplify.toggle("flow");
		this.lastFrameTime = performance.now();
		this.startPerfCheck();
		this.nextFrame();
	
	}

	stopRenderLoop() {

		if(!this.isRunning)
			return;
		if(DEBUG)
			console.log("stop render loop");

		this.isRunning = false;

		cancelAnimationFrame(this.loop);

		this.stopPerfCheck();

		this.renderInfo("--");

		this.amplify.toggle("flow",
			false);
	
	}

	nextFrame() {

		this.loop = requestAnimationFrame(hrts =>
			this.renderLoop(hrts));
	
	}

	renderLoop(currentTime) {

		if(!this.gl || this.gl.isContextLost()) {

			this.stopRenderLoop();

			throw new Error("webgl context lost");
		
		}

		this.accumulatedTime += this.deltaTime;

		this.physicsStep();
		this.swapBuffers();

		this.renderStep();

		this.checkPerformance(currentTime);

		// if(this.isRunning)
		this.nextFrame();
	
	}

	startPerfCheck(chk = 1000) {

		if(this.PERF_CHECK)
			return;

		if(DEBUG)
			console.log("start perf check",
				chk);

		this.PERF_CHECK = true;

		this.notBefore = this.lastFrameTime + chk;
		// this.frameTimeHistory = new Array(30).fill(16.67);
	
	}

	stopPerfCheck() {

		if(!this.PERF_CHECK)
			return;

		if(DEBUG)
			console.log("stop perf check");

		this.PERF_CHECK = false;

		this.currentFPS = 0;
	
	}

	checkPerformance(currentTime) {

		const frameTime = currentTime - this.lastFrameTime;

		this.lastFrameTime = currentTime;

		if(!this.PERF_CHECK || currentTime < this.notBefore)
			return;

		this.frameTimeHistory[this.frameTimeIndex] = frameTime;
		this.frameTimeIndex
			= (this.frameTimeIndex + 1) % this.frameTimeHistory.length;

		const avgFrameTime
			= this.frameTimeHistory.reduce((a, b) =>
				a + b)
			/ this.frameTimeHistory.length;
		const updatedFPS = Math.round(1000 / avgFrameTime);

		if(updatedFPS !== this.currentFPS) {

			this.renderInfo(updatedFPS.toString()
			.padStart(2,
				"0"));
		
		}

		this.currentFPS = updatedFPS;

		if(currentTime - this.lastScaleCheck >= this.SCALE_CHECK_INTERVAL) {

			this.lastScaleCheck = currentTime;

			this.LOOP_COUNT++;
			if(this.LOOP_COUNT >= this.LOOPS_TO_SCALE) {

				if(this.currentFPS < this.TARGET_FPS) {

					this.downScale();
				
				}
				else if(
					this.ENABLE_UPSCALE
					&& this.displayScale < this.DOWN_FROM
					&& this.displayScale < this.MAX_SCALE
				) {

					this.upScale();
				
				}
			
			}
		
		}
	
	}

	downScale() {

		if(DEBUG)
			console.log("downscale");

		this.DOWN_FROM = this.displayScale - this.SCALE_STEP;
		this.setDisplayScale(this.displayScale - this.SCALE_STEP);
	
	}

	upScale() {

		if(DEBUG)
			console.log("upscale");

		this.setDisplayScale(this.displayScale + this.SCALE_STEP);
	
	}

	setDisplayScale(ds) {

		ds = Math.max(Math.min(this.MAX_SCALE,
			ds),
		this.MIN_SCALE);

		if(ds == this.displayScale)
			return;

		if(DEBUG)
			console.log("set scale",
				ds);

		this.stopPerfCheck();

		this.renderText((ds > this.displayScale ? "up" : "down") + "scale");

		this.LOOP_COUNT = 0;

		// clean round
		this.displayScale = Math.round(ds * 2) / 2;
		this.scaleBase = this.displayScale / this.baseScale;

		this.syncLiquid();

		this.startPerfCheck();
	
	}

	renderText(str) {

		window.requestAnimationFrame(() => {
			this.infos.textContent = str
		});
	
	}

	renderInfo(fps) {

		this.infos.textContent = "x" + this.displayScale.toString() + " " + fps;
	
	}

	visibleChange() {

		this.isVisible = document.visibilityState === "visible";

		if(DEBUG)
			console.log(this.isVisible ? "visible" : "hidden");

		if(this.isVisible)
			this.startRenderLoop();
		else
			this.stopRenderLoop();
	
	}

	swapBuffers() {

		[this.currentFramebuffer, this.currentTexture, this.previousTexture] = [
			this.currentFramebuffer === this.framebuffer1
				? this.framebuffer2
				: this.framebuffer1,
			this.currentTexture === this.waterTexture1
				? this.waterTexture2
				: this.waterTexture1,
			this.previousTexture === this.waterTexture1
				? this.waterTexture2
				: this.waterTexture1,
		];
	
	}

	resetWaterState() {

		if(DEBUG)
			console.log("reset state");

		const gl = this.gl;
		const initialData = new Float32Array(this.w * this.h * 4);

		// still water
		for(let i = 0; i < initialData.length; i += 4) {

			initialData[i] = 0.0; // height
			initialData[i + 1] = 0.0; // prev height
			initialData[i + 2] = 0.0; // velocity
			initialData[i + 3] = 1.0; // alpha
		
		}

		[this.waterTexture1, this.waterTexture2].forEach(texture => {

			gl.bindTexture(gl.TEXTURE_2D,
				texture);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA32F,
				this.w,
				this.h,
				0,
				gl.RGBA,
				gl.FLOAT,
				initialData
			);
		
		});

		this.currentFramebuffer = this.framebuffer1;
		this.currentTexture = this.waterTexture1;
		this.previousTexture = this.waterTexture2;
	
	}

	setupEvents() {

		if(DEBUG)
			console.log("setup events");

		document.addEventListener("visibilitychange",
			() =>
				this.visibleChange()
		);
		window.addEventListener("resize",
			() =>
				this.debouncedResize());

		window.addEventListener("hashchange",
			() =>
				window.location.reload());

		const pointerEvents = {
			touchstart: this.dontTouchMe,
			pointerdown: this.handlePointerStart,
			pointermove: this.handlePointerMove,
			pointerup: this.handlePointerEnd,
			pointerout: this.handlePointerEnd,
			pointercancel: this.handlePointerEnd,
		};

		Object.keys(pointerEvents)
		.forEach(pointing =>
			this.cvs.addEventListener(
				pointing,
				pointerEvents[pointing].bind(this)
			)
		);
	
	}

	// POINTERS

	genPopId() {

		return Math.random()
		.toString(36)
		.slice(-6);
	
	}

	getPointerPos(evt) {

		const cx = evt.clientX,
			cy = evt.clientY;

		return {
			x: cx * this.displayScale,
			y: this.h - cy * this.displayScale,
			rx: cx,
			ry: cy,
		};

		// ROUND ?
		/*const cx = Math.round(evt.clientX), 
			cy = Math.round(evt.clientY);

		return {
			x: Math.round(cx * this.displayScale), 
			y: Math.round(this.h - cy * this.displayScale),
			rx: cx,
			ry: cy
		};*/
	
	}

	// args ?
	pointOptions() {

		return {
			touchRadius: this.params.touchRadius,
			touchDamping: this.params.touchDamping,
			initialImpact: this.params.initialImpact,
			trailStrength: this.params.trailStrength,
			trailSpread: this.params.trailSpread,
			trailAngle: this.params.trailAngle,
		};
	
	}

	dontTouchMe(evt) {

		// kill iOS magnifier
		evt.preventDefault();
	
	}

	handlePointerStart(evt) {

		evt.preventDefault();

		const pId = evt.pointerId;

		if(!this.isTouched)
			this.isTouched = true;

		this.cvs.setPointerCapture(pId);

		const pos = this.getPointerPos(evt);

		this.pops.set(pId,
			{
				x: pos.x,
				y: pos.y,
				prevX: pos.x,
				prevY: pos.y,
				...this.pointOptions(),
			});
	
	}

	handlePointerMove(evt) {

		evt.preventDefault();

		const pId = evt.pointerId;

		if(this.pops.has(pId)) {

			const pop = this.pops.get(pId);
			const pos = this.getPointerPos(evt);

			pop.prevX = pop.x;
			pop.prevY = pop.y;
			pop.x = pos.x;
			pop.y = pos.y;

			pop.rx = pos.rx;
			pop.ry = pos.ry;

			this.hitParams();
		
		}
	
	}

	handlePointerEnd(evt) {

		const pId = evt.pointerId;

		if(this.pops.has(pId)) {

			this.cvs.releasePointerCapture(pId);
			this.pops.delete(pId);
			this.hitParams();
		
		}
	
	}

	hitParams() {

		if(this.amplify.pop) {

			const hit = Array.from(this.pops.values())
			.some(pop =>
				this.hitPoint(pop.rx,
					pop.ry,
					this.amplify.bnd)
			);

			if(hit !== this.hits) {

				this.hits = hit;
				clearTimeout(this.hitting);
				this.hitting = setTimeout(
					() =>
						this.amplify.mask(this.hits),
					100
				);
			
			}
		
		}
	
	}

	hitPoint(px, py, bnd) {

		return (
			px >= bnd.x
			&& px <= bnd.x + bnd.w
			&& py >= bnd.y
			&& py <= bnd.y + bnd.h
		);
	
	}

	/*destroy() {
		this.isVisible = false;
		cancelAnimationFrame(this.loop);
		this.sizer.disconnect();

		const gl = this.gl;
		if(gl) {
			[
				this.waterTexture1,
				this.waterTexture2,
				this.backgroundTexture,
			].forEach((tex) =>
				gl.deleteTexture(tex));
			[this.framebuffer1, this.framebuffer2].forEach((fb) =>
				gl.deleteFramebuffer(fb)
			);
			gl.deleteBuffer(this.vertexBuffer);
			gl.deleteProgram(this.physicsProgram);
			gl.deleteProgram(this.renderProgram);
		}

		this.cvs.remove();
		this.pops.clear();
	}*/

	// GETTERS

	get w() {

		return this.cvs.width;
	
	}

	get h() {

		return this.cvs.height;
	
	}

	// UTIL

	randRange(min, max) {

		return Math.floor(Math.random() * (max - min + 1)) + min;
	
	}

	// EFFECTS

	/**
	 * @method dropIt :
	 * @param {number=} x :
	 * @param {number=} y :
	 */
	dropIt(x, y) {

		x ||= this.randRange(this.w * 0.3,
			this.w * 0.7);
		y ||= this.randRange(this.h * 0.3,
			this.h * 0.7);

		const dropId = "drop_" + this.genPopId();

		const point = {
			x,
			y,
			prevX: x,
			prevY: y,
			...this.pointOptions(),
			touchRadius: 0.015,
			touchDamping: 990,
			initialImpact: 0.15,
			trailStrength: 0.001,
			trailSpread: 0,
			trailAngle: this.params.trailAngle,
			// initialImpact: 0.1,
			// trailStrength: 0
		};

		this.pops.set(dropId,
			point);

		setTimeout(() => {

			this.pops.delete(dropId);
		
		},
		75 + Math.round(Math.random() * 100));
	
	}

	curveIt() {

		const centerX = this.w * 0.5;
		const centerY = this.h * 0.5;

		const offCenterX = 0.3;
		const offCenterY = 0.3;

		const startX = centerX - this.w * offCenterX;
		const startY = centerY + (Math.random() - 0.5) * this.h * offCenterY;
		const endX = centerX + this.w * offCenterX;
		const endY = centerY + (Math.random() - 0.5) * this.h * offCenterY;

		const ctrlX = centerX + (Math.random() - 0.5) * this.w * 0.2;
		const ctrlY = centerY + (Math.random() - 0.5) * this.h * 0.4;

		const touchId = "curve_" + this.genPopId();
		const point = {
			x: startX,
			y: startY,
			prevX: startX,
			prevY: startY,
			...this.pointOptions(),
			// touchRadius: 0.015,
			// trailStrength: 0.08,
			// trailSpread: 0.05
		};

		this.pops.set(touchId,
			point);
		const startTime = performance.now();
		const duration = 1234;

		const animate = () => {

			const elapsed = performance.now() - startTime;
			const progress = elapsed / duration;

			if(progress >= 1) {

				this.pops.delete(touchId);
				return;
			
			}

			point.prevX = point.x;
			point.prevY = point.y;

			const t = progress;
			const invT = 1 - t;

			point.x
				= invT * invT * startX + 2 * invT * t * ctrlX + t * t * endX;
			point.y
				= invT * invT * startY + 2 * invT * t * ctrlY + t * t * endY;

			requestAnimationFrame(animate);
		
		};

		animate();
	
	}

	snailIt() {

		const centerX = this.w * 0.5;
		const centerY = this.h * 0.5;

		const startX = centerX + (Math.random() - 0.5) * this.w * 0.3;
		const startY = centerY + (Math.random() - 0.5) * this.h * 0.3;

		const touchId = "curve_" + this.genPopId();
		const point = {
			x: startX,
			y: startY,
			prevX: startX,
			prevY: startY,
			...this.pointOptions(),
			touchRadius: 0.02,
			trailStrength: 0.12,
			trailSpread: 0.15,
		};

		this.pops.set(touchId,
			point);

		let time = 0;
		const duration = 2500; // 2.5 seconds
		const startTime = performance.now();

		// Random curve parameters
		const radiusX = this.w * 0.15; // Curve width
		const radiusY = this.h * 0.15; // Curve height
		const loops = 1.5 + Math.random(); // How many loops to make
		const drift = {
			x: (Math.random() - 0.5) * 0.3, // Gradual x drift
			y: (Math.random() - 0.5) * 0.3, // Gradual y drift
		};

		const animate = () => {

			const elapsed = performance.now() - startTime;
			const progress = elapsed / duration;

			if(progress >= 1) {

				this.pops.delete(touchId);
				return;
			
			}

			point.prevX = point.x;
			point.prevY = point.y;

			// Smooth curve motion with slight drift
			const angle = progress * Math.PI * 2 * loops;

			point.x = startX + Math.cos(angle) * radiusX + drift.x * elapsed;
			point.y = startY + Math.sin(angle) * radiusY + drift.y * elapsed;

			requestAnimationFrame(animate);
		
		};

		animate();
	
	}

	// SWIRLS

	createSwirl(x, y, radius, params, dur, startAngle, ease) {

		const popId = this.genPopId();
		const startTime = performance.now();

		const initialX = x + Math.cos(startAngle) * radius;
		const initialY = y + Math.sin(startAngle) * radius;

		const popped = {
			x: initialX,
			y: initialY,
			prevX: initialX,
			prevY: initialY,
			...this.pointOptions(),
			...params,
		};

		this.pops.set(popId,
			popped);

		const updateSwirl = () => {

			const elapsed = performance.now() - startTime;
			const progress = elapsed / dur;

			if(progress < 1) {

				const angle = startAngle + elapsed * 0.001 * popped.speed;
				const easedProgress = ease(elapsed,
					0,
					1,
					dur);
				const currentRadius = radius * (1 - easedProgress);

				if(this.pops.has(popId)) {

					const pop = this.pops.get(popId);

					pop.prevX = pop.x;
					pop.prevY = pop.y;
					pop.x = x + Math.cos(angle) * currentRadius;
					pop.y = y + Math.sin(angle) * currentRadius;

					requestAnimationFrame(updateSwirl);
				
				}
			
			}
			else {

				this.pops.delete(popId);
			
			}
		
		};

		requestAnimationFrame(updateSwirl);
	
	}

	createSwirls() {

		if(DEBUG)
			console.log("swirls");

		let numSwirls = 3,
			radius = 0.3;

		for(let i = 0; i < numSwirls; i++) {

			this.createSwirl(
				this.w / 2,
				this.h / 2,
				Math.min(this.w,
					this.h) * radius,
				{
					// touchRadius: 0.02,
					// touchDamping: 0.995,
					// initialImpact: 0.32,
					// trailStrength: 1.2,
					// trailSpread: 1.6,
					// trailAngle: 500,
					speed: 2.5,
				},
				3333,
				((2 * Math.PI) / numSwirls) * i,
				this.sineIn
			);
		
		}
	
	}

	sineIn(t, b, c, d) {

		return -c * Math.cos((t / d) * (Math.PI / 2)) + c + b;
	
	}

	// RAIN

	toggleRain() {

		if(this.isRaining)
			this.stopRain();
		else
			this.startRain();
	
	}

	startRain() {

		this.isRaining = true;
		this.lastRainDrop = 0;
		this.activeRaindrops = new Set();

		this.animateRain();
		this.amplify.toggle("rain");
	
	}

	animateRain() {

		if(!this.isRaining)
			return;

		const currentTime = performance.now();

		if(
			currentTime - this.lastRainDrop > this.rainDropDelay
			&& this.activeRaindrops.size < this.maxRaindrops
			&& this.pops.size < 8
		) {

			this.createRaindrop();
			this.lastRainDrop = currentTime;
		
		}

		requestAnimationFrame(() =>
			this.animateRain());
	
	}

	createRaindrop() {

		const x = Math.random() * this.w;
		const y = Math.random() * this.h;
		const dropId = "rain_" + this.genPopId();

		// impact
		const impactPoint = {
			x,
			y,
			prevX: x,
			prevY: y,
			...this.pointOptions(),
			touchRadius: 0.01,
			touchDamping: 0.35,
			initialImpact: 0.1,
			// trailStrength: 0.1,
		};

		this.pops.set(dropId + "_impact",
			impactPoint);

		// then splash
		setTimeout(() => {

			const splashPoint = {
				x,
				y,
				prevX: x,
				prevY: y,
				...this.pointOptions(),
				touchRadius: 0.04,
				touchDamping: 0.35,
				initialImpact: 0.1,
				// trailStrength: 0.1,
				// trailSpread: 2.0
			};

			this.pops.set(dropId + "_splash",
				splashPoint);
		
		},
		64);

		this.activeRaindrops.add(dropId);
		setTimeout(() => {

			this.pops.delete(dropId + "_impact");
			this.pops.delete(dropId + "_splash");
			this.activeRaindrops.delete(dropId);
		
		},
		72);
	
	}

	stopRain() {

		this.isRaining = false;
		this.amplify.toggle("rain",
			false);
	
	}

	// AUTOTOUCH

	toggleAutoTouch() {

		if(this.isAutoTouching)
			this.stopAutoTouch();
		else
			this.startAutoTouch();
	
	}

	startAutoTouch() {

		if(this.isAutoTouching)
			return;

		this.isAutoTouching = true;
		const touchId = "auto";
		let time = 0;

		const point = {
			x: this.w / 2,
			y: this.h / 2,
			prevX: this.w / 2,
			prevY: this.h / 2,
			speed: 0.01,
			scale: 0.5,
			...this.pointOptions(),
		};

		this.pops.set(touchId,
			point);

		const animate = () => {

			if(!this.isAutoTouching) {

				this.pops.delete(touchId);
				return;
			
			}

			time += point.speed;
			point.prevX = point.x;
			point.prevY = point.y;

			point.x = this.w * (0.5 + point.scale * Math.sin(time));
			point.y = this.h * (0.5 + point.scale * Math.cos(time * 1.5));

			window.requestAnimationFrame(animate);
		
		};

		animate();
		this.amplify.toggle("point");
	
	}

	stopAutoTouch() {

		if(!this.isAutoTouching)
			return;
		if(DEBUG)
			console.log("stop auto touch");
		this.isAutoTouching = false;
		this.amplify.toggle("point",
			this.isAutoTouching);
	
	}

}
