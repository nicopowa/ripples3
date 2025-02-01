const liquifying = {
	
	// Core simulation parameters 
	timeScale: {
		nnm: "time scale", 
		val: 1.0, 
		min: 0.5, 
		max: 1.5, 
		stp: 0.05
	},
	waveSpeed: {
		nnm: "wave speed", 
		val: 0.995, 
		min: 0.990, 
		max: 1, 
		stp: 0.001
	},
	damping: {
		nnm: "damping", 
		val: 0.998, 
		min: 0.9750, 
		max: 0.9999, 
		stp: 0.0001
	},
	propagationSpeed: {
		nnm: "propagation speed", 
		val: 5, 
		min: 3, 
		max: 7, 
		stp: 0.1
	},

	// Water visual properties
	refraction: {
		nnm: "refraction", 
		val: 0.18, 
		min: 0.10, 
		max: 0.30, 
		stp: 0.01
	},
	// waterTint: new Float32Array([0.05, 0.07, 0.12]),
	tintStrength: {
		nnm: "tint strength", 
		val: 0.022, 
		min: 0.010, 
		max: 0.040, 
		stp: 0.001
	},
	specularStrength: {
		nnm: "specular strength", 
		val: 0.72, 
		min: 0.1, 
		max: 1.0, 
		stp: 0.05
	},
	roughness: {
		nnm: "roughness", 
		val: 0.28, 
		min: 0.20, 
		max: 0.40, 
		stp: 0.01
	},

	// Fresnel and reflection
	fresnelEffect: {
		nnm: "fresnel effect", 
		val: 0.8, 
		min: 0.3, 
		max: 1.3, 
		stp: 0.1
	},
	fresnelPower: {
		nnm: "fresnel power", 
		val: 2.6, 
		min: 1.5, 
		max: 3.5, 
		stp: 0.1
	},
	specularPower: {
		nnm: "specular power", 
		val: 38.0, 
		min: 25, 
		max: 50, 
		stp: 1
	},
	reflectionFresnel: {
		nnm: "reflection fresnel", 
		val: 1.0, 
		min: 0.5, 
		max: 1.5, 
		stp: 0.1
	},
	reflectionBlur: {
		nnm: "reflection blur", 
		val: 0.1, 
		min: 0.05, 
		max: 0.15, 
		stp: 0.01
	},
	reflectionDistortion: {
		nnm: "reflection distortion", 
		val: 0.3, 
		min: 0.15, 
		max: 0.45, 
		stp: 0.01
	},

	// Environmental parameters
	// skyColor: new Float32Array([0.78, 0.89, 1.0]),
	depthFactor: {
		nnm: "depth factor", 
		val: 1.65, 
		min: 1.50, 
		max: 2.00, 
		stp: 0.01
	},
	atmosphericScatter: {
		nnm: "atmospheric scatter", 
		val: 0.72, 
		min: 0.50, 
		max: 1.00, 
		stp: 0.01
	},
	envMapIntensity: {
		nnm: "env map intensity", 
		val: 0.5, 
		min: 0.20, 
		max: 0.70, 
		stp: 0.01
	},

	// Touch interaction
	touchRadius: {
		nnm: "touch radius", 
		val: 0.017, 
		min: 0.005, 
		max: 0.050, 
		stp: 0.001
	},
	initialImpact: {
		nnm: "initial impact", 
		val: 0.46, 
		min: 0.25, 
		max: 0.75, 
		stp: 0.01
	},
	trailStrength: {
		nnm: "trail strength", 
		val: 0.92, 
		min: 0.50, 
		max: 1.50, 
		stp: 0.01
	},
	trailSpread: {
		nnm: "trail spread", 
		val: 48.0, 
		min: 25.0, 
		max: 75.0, 
		stp: 0.05
	},
	trailFrequency: {
		nnm: "trail frequency", 
		val: 0.033, 
		min: 0.025, 
		max: 0.050, 
		stp: 0.001
	},

	// Caustics (should match shader)
	causticStrength: {
		nnm: "caustic strength", 
		val: 0.15, 
		min: 0.05, 
		max: 0.30, 
		stp: 0.01
	},
	causticScale: {
		nnm: "caustic scale", 
		val: 0.8, 
		min: 0.3, 
		max: 1.3, 
		stp: 0.1
	},
	causticSpeed: {
		nnm: "caustic speed", 
		val: 0.3, 
		min: 0.1, 
		max: 1.0, 
		stp: 0.1
	},
	causticBrightness: {
		nnm: "caustic brightness", 
		val: 1.2, 
		min: 0.5, 
		max: 1.5, 
		stp: 0.1
	},
	causticDetail: {
		nnm: "caustic detail", 
		val: 3.0, 
		min: 1.5, 
		max: 5.0, 
		stp: 0.1
	},
	sunIntensity: {
		nnm: "sun intensity", 
		val: 50, 
		min: 0, 
		max: 100, 
		stp: 1
	},
	secondaryIntensity: {
		nnm: "secondary intensity", 
		val: 50, 
		min: 0, 
		max: 100, 
		stp: 1
	}
};

