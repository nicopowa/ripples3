class Params {

	constructor(liquid) {

		this.liquid = liquid;

		this.pop = false;

		this.expanded = false;

		this.preidx = 0;

		this.bnd = {
			x: 0, y: 0,
			w: 0, h: 0
		};

		this.params = {
			waveSpeed: {
				nnm: "wave speed",
				dmp: "wsp",
				val: 0,
				min: 0.95,
				max: 0.999,
				stp: 0.001,
				grp: "global"
				// exp: "Controls how quickly waves propagate. Higher values = faster waves"
			},
			damping: {
				nnm: "damping",
				dmp: "dmp",
				val: 0,
				min: 0.9,
				max: 0.999,
				stp: 0.001,
				grp: "global"
				// exp: "How quickly waves lose energy. Higher values = waves persist longer"
			},
			propagationSpeed: {
				nnm: "propagation",
				dmp: "pgs",
				val: 0,
				min: 2,
				max: 16,
				stp: 2,
				rst: true, // heavy glitch if not reseting water state
				grp: "global"
				// exp: "Distance waves travel per frame. Higher = faster spread"
			},

			refraction: {
				nnm: "refraction",
				dmp: "rft",
				val: 0,
				min: 0.0,
				max: 5.0,
				stp: 0.01,
				grp: "visual"
				// exp: "Light bending through water. Higher values = more distortion"
			},
			waterHue: {
				nnm: "water hue",
				dmp: "wth",
				val: 0,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "visual",
				// exp: "Base color of water (0-1 maps to color wheel)",
				mod: val => {

					this.liquid.params.waterTint = this.hueToRGB(val);

				}
			},
			tintStrength: {
				nnm: "tint",
				dmp: "tnt",
				val: 0,
				min: 0.0,
				max: 1.0,
				stp: 0.005,
				grp: "visual"
				// exp: "Intensity of water coloration"
			},
			specularStrength: {
				nnm: "specular",
				dmp: "sps",
				val: 0,
				min: 0.0,
				max: 5.0,
				stp: 0.01,
				grp: "visual"
				// exp: "Intensity of light reflections on water surface"
			},
			roughness: {
				nnm: "roughness",
				dmp: "rgs",
				val: 0,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "visual"
				// exp: "Surface texture. Higher = more diffuse reflections"
			},

			fresnelEffect: {
				nnm: "effect",
				dmp: "fre",
				val: 0,
				min: 0.0,
				max: 3.0,
				stp: 0.05,
				grp: "fresnel"
				// exp: "Edge brightness. Higher = stronger edge highlights"
			},
			fresnelPower: {
				nnm: "power",
				dmp: "frp",
				val: 0,
				min: 0.1,
				max: 5.0,
				stp: 0.01,
				grp: "fresnel"
				// exp: "Sharpness of edge effect. Higher = more concentrated"
			},
			reflectionFresnel: {
				nnm: "reflection",
				dmp: "frr",
				val: 0,
				min: 0.0,
				max: 5.0,
				stp: 0.05,
				grp: "fresnel"
				// exp: "Strength of angle-based reflections"
			},
			reflectionBlur: {
				nnm: "blur",
				dmp: "blr",
				val: 0,
				min: 0.0,
				max: 5.0,
				stp: 0.01,
				grp: "fresnel"
				// exp: "Softness of reflections"
			},
			reflectionDistortion: {
				nnm: "distortion",
				dmp: "dst",
				val: 0,
				min: 0.0,
				max: 30.0,
				stp: 0.1,
				grp: "fresnel"
				// exp: "Wave-based reflection warping"
			},
			skyHue: {
				nnm: "sky hue",
				dmp: "skh",
				val: 0,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "world",
				// exp: "Color of environmental reflection (0-1 maps to color wheel)",
				mod: () => {
					
					this.liquid.params.skyColor = this.hueToRGB(this.params.skyHue.val);

				}
			},
			depthFactor: {
				nnm: "depth",
				dmp: "dpt",
				val: 0,
				min: 0.0,
				max: 15.0,
				stp: 0.1,
				grp: "world"
				// exp: "Simulated water depth effect"
			},
			atmosphericScatter: {
				nnm: "scatter",
				dmp: "sct",
				val: 0,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "world"
				// exp: "Atmospheric light scattering in water"
			},
			envMapIntensity: {
				nnm: "environment",
				dmp: "env",
				val: 0,
				min: 0.0,
				max: 5.0,
				stp: 0.01,
				grp: "world"
				// exp: "Strength of environmental reflections"
			},

			touchRadius: {
				nnm: "radius",
				dmp: "trd",
				val: 0,
				min: 0.005,
				max: 0.1,
				stp: 0.001,
				grp: "touch"
				// exp: "Size of interaction area"
			},
			initialImpact: {
				nnm: "impact",
				dmp: "tmp",
				val: 0,
				min: 0.01,
				max: 2.0,
				stp: 0.01,
				grp: "touch"
				// exp: "Initial strength of touch disturbance"
			},
			trailStrength: {
				nnm: "trail",
				dmp: "ttr",
				val: 0,
				min: 0.0,
				max: 5.0,
				stp: 0.05,
				grp: "touch"
				// exp: "Strength of continuous touch effect"
			},
			trailSpread: {
				nnm: "spread",
				dmp: "tsp",
				val: 0,
				min: 0.0,
				max: 5.0,
				stp: 0.05,
				grp: "touch"
				// exp: "How widely touch effect spreads"
			},

			causticStrength: {
				nnm: "strength",
				dmp: "css",
				val: 0,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "caustic"
				// exp: "Intensity of underwater light patterns"
			},
			causticScale: {
				nnm: "scale",
				dmp: "csc",
				val: 0,
				min: 0.5,
				max: 3.0,
				stp: 0.05,
				grp: "caustic"
				// exp: "Size of caustic patterns"
			},
			causticSpeed: {
				nnm: "speed",
				dmp: "csp",
				val: 0,
				min: 0.0,
				max: 1.0,
				stp: 0.005,
				grp: "caustic"
				// exp: "Animation speed of caustics"
			},
			causticBrightness: {
				nnm: "brightness",
				dmp: "csb",
				val: 0,
				min: 0.0,
				max: 2.0,
				stp: 0.01,
				grp: "caustic"
				// exp: "Overall brightness of caustic effects"
			},
			causticDetail: {
				nnm: "detail",
				dmp: "csd",
				val: 0,
				min: 0.0,
				max: 5.0,
				stp: 0.05,
				grp: "caustic"
				// exp: "Complexity of caustic patterns"
			},

			sunIntensity: {
				nnm: "sun",
				dmp: "sun",
				val: 0,
				min: 0.0,
				max: 10.0,
				stp: 0.1,
				grp: "sunlight"
				// exp: "Primary light source intensity"
			},
			/*sunHue: {
				nnm: "sun hue",
				dmp: "snh",
				val: 0,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "sunlight",
				// exp: "Sun color (0-1 maps to color wheel)",
				mod: () => {
					
					this.liquid.params.sunColor = this.hueToRGB(this.params.sunHue.val);

				}
			},*/
			sunAngle: {
				nnm: "sun angle",
				dmp: "sth",
				val: 0,
				min: 0,
				max: 360,
				stp: 5,
				grp: "sunlight",
				// exp: "Horizontal angle of sun in degrees (0=East, 90=North, 180=West, 270=South)",
				mod: () =>
					this.updateSunLight()
			},
			sunHeight: {
				nnm: "sun height",
				dmp: "sph",
				val: 0,
				min: 0,
				max: 90,
				stp: 1,
				grp: "sunlight",
				// exp: "Height of sun above horizon in degrees (0=horizon, 90=overhead)",
				mod: () =>
					this.updateSunLight()
			},
			lightIntensity: {
				nnm: "light",
				dmp: "lht",
				val: 0,
				min: 0.0,
				max: 10.0,
				stp: 0.1,
				grp: "sunlight"
				// exp: "Secondary light source intensity"
			},
			/*lightHue: {
				nnm: "light hue",
				dmp: "lih",
				val: 0,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "sunlight",
				// exp: "Light color (0-1 maps to color wheel)",
				mod: () => {
					
					this.liquid.params.lightColor = this.hueToRGB(this.params.lightHue.val);

				}
			},*/
			lightAngle: {
				nnm: "light angle",
				dmp: "lth",
				val: 0,
				min: 0,
				max: 360,
				stp: 5,
				grp: "sunlight",
				// exp: "Horizontal angle of secondary light in degrees",
				mod: () =>
					this.updateSunLight()
			},
			lightHeight: {
				nnm: "light height",
				dmp: "lph",
				val: 0,
				min: 0,
				max: 90,
				stp: 1,
				grp: "sunlight",
				// exp: "Height of secondary light above horizon in degrees",
				mod: () =>
					this.updateSunLight()
			},

			waveReflectionStrength: {
				nnm: "waves",
				dmp: "rfs",
				val: 0,
				min: 0.0,
				max: 5.0,
				stp: 0.01,
				grp: "reflect"
				// exp: "Strength of wave-based reflections"
			},
			mirrorReflectionStrength: {
				nnm: "mirror",
				dmp: "rfm",
				val: 0,
				min: 0.0,
				max: 10.0,
				stp: 0.01,
				grp: "reflect"
				// exp: "Strength of mirror-like reflections"
			},
			velocityReflectionFactor: {
				nnm: "velocity",
				dmp: "rfv",
				val: 0,
				min: 0.0,
				max: 10.0,
				stp: 0.05,
				grp: "reflect"
				// exp: "How much wave motion affects reflections"
			}
		};

		// this.smoother = new ParamAnimator(this);

		this.wrap = this.divIt(
			document.body,
			["params", ...(this.expanded ? ["exp"] : [])]
		)

		this.gear = this.divIt(
			this.wrap,
			"gear"
		);
		this.pwrp = this.divIt(
			this.wrap,
			"pwrp"
		);
		this.switch = this.divIt(
			this.pwrp,
			"switch"
		);
		this.preset = this.divIt(
			this.pwrp,
			"preset"
		);

		let preprev = this.divIt(
			this.preset,
			"preprev",
			"<"
		);

		preprev.addEventListener(
			"click",
			() =>
				this.presetChange(-1)
		);

		this.prename = this.divIt(
			this.preset,
			"prename",
			"default"
		);

		let prenext = this.divIt(
			this.preset,
			"prenext",
			">"
		);

		prenext.addEventListener(
			"click",
			() =>
				this.presetChange(1)
		);

		this.btns = {

			// LINE 1

			close: {
				nnm: "about",
				wht: "cmd",
				cbk: () =>
					this.liquidCode()
			},
			toggle: {
				nnm: "flow",
				wht: "swp",
				cbk: () =>
					this.liquid.toggleRenderLoop(),
				stt: true
			},
			reset: {
				nnm: "reset",
				wht: "cmd",
				cbk: () =>
					this.liquid.resetWaterState()
			},

			// LINE 2

			upscl: {
				nnm: "upscl",
				wht: "cmd",
				cbk: () =>
					this.liquid.upScale()
			},

			full: {
				nnm: "full",
				wht: "cmd",
				cbk: () =>
					this.toggleFull()
			},

			share: {
				nnm: "share",
				wht: "cmd",
				cbk: () =>
					this.shareParams()
			},

			// LINE 3

			bckgd: {
				nnm: "image",
				wht: "cmd",
				cbk: () =>
					this.browseBack()
			},

			what: {
				nnm: "    ",
				wht: "cmd",
				cbk: () => {}
			},

			well: {
				nnm: "    ",
				wht: "cmd",
				cbk: () => {}
			},

			// LINE 4

			auto: {
				nnm: "point",
				wht: "swp",
				cbk: () =>
					this.liquid.toggleAutoTouch()
			},
			rain: {
				nnm: "rain",
				wht: "swp",
				cbk: () =>
					this.liquid.toggleRain()
			},
			swirl: {
				nnm: "swirl",
				wht: "cmd",
				cbk: () => {

					this.toggleParams();
					setTimeout(
						() =>
							this.liquid
							.createSwirls(),
						200
					);

				}
			}
			/*waves: {
				nnm: "waves"
				// 2+ points slowly moving sbs top to bottom or left right to form a single wave
			},*/
		};

		// moving pointers => prop name
		this.proppers = new Map();
		// pointer => prop start val
		this.propfrom = new Map();
		// pointers current x coord
		this.propoint = new Map();

		this.propVal = this.onPropVal.bind(this);
		this.propEnd = this.onPropEnd.bind(this);

		Object.keys(this.btns)
		.forEach(btn => {

			const wut = this.btns[btn];

			if(wut.wht === "cmd")
				this.addAction(wut);
			else if(wut.wht === "swp")
				this.addToggle(wut);
		
		});

		Object.keys(this.params)
		.forEach(flowing => {

			const liquifying = this.params[flowing];

			// sync init value with liquid instance
			liquifying.key = flowing;
			liquifying.val = this.liquid.params[flowing];

			this.addProp(liquifying);
		
		});

		this.gear.addEventListener(
			"click",
			() =>
				this.toggleParams()
		);
		this.wrap.addEventListener(
			"transitionend",
			() =>
				this.updateBounds()
		);
	
	}

	liquified() {

		// this.syncParams(this.liquid.params);

		this.updateSunLight();
		this.updateColors();
	
	}

	divIt(par, cls, inn = "") {

		cls = [cls].flat();

		let elm = document.createElement("div");

		elm.classList.add(...cls);

		if(inn)
			elm.innerHTML = inn;

		if(par)
			par.appendChild(elm);

		return elm;
		
	}

	liquidCode() {

		window.location = "https://post.nicopr.fr/liquid-code/";
	
	}

	toggleParams() {

		this.wrap.classList.toggle("pop");

		this.pop = this.wrap.classList.contains("pop");
	
	}

	presetChange(dir) {

		let prenames = Object.keys(presets);

		this.preidx = this.around(
			this.preidx + dir,
			0,
			prenames.length - 1
		);

		let prename = prenames[this.preidx];

		if(DEBUG)
			console.log(
				"preset",
				prename
			);

		this.prename.innerText = prename;

		const params = {
			...presets["default"],
			...presets[prename]
		};

		// animated preset swapping
		// broken
		// this.smoother.animate(params);

		// just load
		this.liquid.load(params);
		this.syncParams(params);
	
	}

	around(value, min, max) {

		return value < min ? max : value > max ? min : value;
	
	}

	syncParams(params) {

		Object.values(this.params)
		.forEach(entry => {

			entry.val = params[entry.key];
			entry.hnt.innerText = params[entry.key];

			this.updateProgressBar(entry);
		
		});

		this.updateSunLight();
		this.updateColors();
	
	}

	toggleFull() {

		if(document.fullscreenEnabled) {

			if(DEBUG)
				console.log("toggle fullscreen");

			if(document.fullscreenElement)
				document
				.exitFullscreen();
			else
				document.body
				.requestFullscreen();

		}
		else {

			if(DEBUG)
				console.error("fullscreen not available");

		}

	}

	shareParams() {

		if(DEBUG)
			console.log("export params");

		// unbearable float precision monkey patch
		
		const cleanNumber = n =>
			Number(n.toFixed(3));
		
		const cleanParams = {};

		Object.entries(this.params)
		.forEach(([key, entry]) => {

			if(Array.isArray(entry.val)) {

				cleanParams[key] = entry.val.map(cleanNumber);
			
			}
			else if(typeof entry.val === "number") {

				cleanParams[key] = cleanNumber(entry.val);
			
			}
			else {

				cleanParams[key] = entry.val;
			
			}
		
		});
	
		// output params object to console
		console.log(JSON.stringify(cleanParams));
		
		const dump = Object.entries(this.params)
		.map(([key, param]) => {

			const val = cleanParams[key];

			if(Array.isArray(val)) {

				return param.dmp + "=" + JSON.stringify(val);
			
			}
			return param.dmp + "=" + JSON.stringify(val);
		
		});
	
		const shareUrl = location.origin + location.pathname + "#" + dump.join("&");

		const shareData = {
			title: document.title,
			// text: "",
			url: shareUrl
		};

		if(navigator.share && navigator.canShare(shareData)) {

			navigator
			.share(shareData)
			.then(() => {

				if(DEBUG)
					console.log("shared");
				
			})
			.catch(err => {

				console.error(err);

				this.copyParams(shareUrl);

			});

		}
		else {

			this.copyParams(shareUrl);

		}

	}

	copyParams(shareUrl) {

		navigator.clipboard
		.writeText(shareUrl)
		.then(() => {

			if(DEBUG)
				console.log("copied");
		
		})
		.catch(err => {

			throw err;
		
		});

	}

	hashParams() {

		const hash = window.location.hash.slice(1);

		if(!hash.length)
			return {};

		if(DEBUG)
			console.log("load hash");

		try {

			const params = {};

			// uh ? no brain
			const dmpToParam = Object.fromEntries(Object.entries(this.params)
			.map(([key, param]) =>
				[param.dmp, key]));

			hash.split("&")
			.map(keyVal =>
				keyVal.split("="))
			.forEach(([dmp, val]) => {

				const paramKey = dmpToParam[dmp];

				if(!paramKey)
					return;

				const param = this.params[paramKey];
				const value = JSON.parse(val);
					
				param.val = value;
					
				if(param.hnt) {

					const places = String(param.stp)
					.split(".")[1]?.length || 0;

					param.hnt.innerText = value.toFixed(places);
				
				}
				if(param.bar) {

					this.updateProgressBar(param);
				
				}

				if(param.mod) {

					param.mod(value);
				
				}
				else {

					params[paramKey] = value;
				
				}
			
			});

			this.prename.innerText = "custom";

			return params;

		}
		catch(err) {

			this.liquid.renderText("bad url");
			console.error(err);
			return {};
		
		}
	
	}

	browseBack() {

		if(DEBUG) 
			console.log("browse custom img");

		const fileInput = document.createElement("input");

		fileInput.type = "file";
		fileInput.accept = [".jpg", ".png", ".webp"];
		fileInput.style.display = "none";

		fileInput.addEventListener(
			"change",
			evt => {

				if(DEBUG) 
					console.log("load custom img");

				const newBack = URL.createObjectURL(evt.target.files[0]);

				fileInput.remove();

				this.liquid.load({
					img: newBack
				})
				.then(
					() => {

						if(DEBUG) console.log("revoke blob");

						URL.revokeObjectURL(newBack);
					}
				);
			
			}
		);

		fileInput.addEventListener(
			"cancel",
			() => {
			
				if(DEBUG)
					console.log("browse canceled");

				fileInput.remove();
			
			}
		);

		fileInput.click();

	}

	addToggle(toggle) {

		let toggleWrap = this.divIt(
			this.switch,
			[
				"toggle", toggle.nnm.replaceAll(
					" ",
					"-"
				),
				...(toggle.stt ? ["toggle"] : [])
			],
			toggle.nnm
		);

		toggleWrap.addEventListener(
			"click",
			() =>

				toggle.cbk()
		);
	
	}

	toggle(nnm, on = true) {

		this.pwrp.querySelector("." + nnm).classList.toggle(
			"toggled",
			on
		);
	
	}

	addAction(action) {

		let actionWrap = this.divIt(
			this.switch,
			[
				"action",
				action.nnm.replaceAll(
					" ",
					"-"
				)
			],
			action.nnm
		);
		
		// css feedback hack
		actionWrap.tabIndex = 0;

		actionWrap.addEventListener(
			"click",
			() => {

				// evt.preventDefault();

				action.cbk();

				// if(res)
				actionWrap.focus();
				// else actionEl.classList.remove("toggled");
		
			}
		);
	
	}

	addGroup(nnm) {

		// if(DEBUG) console.log("add group", nnm);

		let propGroup = this.divIt(
			this.pwrp,
			["group", nnm.toLowerCase()
			.replaceAll(
				" ",
				"-"
			), ...(this.expanded ? ["exp"] : [])]
		);

		let groupHead = this.divIt(
			propGroup,
			"grp",
			nnm
		);

		let groupWrp = this.divIt(
			propGroup,
			"wrp"
		);

		this.divIt(
			groupWrp,
			"cnt"
		);

		if(!this.expanded)
			groupHead.addEventListener(
				"click",
				() =>
					this.toggleGroup(propGroup)
			);

		return propGroup;
	
	}

	toggleGroup(togroup) {

		Array.from(this.pwrp.querySelectorAll(".group"))
		.forEach(grp =>
			grp.classList
			.toggle(
				"exp",
				grp === togroup
				&& !grp.classList.contains("exp")
			));
	
	}

	addProp(prop) {

		let propWrap = this.divIt(
			null,
			"prop"
		);

		propWrap.dataset.prop = prop.key;

		prop.bar = this.divIt(
			propWrap,
			"vbar"
		);

		// sync later
		// this.updateProgressBar(prop);

		propWrap.addEventListener(
			"pointerdown",
			evt =>
				this.onPropDown(evt)
		);

		let propEl = this.divIt(
			propWrap,
			"valt",
			prop.nnm
		);

		prop.hnt = this.divIt(
			propWrap,
			"val",
			prop.val
		);

		if(prop.grp) {

			let groupName = prop.grp.toLowerCase()
			.replaceAll(
				" ",
				"-"
			);

			let getGroup = this.pwrp.querySelector("." + groupName);

			if(!getGroup) {

				getGroup = this.addGroup(prop.grp);
			
			}

			getGroup.querySelector(".cnt")
			.appendChild(propWrap);
		
		}
		else {

			this.pwrp.appendChild(propWrap);
		
		}
	
	}

	onPropDown(evt) {

		// evt.preventDefault();
		
		let pId = evt.pointerId;

		if(this.proppers.has(pId))
			return;
	
		let propWrap = evt.currentTarget;
		const prop = this.params[propWrap.dataset.prop];
	
		this.proppers.set(
			pId,
			prop.nnm
		);
		this.propfrom.set(
			pId,
			prop.val
		);
		this.propoint.set(
			pId,
			evt.pageX
		);
	
		propWrap.classList.add("down");
		propWrap.setPointerCapture(pId);
	
		propWrap.addEventListener(
			"pointermove",
			this.propVal
		);
		propWrap.addEventListener(
			"pointerup",
			this.propEnd
		);
		propWrap.addEventListener(
			"pointercancel",
			this.propEnd
		);
	
	}

	onPropVal(evt) {

		// evt.preventDefault();
	
		const pId = evt.pointerId;

		if(!this.proppers.has(pId))
			return;

		// dirty
	
		const propWrap = evt.currentTarget;
		const prop = this.params[propWrap.dataset.prop];
		
		const propRange = prop.max - prop.min;
		const movement = (evt.pageX - this.propoint.get(pId)) / 256;
		const valueChange = movement * propRange;
		
		let newValue = this.propfrom.get(pId) + valueChange;

		newValue = Math.max(
			prop.min,
			Math.min(
				prop.max,
				newValue
			)
		);
		newValue = this.roundToStep(
			newValue,
			prop.stp
		);
	
		if(newValue === prop.val)
			return;
	
		prop.val = newValue;
	
		const decimals = String(prop.stp)
		.match(/\.(\d+)$/);
		const places = decimals ? decimals[1].length : 0;

		prop.hnt.innerHTML = prop.val.toFixed(places);
	
		this.updateProgressBar(prop);
	
		if(prop.rst) {

			if(DEBUG) console.log("prop reset")

			this.liquid.resetWaterState();

			this.liquid.syncUniforms();
		
		}
	
		if(prop.mod) {

			prop.mod(prop.val);
		
		}
		else {

			this.liquid.params[prop.key] = prop.val;
		
		}
	
	}

	onPropEnd(evt) {

		// evt.preventDefault();
	
		let pId = evt.pointerId;

		if(!this.proppers.has(pId))
			return;
	
		let propWrap = evt.currentTarget;
		
		propWrap.classList.remove("down");
		propWrap.removeEventListener(
			"pointermove",
			this.propVal
		);
		propWrap.removeEventListener(
			"pointerup",
			this.propEnd
		);
		propWrap.removeEventListener(
			"pointercancel",
			this.propEnd
		);
	
		propWrap.releasePointerCapture(pId);
	
		this.proppers.delete(pId);
		this.propoint.delete(pId);
		this.propfrom.delete(pId);
	
	}

	roundToStep(value, step) {
		
		return Math.round((value + Number.EPSILON) / step) * step;
	
	}

	updateProgressBar(prop) {

		const pc = ((prop.val - prop.min) / (prop.max - prop.min)) * 100;

		prop.bar.style.width = pc + "%";
	
	}

	hueToRGB(hue) {

		hue = hue % 1;
		if(hue < 0)
			hue += 1;

		const h = hue * 6;
		const i = Math.floor(h);
		const f = h - i;
		const p = 0; // no saturation
		const q = 1 * (1 - f);
		const t = 1 * f;

		let r, g, b;

		switch (i % 6) {

			case 0: r = 1; g = t; b = p; break;
			case 1: r = q; g = 1; b = p; break;
			case 2: r = p; g = 1; b = t; break;
			case 3: r = p; g = q; b = 1; break;
			case 4: r = t; g = p; b = 1; break;
			case 5: r = 1; g = p; b = q; break;
			default: r = 0; g = 0; b = 0; // fallback
		
		}

		return [r, g, b];
	
	}

	degToRad(deg) {

		return deg * Math.PI / 180;
	
	}

	sphericalToCartesian(angleDeg, heightDeg) {

		const theta = this.degToRad(angleDeg);
		const phi = this.degToRad(90 - heightDeg);
	
		const sinPhi = Math.sin(phi);
		const x = sinPhi * Math.cos(theta);
		const y = sinPhi * Math.sin(theta);
		const z = Math.cos(phi);
	
		const len = Math.sqrt(x * x + y * y + z * z);

		return [
			x / len,
			y / len,
			z / len
		];
	
	}

	updateSunLight() {
		
		this.liquid.params.sunDirection = this.sphericalToCartesian(
			this.params.sunAngle.val,
			this.params.sunHeight.val
		);
		
		this.liquid.params.lightDirection = this.sphericalToCartesian(
			this.params.lightAngle.val,
			this.params.lightHeight.val
		);
	
	}

	updateColors() {

		this.liquid.params.waterTint = this.hueToRGB(this.params.waterHue.val);
		this.liquid.params.skyColor = this.hueToRGB(this.params.skyHue.val);
	
	}

	updateBounds() {

		const bnds = this.pwrp.getBoundingClientRect();

		this.bnd = {
			x: Math.round(bnds.x),
			y: Math.round(bnds.y),
			w: Math.round(bnds.width),
			h: Math.round(bnds.height)
		};
	
	}

	mask(ify) {

		this.wrap.classList.toggle(
			"msk",
			ify
		);
	
	}

}

