let Result = require ("./Result.js");

class Interpreter {
	constructor () {}

	// -----------------------------------------------------------------------

	primary (node) {
		let res = new Result();

		// Values
		// -----------------------------------------------------------------------

		// number
		if (node.type == "NumericLiteral") {
			return (res.success({ type: "number", value: node.value }));
		}

		// string
		else if (node.type == "StringLiteral") {
			return (res.success({ type: "string", value: node.value }));
		}

		// literal
		else if (node.type == "Literal") {
			if (node.value == "true" || node.value == "false") {
				return (res.success({
					type: "boolean",
					value: node.value == "true"
				}));
			}

			return (res.success({ type: node.value, value: (null) }));
		}

		// Misc.
		// -----------------------------------------------------------------------

		else if (node.type == "Program") {
			return (this.program(node));
		}

		// Expressions
		// -----------------------------------------------------------------------

		// binary expr
		else if (node.type == "BinaryExpr") {
			return (this.binaryExpr(node));
		}

	}

	// -----------------------------------------------------------------------

	program (program) {
		let res = new Result();
		let last = (null);

		for (let expr of program.body) {
			last = res.register(this.primary(expr));
			if (res.error) return (res);
		}

		return (res.success(last));
	}

	// -----------------------------------------------------------------------

	binaryExpr (expr) {
		let res = new Result();

		let left = res.register(this.primary(expr.left));
		if (res.error) return (res);

		let right = res.register(this.primary(expr.right));
		if (res.error) return (res);

		let operator = expr.op;
		let value = (null);

		switch (operator) {
			case "+": value = left.value + right.value; break;
			case "-": value = left.value - right.value; break;
			case "*": value = left.value * right.value; break;
			case "/": value = left.value / right.value; break;
			case "%": value = left.value % right.value; break;
			case "^": value = left.value ** right.value; break;
		}

		let type = typeof(value);

		return (res.success({ type, value }));
	}
}

module.exports = (Interpreter);