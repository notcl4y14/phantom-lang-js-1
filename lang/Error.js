class Error {
	constructor (details, pos) {
		this.details = details;
		this.pos = pos;
	}

	// Returns the error as a string
	_string () {
		
		// Getting positions
		let leftPos = this.pos[0];
		let rightPos = this.pos[1];

		// Getting filename and details
		let filename = leftPos.filename;
		let details = this.details;

		// Getting the line
		let line = (leftPos.line == rightPos.line)
			? `${leftPos.line + 1}`
			: `${leftPos.line + 1} - ${rightPos.line + 1}`;

		// Getting the column
		let column = (leftPos.column == rightPos.column)
			? `${leftPos.column + 1}`
			: `${leftPos.column + 1} - ${rightPos.column + 1}`;

		// Returning result
		return `${filename}: ${line} : ${column} : ${details}`;
	}
}

module.exports = Error;