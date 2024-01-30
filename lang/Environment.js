class Environment {
	constructor (parent = null) {
		this.variables = {};
		this.parent = parent;
	}

	// Declares a variable
	declare (name, value, type = null) {

		// If the variable is already declared
		if (this.variables[name]) {
			// Return nothing
			return;
		}

		// Declaring and returning
		this.variables[name] = { type, value };
		return this.lookup(name);
	}

	// Sets the variable
	set (name, value) {

		// If the variable is not declared
		if (!this.variables[name]) {

			// Setting the parent environment's variable
			if (this.parent) {
				return this.parent.set(name, value);
			}

			// Return nothing
			return;
		}

		// Setting and returning
		this.variables[name].value = value;
		return this.lookup(name);
	}

	// Gets the variable
	lookup (name) {

		// If the variable does not exist
		if (!this.variables[name]) {

			// Getting the parent environment's variable
			if (this.parent) {
				return this.parent.lookup(name);
			}

			// Return nothing
			return;
		}

		// Returning the variable
		return this.variables[name];
	}
}

module.exports = Environment;