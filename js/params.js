class Params {

	constructor(liquid) {

		this.liquid = liquid;

		this.pop = false;

		this.expanded = false;

		this.preidx = 0;

		this.bnd = { x: 0, y: 0, w: 0, h: 0 };

		this.params = {
			waveSpeed: {
				nnm: "wave speed",
				dmp: "wsp",
				val: 0.997,
				min: 0.95,
				max: 0.999,
				stp: 0.001,
				grp: "global",
				exp: "Controls how quickly waves propagate. Higher values = faster waves",
			},
			damping: {
				nnm: "damping",
				dmp: "dmp",
				val: 0.994,
				min: 0.9,
				max: 0.999,
				stp: 0.001,
				grp: "global",
				exp: "How quickly waves lose energy. Higher values = waves persist longer",
			},
			propagationSpeed: {
				nnm: "propagation",
				dmp: "pgs",
				val: 12,
				min: 2,
				max: 16,
				stp: 2,
				rst: true,
				grp: "global",
				exp: "Distance waves travel per frame. Higher = faster spread",
			},

			refraction: {
				nnm: "refraction",
				dmp: "rft",
				val: 0.8,
				min: 0.0,
				max: 5.0,
				stp: 0.01,
				grp: "visual",
				exp: "Light bending through water. Higher values = more distortion",
			},
			waterHue: {
				nnm: "water hue",
				dmp: "wth",
				val: 0.58,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "visual",
				exp: "Base color of water (0-1 maps to color wheel)",
				cbk: val => {

					this.liquid.params.waterTint = this.hueToRGB(val);
				
				},
			},
			tintStrength: {
				nnm: "tint",
				dmp: "tnt",
				val: 0.02,
				min: 0.0,
				max: 0.3,
				stp: 0.005,
				grp: "visual",
				exp: "Intensity of water coloration",
			},
			specularStrength: {
				nnm: "specular strength",
				dmp: "sps",
				val: 0.56,
				min: 0.0,
				max: 5.0,
				stp: 0.01,
				grp: "visual",
				exp: "Intensity of light reflections on water surface",
			},
			roughness: {
				nnm: "roughness",
				dmp: "rgs",
				val: 0.16,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "visual",
				exp: "Surface texture. Higher = more diffuse reflections",
			},

			fresnelEffect: {
				nnm: "effect",
				dmp: "fre",
				val: 0.8,
				min: 0.0,
				max: 30.0,
				stp: 0.1,
				grp: "fresnel",
				exp: "Edge brightness. Higher = stronger edge highlights",
			},
			fresnelPower: {
				nnm: "power",
				dmp: "frp",
				val: 2.6,
				min: 0.1,
				max: 1.0,
				stp: 0.005,
				grp: "fresnel",
				exp: "Sharpness of edge effect. Higher = more concentrated",
			},
			reflectionFresnel: {
				nnm: "reflection",
				dmp: "frr",
				val: 1.0,
				min: 0.0,
				max: 5.0,
				stp: 0.05,
				grp: "fresnel",
				exp: "Strength of angle-based reflections",
			},
			reflectionBlur: {
				nnm: "blur",
				dmp: "blr",
				val: 0.0,
				min: 0.0,
				max: 5.0,
				stp: 0.01,
				grp: "fresnel",
				exp: "Softness of reflections",
			},
			reflectionDistortion: {
				nnm: "distortion",
				dmp: "dst",
				val: 0.3,
				min: 0.0,
				max: 30.0,
				stp: 0.1,
				grp: "fresnel",
				exp: "Wave-based reflection warping",
			},

			skyHue: {
				nnm: "sky hue",
				dmp: "skh",
				val: 0.62,
				min: 0.0,
				max: 3.0,
				stp: 0.01,
				grp: "world",
				exp: "Color of environmental reflection (0-1 maps to color wheel)",
				cbk: val => {

					this.liquid.params.skyColor = this.hueToRGB(val);
				
				},
			},
			depthFactor: {
				nnm: "depth",
				dmp: "dpt",
				val: 4,
				min: 0.0,
				max: 10.0,
				stp: 0.01,
				grp: "world",
				exp: "Simulated water depth effect",
			},
			atmosphericScatter: {
				nnm: "scatter",
				dmp: "sct",
				val: 0.72,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "world",
				exp: "Atmospheric light scattering in water",
			},
			envMapIntensity: {
				nnm: "environment",
				dmp: "env",
				val: 0.5,
				min: 0.0,
				max: 5.0,
				stp: 0.01,
				grp: "world",
				exp: "Strength of environmental reflections",
			},

			touchRadius: {
				nnm: "radius",
				dmp: "trd",
				val: 0.017,
				min: 0.005,
				max: 0.1,
				stp: 0.001,
				grp: "touch",
				exp: "Size of interaction area",
			},
			initialImpact: {
				nnm: "impact",
				dmp: "tmp",
				val: 0.0,
				min: 0.01,
				max: 2.0,
				stp: 0.01,
				grp: "touch",
				exp: "Initial strength of touch disturbance",
			},
			trailStrength: {
				nnm: "trail",
				dmp: "ttr",
				val: 0.0,
				min: 0.0,
				max: 5.0,
				stp: 0.05,
				grp: "touch",
				exp: "Strength of continuous touch effect",
			},
			trailSpread: {
				nnm: "spread",
				dmp: "tsp",
				val: 3.2,
				min: 0.0,
				max: 5.0,
				stp: 0.05,
				grp: "touch",
				exp: "How widely touch effect spreads",
			},

			causticStrength: {
				nnm: "strength",
				dmp: "css",
				val: 0.25,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "caustic",
				exp: "Intensity of underwater light patterns",
			},
			causticScale: {
				nnm: "scale",
				dmp: "csc",
				val: 1.0,
				min: 0.5,
				max: 3.0,
				stp: 0.1,
				grp: "caustic",
				exp: "Size of caustic patterns",
			},
			causticSpeed: {
				nnm: "speed",
				dmp: "csp",
				val: 0.15,
				min: 0.0,
				max: 2.0,
				stp: 0.01,
				grp: "caustic",
				exp: "Animation speed of caustics",
			},
			causticBrightness: {
				nnm: "brightness",
				dmp: "csb",
				val: 0.5,
				min: 0.0,
				max: 2.0,
				stp: 0.01,
				grp: "caustic",
				exp: "Overall brightness of caustic effects",
			},
			causticDetail: {
				nnm: "detail",
				dmp: "csd",
				val: 2.0,
				min: 0.0,
				max: 5.0,
				stp: 0.05,
				grp: "caustic",
				exp: "Complexity of caustic patterns",
			},

			sunIntensity: {
				nnm: "sun",
				dmp: "sun",
				val: 0.3,
				min: 0.0,
				max: 50.0,
				stp: 0.1,
				grp: "sunlight",
				exp: "Primary light source intensity",
			},
			sunTheta: {
				nnm: "sun angle",
				dmp: "sth",
				val: 0.1,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "sunlight",
				exp: "Horizontal angle of sun (0-1 = 0-360°)",
				cbk: () => {

					this.liquid.params.sunDirection = this.updateLight(
						this.params.sunTheta,
						this.params.sunPhi
					);
				
				},
			},
			sunPhi: {
				nnm: "sun height",
				dmp: "sph",
				val: 0.35,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "sunlight",
				exp: "Vertical angle of sun (0 = up, 1 = down)",
				cbk: () => {

					this.liquid.params.sunDirection = this.updateLight(
						this.params.sunTheta,
						this.params.sunPhi
					);
				
				},
			},
			secondaryIntensity: {
				nnm: "light",
				dmp: "lht",
				val: 0.16,
				min: 0.0,
				max: 50.0,
				stp: 0.1,
				grp: "sunlight",
				exp: "Secondary light source intensity",
			},
			secondarySunTheta: {
				nnm: "light angle",
				dmp: "lth",
				val: 0.65,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "sunlight",
				exp: "Horizontal angle of secondary light",
				cbk: () => {

					this.liquid.params.secondarySunDirection = this.updateLight(
						this.params.secondarySunTheta,
						this.params.secondarySunPhi
					);
				
				},
			},
			secondarySunPhi: {
				nnm: "light height",
				dmp: "lph",
				val: 0.3,
				min: 0.0,
				max: 1.0,
				stp: 0.01,
				grp: "sunlight",
				exp: "Vertical angle of secondary light",
				cbk: () => {

					this.liquid.params.secondarySunDirection = this.updateLight(
						this.params.secondarySunTheta,
						this.params.secondarySunPhi
					);
				
				},
			},

			waveReflectionStrength: {
				nnm: "waves",
				dmp: "rfs",
				val: 0.5,
				min: 0.0,
				max: 5.0,
				stp: 0.01,
				grp: "reflect",
				exp: "Strength of wave-based reflections",
			},
			mirrorReflectionStrength: {
				nnm: "mirror",
				dmp: "rfm",
				val: 0.16,
				min: 0.0,
				max: 15.0,
				stp: 0.05,
				grp: "reflect",
				exp: "Strength of mirror-like reflections",
			},
			velocityReflectionFactor: {
				nnm: "velocity",
				dmp: "rfv",
				val: 0.05,
				min: 0.0,
				max: 10.0,
				stp: 0.05,
				grp: "reflect",
				exp: "How much wave motion affects reflections",
			},
		};

		this.wrap = document.createElement("div");
		this.wrap.classList.add("params");
		if(this.expanded)
			this.wrap.classList.add("exp");
		document.body.appendChild(this.wrap);

		this.gear = document.createElement("div");
		this.gear.classList.add("gear");
		this.wrap.appendChild(this.gear);

		this.pwrp = document.createElement("div");
		this.pwrp.classList.add("pwrp");
		this.wrap.appendChild(this.pwrp);

		this.switch = document.createElement("div");
		this.switch.classList.add("switch");
		this.pwrp.appendChild(this.switch);

		this.preset = document.createElement("div");
		this.preset.classList.add("preset");
		this.pwrp.appendChild(this.preset);

		let preprev = document.createElement("div");

		preprev.classList.add("preprev");
		preprev.innerText = "<";
		this.preset.appendChild(preprev);
		preprev.addEventListener("click",
			() =>
				this.presetChange(-1));

		this.prename = document.createElement("div");
		this.prename.classList.add("prename");
		this.prename.innerText = "default";
		this.preset.appendChild(this.prename);

		let prenext = document.createElement("div");

		prenext.classList.add("prenext");
		prenext.innerHTML = ">";
		this.preset.appendChild(prenext);
		prenext.addEventListener("click",
			() =>
				this.presetChange(1));

		this.btns = {
			close: {
				nnm: "about",
				wht: "cmd",
				cbk: () =>
					this.liquidCode(),
			},
			toggle: {
				nnm: "flow",
				wht: "swp",
				cbk: () =>
					this.liquid.toggleRenderLoop(),
				stt: true,
			},
			reset: {
				nnm: "reset",
				wht: "cmd",
				cbk: () => 
					this.liquid.resetWaterState(),
			},

			upscl: {
				nnm: "upscl",
				wht: "cmd",
				cbk: () =>
					this.liquid.upScale(),
			},

			copy: {
				nnm: "copy",
				wht: "cmd",
				cbk: () =>
					this.copyParams(),
			},

			abcde: {
				nnm: "&nbsp;".repeat(5),
				wht: "cmd",
				cbk: () => {},
			},

			auto: {
				nnm: "point",
				wht: "swp",
				cbk: () =>
					this.liquid.toggleAutoTouch(),
			},
			rain: {
				nnm: "rain",
				wht: "swp",
				cbk: () =>
					this.liquid.toggleRain(),
			},
			swirl: {
				nnm: "swirl",
				wht: "cmd",
				cbk: () => {

					this.toggleParams();
					setTimeout(
						() => this.liquid
							.createSwirls(), 
						200
					);

				},
			},
			/*waves: {
				nnm: "waves"
				// 2+ points slowly moving sbs top to bottom or left right to form a single wave
			},*/
		};

		// moving pointers => prop name
		this.proppers = new Map();
		// pointers current x coord
		this.propoint = new Map();
		// props params
		this.props = new Map();

		this.propVal = this.onPropVal.bind(this);
		this.propEnd = this.onPropEnd.bind(this);

		this.propEvents = {
			"pointermove": this.propVal,
			"pointerup": this.propEnd,
			"pointerleave": this.propEnd,
		};

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
			liquifying.val = this.liquid.params[flowing] || liquifying.val;
			liquifying.cbk = val =>
				this.setProp(flowing,
					val);

			this.addProp(liquifying);
		
		});

		// this.eventProp(true);

		this.gear.addEventListener("click",
			() =>
				this.toggleParams());
		this.wrap.addEventListener("transitionend",
			() =>
				this.updateBounds());
	
	}

	liquified() {

		this.gear.addEventListener(
			"transitionend",
			() => {
				// console.log("done");
			},
			{
				once: true,
			}
		);

		this.gear.classList.add("up");
	
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

		this.preidx = this.around(this.preidx + dir,
			0,
			prenames.length - 1);

		let prename = prenames[this.preidx];

		if(DEBUG)
			console.log("preset",
				prename);

		this.prename.innerText = prename;

		let params = presets[prename];

		this.syncParams(params);

		this.liquid.load(params);
	
	}

	around(value, min, max) {

		return value < min ? max : value > max ? min : value;
	
	}

	syncParams(params) {

		Array.from(this.props.values())
		.forEach(propEntry => {

			if(Object.hasOwn(params,
				propEntry.key)) {

				propEntry.val = params[propEntry.key];
				propEntry.hnt.innerText = params[propEntry.key];
			
			}
		
		});

		if(params.sunTheta && params.sunPhi)
			params.sunDirection = this.updateLight(
				params.sunTheta,
				params.sunPhi
			);

		if(params.secondarySunTheta && params.secondarySunPhi)
			params.secondarySunDirection = this.updateLight(
				params.secondarySunTheta,
				params.secondarySunPhi
			);
	
	}

	copyParams() {

		if(DEBUG)
			console.log("copy params");

		const dump = Object.entries(this.liquid.params)
		.map(([param, value]) => {

			if(Object.hasOwn(this.params,
				param)) {

				if(
					param === "sunDirection"
						|| param === "secondarySunDirection"
				) {

					return null;
				
				}
				if(value instanceof Float32Array) {

					return (
						this.params[param].dmp
							+ "="
							+ JSON.stringify(Array.from(value))
					);
				
				}
				return this.params[param].dmp + "=" + JSON.stringify(value);
			
			}
			return null;
		
		})
		.filter(Boolean);

		if(this.params.sunTheta && this.params.sunPhi) {

			dump.push(`sth=${this.params.sunTheta.val}`);
			dump.push(`sph=${this.params.sunPhi.val}`);
		
		}
		if(this.params.secondarySunTheta && this.params.secondarySunPhi) {

			dump.push(`lth=${this.params.secondarySunTheta.val}`);
			dump.push(`lph=${this.params.secondarySunPhi.val}`);
		
		}

		const copyUrl
			= location.origin + location.pathname + "#" + dump.join("&");

		navigator.clipboard
		.writeText(copyUrl)
		.then(() => {

			if(DEBUG)
				console.log("paste & share");
		
		})
		.catch(err => {

			console.error(err);
		
		});
	
	}

	hashParams() {

		const hsh = window.location.hash.slice(1);

		if(hsh.length) {

			if(DEBUG)
				console.log("load hash");

			try {

				const params = {};
				const angleParams = {};

				hsh.split("&")
				.map(keyVal =>
					keyVal.split("="))
				.forEach(([dmp, val]) => {

					const paramName = Object.keys(this.params)
					.find(
						param =>
							this.params[param].dmp === dmp
					);

					if(paramName) {

						const parsedVal = JSON.parse(val);

						if(Array.isArray(parsedVal)) {

							params[paramName] = new Float32Array(parsedVal);
						
						}
						else {

							params[paramName] = parsedVal;
						
						}

						if(dmp === "sth")
							angleParams.sunTheta = parsedVal;
						if(dmp === "sph")
							angleParams.sunPhi = parsedVal;
						if(dmp === "lth")
							angleParams.secondarySunTheta = parsedVal;
						if(dmp === "lph")
							angleParams.secondarySunPhi = parsedVal;
					
					}
				
				});

				if(
					angleParams.sunTheta !== undefined
					&& angleParams.sunPhi !== undefined
				) {

					params.sunDirection = this.updateLight(
						angleParams.sunTheta,
						angleParams.sunPhi
					);
				
				}

				if(
					angleParams.secondarySunTheta !== undefined
					&& angleParams.secondarySunPhi !== undefined
				) {

					params.secondarySunDirection = this.updateLight(
						angleParams.secondarySunTheta,
						angleParams.secondarySunPhi
					);
				
				}

				this.prename.innerText = "custom";

				// window.location.hash = "";

				this.syncParams(params);

				return params;
			
			}
			catch (err) {

				console.log("parse params error");
				console.error(err);
			
			}
		
		}

		return {};
	
	}

	addToggle(toggle) {

		let toggleWrap = document.createElement("span");

		toggleWrap.classList.add("toggle",
			toggle.nnm.replaceAll(" ",
				"-"));

		if(toggle.stt)
			toggleWrap.classList.add("toggled");

		toggleWrap.innerHTML = toggle.nnm;

		this.switch.appendChild(toggleWrap);

		toggleWrap.addEventListener("click",
			evt => {

				// evt.preventDefault();

				toggle.cbk();
		
			});
	
	}

	toggle(nnm, on = true) {

		this.pwrp.querySelector("." + nnm).classList.toggle("toggled",
			on);
	
	}

	addAction(action) {

		let actionWrap = document.createElement("span");

		// css feedback hack
		actionWrap.tabIndex = 0;

		actionWrap.classList.add("action",
			action.nnm.replaceAll(" ",
				"-"));

		actionWrap.innerHTML = action.nnm;

		this.switch.appendChild(actionWrap);

		actionWrap.addEventListener("click",
			() => {

				// evt.preventDefault();

				action.cbk();

				// if(res)
				actionWrap.focus();
				// else actionEl.classList.remove("toggled");
		
			});
	
	}

	addGroup(nnm) {

		// if(DEBUG) console.log("add group", nnm);

		let propGroup = document.createElement("div");

		propGroup.classList.add(
			"group",
			nnm.toLowerCase()
			.replaceAll(" ",
				"-")
		);

		if(this.expanded)
			propGroup.classList.add("exp");

		this.pwrp.appendChild(propGroup);

		let groupHead = document.createElement("div");

		groupHead.classList.add("grp");

		groupHead.innerHTML = nnm;

		propGroup.appendChild(groupHead);

		let groupWrp = document.createElement("div");

		groupWrp.classList.add("wrp");

		propGroup.appendChild(groupWrp);

		let groupCnt = document.createElement("div");

		groupCnt.classList.add("cnt");

		groupWrp.appendChild(groupCnt);

		if(!this.expanded)
			groupHead.addEventListener("click",
				() =>
					this.toggleGroup(propGroup)
			);

		return propGroup;
	
	}

	toggleGroup(togroup) {

		if(togroup.classList.contains("exp")) {

			togroup.classList.remove("exp");
			return;
		
		}

		Array.from(this.pwrp.querySelectorAll(".group"))
		.forEach(grp =>
			grp.classList.toggle("exp",
				grp === togroup)
		);
	
	}

	addProp(prop) {

		// if(DEBUG) console.log("prop", prop.nnm, prop);

		let propWrap = document.createElement("div");

		propWrap.classList.add("prop",
			prop.nnm.replaceAll(" ",
				"-"));

		propWrap.addEventListener("pointerdown",
			evt => {

				evt.preventDefault();

				let pointId = evt.pointerId;

				if(this.proppers.has(pointId)) {

					// prop busy

					return;
			
				}

				Object.keys(this.propEvents)
				.forEach(propEvent => {

					propWrap.addEventListener(
						propEvent,
						this.propEvents[propEvent]
					);
			
				});

				propWrap.setPointerCapture(pointId);

				this.proppers.set(pointId,
					prop.nnm);

				this.propoint.set(pointId,
					evt.pageX);

				// if(DEBUG) console.log("down", this.proPointers.get(pointId));

				propWrap.classList.add("down");
		
			});

		let propEl = document.createElement("div");

		propEl.classList.add("valt");

		propEl.innerHTML = prop.nnm;

		propWrap.appendChild(propEl);

		let propVal = document.createElement("div");

		propVal.classList.add("val");

		propVal.innerHTML = prop.val;

		propWrap.appendChild(propVal);

		prop.hnt = propVal;

		if(prop.grp) {

			let groupName = prop.grp.toLowerCase()
			.replaceAll(" ",
				"-");

			let getGroup = this.pwrp.querySelector("." + groupName);

			if(!getGroup)
				getGroup = this.addGroup(prop.grp);

			getGroup.querySelector(".cnt")
			.appendChild(propWrap);
		
		}
		else
			this.pwrp.appendChild(propWrap);

		this.props.set(prop.nnm,
			prop);
	
	}

	eventProp(addEvt) {

		Object.keys(this.propEvents)
		.forEach(propEvent => {

			addEvt
				? document.body.addEventListener(
					propEvent,
					this.propEvents[propEvent]
				  )
				: document.body.removeEventListener(
					propEvent,
					this.propEvents[propEvent]
				  );
		
		});
	
	}

	onPropVal(evt) {

		evt.preventDefault();

		let pointId = evt.pointerId;

		if(this.proppers.has(pointId)) {

			let propx = evt.pageX,
				propd = Math.round((propx - this.propoint.get(pointId)) / 3);

			if(propd != 0) {

				let propName = this.proppers.get(pointId);
				let prop = this.props.get(propName);

				// console.log(propd, prop.stp);

				prop.val = this.roundIt(
					Math.min(
						Math.max(prop.min,
							prop.val + propd * prop.stp),
						prop.max
					),
					prop.stp
				);

				this.propoint.set(pointId,
					evt.pageX);
				// propagation needs still water

				if(prop.rst) {

					this.liquid.resetWaterState();
					this.liquid.syncUniforms();
				
				}

				prop.cbk(prop.val);

				const decimals = String(prop.stp)
				.match(/\.(\d+)$/);
				const places = decimals ? decimals[1].length : 0;

				prop.hnt.innerHTML = prop.val.toFixed(places);
			
			}
		
		}
	
	}

	roundIt(val, stp) {

		const match = String(stp)
		.match(/\.(\d+)$/);
		const decimals = match ? match[1].length : 0;
		const multiplier = Math.pow(10,
			decimals);

		return Math.round(val * multiplier) / multiplier;
	
	}

	hueToRGB(hue) {

		// Convert hue (0-1) to RGB
		// Returns normalized RGB values as Float32Array
		const h = hue * 6;
		const i = Math.floor(h);
		const f = h - i;
		const p = 0; // No saturation variation - using fixed saturation
		const q = 1 * (1 - f);
		const t = 1 * f;

		let r, g, b;

		switch (i % 6) {

			case 0:
				(r = 1), (g = t), (b = p);
				break;
			case 1:
				(r = q), (g = 1), (b = p);
				break;
			case 2:
				(r = p), (g = 1), (b = t);
				break;
			case 3:
				(r = p), (g = q), (b = 1);
				break;
			case 4:
				(r = t), (g = p), (b = 1);
				break;
			case 5:
				(r = 1), (g = p), (b = q);
				break;
		
		}

		// Create a new Float32Array for shader uniform
		return new Float32Array([r, g, b]);
	
	}

	sphericalToCartesian(theta, phi) {

		// Convert spherical coordinates to cartesian (normalized direction vector)
		// theta: azimuth angle in radians (0 to 2π) - horizontal rotation
		// phi: polar angle in radians (0 to π) - vertical angle from up
		const x = Math.sin(phi) * Math.cos(theta);
		const y = Math.cos(phi);
		const z = Math.sin(phi) * Math.sin(theta);

		return new Float32Array([x, y, z]);
	
	}

	/*

	theta=0: light points east
	theta=0.25: light points north
	theta=0.5: light points west
	theta=0.75: light points south
	phi=0: light points straight up
	phi=0.5: light points horizontally
	phi=1: light points straight down

	*/

	updateLight(t, p) {

		const theta = t * Math.PI * 2;
		const phi = p * Math.PI;

		return this.sphericalToCartesian(theta,
			phi);
	
	}

	setProp(nnm, val) {

		// console.log(nnm, val);

		this.liquid.params[nnm] = val;
	
	}

	onPropEnd(evt) {

		evt.preventDefault();

		let pointId = evt.pointerId;

		if(this.proppers.has(pointId)) {

			let propName = this.proppers.get(pointId);

			// if(DEBUG) console.log("rm", propName);

			let propWrap = document.querySelector(
				".params" + " " + "." + propName.replaceAll(" ",
					"-")
			);

			propWrap.releasePointerCapture(pointId);

			Object.keys(this.propEvents)
			.forEach(propEvent => {

				propWrap.removeEventListener(
					propEvent,
					this.propEvents[propEvent]
				);
			
			});

			propWrap.classList.remove("down");

			this.proppers.delete(pointId);

			this.propoint.delete(pointId);
		
		}
	
	}

	updateBounds() {

		const bnds = this.pwrp.getBoundingClientRect();

		this.bnd = {
			x: Math.round(bnds.x),
			y: Math.round(bnds.y),
			w: Math.round(bnds.width),
			h: Math.round(bnds.height),
		};

		// if(DEBUG) console.log(this.bnd);
	
	}

	mask(ify) {

		this.wrap.classList.toggle("msk",
			ify);
	
	}

}