class ParamAnimator {

	constructor(ctrl) {

		this.ctrl = ctrl;
		this.animations = new Map();
		this.isAnimating = false;
		this.rafId = 0;
		this.lastFrame = 0;
		this.duration = 1500;
		this.fps = 60;
		this.frameTime = 1000 / this.fps;
	
	}

	easeInOutCubic(t) {

		return t < 0.5
			? 4 * t * t * t
			: 1 - Math.pow(
				-2 * t + 2,
				3
			) / 2;
	
	}

	roundDec(value, decimals) {

		let pows = Math
		.pow(
			10,
			decimals
		);

		return Math
		.round(value
			* pows)
		/ pows;

	}

	roundToStep(value, step) {

		if(!step)
			return value;

		const EPSILON = 1e-10;

		return Math.round((value + EPSILON) / step) * step;
	
	}

	animate(targetPreset) {

		if(this.isAnimating) {

			this.isAnimating = false;
			this.animations.clear();
			cancelAnimationFrame(this.rafId);
		
		}

		Object.entries(targetPreset)
		.forEach(([key, target]) => {

			const control = this.ctrl.params[key];

			if(!control)
				return;

			const current = control.val;

			if(current === target)
				return;

			if(Array.isArray(target)) {

				this.animations.set(
					key,
					{
						start: [...(Array.isArray(current) ? current : Array(target.length)
						.fill(0))],
						end: [...target],
						elapsed: 0,
						control
					}
				);
			
			}
			else {

				this.animations.set(
					key,
					{
						start: Number(current) || 0,
						end: target,
						step: control.stp || 0.001,
						elapsed: 0,
						control
					}
				);
			
			}
		
		});

		if(this.animations.size > 0 && !this.isAnimating) {

			this.isAnimating = true;
			this.lastFrame = performance.now();
			this.rafId = requestAnimationFrame(() =>
				this.animationLoop());
		
		}
	
	}

