module.exports = (class {

	constructor (parent = null) {
		this.variables = {};
		this.parent = parent;
	};

	checkType (value, type) {
		// if type is null, then it's dynamic
		if (!type) return true;
		return typeof(value) == type;
	};

	declare (name, value, type = null) {

		if (this.variables[name]) {
			return 1;
		}

		let isValid = this.checkType(value.value, type);

		if (!isValid) {
			return 2;
		}

		this.variables[name] = { type, value };
		return this.lookup(name);
	};

	set (name, value) {

		if (!this.variables[name]) {

			if (this.parent) {
				return this.parent.set(name, value);
			}

			return 1;
		}

		let variable = this.variables[name];
		let isValid = this.checkType(value.value, variable.type);
		
		if (!isValid) {
			return 2;
		}

		this.variables[name].value = value;
		return this.lookup(name);
	};

	lookup (name) {

		if (!this.variables[name]) {

			if (this.parent) {
				return this.parent.lookup(name);
			}

			return;
		}

		return this.variables[name];
	};

	// lookupObject (name, path) {

	// 	if (!this.variables[name]) {

	// 		if (this.parent) {
	// 			return this.parent.lookupObject(name);
	// 		}

	// 		return;
	// 	}

	// 	let current = this.variables[name];

	// 	for (let i = 0; i < path.length; i += 1) {
	// 		current = current.value[path[i]];
	// 		if (!current) return;
	// 	}

	// 	return current;
	// }

});