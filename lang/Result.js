class Result {
	constructor () {
		this.value = null;
		this.error = null;
	}

	register (res) {
		if (res instanceof Result) {
			if (res.error) {
				this.error = res.error;
			}

			return (res.value);
		}

		return (res);
	}

	success (value) {
		this.value = value;
		return this;
	}

	failure (error) {
		this.error = error;
		return this;
	}
}

module.exports = (Result);