	animationLoop() {

		const now = performance.now();
		const delta = now - this.lastFrame;

		if(delta >= this.frameTime) {

			this.lastFrame = now - (delta % this.frameTime);
			let allComplete = true;

			for(const [key, anim] of this.animations) {

				anim.elapsed += delta;
				let progress = Math.min(
					anim.elapsed / this.duration,
					1
				);
				const ease = this.easeInOutCubic(progress);

				if(Array.isArray(anim.start)) {

					const newValues = anim.start.map((start, i) => {

						const end = anim.end[i];

						return start + (end - start) * ease;
					
					});

					anim.control.val = newValues;
					if(anim.control.mod) {

						anim.control.mod(newValues);
					
					}
					else {

						this.ctrl.liquid.params[key] = newValues;
					
					}
				
				}
				else {

					const range = anim.end - anim.start;
					const current = anim.start + range * ease;
					const value = this.roundToStep(
						current,
						anim.step
					);
					
					anim.control.val = value;
					if(anim.control.hnt) {

						const places = String(anim.step)
						.split(".")[1]?.length || 0;

						anim.control.hnt.innerText = value.toFixed(places);
					
					}
					if(anim.control.bar) {

						const pc = ((value - anim.control.min)
							/ (anim.control.max - anim.control.min)) * 100;

						anim.control.bar.style.width = pc + "%";
					
					}

					if(anim.control.mod) {

						anim.control.mod(value);
					
					}
					else {

						this.ctrl.liquid.params[key] = value;
					
					}
				
				}

				if(progress < 1)
					allComplete = false;
			
			}

			if(allComplete) {

				this.isAnimating = false;
				this.animations.clear();
				return;
			
			}
		
		}

		requestAnimationFrame(() =>
			this.animationLoop());
	
	}

}