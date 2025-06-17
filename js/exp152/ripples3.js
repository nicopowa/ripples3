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
	setTimeout(
		cb,
		ms + Math.round(Math.random() * ms)
	);

window.addEventListener(
	"load",
	() => {

		console.log("https://github.com/nicopowa/ripples3");

		window.addEventListener(
			"error",
			evt => {

				handleError(evt.error);
				return false;
	
			}
		);

		window.addEventListener(
			"unhandledrejection",
			evt => {

				handleError(evt.reason);
				return false;
	
			}
		);

		try {

			const liquify = new Liquid();
			const amplify = new Params(liquify);

			liquify
			.flow(
				amplify,
				amplify.hashParams()
			)
			.then(() => {

				if(DEBUG)
					console.log("flowing");

				lazy(
					() => {

						// liquify.snailIt();
						// liquify.circleIt();
						// if(!liquify.isTouched) liquify.dropIt();
						/*lazy(
							() => {
								if(!liquify.isTouched) liquify.curveIt();
							}, 
							1000
						);*/

						/*setInterval(
							() => 
								liquify.dropIt(
									liquify.w / 2, 
									liquify.h / 2, 
									111
								),
							2222
						);*/
					
					},
					500
				);
			
			})
			.catch(err =>
				handleError(err));
	
		}
		catch (err) {

			handleError(err);
	
		}

	}
);

/**
 * @class Liquid : liquify all the pixels
 */
class Liquid {

	/**
	 * @construct
	 */
	constructor() {

		this.BASE_SCALE = 2.0; // ref scale
		this.REF_SIZE = 1024;   // ref size
		this.MAX_SCALE = 2.0;  // Max display scale 
		// this.MAX_SCALE = Math.min(window.devicePixelRatio || 1, 2); // default device scale
		this.MIN_SCALE = 1.0;  // Min display scale
		this.STEP = 1000 / 60; // 60 FPS fixed timestep

		// this.DISP_SCALE = this.MIN_SCALE; // start low and go up
		this.DISP_SCALE = this.MAX_SCALE; // start high and go down

		this.TARGET_FPS = 55; // downscale if less
		this.SCALE_CHECK_INTERVAL = 1000; // perf check interval
		this.SCALE_STEP = 0.5; // scale step
		this.ENABLE_UPSCALE = true; // enable auto upscale
		this.LOOPS_TO_SCALE = 3; // loops before scale (up or down)

		// DO NOT EDIT BELOW

		this.PERF_CHECK = false;
		this.LOOP_COUNT = 0; // check loops count
		this.DOWN_FROM = this.MAX_SCALE; // prevent upscale loop

		this.STEP_INV = 1 / this.STEP;

		this.FIXED_TIMESTEP = 1000.0 / 60.0; // frame time 16.667
		this.DELTA_TIMESTEP = this.FIXED_TIMESTEP / 1000;

		this.ww // innerWidth
			= this.wh = 0; // innerHeight

		this.sizeBase = 0;

		this.syncSize();

		this.params = {
			img: "assets/img.webp",
			waveSpeed: 0.997,
			damping: 0.996,
			propagationSpeed: 10,
			refraction: 0.8,
			waterHue: 0.619,
			waterTint: [0, 0.286, 1],
			tintStrength: 0.1,
			specularStrength: 0.7,
			roughness: 0.16,
			fresnelEffect: 1.2,
			fresnelPower: 2.6,
			specularPower: 39,
			reflectionFresnel: 1,
			reflectionBlur: 0.2,
			reflectionDistortion: 0.5,
			skyHue: 0.583,
			skyColor: [0, 0.502, 1],
			depthFactor: 2,
			atmosphericScatter: 0.2,
			envMapIntensity: 0.7,
			touchRadius: 0.027,
			initialImpact: 0.36,
			trailStrength: 0.25,
			trailSpread: 0.3,
			causticStrength: 0.15,
			causticScale: 1.4,
			causticSpeed: 0.02,
			causticBrightness: 0.42,
			causticDetail: 2.5,
			sunDirection: [0.624, 0.332, 0.707],
			sunAngle: 28,
			sunHeight: 63,
			lightDirection: [0.659, -0.534, 0.53],
			lightAngle: 175,
			lightHeight: 60,
			sunIntensity: 6,
			sunHue: 0.52,
			lightIntensity: 1.2,
			lightHue: 0.52,
			waveReflectionStrength: 0.6,
			mirrorReflectionStrength: 0.3,
			velocityReflectionFactor: 0.15
		};

		this.img = this.params.img;

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
		this.isFocused = true; // focus state
		this.isTouched = false; // first touch
		this.isAuto = false; // auto touch

		this.isRaining = false;
		this.lastRainDrop = 0;
		this.rainDropDelay = 256;
		this.maxRaindrops = 4;
		this.activeRaindrops = null;

		this.pops = new Map(); // pointers
		this.deltaTime = 1;
		this.accumulatedTime = 0;
		this.fish = []; // underwater imgs

		this.infos = null;

		this.cvs = document.createElement("canvas");
		this.cvs.style.opacity = "0";
		document.body.appendChild(this.cvs);
	
	}

	async load(preset) {

		if(DEBUG)
			console.log("load params");

		const changeBackground = preset.img && preset.img != this.img;
	
		this.stopPerfCheck();
		this.renderText("loading");

		if(changeBackground) {

			await this.fadeCanvas(0);
			this.img = preset.img;
			this.image = await this.loadImage(this.img);
			this.updateBackgroundTexture();

		}

		this.resetWaterState();
	
		this.params = {
			...this.params,
			...preset
		};
	
		this.syncUniforms();

		// stoopid double check
		if(changeBackground) {

			await this.fadeCanvas(1);
		
		}

		this.startPerfCheck();
	
	}

