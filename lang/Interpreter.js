let Result = require ("./Result.js");
let Error = require ("./Error.js");
let RuntimeValue = require ("./RuntimeValue.js");

class Interpreter {
	constructor () {}

	// -----------------------------------------------------------------------

	primary (node, env) {
		let res = new Result();

		if (node instanceof RuntimeValue) {
			return res.success(node);
		}

		// Values
		// -----------------------------------------------------------------------

		// number
		if (node.type == "NumericLiteral") {
			return res.success(new RuntimeValue("number", node.value));
		}

		// string
		else if (node.type == "StringLiteral") {
			return res.success(new RuntimeValue("string", node.value));
		}

		// literal
		else if (node.type == "Literal") {
			if (node.value == "true" || node.value == "false") {
				return res.success(new RuntimeValue("boolean", node.value == "true"));
			}

			return res.success(new RuntimeValue(node.value, null));
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

	// Misc.
	program (program, env) {
		let res = new Result();
		let last = null;

		for (let expr of program.body) {
			last = res.register(this.primary(expr, env));
			if (res.error) return res;
		}

		return res.success(last);
	}

	// Statements
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

	// Expressions
	// -----------------------------------------------------------------------

	binaryExpr (expr, env) {
		let res = new Result();

		let left,
			right,
			value = null;

		left = res.register(this.primary(expr.left, env));
		if (res.error) return res;

		right = res.register(this.primary(expr.right, env));
		if (res.error) return res;

		let leftValue = left._number();
		let rightValue = right._number();

		// if (left.type == "number") {
		// 	leftValue = left._number();
		// 	rightValue = right._number();
		// }
		if (left.type == "string") {
			leftValue = left._string();
			rightValue = right._string();
		}

		switch (expr.operator) {
			case "+": value = leftValue + rightValue; break;
			case "-": value = leftValue - rightValue; break;
			case "*": value = leftValue * rightValue; break;
			case "/": value = leftValue / rightValue; break;
			case "%": value = leftValue % rightValue; break;
			case "^": value = leftValue ** rightValue; break;
		}

		let type = typeof(value);

		return res.success(new RuntimeValue(type, value));
	}

	unaryExpr (expr, env) {
		let res = new Result();

		let argument, value = null;

		argument = res.register(this.primary(expr.argument, env));
		if (res.error) return (res);

		switch (expr.operator) {
			case "-": value = argument.value * -1; break;
			case "!": value = !(argument.value); break;
			case "delete":
				if (expr.argument.type != "Identifier") {
					return res.failure( new Error("Expected identifier", expr.pos) );
				}

				delete env.variables[expr.argument.value];
				return res.success();
		}

		let type = typeof(value);

		return res.success(new RuntimeValue(type, value));
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