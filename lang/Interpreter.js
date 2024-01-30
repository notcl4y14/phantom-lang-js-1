let Result = require ("./Result.js");
let Error = require ("./Error.js");

class Interpreter {
	constructor () {}

	// -----------------------------------------------------------------------

	primary (node, env) {
		let res = new Result();

		if (node.type == "number" || node.value == "string" || node.value == "boolean" || node.type == "null") {
			return res.succes(node);
		}

		// Values
		// -----------------------------------------------------------------------

		// number
		if (node.type == "NumericLiteral") {
			return res.success({ type: "number", value: node.value });
		}

		// string
		else if (node.type == "StringLiteral") {
			return res.success({ type: "string", value: node.value });
		}

		// literal
		else if (node.type == "Literal") {
			if (node.value == "true" || node.value == "false") {
				return res.success({
					type: "boolean",
					value: node.value == "true"
				});
			}

			return res.success({ type: node.value, value: null });
		}

		// identifier
		else if (node.type == "Identifier") {
			let variable = env.lookup(node.value);

			return variable
				? res.success(variable.value)
				: res.failure( new Error(`Variable '${node.value}' does not exist`) );
		}

		// Misc.
		// -----------------------------------------------------------------------

		else if (node.type == "Program") {
			return this.program(node, env);
		}

		// Statements
		// -----------------------------------------------------------------------

		// var declaration
		else if (node.type == "VarDeclaration") {
			return this.varDeclaration(node, env);
		}

		// Expressions
		// -----------------------------------------------------------------------

		// binary expr
		else if (node.type == "BinaryExpr") {
			return this.binaryExpr(node, env);
		}

		// unary expr
		else if (node.type == "UnaryExpr") {
			return this.unaryExpr(node, env);
		}

		// assignment expr
		else if (node.type == "AssignmentExpr") {
			return this.assignmentExpr(node, env);
		}

	}

	// -----------------------------------------------------------------------

	program (program, env) {
		let res = new Result();
		let last = null;

		for (let expr of program.body) {
			last = res.register(this.primary(expr, env));
			if (res.error) return res;
		}

		return res.success(last);
	}

	// -----------------------------------------------------------------------

	varDeclaration (stmt, env) {
		let res = new Result();
		
		let name = stmt.name.value;
		let value = res.register(this.primary(stmt.value, env));
		if (res.error) return res;

		let type = stmt.rtType != null
			? stmt.rtType.value
			: stmt.rtType;

		let variable = env.declare(name, value, type);
		if (!variable) return res.failure( new Error(`Cannot redeclare '${name}'`, stmt.pos) );

		return res.success(variable);
	}

	// -----------------------------------------------------------------------

	binaryExpr (expr, env) {
		let res = new Result();

		let left = res.register(this.primary(expr.left, env));
		if (res.error) return res;

		let right = res.register(this.primary(expr.right, env));
		if (res.error) return res;

		let operator = expr.op;
		let value = null;

		switch (operator) {
			// case "+": value = Number((left.value + right.value).toFixed(1)); break;
			case "+": value = left.value + right.value; break;
			case "-": value = left.value - right.value; break;
			case "*": value = left.value * right.value; break;
			case "/": value = left.value / right.value; break;
			case "%": value = left.value % right.value; break;
			case "^": value = left.value ** right.value; break;
		}

		let type = typeof(value);

		return res.success({ type, value });
	}

	unaryExpr (expr, env) {
		let res = new Result();

		let argument = res.register(this.primary(expr.argument, env));
		if (res.error) return (res);

		let operator = expr.operator;
		let value = null;

		switch (operator) {
			case "-": value = argument.value * -1; break;
			case "!": value = !(argument.value); break;
		}

		let type = typeof(value);

		return res.success({ type, value });
	}

	assignmentExpr (stmt, env) {
		let res = new Result();
		
		let ident = stmt.ident.value;
		let value = res.register(this.primary(stmt.value, env));
		if (res.error) return res;

		let variable = env.set(ident, value);
		if (!variable) return res.failure( new Error(`Variable '${ident}' does not exist`, stmt.pos) );

		return res.success(variable);
	}
}

module.exports = Interpreter;