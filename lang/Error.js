class Error {
	constructor (details, pos) {
		this.details = details;
		this.pos = pos;
	}

	_string () {
		let leftPos = this.pos[0];
		let rightPos = this.pos[1];
		let filename = leftPos.filename;
		let details = this.details;

		let line = (leftPos.line == rightPos.line)
			? `${leftPos.line + 1}`
			: `${leftPos.line + 1} - ${rightPos.line + 1}`;

		let column = (leftPos.column == rightPos.column)
			? `${leftPos.column + 1}`
			: `${leftPos.column + 1} - ${rightPos.column + 1}`;

		return (`${filename}: ${line} : ${column} : ${details}`);
	}
}

module.exports = Error;