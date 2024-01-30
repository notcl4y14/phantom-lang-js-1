let Token = class {
	constructor (type, value = null) {
		this.type = type;
		this.value = value;
		this.pos = [];
	}

	// Sets the position
	setPos (left, right = null) {
		this.pos[0] = left;
		this.pos[1] = (right != null)
			? right
			: left.clone().advance();

		return this;
	}

	// Checks if the token's type and value match the input
	matches (type, value) {
		return this.type == type && this.value == value;
	}

	// Returns token as a string
	_string () {
		return `Token { type: ${this.type}, value: ${this.value} }`;
	}
}

module.exports = Token;