class Result {
	constructor () {
		this.value = null;
		this.error = null;
	}

	// Returns either the result's value or an error
	register (res) {

		// If res is instance of Result
		if (res instanceof Result) {
			// Checks for error
			if (res.error) {
				this.error = res.error;
			}

			// Returning the value
			return (res.value);
		}

		// Returning back
		return (res);
	}

	// Returns successful result
	success (value) {
		this.value = value;
		return this;
	}

	// Returns failed result
	failure (error) {
		this.error = error;
		return this;
	}
}

module.exports = Result;