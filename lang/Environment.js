class Environment {
	constructor (parent = null) {
		this.variables = {};
		this.parent = parent;
	}

	declare (name, value, type = null) {
		if (this.variables[name]) return;
		this.variables[name] = { type, value };
		return this.lookup(name);
	}

	set (name, value) {
		if (!this.variables[name]) {
			if (this.parent) return this.parent.set(name, value);
			return;
		}

		this.variables[name].value = value;
		return this.lookup(name);
	}

	lookup (name) {
		if (!this.variables[name]) {
			if (this.parent) return this.parent.lookup(name);
			return;
		}

		return this.variables[name];
	}
}

module.exports = Environment;