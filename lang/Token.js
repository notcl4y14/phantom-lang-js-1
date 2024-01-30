let Token = class {
	constructor (type, value = null) {
		this.type = type;
		this.value = value;
		this.pos = [];
	}

	setPos (left, right = null) {
		this.pos[0] = left;
		this.pos[1] = (right != null)
			? right
			: left.clone().advance();
		return this;
	}

	matches (type, value) {
		return this.type == type && this.value == value;
	}

	_string () {
		return `Token { type: ${this.type}, value: ${this.value} }`;
	}
}

module.exports = Token;