class RuntimeValue {
	constructor (type, value = null) {
		this.type = type;
		this.value = value;
	}

	static toRtValue (value) {
		switch (typeof(value)) {
			case "string": return new RuntimeValue("string", value);
			case "number": return new RuntimeValue("number", value);
			case "boolean": return new RuntimeValue("boolean", value);
			case "array":
				let arr = [];

				for (let i = 0; i < value.length; i += 1) {
					arr.push(RuntimeValue.toRtValue(value[i]));
				}

				return new RuntimeValue("array", arr);
			case "object":
				let obj = {};

				for (let [key, val] of Object.entries(value)) {
					obj[key] = RuntimeValue.toRtValue(val);
				}

				return new RuntimeValue("object", obj);
			case "null":
			case "undefined": return new RuntimeValue("null", null);
		}
	}

	_string () {
		switch (this.type) {
			case "null": return this.type;
			case "string": return this.value;
			case "number": return `${this.value}`;
			case "boolean": return `${this.value}`;

			default: return `[object: ${this.type}]`;
		}
	}

	_number () {
		switch (this.type) {
			case "null": return 0;
			case "string":
				let result = Number(this.value);
				if (result == NaN) result = 0;
				return result;
			case "number": return this.value;
			case "boolean":
				return this.value === true ? 1 : 0;

			default: return 0;
		}
	}

	_boolean () {
		switch (this.type) {
			case "null": return false;
			case "string": return Boolean(this.value);
			case "number": return this.value != 0;
			case "boolean": return this.value;

			default: return true;
		}
	}
}

module.exports = RuntimeValue;