class RuntimeValue {
	constructor (type, value = null) {
		this.type = type;
		this.value = value;
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
				return this.value == "true" ? 1 : 0;

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