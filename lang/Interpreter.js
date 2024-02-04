let Error = require ("./Error.js");
let Environment = require ("./Environment.js");
let RuntimeValue = require ("./RuntimeValue.js");

module.exports = (class {
	constructor () {}

	// -----------------------------------------------------------------------

	primary (node, env) {

		if (node instanceof RuntimeValue) {
			return node;
		}

		// Values
		// -----------------------------------------------------------------------

		// number
		if (node.type == "NumericLiteral") {
			return new RuntimeValue("number", node.value);
		}

		// string
		else if (node.type == "StringLiteral") {
			return new RuntimeValue("string", node.value);
		}

		// literal
		else if (node.type == "Literal") {
			if (node.value == "true" || node.value == "false") {
				return new RuntimeValue("boolean", node.value == "true");
			}

			return new RuntimeValue(node.value, null);
		}

		// identifier
		else if (node.type == "Identifier") {
			let variable = env.lookup(node.value);

			if (!variable) {
				throw new Error(`Variable '${node.value}' does not exist`, node.pos);
			}

			return variable.value;
		}

		else if (node.type == "ArrayLiteral") {
			return this.arrayLiteral(node, env);
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

		// if statement
		else if (node.type == "IfStatement") {
			return this.ifStatement(node, env);
		}

		// while statement
		else if (node.type == "WhileStatement") {
			return this.whileStatement(node, env);
		}

		// block statement
		else if (node.type == "BlockStatement") {
			return this.blockStatement(node, env);
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

		throw new Error(`No evaluation method for AST type '${node.type}'`, node.pos);
	}

	// -----------------------------------------------------------------------

	// Misc.
	program (program, env) {
		let last = null;

		for (let expr of program.body) {
			last = this.primary(expr, env);
		}

		return last;
	}

	// Literals
	// -----------------------------------------------------------------------

	arrayLiteral (literal, env) {
		let rtValue = new RuntimeValue("array", []);

		for (let i = 0; i < literal.values.length; i += 1) {
			let value = this.primary(literal.values[i], env);
			rtValue.value.push(value);
		}

		return rtValue;
	}

	// Statements
	// -----------------------------------------------------------------------

	varDeclaration (stmt, env) {
		let name = stmt.name.value;
		let value = this.primary(stmt.value, env);

		let type = stmt.rtType != null
			? stmt.rtType.value
			: stmt.rtType;

		let variable = env.declare(name, value, type);

		switch (variable) {
			case 1: throw new Error(`Cannot redeclare '${name}'`, stmt.name.pos);
			case 2: throw new Error(`Value '${value._string()}' is unappliable to variable type of '${type}'`, stmt.value.pos);
		}

		return variable;
	}

	ifStatement (stmt, env) {
		let condition = this.primary(stmt.condition, env);
		let block = stmt.block;
		let last = null;

		if (condition.value) {

			last = this.blockStatement(block, env);

		} else if (stmt.alternate) {

			last = this.primary(stmt.alternate, env);

		}

		return last;
	}

	whileStatement (stmt, env) {
		let condition = this.primary(stmt.condition, env);
		let block = stmt.block;
		let last = null;

		while (condition.value) {

			last = this.blockStatement(block, env);
			condition = this.primary(stmt.condition, env);

		}

		return last;
	}

	blockStatement (stmt, env) {
		let body = stmt.body;
		let scope = new Environment(env);
		let last = null;

		for (let expr of body) {
			last = this.primary(expr, scope);
		}

		return last;
	}

	// Expressions
	// -----------------------------------------------------------------------

	binaryExpr (expr, env) {
		let left = this.primary(expr.left, env);
		let right = this.primary(expr.right, env);
		let value = null;

		let leftValue = left._number();
		let rightValue = right._number();

		if (left.type == "string") {
			leftValue = left._string();
			rightValue = right._string();
		}

		switch (expr.operator) {
			case "+":  value = leftValue + rightValue; break;
			case "-":  value = leftValue - rightValue; break;
			case "*":  value = leftValue * rightValue; break;
			case "/":  value = leftValue / rightValue; break;
			case "%":  value = leftValue % rightValue; break;
			case "^":  value = leftValue ** rightValue; break;

			case "==": value = left.value == right.value && left.type == right.type; break;
			case "!=": value = left.value !== right.value; break;
			case "<":  value = leftValue < rightValue; break;
			case ">":  value = leftValue > rightValue; break;
			case "<=": value = leftValue <= rightValue; break;
			case ">=": value = leftValue >= rightValue; break;
		}

		let type = typeof(value);

		return new RuntimeValue(type, value);
	}

	unaryExpr (expr, env) {
		let argument = this.primary(expr.argument, env);
		let value = null;

		switch (expr.operator) {
			case "-": value = argument.value * -1; break;
			case "!": value = !(argument.value); break;
			case "delete":
				if (expr.argument.type != "Identifier") {
					throw new Error("Expected identifier", expr.pos);
				}

				delete env.variables[expr.argument.value];
				return null;
		}

		let type = typeof(value);

		return new RuntimeValue(type, value);
	}

	assignmentExpr (stmt, env) {
		let ident = stmt.ident.value;
		let value = this.primary(stmt.value, env);
		let varValue = env.lookup(ident).value.value;
		let result = null;

		switch (stmt.operator.value) {
			case "=": result = value; break;
			case "+=": result = varValue + value; break;
			case "-=": result = varValue - value; break;
			case "*=": result = varValue * value; break;
			case "/=": result = varValue / value; break;
			case "%=": result = varValue % value; break;
			case "^=": result = varValue ** value; break;
			default: throw new Error(`Unexpected token '${stmt.operator.value}'`, stmt.pos);
		}

		let variable = env.set(ident, result);

		switch (variable) {
			case 1: throw new Error(`Variable '${ident}' does not exist`, stmt.ident.pos);
			case 2:
				let variable = env.lookup(ident);
				throw new Error(`Value '${value._string()}' is unappliable to variable type of '${variable.type}'`, stmt.value.pos);
		}

		return variable;
	}
});