/**
 * Ripples3
 * Nico Pr
 * https://nicopr.fr
 * https://github.com/nicopowa/ripples3
 */

window.addEventListener("load", () => {
	try {
		if(DEBUG) console.log("dive in");

		const liquify = new Liquid("assets/img.webp");
		// const amplify = new Params(liquify);

		liquify.flow()
		.then(() =>
			setTimeout(() => {
				liquify.createSwirls();
			}, 1111)
		);
	} catch (err) {
		console.error("screen liquify fail", err);
		const errorDiv = document.createElement("div");
		errorDiv.classList.add("err");
		errorDiv.innerHTML = "liquify fail<br>" + err;
		document.body.appendChild(errorDiv);
	}
});

class Liquid {
	constructor(imagePath) {
		this.img = imagePath;

		this.params = {
			// global time scaling factor
			timeScale: 1.0,
			// wave propagation speed
			waveSpeed: 0.995,
			// wave energy fading
			damping: 0.998,
			// waves travel distance per frame
			propagationSpeed: 8,

			// light bending strength through surface
			refraction: 0.18,
			// water base color tint rgb
			waterTint: new Float32Array([0.04, 0.06, 0.11]),
			// water color tint intensity
			tintStrength: 0.022,
			// specular highlights intensity on surface
			specularStrength: 0.72,
			// surface roughness affecting reflections
			roughness: 0.28,

			// edge highlighting strength based on viewing angle
			fresnelEffect: 0.8,
			// fresnel edge highlighting sharpness
			fresnelPower: 2.6,
			// specular highlights sharpness
			specularPower: 38.0,
			// fresnel-based reflections intensity
			reflectionFresnel: 1.0,
			// reflections blur amount
			reflectionBlur: 0.1,
			// how much waves distort reflections
			reflectionDistortion: 0.3,

			// sky reflection color rgb
			skyColor: new Float32Array([0.78, 0.89, 1.0]),
			// depth-based darkening strength
			depthFactor: 1.65,
			// view-angle based color scattering intensity
			atmosphericScatter: 0.72,
			// environment map reflections strength
			envMapIntensity: 0.5,

			// touch interaction radius
			touchRadius: 0.012,
			// touch impact initial strength
			initialImpact: 0.42,
			// touch trails persistence
			trailStrength: 0.92,
			// touch trails width
			trailSpread: 6.0,
			// trail pattern variation rate
			trailFrequency: 0.0003,

			// underwater light patterns intensity
			causticStrength: 0.15,
			// caustic patterns size
			causticScale: 0.8,
			// caustics animation speed
			causticSpeed: 0.3,
			// caustic highlights brightness
			causticBrightness: 1.2,
			// caustic patterns detail level
			causticDetail: 3.0,

			// primary light direction xyz vector
			sunDirection: new Float32Array([0.35, 0.65, 0.45]),
			// secondary light direction xyz vector
			secondarySunDirection: new Float32Array([-0.45, 0.55, 0.45]),
			// primary light intensity
			sunIntensity: 0.57,
			// secondary light intensity
			secondaryIntensity: 0.17,
		};

		// auto
		this.defaultPointOpts = {
			touchRadius: 0.012,
			initialImpact: 0.42,
			trailStrength: 0.62,
			trailSpread: 0.05,
			trailFrequency: 0.003,
		};

		this.sizer =
			this.sizing =
			this.image =
			this.cvs =
			this.gl =
			this.vertexBuffer =
			this.physicsProgram =
			this.physicsUniforms =
			this.renderProgram =
			this.renderUniforms =
			this.currentTexture =
			this.previousTexture =
			this.backgroundTexture =
			this.waterTexture1 =
			this.waterTexture2 =
			this.currentFramebuffer =
			this.framebuffer1 =
			this.framebuffer2 =
				null;

		this.loop = -1;

		this.vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
		this.touchPositions = new Float32Array(20); // 10 touches

		this.dpr = Math.min(window.devicePixelRatio || 1, 2);
		// this.dpr = window.devicePixelRatio || 1;
		this.TWO_PI = Math.PI * 2;

		this.pops = new Map();
		this.lastTime = 0;
		this.deltaTime = 0;
		this.accumulatedTime = 0;
		this.isVisible = true;
		this.injectedImage = null;

	}

	initializeWebGL() {
		this.cvs = document.createElement("canvas");
		document.body.appendChild(this.cvs);

		const contextOptions = {
			alpha: false,
			antialias: false,
			depth: false,
			stencil: false,
			powerPreference: "high-performance",
			preserveDrawingBuffer: false,
		};

		this.gl = this.cvs.getContext("webgl2", contextOptions);
		if(!this.gl) throw new Error("WebGL2 not supported");

		this.gl.getExtension("EXT_color_buffer_float");
		this.gl.getExtension("OES_texture_float_linear");

		this.sizer = new ResizeObserver(this.debouncedResize.bind(this));
		this.sizer.observe(document.body);
	}

	async flow() {
		console.log("flow");
		return this.loadImage(this.img)
		.then(async () => {

			this.initializeWebGL();

			await this.initShaders();
			// await this.initShadersZip();

			this.initBuffers();
			this.initTextures();
			this.setupEventListeners();
			this.startRenderLoop();

			/*return new Promise((ready) =>
				this.cvs.addEventListener("transitionend", () => 
					ready(), {
					once: true,
				})
			);*/
		});
	}