	flow(amplify = null, params = {}) {

		this.amplify = amplify;
		this.params = {
			...this.params,
			...params
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
			this.startRenderLoop
		];

		return initSequence
		.map(fn =>
			fn.bind(this))
		.reduce(
			(prv, cur) =>
				prv.then(() =>
					cur()),
			Promise.resolve()
		)
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

		// underwater github logo 
		this.fish.push({
			i: await this.loadImage("assets/github-mark-white.png"),
			c: () =>
				({
					x: this.w - (imgSize + imgOff) * this.DISP_SCALE,
					y: imgOff * this.DISP_SCALE,
					w: imgSize * this.DISP_SCALE,
					h: imgSize * this.DISP_SCALE
				})
		});
	
	}

	loadImage(imgSrc) {

		return new Promise(imgLoaded => {

			const i = new Image();

			i.addEventListener(
				"load",
				() =>
					imgLoaded(i)
			);
			i.addEventListener(
				"error",
				() => {

					throw new Error("image load error " + imgSrc);
			
				}
			);
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
			preserveDrawingBuffer: false
		};

		this.gl = this.cvs.getContext(
			"webgl2",
			contextOptions
		);
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
		float angle = float(i) * 0.785398163; // PI / 4
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
uniform vec3 uLightDirection;
uniform float uSunIntensity;
uniform float uLightIntensity;
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
uniform float uRefraction;

in vec2 texCoord;
out vec4 fragColor;

vec3 getNormal(vec2 uv, vec2 pixel) {
	vec4 data = texture(uWaterHeight, uv);
	float height = data.r;
	float oldHeight = data.g;
	float velocity = (height - oldHeight) * uDisplayScale;
	
	float s = 2.0;
	float l1 = texture(uWaterHeight, clamp(uv - vec2(pixel.x * s, 0.0), 0.0, 1.0)).r;
	float r1 = texture(uWaterHeight, clamp(uv + vec2(pixel.x * s, 0.0), 0.0, 1.0)).r;
	float t1 = texture(uWaterHeight, clamp(uv - vec2(0.0, pixel.y * s), 0.0, 1.0)).r;
	float b1 = texture(uWaterHeight, clamp(uv + vec2(0.0, pixel.y * s), 0.0, 1.0)).r;
	
	float l2 = texture(uWaterHeight, clamp(uv - vec2(pixel.x, pixel.y), 0.0, 1.0)).r;
	float r2 = texture(uWaterHeight, clamp(uv + vec2(pixel.x, pixel.y), 0.0, 1.0)).r;
	float t2 = texture(uWaterHeight, clamp(uv + vec2(pixel.x, -pixel.y), 0.0, 1.0)).r;
	float b2 = texture(uWaterHeight, clamp(uv + vec2(-pixel.x, pixel.y), 0.0, 1.0)).r;
	
	float dx = ((l1 - r1) * 2.0 + (l2 - r2)) / 3.0;
	float dy = ((t1 - b1) * 2.0 + (t2 - b2)) / 3.0;
	
	float normalStrength = 1.0 + abs(velocity) * 2.0;
	return normalize(vec3(
		dx * normalStrength * uDisplayScale,
		dy * normalStrength * uDisplayScale,
		1.0
	));
}

vec3 sampleBlurredReflection(vec2 uv, float radius, vec2 pixel) {
	// gaussian melting cpu ?
	int kernelSize = 5;
	float sigma = 2.0;
	float pi = 3.14159265359;
	
	vec3 color = vec3(0.0);
	float totalWeight = 0.0;
	
	for (int i = -2; i <= 2; i++) {
		for (int j = -2; j <= 2; j++) {
			float dist = sqrt(float(i * i + j * j));
			float weight = exp(-(dist * dist) / (2.0 * sigma * sigma)) / (2.0 * pi * sigma * sigma);
			
			vec2 sampleUv = clamp(uv + vec2(float(i), float(j)) * radius * pixel, 0.0, 1.0);
			sampleUv.y = 1.0 - sampleUv.y;
			
			color += texture(uBackgroundTexture, sampleUv).rgb * weight;
			totalWeight += weight;
		}
	}
	
	return color / totalWeight;
}

float getReflection(vec3 normal, vec3 lightDir, vec3 viewDir, float velocity) {
	vec3 halfDir = normalize(lightDir + viewDir);
	float NdotH = max(dot(normal, halfDir), 0.0);
	float pi = 3.14159265359;
	
	float alpha = uRoughness * uRoughness;
	float alpha2 = alpha * alpha;
	float NdotH2 = NdotH * NdotH;
	
	float denom = NdotH2 * (alpha2 - 1.0) + 1.0;
	float D = alpha2 / (pi * denom * denom);
	
	// separate mirror & wave reflections
	float mirrorSpec = D * uMirrorReflectionStrength;
	float waveSpec = pow(NdotH, uSpecularPower) * (1.0 + abs(velocity) * 8.0) * uWaveReflectionStrength;
	
	// then blend
	float velocityFactor = smoothstep(0.0, 1.0, abs(velocity) * uVelocityReflectionFactor);
	return mix(mirrorSpec, waveSpec, velocityFactor) * uSpecularStrength;
}

void main() {
	vec2 pixel = vec2(1.0) / uResolution;
	vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
	
	vec4 heightData = texture(uWaterHeight, texCoord);
	float height = heightData.r;
	float oldHeight = heightData.g;
	float velocity = (height - oldHeight);
	
	vec3 normal = getNormal(texCoord, pixel);
	float depth = clamp(height * uDepthFactor, 0.0, 1.0);
	
	// distortion smoothing based on velocity
	float distortionFactor = smoothstep(0.0, 1.0, abs(velocity));
	vec2 refractOffset = normal.xy * (uRefraction + distortionFactor * 0.3);
	vec2 bgCoord = clamp(texCoord + refractOffset, 0.0, 1.0);
	
	float viewAngleBlur = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
	float blurRadius = uReflectionBlur * (1.0 + distortionFactor * 2.0 + viewAngleBlur);
	vec3 refractColor = sampleBlurredReflection(bgCoord, blurRadius, pixel);
	
	// water color with depth (broken ?)
	float waterDepth = smoothstep(0.0, 1.0, depth);
	float scatter = clamp(waterDepth * uAtmosphericScatter, 0.0, 1.0);
	vec3 waterColor = mix(refractColor, uWaterTint, uTintStrength * (scatter + 0.2));
	
	float caustic = 0.0;
	if (uCausticStrength > 0.0) {
		float detailScale = uCausticDetail * 10.0;
		float scaledTime = uTime * uCausticSpeed;
		
		// noise detail killing cpu ?
		for (float i = 1.0; i <= 2.0; i++) {
			float scale = i * uCausticScale;
			vec2 causticsUV = texCoord * scale + normal.xy * uReflectionDistortion;
			float timeOffset = scaledTime * i * 0.5;
			
			vec2 warp = vec2(
				sin(causticsUV.y * 2.0 + timeOffset),
				sin(causticsUV.x * 2.0 + timeOffset * 1.3)
			);
			
			causticsUV += warp * 0.1;
			
			float pattern = sin(causticsUV.x * detailScale + timeOffset) * 
						  sin(causticsUV.y * detailScale + timeOffset * 1.3);
			
			caustic += pattern * (1.0/i);
		}
		caustic = caustic * 0.5 + 0.5;
	}
	
	vec3 finalColor = waterColor;
	
	float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), uFresnelPower) * uFresnelEffect;
	fresnel = smoothstep(0.0, 1.0, fresnel);
	
	// light reflections
	vec3 sunRefl = vec3(1.0, 0.97, 0.92) * getReflection(normal, normalize(uSunDirection), viewDir, velocity) * uSunIntensity;
	vec3 secondaryRefl = vec3(0.97, 0.99, 1.0) * getReflection(normal, normalize(uLightDirection), viewDir, velocity) * uLightIntensity;
	
	// blend env reflections
	vec3 envRefl = mix(uSkyColor, vec3(1.0), fresnel) * uEnvMapIntensity;
	
	finalColor += sunRefl + secondaryRefl;
	finalColor += envRefl * fresnel * uReflectionFresnel;
	
	// depth attenuated caustics (CPU ?)
	if (uCausticStrength > 0.0) {
		float causticAttenuation = smoothstep(1.0, 0.0, waterDepth * 2.0);
		float causticBlend = causticAttenuation * (1.0 - scatter * 0.5); // underwater scatter
		finalColor += vec3(1.0, 0.97, 0.9) * caustic * uCausticStrength * uCausticBrightness * causticBlend;
	}
	
	fragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}`;

		if(DEBUG)
			console.log("physics program");
		this.physicsProgram = this.createProgram(
			VERTEX_SHADER,
			PHYSICS_SHADER
		);

		if(DEBUG)
			console.log("render program");
		this.renderProgram = this.createProgram(
			VERTEX_SHADER,
			RENDER_SHADER
		);
	
	}

	async initShadersZip() {

		if(DEBUG)
			console.log("init shaders zip");

		// https://ctrl-alt-test.fr/minifier/?main
		// https://github.com/laurentlb/shader-minifier

		const VERTEX_SHADER = await this.decompress("H4sIAAAAAAAAClMuSy0qzszPUzA2MFBILebKzFMoS002UijIL84syczPs84vLYGIlKRWOOfnF6VYl+VnpijkJmbmaWhWwwRtYeq19Ey19Uyt03PiA6AitmWpySYaMHkdAx1DTetaAIBqaOZ3AAAA");

		const PHYSICS_SHADER = await this.decompress("H4sIAAAAAAAACoVUTW+bQBC991cgVYpYvMZgJ20qQg6Ne+vBiqP2EPmwgjGMBCzaD5c04r9XuyyE2JVyY2dn3rw385bPJxASeeNtosgD+akVkKENlFiUrXesOFPJeVSyuq1ArLeJbvDIRe2dIFt7+hEkr7RC3kwXFsDTW6gUe8IaqN6ibCv2ss9YBVTv8S98ZxKo/s1OsG8Bcqq3rG6xKajeCd6yghlEezXBTgw8vRNwQq7lXjEFZ4SeuM7K5zg6THFslAs/cN2oRCqhM+XZyKstarlEK2GgLliOWrqDVAKaQpXuqATDarxqBbA86adOFtL12jHBammJYDNwU9A9cC7yhGtlItfeUbDigVdcJCeOuVczbHzyaq+k0ZYq6JQW4L+XTEck4piUgEWpUlsTdskgCjuoUvPpx2Q1X5Rjr+s0CpMjF76ZEKZRgne3CS4W5HXIYE1RQWq/fSRB+PX2ZvPtNv6ySaSuFx9xW9jWGZe+xSFUYuM+SWDJBRfLJmGX9IZYjZ0/iKJS10EYr2+CdbgcBL7MnEOC0TpO1p+SKeOwtGadP1MddnR+eiFnyucOmc0gR6nSyjrAH5UFM6ClMxweyMr/qOVq8j6h0jyG/NFaLX1nGTyEzoF49E3/u3nuSAzrlmXqonK0ayBrzlUpFbT+vJxGITWYJAhvDP55vfX3fRReXeF9RNzzEHDa8ZHlMy7jA635CX5BNsUOS5fl1mDuf0Izjs6lk9W4HtPb5dzHsLx2rUxoiyJ1+auzcqr4jmOj0v+u4j0DVvGmeDJy0pwr31VS14EYAm8pd1E4DtZO4MfxCJlKoWv95bj9AWD5VhSMWJOq1cU8h3/EIoyimJBkWNriYmu2ZzDrHLjZBOEm6fvevrehOOn76a9hXve1L3VN3VuJaEyS/h+jh5Pl4gUAAA==");

		const RENDER_SHADER = await this.decompress("H4sIAAAAAAAACp1XS4/bNhC+91cY6IWkaNqSs2gWKgs0cYIEaIIgTrJnVqJtbmRRpUivnMX+94IPPb3ebnqxzCHnyZlvhr8euaqFLGer5XLG618qxTPhCHux21ezbSGZTqfUmh2qgqtknZpSbKU6zI48S2bmM69lYbSQZbfhBMzMF3Hg2KxFXRXstMlYwbsTnbCZuWGaq3dc7PYam1cs+75T0pT5F95oozg2nxQ/CmnqjWaaD3WvZmZjyrVQPLPasfnLyujWU2s2pnxfal7WQp/C2W49EetM+iJKfe5RqTda8XKn99hsKp6Zgqme8lma3b7kdY3NW8Xrkhdvtlue6W75Sd5x1XOG5We+LbzR4diQtBa1lmrkUXD+++m1LKSaGrnmld6/ZZmWCps/9UHW1Z4rkW0yprVV96Y8fmDVIBivmam1yHo/WoK9s35VcZ53q1fKRtD7GkhrrpkosLlhR97b30v9IJSS6rGdb7yQmdCnQSCC/T3lVWH8WjF/v6L0Gah581pKlafSaEt5MdsqtvOhcZHacf1RqgMrgM/YI3bfSjS8gPeOI2eaUe1TDoxT8ghTH9jSyWiNpjGJ2N81AJaVNHP3OUE0yneIEpIqro0qA7v4wa0VKwDAo+qygh0qYI5zayJwJpIGJQQvIV4SHBMISTN/kjV6itVaFD1b9f/ROVQGFyuCxnEbBwg/KwxL7L05oYT8pEkXWJ8RhlEY8TyI+Un185b/nP0ZwYkhTB9cCnu8tCWgeN7XRJfQPkMVy4Wpp9m9mmW2FqhLu2WbzVpqVtw4m+mSpFupgCj1TNB5korfaZKKKIIt9dZSby31NorgvZeQi1rT+h+lgVsDgUR0i24hTN0Obyowt/+Q/Vm8JHABEoJYJmswj4m9AXsnqbPW+/f1SMfhC4Kh9w/cQoi8j8i5F4KZttzkRGMy71epczzqC/u8vbSHIWlOP5yl6SAyEXWUh1DCTtxisJ8++FDsuB5fyiqUO3b/i9CY/Ooo+J1deNZjgL42qh9zqd/RA2tALjUIUnrsaEVFQQq0GQUxK6o9o33/Qf3f1O0h6j7h8nNeygN1qpD/BW7b3ksUd5B1EI2nL0B/bY7X/0J0GdMreQec6Em3gwgE5Ow8Ry8JRJe6Rn2QUu9rzSvgbhuPWS+2DgjRWYNOH45S5LMDEyVwpRHKhLpki+FiOMwM74pOwHuJl644Xe/Yu1RYX+wgbX9qK8+fpz0baXDrUKDOB5undJBPtO9lrVgPLa3wvJsWfBjo0/GDabDm7JgvRL+LRjNFQLCgsPZTBR2ff2Ts8Gw487OCxRyxBdPR448l6eDFTRMOCOl4wkDxkuDabuR2xKRu0ESjMcXhmZcjaEwcohEHafed2QWnAo1GHY9FwcL66zfaxhi545G/A9Kc0OPzmRfaW4YEIlde6B1TlU+zWpSgV+EaU+RYIJ5sNd0WiskKwrTfi6gViEjc6pxyDqIXpKMzxWdnnJpWS+QdseW6EDB9aC8ufBG5ishVaE9bUbLCTVzUYsalbuVzpA3qIJxgMNdF0xRGZNW2zek86LDk7HxCIos+MZlPYLTFTAeZCYEw1A7uJ348mvERCOkdkST0taeL6xl6R08BiMYPBZgOQtn/jRzqxJhc/4bJdQLRuOGcdYnRwwi2+vEANoevIS/dy77G8X9LHz+0HpU/fl9FNiu6Bwv23kA8jSdE07cJOrvc88fSJRwZhI+O4gdRm8NTNnT+ukFgcMkxsYkYQC4hrpfNQ4ogcmVBsX16WJUvQsb3lrR5HMP04V/CgG7Fhw8AAA==");
		
		this.physicsProgram = this.createProgram(
			VERTEX_SHADER,
			PHYSICS_SHADER
		);

		this.renderProgram = this.createProgram(
			VERTEX_SHADER,
			RENDER_SHADER
		);
	
	}

	async decompress(b64Str, format = "gzip") {

		return await new Response(new Response(Uint8Array.from(
			atob(b64Str),
			c =>
				c.charCodeAt(0)
		)).body.pipeThrough(new DecompressionStream(format)))
		.text();
	
	}

	initBuffers() {

		if(DEBUG)
			console.log("init buffers");
		this.vertexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(
			this.gl.ARRAY_BUFFER,
			this.vertexBuffer
		);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			this.vertices,
			this.gl.STATIC_DRAW
		);
	
	}

	syncSize() {

		this.ww = window.innerWidth;
		this.wh = window.innerHeight;

		this.sizeBase = Math.max(
			this.ww,
			this.wh
		) / this.REF_SIZE;

		this.deltaTime = this.STEP * (this.BASE_SCALE / this.DISP_SCALE) * this.STEP_INV;

		if(DEBUG)
			console.log(
				"screen",
				this.ww + "x" + this.wh,
				"fact",
				this.sizeBase
			);
	
	}

	syncCanvas() {

		// round ?
		const cw = Math.round(this.ww * this.DISP_SCALE);
		const ch = Math.round(this.wh * this.DISP_SCALE);

		this.cvs.width = cw;
		this.cvs.height = ch;

		if(DEBUG)
			console.log(
				"canvas",
				cw + "x" + ch
			);
	
	}

	fadeCanvas(op) {

		return new Promise(res => {

			this.cvs.addEventListener(
				"transitionend",
				() =>
					res(),
				{
					once: true
				}
			);

			this.cvs.style.opacity = op;
		
		});
	
	}

	syncViewport() {

		this.gl.viewport(
			0,
			0,
			this.w,
			this.h
		);
	
	}

	syncUniforms() {

		// if(DEBUG)console.log("sync uniforms");

		// this.scaledPropagation = this.params.propagationSpeed * this.DISP_SCALE / this.BASE_SCALE;
		// heaavy render glitch if not rounded ?
		this.scaledPropagation = Math.round((this.params.propagationSpeed * this.DISP_SCALE) / this.BASE_SCALE);
	
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

		gl.bindFramebuffer(
			gl.FRAMEBUFFER,
			null
		);
		gl.bindTexture(
			gl.TEXTURE_2D,
			null
		);
	
	}

	createWaterTexture() {

		const gl = this.gl;
		const texture = gl.createTexture();

		gl.bindTexture(
			gl.TEXTURE_2D,
			texture
		);

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

		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_MIN_FILTER,
			gl.NEAREST
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_MAG_FILTER,
			gl.NEAREST
		);

		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_S,
			gl.CLAMP_TO_EDGE
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_T,
			gl.CLAMP_TO_EDGE
		);

		const waterError = gl.getError();

		if(waterError !== gl.NO_ERROR) {

			throw new Error("create water texture fail");
		
		}

		return texture;
	
	}

	createBackgroundTexture() {

		const gl = this.gl;
		const texture = gl.createTexture();

		gl.bindTexture(
			gl.TEXTURE_2D,
			texture
		);

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

		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_MIN_FILTER,
			gl.LINEAR
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_MAG_FILTER,
			gl.LINEAR
		);

		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_S,
			gl.CLAMP_TO_EDGE
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_WRAP_T,
			gl.CLAMP_TO_EDGE
		);

		return texture;
	
	}

	createFramebuffer(texture) {

		const gl = this.gl;
		const framebuffer = gl.createFramebuffer();

		gl.bindFramebuffer(
			gl.FRAMEBUFFER,
			framebuffer
		);
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

	handleResize() {

		clearTimeout(this.sizing);

		this.sizing = setTimeout(
			() =>
				this.doResize(),
			128
		);
	
	}

	doResize() {

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

			gl.bindTexture(
				gl.TEXTURE_2D,
				texture
			);
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

			gl.bindFramebuffer(
				gl.FRAMEBUFFER,
				framebuffer
			);

			if(
				gl.checkFramebufferStatus(gl.FRAMEBUFFER)
				!== gl.FRAMEBUFFER_COMPLETE
			) {

				throw new Error("incomplete resized framebuffer");
			
			}
		
		});

		gl.bindFramebuffer(
			gl.FRAMEBUFFER,
			null
		);
	
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
						)
					}),
				{}
			);

		this.physicsUniforms = {
			...getUniforms(
				this.physicsProgram,
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
					touchCount: "TouchCount"
				}
			),
			touches: new Array(10)
			.fill({})
			.map((_, i) => {

				const uTouch = `TouchParams[${i}].`;

				return getUniforms(
					this.physicsProgram,
					{
						position: `${uTouch}position`,
						radius: `${uTouch}radius`,
						damping: `${uTouch}damping`,
						strength: `${uTouch}strength`,
						trail: `${uTouch}trail`,
						spread: `${uTouch}spread`,
						angle: `${uTouch}angle`
					}
				);
			
			})
		};

		this.renderUniforms = getUniforms(
			this.renderProgram,
			{
				resolution: "Resolution",
				time: "Time",
				displayScale: "DisplayScale",
				previousState: "PreviousState",
				waterHeight: "WaterHeight",
				backgroundTexture: "BackgroundTexture",

				sunDirection: "SunDirection",
				lightDirection: "LightDirection",
				sunIntensity: "SunIntensity",
				lightIntensity: "LightIntensity",
				sunColor: "SunColor",
				lightColor: "LightColor",

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
				velocityReflectionFactor: "VelocityReflectionFactor"
			}
		);
	
	}

	createProgram(vertexSource, fragmentSource) {

		const gl = this.gl;
		const program = gl.createProgram();

		const createShader = (type, source) => {

			const shader = gl.createShader(type);

			gl.shaderSource(
				shader,
				source
			);
			gl.compileShader(shader);

			if(!gl.getShaderParameter(
				shader,
				gl.COMPILE_STATUS
			)) {

				const shaderInfo = gl.getShaderInfoLog(shader);

				gl.deleteShader(shader);

				throw new Error(`compile shader fail ${shaderInfo}`);
			
			}
			return shader;
		
		};

		let vertShader, fragShader;

		try {

			vertShader = createShader(
				gl.VERTEX_SHADER,
				vertexSource
			);
			fragShader = createShader(
				gl.FRAGMENT_SHADER,
				fragmentSource
			);

			gl.attachShader(
				program,
				vertShader
			);
			gl.attachShader(
				program,
				fragShader
			);
			gl.linkProgram(program);

			if(!gl.getProgramParameter(
				program,
				gl.LINK_STATUS
			)) {

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
		gl.bindFramebuffer(
			gl.FRAMEBUFFER,
			this.currentFramebuffer
		);

		gl.bindBuffer(
			gl.ARRAY_BUFFER,
			this.vertexBuffer
		);
		const positionLoc = gl.getAttribLocation(
			this.physicsProgram,
			"position"
		);

		gl.enableVertexAttribArray(positionLoc);
		gl.vertexAttribPointer(
			positionLoc,
			2,
			gl.FLOAT,
			false,
			0,
			0
		);

		gl.uniform2f(
			u.resolution,
			this.w,
			this.h
		);
		gl.uniform1f(
			u.displayScale,
			this.DISP_SCALE
		);
		gl.uniform1f(
			u.sizeBase,
			this.sizeBase
		);
		gl.uniform1f(
			u.deltaTime,
			this.deltaTime
		);
		gl.uniform1f(
			u.time,
			this.accumulatedTime
		);
		gl.uniform1f(
			u.waveSpeed,
			this.params.waveSpeed
		);
		gl.uniform1f(
			u.damping,
			this.params.damping
		);
		gl.uniform1f(
			u.propagationSpeed,
			// based on display scale factor
			this.scaledPropagation
			// this.params.propagationSpeed
		);

		this.processTouches();

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(
			gl.TEXTURE_2D,
			this.previousTexture
		);
		gl.uniform1i(
			u.previousState,
			0
		);

		gl.drawArrays(
			gl.TRIANGLE_STRIP,
			0,
			4
		);
	
	}

	processTouches() {

		const touchArray = Array.from(this.pops.values());
		const touchCount = Math.min(
			touchArray.length,
			10
		);

		this.touchPositions.fill(0);
		const gl = this.gl;
		const u = this.physicsUniforms;

		for(let i = 0; i < touchCount; i++) {

			const touch = touchArray[i];

			this.touchPositions[i * 2] = touch.x;
			this.touchPositions[i * 2 + 1] = touch.y;

			this.touchPositions[(i + touchCount) * 2] = touch.prevX;
			this.touchPositions[(i + touchCount) * 2 + 1] = touch.prevY;

			gl.uniform2f(
				u.touches[i].position,
				touch.x,
				touch.y
			);
			gl.uniform1f(
				u.touches[i].radius,
				touch.touchRadius
			);
			gl.uniform1f(
				u.touches[i].damping,
				touch.touchDamping
			);
			gl.uniform1f(
				u.touches[i].strength,
				touch.initialImpact
			);
			gl.uniform1f(
				u.touches[i].trail,
				touch.trailStrength
			);
			gl.uniform1f(
				u.touches[i].spread,
				touch.trailSpread
			);
			gl.uniform1f(
				u.touches[i].angle,
				touch.trailAngle
			);
		
		}

		gl.uniform2fv(
			u.touchPositions,
			this.touchPositions
		);
		gl.uniform1i(
			u.touchCount,
			touchCount
		);
	
	}

	renderStep() {

		const gl = this.gl;

		gl.useProgram(this.renderProgram);
		gl.bindFramebuffer(
			gl.FRAMEBUFFER,
			null
		);

		gl.clearColor(
			0,
			0,
			0,
			1
		);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.bindBuffer(
			gl.ARRAY_BUFFER,
			this.vertexBuffer
		);
		const positionLoc = gl.getAttribLocation(
			this.renderProgram,
			"position"
		);

		gl.enableVertexAttribArray(positionLoc);
		gl.vertexAttribPointer(
			positionLoc,
			2,
			gl.FLOAT,
			false,
			0,
			0
		);

		this.updateRenderUniforms();

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(
			gl.TEXTURE_2D,
			this.currentTexture
		);
		gl.uniform1i(
			this.renderUniforms.waterHeight,
			0
		);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(
			gl.TEXTURE_2D,
			this.backgroundTexture
		);
		gl.uniform1i(
			this.renderUniforms.backgroundTexture,
			1
		);

		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(
			gl.TEXTURE_2D,
			this.previousTexture
		);
		gl.uniform1i(
			this.renderUniforms.previousState,
			2
		);

		gl.drawArrays(
			gl.TRIANGLE_STRIP,
			0,
			4
		);

		/*
		
		// error checking

		const renderError = gl.getError();

		if(renderError !== gl.NO_ERROR) {

			throw new Error("render step error " + renderError);
		
		}

		const fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

		if(fbStatus !== gl.FRAMEBUFFER_COMPLETE) {

			throw new Error("incomplete framebuffer " + fbStatus);
		
		}*/
	
	}

	updateRenderUniforms() {

		const gl = this.gl;
		const u = this.renderUniforms;
		const p = this.params;

		gl.uniform2f(
			u.resolution,
			this.w,
			this.h
		);
		gl.uniform1f(
			u.time,
			this.accumulatedTime
		);
		gl.uniform1f(
			u.displayScale,
			this.DISP_SCALE
		);

		Object.keys(p)
		.filter(prop =>
			u[prop] && p[prop] instanceof Array)
		.forEach(prop =>
			gl.uniform3fv(
				u[prop],
				p[prop]
			));

		Object.keys(p)
		.filter(prop =>
			u[prop] && typeof p[prop] === "number")
		.forEach(prop =>
			gl.uniform1f(
				u[prop],
				p[prop]
			));
	
	}

	updateBackgroundTexture() {

		if(!this.image?.complete || !this.image.naturalWidth)
			return;

		const gl = this.gl;
		let cvs = document.createElement("canvas");
		const ctx = cvs.getContext(
			"2d",
			{ alpha: false }
		);

		cvs.width = this.w;
		cvs.height = this.h;

		ctx.fillStyle = "#000000";
		ctx.fillRect(
			0,
			0,
			this.w,
			this.h
		);

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

		ctx.drawImage(
			this.image,
			sx,
			sy,
			sw,
			sh,
			0,
			0,
			this.w,
			this.h
		);

		this.fish.forEach(fish => {

			if(fish.i?.complete) {

				const { x, y, w, h } = fish.c();

				ctx.globalAlpha = 0.55;
				ctx.shadowColor = "#000000";
				ctx.shadowBlur = 16;
				ctx.drawImage(
					fish.i,
					x,
					y,
					w,
					h
				);
			
			}
		
		});

		gl.bindTexture(
			gl.TEXTURE_2D,
			this.backgroundTexture
		);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			cvs
		);

		ctx.clearRect(
			0,
			0,
			this.w,
			this.h
		);
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

		this.amplify.toggle(
			"flow",
			false
		);
	
	}

	nextFrame() {

		this.loop = requestAnimationFrame(hrts =>
			this.renderLoop(hrts));
	
	}

	renderLoop(currentTime) {

		/*
		// will throw error anyway ?
		if(!this.gl || this.gl.isContextLost()) {

			this.stopRenderLoop();

			throw new Error("webgl context lost");
		
		}
			*/

		this.accumulatedTime += this.deltaTime;

		this.physicsStep();
		this.swapBuffers();

		this.renderStep();

		this.checkPerformance(currentTime);

		// if(this.isRunning)
		this.nextFrame();
	
	}

	startPerfCheck(chk = this.SCALE_CHECK_INTERVAL) {

		if(this.PERF_CHECK)
			return;

		// if(DEBUG) console.log("perf run");

		this.PERF_CHECK = true;

		this.notBefore = this.lastFrameTime + chk;
		// this.frameTimeHistory = new Array(30).fill(16.67);
	
	}

	stopPerfCheck() {

		if(!this.PERF_CHECK)
			return;

		// if(DEBUG) console.log("stop perf check");

		this.PERF_CHECK = false;

		this.LOOP_COUNT = 0;

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
			.padStart(
				2,
				"0"
			));
		
		}

		this.currentFPS = updatedFPS;

		if(currentTime - this.lastScaleCheck >= this.SCALE_CHECK_INTERVAL) {

			this.lastScaleCheck = currentTime;

			this.LOOP_COUNT++;

			if(this.LOOP_COUNT >= this.LOOPS_TO_SCALE) {

				this.LOOP_COUNT = 0;

				if(this.currentFPS < this.TARGET_FPS) {

					this.downScale();
				
				}
				else if(
					this.ENABLE_UPSCALE
					&& this.DISP_SCALE < this.DOWN_FROM
					&& this.DISP_SCALE < this.MAX_SCALE
				) {

					this.upScale();
				
				}
			
			}
		
		}
	
	}

	downScale() {

		if(this.DISP_SCALE == this.MIN_SCALE)
			return;

		if(DEBUG)
			console.log("downscale");

		this.DOWN_FROM = this.DISP_SCALE - this.SCALE_STEP;
		this.setDisplayScale(this.DISP_SCALE - this.SCALE_STEP);
	
	}

	upScale() {

		if(this.DISP_SCALE == this.MAX_SCALE)
			return;

		if(DEBUG)
			console.log("upscale");

		this.setDisplayScale(this.DISP_SCALE + this.SCALE_STEP);
	
	}

	setDisplayScale(ds) {

		ds = Math.max(
			Math.min(
				this.MAX_SCALE,
				ds
			),
			this.MIN_SCALE
		);

		if(ds == this.DISP_SCALE)
			return;

		if(DEBUG)
			console.log(
				"set scale",
				ds
			);

		this.stopPerfCheck();

		this.renderText((ds > this.DISP_SCALE ? "up" : "down") + "scale");

		this.LOOP_COUNT = 0;
		
		// this.DISP_SCALE = Math.round(ds * 2) / 2; // clean round ?
		this.DISP_SCALE = ds;

		this.syncLiquid();

		this.startPerfCheck();
	
	}

	renderText(str) {

		// disp on next frame
		window.requestAnimationFrame(() => {

			this.infos.textContent = str;
		
		});
	
	}

	renderInfo(fps) {

		this.infos.textContent = "x" + this.DISP_SCALE.toString() + " " + fps;
	
	}

	visibleChange() {

		this.isVisible = document.visibilityState === "visible";

		if(DEBUG)
			console.log(this.isVisible ? "visible" : "hidden");

		this.activeChange();
	
	}

	handleBlur() {

		this.focusChange(false);
	
	}

	handleFocus() {

		this.focusChange(true);
	
	}

	focusChange(focused) {

		if(DEBUG)
			console.log(focused ? "focus" : "blur");

		this.isFocused = focused;

		this.activeChange();
	
	}

	activeChange() {

		if(this.isActive)
			this.startRenderLoop();
		else
			this.stopRenderLoop();
	
	}

	handleHash() {

		if(DEBUG)
			console.log("hash changed");

		// alert("hash");

		// window.location.reload();
	
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
				: this.waterTexture1
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

			gl.bindTexture(
				gl.TEXTURE_2D,
				texture
			);
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

		document.addEventListener(
			"visibilitychange",
			() =>
				this.visibleChange()
		);
		
		Object.entries({
			"blur": this.handleBlur,
			"focus": this.handleFocus,
			"resize": this.handleResize,
			"hashchange": this.handleHash
		})
		.forEach(([evtName, evtCall]) =>
			window.addEventListener(
				evtName,
				evtCall.bind(this)
			));

		Object.entries({
			"touchstart": this.doNotTouch,
			"pointerdown": this.handlePointerStart,
			"pointermove": this.handlePointerMove,
			"pointerup": this.handlePointerEnd,
			"pointerout": this.handlePointerEnd,
			"pointercancel": this.handlePointerEnd
		})
		.forEach(([evtName, evtCall]) =>
			this.cvs.addEventListener(
				evtName,
				evtCall.bind(this)
			));
	
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
			x: cx * this.DISP_SCALE,
			y: this.h - cy * this.DISP_SCALE,
			rx: cx,
			ry: cy
		};

		// round ?
		/*const cx = Math.round(evt.clientX), 
			cy = Math.round(evt.clientY);

		return {
			x: Math.round(cx * this.DISP_SCALE), 
			y: Math.round(this.h - cy * this.DISP_SCALE),
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
			trailAngle: this.params.trailAngle
		};
	
	}

	doNotTouch(evt) {

		// kill iOS magnifier
		evt.preventDefault();
	
	}

	handlePointerStart(evt) {

		// evt.preventDefault();

		const pId = evt.pointerId;

		if(!this.isTouched)
			this.isTouched = true;

		this.cvs.setPointerCapture(pId);

		const pos = this.getPointerPos(evt);

		this.pops.set(
			pId,
			{
				x: pos.x,
				y: pos.y,
				prevX: pos.x,
				prevY: pos.y,
				...this.pointOptions()
			}
		);
	
	}

	handlePointerMove(evt) {

		// evt.preventDefault();

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
				this.hitPoint(
					pop.rx,
					pop.ry,
					this.amplify.bnd
				));

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

	get isActive() {

		return this.isVisible && this.isFocused;
	
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
	 * @param {number=} o :
	 */
	dropIt(x, y, o = 75) {

		x ||= this.randRange(
			this.w * 0.3,
			this.w * 0.7
		);
		y ||= this.randRange(
			this.h * 0.3,
			this.h * 0.7
		);

		const dropId = "drop_" + this.genPopId();

		const point = {
			x,
			y,
			prevX: x,
			prevY: y,
			...this.pointOptions()
			// touchRadius: 0.015,
			// touchDamping: 990,
			// initialImpact: 0.15,
			// trailStrength: 0.001,
			// trailSpread: 0,
			// trailAngle: this.params.trailAngle
		};

		this.pops.set(
			dropId,
			point
		);

		setTimeout(
			() => {

				this.pops.delete(dropId);
		
			},
			o + Math.round(Math.random() * 100)
		);
	
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
			...this.pointOptions()
			// touchRadius: 0.015,
			// trailStrength: 0.08,
			// trailSpread: 0.05
		};

		this.pops.set(
			touchId,
			point
		);
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

			window.requestAnimationFrame(animate);
		
		};

		animate();
	
	}

	circleIt() {

		const centerX = this.w * 0.5;
		const centerY = this.h * 0.5;
		const radius = Math.min(
			this.w,
			this.h
		) * 0.05;
		const speed = 0.005; // rad / ms

		const touchId = "circle_" + this.genPopId();
		const startAngle = Math.random() * this.TWO_PI;

		const point = {
			x: centerX + Math.cos(startAngle) * radius,
			y: centerY + Math.sin(startAngle) * radius,
			prevX: centerX + Math.cos(startAngle) * radius,
			prevY: centerY + Math.sin(startAngle) * radius,
			...this.pointOptions(),
			touchRadius: 0.02
			// trailStrength: 0.15,
			// trailSpread: 0.1
		};

		this.pops.set(
			touchId,
			point
		);
		const startTime = performance.now();

		const animate = () => {

			if(!this.pops.has(touchId))
				return;

			const elapsed = performance.now() - startTime;
			const angle = startAngle + elapsed * speed;

			point.prevX = point.x;
			point.prevY = point.y;
			point.x = centerX + Math.cos(angle) * radius;
			point.y = centerY + Math.sin(angle) * radius;

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
			trailSpread: 0.15
		};

		this.pops.set(
			touchId,
			point
		);

		const duration = 2500;
		const startTime = performance.now();

		// curve width & height
		const radiusX = this.w * 0.15; 
		const radiusY = this.h * 0.15;
		const loops = 1.5 + Math.random(); // how many loops
		const drift = {
			x: (Math.random() - 0.5) * 0.3, 
			y: (Math.random() - 0.5) * 0.3
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
			...params
		};

		this.pops.set(
			popId,
			popped
		);

		const updateSwirl = () => {

			const elapsed = performance.now() - startTime;
			const progress = elapsed / dur;

			if(progress < 1) {

				const angle = startAngle + elapsed * 0.001 * popped.speed;
				const easedProgress = ease(
					elapsed,
					0,
					1,
					dur
				);
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
				Math.min(
					this.w,
					this.h
				) * radius,
				{
					// touchRadius: 0.02,
					// touchDamping: 0.995,
					// initialImpact: 0.32,
					// trailStrength: 1.2,
					// trailSpread: 1.6,
					// trailAngle: 500,
					speed: 2.5
				},
				3333,
				2 * Math.PI / numSwirls * i,
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
			touchRadius: 0.02,
			touchDamping: 0.35,
			initialImpact: 0.12
			// trailStrength: 0.1,
		};

		this.pops.set(
			dropId + "_impact",
			impactPoint
		);

		// then splash
		setTimeout(
			() => {

				const splashPoint = {
					x,
					y,
					prevX: x,
					prevY: y,
					...this.pointOptions(),
					touchRadius: 0.06,
					touchDamping: 0.35,
					initialImpact: 0.12
					// trailStrength: 0.1,
					// trailSpread: 2.0
				};

				this.pops.set(
					dropId + "_splash",
					splashPoint
				);
		
			},
			64
		);

		this.activeRaindrops.add(dropId);
		setTimeout(
			() => {

				this.pops.delete(dropId + "_impact");
				this.pops.delete(dropId + "_splash");
				this.activeRaindrops.delete(dropId);
		
			},
			72
		);
	
	}

	stopRain() {

		this.isRaining = false;
		this.amplify.toggle(
			"rain",
			false
		);
	
	}

	// AUTOTOUCH

	toggleAutoTouch() {

		if(this.isAuto)
			this.stopAutoTouch();
		else
			this.startAutoTouch();
	
	}

	startAutoTouch() {

		if(this.isAuto)
			return;

		this.isAuto = true;
		const touchId = "auto";
		let time = 0;

		const point = {
			x: this.w / 2,
			y: this.h / 2,
			prevX: this.w / 2,
			prevY: this.h / 2,
			speed: 0.01,
			scale: 0.5,
			...this.pointOptions()
		};

		this.pops.set(
			touchId,
			point
		);

		const animate = () => {

			if(!this.isAuto) {

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

		if(!this.isAuto)
			return;
		if(DEBUG)
			console.log("stop auto touch");
		this.isAuto = false;
		this.amplify.toggle(
			"point",
			this.isAuto
		);
	
	}

}