// defaultPointOpts

// lightingParams

class Params {

	constructor(liquid) {

		this.liquid = liquid;

		this.wrap = document.createElement("div");
		this.wrap.classList.add("params");
		document.body.appendChild(this.wrap);

		// moving pointers => prop name
		this.proppers = new Map();
		// pointers current x coord
		this.propoint = new Map();
		// props params
		this.props = new Map();

		this.propVal = evt => 
			this.onPropVal(evt);
	
		this.propEnd = evt => 
			this.onPropEnd(evt);

		this.propEvents = {
			"pointerup": this.propEnd, 
			"pointerleave": this.propEnd, 
			"pointermove": this.propVal
		};

		console.log(this.liquid.params);

		this.eventProp(true);

		Object.keys(liquifying)
		.forEach(
			flowing => {

				const fluid = liquifying[flowing];

				this.addProp(fluid.nnm, fluid.val, fluid.min, fluid.max, fluid.stp, val => this.setProp(flowing, val))

			}
		);

		// this.addProp("test", 50, 0, 100, 1, v => console.log(v))

	}

	setProp(nnm, val) {

		// console.log(nnm, val);

		this.liquid.params[nnm] = val;

	}

	addProp(nnm, val, min, max, stp, cbk) {

		let propWrap = document
		.createElement("span");

		propWrap.classList
		.add(
			"prop", 
			nnm
			.replaceAll(
				" ", 
				"-"
			)
		);

		propWrap
		.addEventListener(
			"pointerdown", 
			evt => {

				evt
				.preventDefault();

				let pointId = evt.pointerId;

				if(this.proppers.has(pointId)) {

					// prop busy

					return;

				}

				this.proppers
				.set(
					pointId, 
					nnm
				);

				this.propoint
				.set(
					pointId, 
					evt.pageX
				);

				// if(DEBUG) console.log("down", this.proPointers.get(pointId));

				propWrap.classList
				.add("down");

			}
		);

		let leftSide = document
		.createElement("div");

		leftSide.innerHTML = "<";

		propWrap
		.appendChild(leftSide);

		let valWrap = document
		.createElement("div");

		valWrap.classList
		.add("valw");

		let propEl = document
		.createElement("div");

		propEl.innerHTML = nnm
		.toUpperCase();

		valWrap
		.appendChild(propEl);

		let propVal = document
		.createElement("div");

		propVal.classList
		.add("val");

		propVal.innerHTML = val;

		valWrap
		.appendChild(propVal);

		propWrap
		.appendChild(valWrap);

		let rightSide = document
		.createElement("div");

		rightSide.innerHTML = ">";

		propWrap
		.appendChild(rightSide);

		this.wrap
		.appendChild(propWrap);

		this.props
		.set(
			nnm, 
			{
				val: val, 
				min: min, 
				max: max, 
				stp: stp, 
				cbk: cbk, 
				hnt: propVal
			}
		);

	}

	eventProp(addEvt) {

		Object
		.keys(this.propEvents)
		.forEach(
			propEvent => {

				addEvt ? 
				document.body
				.addEventListener(
					propEvent, 
					this.propEvents[propEvent]
				) 
				: document.body
				.removeEventListener(
					propEvent, 
					this.propEvents[propEvent]
				);

			}
		);

	}

	onPropVal(evt) {

		let pointId = evt.pointerId;

		if(this.proppers.has(pointId)) {

			let propx = evt.pageX, 

				propd = Math
				.round(
					(
						propx 
						- this.propoint
						.get(pointId)
					) 
					/ 3
				);

			if(propd != 0) {

				let propName = this.proppers
				.get(pointId);

				let prop = this.props
				.get(propName);

				prop.val = this.roundIt(
					Math
					.min(
						Math
						.max(
							prop.min, 
							prop.val 
							+ propd 
							* prop.stp
						), 
						prop.max
					)
				);

				this.propoint
				.set(
					pointId, 
					evt.pageX
				);

				prop
				.cbk(prop.val);

				prop.hnt.innerHTML = prop.val;

			}

		}

	}

	roundIt(v) {

		return Math
		.round(
			v 
			* 1e2 
			+ Number.EPSILON
		) 
		/ 1e2;

	}

	onPropEnd(evt) {

		let pointId = evt.pointerId;

		if(this.proppers.has(pointId)) {

			let propName = this.proppers
			.get(pointId);

			// if(DEBUG) console.log("rm", propName);

			document
			.querySelector(
				".params" + 
				" " + 
				"." + propName
				.replaceAll(
					" ", 
					"-"
				)
			).classList
			.remove("down");

			this.proppers
			.delete(pointId);

			this.propoint
			.delete(pointId);

		}

	}

}