	debouncedResize() {
		if(this.sizing) cancelAnimationFrame(this.sizing);
		this.sizing = requestAnimationFrame(() => 
			this.handleResize());
	}

	handleResize() {
		const w = window.innerWidth;
		const h = window.innerHeight;

		this.cvs.width = w * this.dpr;
		this.cvs.height = h * this.dpr;
		this.cvs.style.width = w + "px";
		this.cvs.style.height = h + "px";

		this.injectLogo();

		if(this.gl) {
			this.gl.viewport(0, 0, this.cvs.width, this.cvs.height);
			if(this.backgroundTexture) {
				this.updateTextures();
				requestAnimationFrame(() => 
					this.updateBackgroundTexture());
			}
		}
	}

	async injectLogo() {
		this.injectedImage = null;
		const logoSize = 32;
		const logoOff = 5;
		await this.injectImage(
			"assets/github-mark-white.png",
			window.innerWidth - logoSize - logoOff,
			window.innerHeight - logoSize - logoOff,
			logoSize,
			logoSize
		);
	}

	updateTextures() {
		if(DEBUG) console.log("update textures");

		const gl = this.gl;

		[this.waterTexture1, this.waterTexture2].forEach((texture) => {
			gl.bindTexture(gl.TEXTURE_2D, texture);
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

		[this.framebuffer1, this.framebuffer2].forEach((framebuffer) => {
			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

			/*if(
				gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
				gl.FRAMEBUFFER_COMPLETE
			) {
				throw new Error("framebuffer incomplete after resize");
			}*/
		});

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	async loadImage(src) {
		if(DEBUG) console.log("load image");
		this.image = new Image();
		return new Promise((resolve, reject) => {
			this.image.crossOrigin = "Anonymous";
			this.image.onload = resolve;
			this.image.onerror = reject;
			this.image.src = src;
		});
	}

	fitImage(image) {
		if(DEBUG) console.log("fit image");

		const cvs = document.createElement("canvas");
		const ctx = cvs.getContext("2d", { alpha: false });

		cvs.width = this.w;
		cvs.height = this.h;

		const imageAspect = image.naturalWidth / image.naturalHeight;
		const canvasAspect = cvs.width / cvs.height;

		const drawWidth =
			imageAspect > canvasAspect ? cvs.height * imageAspect : cvs.width;
		const drawHeight =
			imageAspect > canvasAspect ? cvs.height : cvs.width / imageAspect;

		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, cvs.width, cvs.height);
		ctx.drawImage(
			image,
			(cvs.width - drawWidth) / 2,
			(cvs.height - drawHeight) / 2,
			drawWidth,
			drawHeight
		);

		const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
		cvs.width = cvs.height = 0;
		return imageData;
	}

	async decompress(b64Str, format = "gzip") {
		return await new Response(
			new Response(
				Uint8Array.from(atob(b64Str), (c) => 
					c.charCodeAt(0))
			).body.pipeThrough(new DecompressionStream(format))
		)
		.text();
	}

	async initShadersZip() {
		if(DEBUG) console.log("init zip shaders");

		// https://ctrl-alt-test.fr/minifier/?main
		// https://github.com/laurentlb/shader-minifier

		const VERTEX_SHADER = await this.decompress(
			"H4sIAAAAAAAAClMuSy0qzszPUzA2MFBILebKzFMoS002UijIL84syczPs84vLYGIlKRWOOfnF6VYl+VnpijkJmbmaWhWwwRtYeq19Ey19Uyt03PiA6AitmWpySYaMHkdAx1DTetaAIBqaOZ3AAAA"
		);

		const PHYSICS_SHADER = await this.decompress(
			"H4sIAAAAAAAACnVVzW7jOAy+71MYWGBgOQprZ8aYBqp6aR+g2BaYw6IHra3EBGzLq5/AwUzffSHJTu1k52JQpEh+/ETSf56kNqj65GueJ9L8MWhZYVA0eGyG5NAqYdm11ohuaKXePd9YsLfM9XhQuktOstol7i9pVOssqv5iCEET9yxbK96wk9R9fl8r0UrqfoiTfB2krKl7Ft2A/ZG6F60GcRQ+VDAxY7WrbPKmXNX8DNkGZTCkiim0qNGZ6WCslv3RNtPRaoHtbBq0FPV0OGj5r5N9dWYfF8SXghP3ouUJlTOvVlh5VWtA8neRv1/02NtJ/aTcgpugmiwvQovOBDfsYyQrxyeldM2Us17zLTlocXxSrdLspLBOOoF9SqaicZQt92JakLsl4cHTeKDcytE6LdM1fjonIlPxjcRjY3nwgZEa1/Ec6Em0WL8GDgzPgR2UTn1lyHOGD8WO4WZDfsYIoj+2kgc5RZJBufta7u+/fy9ZAFujjlArZdJwl1CD/SQSGpkOmPgMblOjzkKV2W0TxHwFMDykC2cYH3L49WuleSyuNOebO+fHAsgSQ9WKblgGpgE95HlBJnG/3xNCIw64L1dMRtJ+x/4iLIGRGddt+NIvC0HZkv4NjzrP4//wk94QlEFJPDc1ahgfeQ5fvgTxgReTeP7Unr2WBBy/gVyjJjBmUNI1KijZh3HdHe/EmC5NtACyqoB3OKaxSt9f2Q62sd3Oi7EnLLbeVastRyn0XJyWMEXK8GkA8X01BfE9ajSWt2EDpOnM3HZ2JdnCYzVEcKZxjbw1WppGtTVfjS2+Q7RnBdxHoo19uHKZhwO7QVSWm04p2xgrh/TqIs2B+gAku04yry+fhg6NMJL7i7f3wi7bhmV6Y/zcbTFC6kcviCSD/eZyygooSQbFLYy4NkOHxGKytIBNDME+fAtkvICt+MdMb+zD7K5a2LgubgNZH+Wzf5gO+8uj0AK2n3tp6Znx+W+Q+SaCfUkLoAs2c6AlUB9sjgwjvYhnchemBEZC2GWh+nX0bd2yU3fmtCDs4z+qVpK6IwcAAA=="
		);

		const RENDER_SHADER = await this.decompress(
			"H4sIAAAAAAAACp1WS2/jNhC+91cI6IWkaK7kJO0GrA5NvNsW6AKLOGjPXJm2iZVIlQ/H3sD/vSCpd7xp0JM4o5lvHvw45I8Hro1QMrnKsoSbHxrNSxEUe7HbN8m2UszSudawuqm4Xq6ok2KrdJ0ceLlM3AM3qnJWKNn/CACJexQ173W9e+L+Zpbr37nY7S12d6z8utPKyc0jP1qn+Rj+KnFrJ1dC89IHwG7NSyU3TJ/G6nnctZN/SMulEfY0chnpHvhWs6lvjBZSexTSvqxF2rXVXO7sHrt1w0tXMT1oHpTb7SU3BruPmhvJqw/bLS9tL35WT1wPnkGcl/r1dK8qpeexV7yx+4+stEpj96utlWn2XItyXTJrPegHefjEmml9VexNG32suqucHssrYazSsb/3zBkryqGuTlGyig9Sw/mml+6038lYe6tacctERYWMHLH8eK+U3lDlrNdcJ1vNdrFWY7UrbbJ2estKvmKWPcey94EgNAqN5ofIGBp6JZWuWUXHlr9pthFcWnqmI7Bkx+1IBJGzB/gcFo048qrIybsxi8feJq5psN61EQovARvpCiZ0LitWN8Ad0mAS4MkRLQnOIA4SzskiLCAkx8WrGIs3YeA35JFFP3JCS/J/8/gvDIjIDW3bReKOFK/CXsDo/YftvozhDpCcZtG6/S+qQF3Q7Rbs7SJpivgR37gnwxVYdIa+xTmEVHPrtOy3/hxJFngkKx8JjCiIwzqoV0JH6SD4kxcusRM+t/CNegI1O4KNsqCFGhLr8NIWCkKcETibHhC9mEPI1ErZvbG8ARnBJFviWfixBcluMFne4FkaXfAQE3b1l/Fkx6kWj1GjTFujFTWHz40yqJhMDOp/jHR+brSHVipheJERzOqmyAneav5PkRO6VRpEC1FkhIpf5jMlTWE7IZjcVbwIIQC5ST0CIjmkATotjJChLJ+W/4cDj0tlQHCE2BvEJYQQsbqhrG5QQX6iAapYEnqOuwUi5DQV+A4sCZrp6PmgxCapmZAgDJmeDkVgW4YznMNLM6aYTapuaMKuYStl/yq6vZpyGnc88VsWh9WXXfAu4nHrwNKpHzme0OgyRCAnKftiwPRkQRhbl7Vff0haeHIqcrLohTicdQQM872oxbEblX+qDXh53+PWe35FIXAhk/TymffD4/QND9c3nlzY362r662JN2kBcrIIfYZotLxw58ZCW7eh0HHluL/PcWuHyA2kXajpeep74N9MEM3vYQRmB3vp52YLNZgPN7GfYkMqaeReZ09fz3v8F/sx1XVi+paBaPrSgel4RM74OYy2yYMOdsTF39lXNHnMoVBGjsntz5jcLiF6T6YGb03h0ivyLbm8eErGjMjte0xub3EO0TW5ZEb7947fiWswaXEO6flfWh3kF5MLAAA="
		);

		this.physicsProgram = this.createProgram(VERTEX_SHADER, PHYSICS_SHADER);

		this.renderProgram = this.createProgram(VERTEX_SHADER, RENDER_SHADER);

		this.cacheUniformLocations();
	}

	async initShaders() {
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
precision highp int;

uniform vec2 uResolution;
uniform float uDeltaTime;
uniform float uTime;
uniform float uTimeScale;
uniform float uWaveSpeed;
uniform float uDamping;
uniform float uPropagationSpeed;

struct Touch {
	vec2 position;
	float radius;
	float strength;
	float trail;
	float spread;
	float frequency;
};

uniform sampler2D uPreviousState;
uniform vec2 uTouch[10];
uniform int uTouchCount;
uniform Touch uTouchParams[10];

in vec2 texCoord;
out vec4 fragColor;

void main() {
	vec2 pixel = vec2(1.0) / uResolution;
	vec4 state = texture(uPreviousState, texCoord);
	float height = state.r;
	float oldHeight = state.g;
	
	float sum = 0.0;
	float validSamples = 0.0;
	
	// 12 directions sampling pattern
	for(int i = 0; i < 12; i++) {
		float angle = float(i) * 0.523598775; // 2*PI / 12
		vec2 dir = vec2(cos(angle), sin(angle));
		
		// primary sample
		vec2 sampleCoord = texCoord + dir * pixel * uPropagationSpeed;
		float weight = 1.0;
		
		if(sampleCoord.x < 0.0 || sampleCoord.x > 1.0 || 
		   sampleCoord.y < 0.0 || sampleCoord.y > 1.0) {
			sampleCoord = clamp(sampleCoord, vec2(0.001), vec2(0.999));
			weight = 0.85; // edge bouncing weakens strength
		}
		
		// get sample point height
		float heightSample = texture(uPreviousState, sampleCoord).r;
		
		// add weight
		sum += heightSample * weight;
		validSamples += weight;
		
		// add secondary samples half distance for better wave interaction
		vec2 halfSampleCoord = texCoord + dir * pixel * (uPropagationSpeed * 0.5);
		if(halfSampleCoord.x >= 0.0 && halfSampleCoord.x <= 1.0 && 
		   halfSampleCoord.y >= 0.0 && halfSampleCoord.y <= 1.0) {
			float halfHeight = texture(uPreviousState, halfSampleCoord).r;
			sum += halfHeight * 0.5;
			validSamples += 0.5;
		}
	}
	
	// normalize
	sum /= max(validSamples, 1.0);
	
	float newHeight = sum * 2.0 - oldHeight;
	newHeight = mix(height, newHeight, uWaveSpeed);
	
	float touchImpact = 0.0;
	
	for(int i = 0; i < uTouchCount; i++) {
		vec2 touchPos = uTouch[i] / uResolution;
		vec2 diff = (texCoord - touchPos) * uResolution;
		float dist = length(diff) / uResolution.y; // Normalize by height
		
		float radiusThreshold = uTouchParams[i].radius * 1.8;
		if(dist < radiusThreshold) {
			float strength = smoothstep(radiusThreshold, 0.0, dist);
			float impact = strength * uTouchParams[i].strength * 1.8;
			
			float phase = dist * uTouchParams[i].spread - uTime * uTouchParams[i].frequency;
			float trailEffect = sin(phase) * 0.9 + sin(phase * 1.5) * 0.1;
			trailEffect *= uTouchParams[i].trail;
			
			touchImpact += impact * (1.0 + trailEffect);
		}
	}
	
	touchImpact *= 1.0 - abs(height) * 0.12;
	newHeight += touchImpact;
	
	// edge damping
	vec2 edgeDist = min(texCoord, 1.0 - texCoord);
	float edgeFactor = min(edgeDist.x, edgeDist.y) / pixel.x;
	float edgeDamping = smoothstep(0.0, 5.0, edgeFactor);
	newHeight *= uDamping * mix(0.95, 1.0, edgeDamping);
	
	fragColor = vec4(newHeight, height, 0.0, 1.0);
}`;

		const RENDER_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;

uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uWaterHeight;
uniform sampler2D uBackgroundTexture;

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

uniform vec3 uSkyColor;
uniform float uDepthFactor;
uniform float uAtmosphericScatter;

uniform float uEnvMapIntensity;
uniform float uReflectionFresnel;
uniform float uReflectionBlur;
uniform float uReflectionDistortion;

uniform float uCausticStrength;
uniform float uCausticScale;
uniform float uCausticSpeed;
uniform float uCausticBrightness;
uniform float uCausticDetail;

in vec2 texCoord;
out vec4 fragColor;

struct SurfaceData {
	float height;
	float prevHeight;
	vec3 normal;
	float heightGradient;
};

SurfaceData getSurfaceData(vec2 uv) {
	vec2 pixel = 1.0 / uResolution;
	SurfaceData surface;
	
	vec2 c_uv = clamp(uv, pixel, 1.0 - pixel);
	vec2 r_uv = clamp(uv + vec2(pixel.x * 2.0, 0.0), pixel, 1.0 - pixel);
	vec2 l_uv = clamp(uv - vec2(pixel.x * 2.0, 0.0), pixel, 1.0 - pixel);
	vec2 t_uv = clamp(uv + vec2(0.0, pixel.y * 2.0), pixel, 1.0 - pixel);
	vec2 b_uv = clamp(uv - vec2(0.0, pixel.y * 2.0), pixel, 1.0 - pixel);
	
	float c = texture(uWaterHeight, c_uv).r;
	float r = texture(uWaterHeight, r_uv).r;
	float l = texture(uWaterHeight, l_uv).r;
	float t = texture(uWaterHeight, t_uv).r;
	float b = texture(uWaterHeight, b_uv).r;
	
	vec2 gradient = vec2(r - l, t - b) * 0.5;
	surface.height = c;
	surface.prevHeight = texture(uWaterHeight, uv).g;
	surface.heightGradient = length(gradient);
	surface.normal = normalize(vec3(-gradient * 2.0, 1.0));
	
	return surface;
}

float getSunlight(vec3 normal, vec3 lightDir, vec3 viewDir, float heightGradient) {
	float nDotL = max(dot(normal, lightDir), 0.0);
	vec3 halfway = normalize(lightDir + viewDir);
	float nDotH = max(dot(normal, halfway), 0.0);
	float specBase = pow(nDotH, uSpecularPower);
	float edge = smoothstep(0.0, 0.02, heightGradient);
	return specBase * uSpecularStrength * edge * smoothstep(0.05, 0.25, nDotL);
}

float causticEffect(vec2 pos, float time) {
	vec2 causticPos = pos * uCausticScale;
	float speed = time * uCausticSpeed;
	float noise = 0.0;
	float amp = 1.0;
	float freq = 1.0;
	
	for(float i = 0.0; i < uCausticDetail; i++) {
		float angle = speed * (0.5 + freq * 0.1);
		vec2 wave = vec2(cos(angle), sin(angle));
		noise += sin(dot(causticPos * freq, wave)) * amp;
		
		amp *= 0.6;
		freq *= 2.0;
	}
	
	return (noise + uCausticDetail) / (2.0 * uCausticDetail);
}

void main() {
	vec3 viewDir = vec3(0.0, 0.0, 1.0);
	SurfaceData surface = getSurfaceData(texCoord);
	
	vec3 sunDir = normalize(uSunDirection);
	vec3 secondarySunDir = normalize(uSecondarySunDirection);
	
	float primaryLight = getSunlight(surface.normal, sunDir, viewDir, surface.heightGradient) * uSunIntensity;
	float secondaryLight = getSunlight(surface.normal, secondarySunDir, viewDir, surface.heightGradient) * uSecondaryIntensity;
	
	float nDotV = max(dot(surface.normal, viewDir), 0.0);
	float fresnel = pow(1.0 - nDotV, uFresnelPower) * uFresnelEffect;
	
	// background sampling
	vec2 refractOffset = surface.normal.xy * uRefraction * (1.0 + abs(surface.height));
	vec2 bgCoord = clamp(texCoord + refractOffset, vec2(0.0), vec2(1.0));
	bgCoord.y = 1.0 - bgCoord.y;
	
	float blur = uReflectionBlur * (abs(surface.height) + surface.heightGradient);
	vec3 refractColor = textureLod(uBackgroundTexture, bgCoord, blur).rgb;
	
	float tintBlend = uTintStrength * (1.0 + abs(surface.height));
	vec3 waterColor = mix(refractColor, uWaterTint, tintBlend);
	
	float scatter = (1.0 - nDotV) * (1.0 - nDotV) * uAtmosphericScatter;
	vec3 scatterColor = mix(waterColor, uSkyColor, scatter * 0.5);
	
	float caustic = causticEffect(bgCoord, uTime) * uCausticStrength;
	caustic *= smoothstep(0.0, 0.2, 1.0 - scatter) * uCausticBrightness;
	waterColor += vec3(caustic);
	
	vec3 finalColor = mix(waterColor, scatterColor, fresnel);
	finalColor += vec3(1.0, 0.97, 0.92) * primaryLight * 8.0 * uSunIntensity;
	finalColor += vec3(0.98, 0.99, 1.0) * secondaryLight * 4.0 * uSecondaryIntensity;
	
	fragColor = vec4(finalColor, 1.0);
}`;

		this.physicsProgram = this.createProgram(VERTEX_SHADER, PHYSICS_SHADER);

		this.renderProgram = this.createProgram(VERTEX_SHADER, RENDER_SHADER);

		this.cacheUniformLocations();
	}

	getULP(name) {
		return this.getUL(this.physicsProgram, `u${name}`);
	}

	getULR(name) {
		return this.getUL(this.renderProgram, `u${name}`);
	}

	getUL(prg, nnm) {
		return this.gl.getUniformLocation(prg, nnm);
	}

	cacheUniformLocations() {
		const p = this.physicsProgram;

		this.physicsUniforms = {
			resolution: this.getULP("Resolution"),
			deltaTime: this.getULP("DeltaTime"),
			time: this.getULP("Time"),
			timeScale: this.getULP("TimeScale"),
			waveSpeed: this.getULP("WaveSpeed"),
			damping: this.getULP("Damping"),
			propagationSpeed: this.getULP("PropagationSpeed"),
			previousState: this.getULP("PreviousState"),
			touchPositions: this.getULP("Touch"),
			touchCount: this.getULP("TouchCount"),

			touches: Array(10)
			.fill({})
			.map((_, i) => 
				({
					position: this.gl.getUniformLocation(
						p,
						`uTouchParams[${i}].position`
					),
					radius: this.gl.getUniformLocation(
						p,
						`uTouchParams[${i}].radius`
					),
					strength: this.gl.getUniformLocation(
						p,
						`uTouchParams[${i}].strength`
					),
					trail: this.gl.getUniformLocation(
						p,
						`uTouchParams[${i}].trail`
					),
					spread: this.gl.getUniformLocation(
						p,
						`uTouchParams[${i}].spread`
					),
					frequency: this.gl.getUniformLocation(
						p,
						`uTouchParams[${i}].frequency`
					),
				})),
		};

		this.renderUniforms = {
			resolution: this.getULR("Resolution"),
			time: this.getULR("Time"),
			waterHeight: this.getULR("WaterHeight"),
			backgroundTexture: this.getULR("BackgroundTexture"),

			sunDirection: this.getULR("SunDirection"),
			secondarySunDirection: this.getULR("SecondarySunDirection"),
			sunIntensity: this.getULR("SunIntensity"),
			secondaryIntensity: this.getULR("SecondaryIntensity"),

			refraction: this.getULR("Refraction"),
			waterTint: this.getULR("WaterTint"),
			tintStrength: this.getULR("TintStrength"),
			specularStrength: this.getULR("SpecularStrength"),
			roughness: this.getULR("Roughness"),

			fresnelEffect: this.getULR("FresnelEffect"),
			fresnelPower: this.getULR("FresnelPower"),
			specularPower: this.getULR("SpecularPower"),

			skyColor: this.getULR("SkyColor"),
			depthFactor: this.getULR("DepthFactor"),
			atmosphericScatter: this.getULR("AtmosphericScatter"),
			envMapIntensity: this.getULR("EnvMapIntensity"),

			reflectionFresnel: this.getULR("ReflectionFresnel"),
			reflectionBlur: this.getULR("ReflectionBlur"),
			reflectionDistortion: this.getULR("ReflectionDistortion"),

			causticStrength: this.getULR("CausticStrength"),
			causticScale: this.getULR("CausticScale"),
			causticSpeed: this.getULR("CausticSpeed"),
			causticBrightness: this.getULR("CausticBrightness"),
			causticDetail: this.getULR("CausticDetail"),
		};
	}

	getUniformLocations(gl, program, defs) {
		const uniforms = {};

		for(const [type, locations] of Object.entries(defs)) {
			if(type === "touchParams" || type === "arrays") continue;

			uniforms[type] = {};
			for(const [name, loc] of Object.entries(locations)) {
				uniforms[type][name] = gl.getUniformLocation(program, loc);
			}
		}

		if(defs.arrays) {
			uniforms.arrays = {};
			for(const [name, def] of Object.entries(defs.arrays)) {
				uniforms.arrays[name] = {
					location: gl.getUniformLocation(program, def.name),
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
		if(DEBUG) console.log("create program");

		const gl = this.gl;
		const program = gl.createProgram();

		const createShader = (type, source) => {
			const shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);

			if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				const info = gl.getShaderInfoLog(shader);
				gl.deleteShader(shader);
				throw new Error(`Shader compilation error: ${info}`);
			}
			return shader;
		};

		const vertShader = createShader(gl.VERTEX_SHADER, vertexSource);
		const fragShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);

		gl.attachShader(program, vertShader);
		gl.attachShader(program, fragShader);
		gl.linkProgram(program);

		if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			const info = gl.getProgramInfoLog(program);
			gl.deleteProgram(program);
			throw new Error(`Program linking error: ${info}`);
		}

		gl.deleteShader(vertShader);
		gl.deleteShader(fragShader);

		return program;
	}

	initBuffers() {
		this.vertexBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			this.vertices,
			this.gl.STATIC_DRAW
		);
	}

