let Token = class {
	constructor (type, value) {
		this.type = type;
		this.value = value;
	}

	string () {
		return `Token { type: ${this.type}, value: ${this.value} }`;
	}
}

module.exports = Token;