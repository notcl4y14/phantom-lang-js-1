let Position = class {
	constructor (filename, index, line, column) {
		this.filename = filename;
		this.index = index;
		this.line = line;
		this.column = column;
	}

	advance (char = "", delta = 1) {

		this.index += delta;
		this.column += delta;

		if (char == "\n") {
			this.column = 0;
			this.line += 1;
		}

		return this;

	}

	clone () {
		return new Position(this.filename, this.index, this.line, this.column);
	}

	_string (depth = 1) {
		let str = "Position { ";
		if (depth >= 3) str += `filename: ${this.filename}, `;
		if (depth >= 2) str += `index: ${this.index}, `;
		if (depth >= 1) str += `line: ${this.line}, column: ${this.column} `;
		str += "}";
		return str;
	}
};

module.exports = Position;