	createTexture(linear = true) {
		const gl = this.gl;
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_MIN_FILTER,
			linear ? gl.LINEAR : gl.NEAREST
		);
		gl.texParameteri(
			gl.TEXTURE_2D,
			gl.TEXTURE_MAG_FILTER,
			linear ? gl.LINEAR : gl.NEAREST
		);

		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA32F,
			1,
			1,
			0,
			gl.RGBA,
			gl.FLOAT,
			new Float32Array([0.0, 0.0, 0.0, 1.0])
		);

		return texture;
	}

	initTextures() {
		const gl = this.gl;

		this.waterTexture1 = this.createTexture(false);
		this.waterTexture2 = this.createTexture(false);

		const initialData = new Float32Array(this.w * this.h * 4);
		for(let i = 3; i < initialData.length; i += 4) {
			initialData[i] = 1.0;
		}

		[this.waterTexture1, this.waterTexture2].forEach((texture) => {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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

		this.framebuffer1 = gl.createFramebuffer();
		this.framebuffer2 = gl.createFramebuffer();

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer1);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			this.waterTexture1,
			0
		);

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer2);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			this.waterTexture2,
			0
		);

		this.backgroundTexture = this.createTexture(true);
		this.updateBackgroundTexture();

		this.currentFramebuffer = this.framebuffer1;
		this.currentTexture = this.waterTexture1;
		this.previousTexture = this.waterTexture2;

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	processTouches() {
		const touchArray = Array.from(this.pops.values());
		const touchCount = Math.min(touchArray.length, 10);

		this.touchPositions.fill(0);
		for(let i = 0; i < touchCount; i++) {
			const touch = touchArray[i];
			this.touchPositions[i * 2] = touch.x;
			this.touchPositions[i * 2 + 1] = touch.y;
		}

		const gl = this.gl;
		gl.uniform2fv(this.physicsUniforms.touchPositions, this.touchPositions);
		gl.uniform1i(this.physicsUniforms.touchCount, touchCount);
	}

	physicsStep() {
		const gl = this.gl;
		gl.useProgram(this.physicsProgram);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.currentFramebuffer);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		const positionLoc = gl.getAttribLocation(
			this.physicsProgram,
			"position"
		);
		gl.enableVertexAttribArray(positionLoc);
		gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

		this.updatePhysicsUniforms();

		this.processTouches();

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.previousTexture);
		gl.uniform1i(this.physicsUniforms.previousState, 0);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	updatePhysicsUniforms() {
		const gl = this.gl;
		const u = this.physicsUniforms;

		gl.uniform2f(u.resolution, this.w, this.h);
		gl.uniform1f(u.deltaTime, this.deltaTime);
		gl.uniform1f(u.time, this.accumulatedTime);
		gl.uniform1f(u.timeScale, this.params.timeScale);
		gl.uniform1f(u.waveSpeed, this.params.waveSpeed);
		gl.uniform1f(u.damping, this.params.damping);
		gl.uniform1f(u.propagationSpeed, this.params.propagationSpeed);

		const touches = Array.from(this.pops.values());
		const touchCount = Math.min(touches.length, 10);

		this.touchPositions.fill(0);

		for(let i = 0; i < touchCount; i++) {
			const touch = touches[i];
			const pos = [touch.x / this.w, touch.y / this.h];

			this.touchPositions[i * 2] = pos[0];
			this.touchPositions[i * 2 + 1] = pos[1];

			gl.uniform2f(u.touches[i].position, pos[0], pos[1]);
			gl.uniform1f(u.touches[i].radius, touch.touchRadius);
			gl.uniform1f(u.touches[i].strength, touch.initialImpact);
			gl.uniform1f(u.touches[i].trail, touch.trailStrength);
			gl.uniform1f(u.touches[i].spread, touch.trailSpread);
			gl.uniform1f(u.touches[i].frequency, touch.trailFrequency);
		}

		gl.uniform2fv(u.touchPositions, this.touchPositions);
		gl.uniform1i(u.touchCount, touchCount);
	}

	renderStep() {
		const gl = this.gl;
		gl.useProgram(this.renderProgram);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		const positionLoc = gl.getAttribLocation(
			this.renderProgram,
			"position"
		);
		gl.enableVertexAttribArray(positionLoc);
		gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

		this.updateRenderUniforms();

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);
		gl.uniform1i(this.renderUniforms.waterHeight, 0);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.backgroundTexture);
		gl.uniform1i(this.renderUniforms.backgroundTexture, 1);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	updateRenderUniforms() {
		const gl = this.gl;
		const u = this.renderUniforms;
		const p = this.params;

		gl.uniform2f(u.resolution, this.w, this.h);
		gl.uniform1f(u.time, this.accumulatedTime);

		Object.keys(p)
		.filter((prop) => 
			u[prop] && p[prop] instanceof Float32Array)
		.forEach((prop) => 
			gl.uniform3fv(u[prop], p[prop]));

		Object.keys(p)
		.filter((prop) => 
			u[prop] && typeof p[prop] === "number")
		.forEach((prop) => 
			gl.uniform1f(u[prop], p[prop]));

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);
		gl.uniform1i(u.waterHeight, 0);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.backgroundTexture);
		gl.uniform1i(u.backgroundTexture, 1);
	}

	async injectImage(imageUrl, x, y, width, height) {
		
		const image = new Image();
		await new Promise((resolve, reject) => {
			image.onload = resolve;
			image.onerror = reject;
			image.crossOrigin = "Anonymous";
			image.src = imageUrl;
		});

		this.injectedImage = {
			image,
			x,
			y,
			width,
			height,
		};

		this.updateBackgroundTexture();
	}

	updateBackgroundTexture() {
		if(!this.image?.complete) return;

		const cvs = document.createElement("canvas");
		const ctx = cvs.getContext("2d", { alpha: false });

		cvs.width = this.w;
		cvs.height = this.h;

		// draw background image
		const imageAspect = this.image.naturalWidth / this.image.naturalHeight;
		const canvasAspect = cvs.width / cvs.height;

		const drawWidth =
			imageAspect > canvasAspect ? cvs.height * imageAspect : cvs.width;
		const drawHeight =
			imageAspect > canvasAspect ? cvs.height : cvs.width / imageAspect;

		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, cvs.width, cvs.height);
		ctx.drawImage(
			this.image,
			(cvs.width - drawWidth) / 2,
			(cvs.height - drawHeight) / 2,
			drawWidth,
			drawHeight
		);

		// draw inject image
		if(this.injectedImage) {
			const { image, x, y, width, height } = this.injectedImage;

			// scale coordinates and dimensions
			const scaledX = x * this.dpr;
			const scaledY = y * this.dpr;
			const scaledWidth = width * this.dpr;
			const scaledHeight = height * this.dpr;

			ctx.drawImage(image, scaledX, scaledY, scaledWidth, scaledHeight);
		}

		const gl = this.gl;
		gl.bindTexture(gl.TEXTURE_2D, this.backgroundTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			cvs
		);
		gl.generateMipmap(gl.TEXTURE_2D);

		// clean up temp canvas
		cvs.width = cvs.height = 0;
	}

	startRenderLoop() {
		if(DEBUG) console.log("start render loop");

		this.nextFrame();

		document.addEventListener("visibilitychange", () =>
			this.visibleChange()
		);
	}

	nextFrame() {
		this.loop = requestAnimationFrame((hrts) => 
			this.renderLoop(hrts));
	}

	renderLoop(currentTime) {
		if(!this.isVisible) return;

		this.loop = requestAnimationFrame(this.renderLoop.bind(this));

		if(!this.lastTime) {
			this.lastTime = currentTime;
			return;
		}

		const rawDeltaTime = Math.min(
			(currentTime - this.lastTime) * 0.001,
			0.016
		);
		this.deltaTime = rawDeltaTime * this.params.timeScale;
		this.lastTime = currentTime;
		this.accumulatedTime += this.deltaTime;

		const gl = this.gl;
		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.BLEND);

		this.physicsStep();
		this.renderStep();
		this.swapBuffers();
	}

	visibleChange() {
		if(DEBUG) console.log("visible change");

		this.isVisible = document.visibilityState === "visible";

		if(this.isVisible) {
			this.lastTime = performance.now();
			this.nextFrame();
		} else {
			cancelAnimationFrame(this.loop);
		}
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
		const gl = this.gl;

		const initialData = new Float32Array(this.w * this.h * 4)
		.fill(0);

		// alpha
		for(let i = 3; i < initialData.length; i += 4) initialData[i] = 1.0;

		[this.waterTexture1, this.waterTexture2].forEach((texture) => {
			gl.bindTexture(gl.TEXTURE_2D, texture);

			// nearest neighbor filtering
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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

			// upload state
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

		this.pops.clear();

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	setupEventListeners() {
		if(DEBUG) console.log("setup events");

		const pointerOpts = { passive: false };
		// kill ios tap hold magnifier
		this.cvs.addEventListener(
			"touchstart",
			this.handleTouchStart.bind(this),
			pointerOpts
		);
		this.cvs.addEventListener(
			"pointerdown",
			this.handlePointerStart.bind(this),
			pointerOpts
		);
		this.cvs.addEventListener(
			"pointermove",
			this.handlePointerMove.bind(this),
			pointerOpts
		);
		this.cvs.addEventListener(
			"pointerup",
			this.handlePointerEnd.bind(this)
		);
		this.cvs.addEventListener(
			"pointerout",
			this.handlePointerEnd.bind(this)
		);
		this.cvs.addEventListener(
			"pointercancel",
			this.handlePointerEnd.bind(this)
		);
	}

	getPointerPos(e) {
		const rect = this.cvs.getBoundingClientRect();

		return {
			x: (e.clientX - rect.left) * this.dpr,
			y: (rect.bottom - e.clientY - rect.top) * this.dpr,
		};
	}

	handleTouchStart(e) {
		// water === magnifier :-D
		e.preventDefault();
	}

	genPopId() {
		return Math.random()
		.toString(36)
		.slice(-6);
	}

	handlePointerStart(e) {
		e.preventDefault();
		const pos = this.getPointerPos(e);
		this.pops.set(e.pointerId, {
			...pos,
			prevX: pos.x,
			prevY: pos.y,
			...this.defaultPointOpts,
			// radius: Math.random() / 33 // testing individual point params
		});
	}

	handlePointerMove(e) {
		e.preventDefault();
		if(this.pops.has(e.pointerId)) {
			const touch = this.pops.get(e.pointerId);
			const pos = this.getPointerPos(e);
			touch.prevX = touch.x;
			touch.prevY = touch.y;
			touch.x = pos.x;
			touch.y = pos.y;
		}
	}

	handlePointerEnd(e) {
		this.pops.delete(e.pointerId);
	}

	destroy() {
		this.isVisible = false;
		cancelAnimationFrame(this.loop);
		this.sizer?.disconnect();

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
	}

	createSwirl(x, y, radius, params, dur, startAngle, ease) {
		const popId = Math.random()
		.toString(36)
		.slice(-6);
		const startTime = performance.now();

		const initialX = x + Math.cos(startAngle) * radius;
		const initialY = y + Math.sin(startAngle) * radius;

		const popped = {
			x: initialX,
			y: initialY,
			prevX: initialX,
			prevY: initialY,
			...this.defaultPointOpts,
			...params,
		};

		this.pops.set(popId, popped);

		const updateSwirl = () => {
			const elapsed = performance.now() - startTime;
			const progress = elapsed / dur;

			if(progress < 1) {
				const angle = startAngle + elapsed * 0.001 * popped.speed;
				const easedProgress = ease(elapsed, 0, 1, dur);
				const currentRadius = radius * (1 - easedProgress);

				const pop = this.pops.get(popId);
				pop.prevX = pop.x;
				pop.prevY = pop.y;
				pop.x = x + Math.cos(angle) * currentRadius;
				pop.y = y + Math.sin(angle) * currentRadius;

				requestAnimationFrame(updateSwirl);
			} else {
				this.pops.delete(popId);
			}
		};

		requestAnimationFrame(updateSwirl);
	}

	createSwirls() {
		if(DEBUG) console.log("swirls");

		let numSwirls = 3;
		const radius = 0.3;

		for(let i = 0; i < numSwirls; i++) {
			const spreadOffset = i * (2.0 / numSwirls);

			this.createSwirl(
				this.w / 2,
				this.h / 2,
				Math.min(this.w, this.h) * radius,
				{
					touchRadius: 0.015,
					initialImpact: 0.15,
					trailStrength: 0.22,
					trailSpread: spreadOffset + 4.0,
					trailFrequency: 0.0002,
					speed: 2.2,
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

	get w() {
		return this.cvs.width;
	}

	get h() {
		return this.cvs.height;
	}
}
