let Result = require ("./Result.js");
let Error = require ("./Error.js");

class Parser {
	constructor (tokens) {
		this.tokens = tokens;
		this.pos = -1;

		this.advance();
	}

	// -----------------------------------------------------------------------

	at (delta = 0) {
		let arr = this.tokens;
		let pos = this.pos;
		return (arr[pos + delta]);
	}

	advance (delta = 1) {
		let prev = this.at();
		this.pos += delta;
		return (prev);
	}

	next () {
		return (this.at(1));
	}

	isEOF() {
		let token = this.at();
		return (token.type == "EOF");
	}

	// -----------------------------------------------------------------------

	parse () {
		let res = new Result();
		let program = {
			type: "Program",
			body: [],
		};

		while (!this.isEOF()) {
			if (this.at().type == "comment") {
				this.advance();
				continue;
			}

			let expr = res.register(this.stmt());
			if (res.error) return (res);

			if (expr) program.body.push(expr);
		}

		return (res.success(program));
	}

	// -----------------------------------------------------------------------

	_binaryExpr (ops, func) {
		let res = new Result();

		let left = res.register(func.call(this));
		if (res.error) return (res);

		while ( !this.isEOF() && ops.includes(this.at().value) ) {
			let op = this.advance().value;
			let right = res.register(func.call(this));
			if (res.error) return (res);

			return (res.success({
				type: "BinaryExpr",
				left, op, right,
			}));
		}

		return (res.success(left));
	}

	// -----------------------------------------------------------------------

	// Statements
	stmt () {
		return (this.expr());
	}

	// Expressions
	expr () {
		return (this.addExpr());
	}

	// -----------------------------------------------------------------------

	addExpr () {
		return (this._binaryExpr( ["+", "-"], this.multExpr ));
	}

	multExpr () {
		return (this._binaryExpr( ["*", "/", "%"], this.powerExpr ));
	}

	powerExpr () {
		return (this._binaryExpr( ["^"], this.primaryExpr ));
	}

	// -----------------------------------------------------------------------

	primaryExpr () {
		let res = new Result();
		let token = this.advance();

		// NumericLiteral
		if (token.type == "number") {
			return (res.success({ type: "NumericLiteral", value: token.value }));
		}

		// StringLiteral
		else if (token.type == "string") {
			return (res.success({ type: "StringLiteral", value: token.value }));
		}

		// Literal
		else if (token.type == "literal") {
			return (res.success({ type: "literal", value: token.value }));
		}

		// Parenthesised expression
		else if (token.type == "closure" && token.value == "(") {
			let value = res.register(this.expr());

			// console.log(this.at());
			// TODO: replace this with the error system, if needed
			if (!(this.at().type == "closure" && this.at().value == ")")) {
				// throw new Error("Expected closing parenthesis");
				return res.failure( new Error("Expected closing parenthesis", this.at().pos) );
			}

			this.advance();

			return (res.success(value));
		}

		// Unary expression
		else if
			((token.type == "operator" && token.value == "-")
			|| (token.type == "symbol" && token.value == "!"))
		{
			let value = res.register(this.primaryExpr());

			return (res.success({ type: "UnaryExpr", operator: token.value, argument: value }));
		}

		// Repeatable binary expression
		// I don't really think it works
		// else if (token.type == "operator") {

		// 	// if ( token.value != "=" ) this.advance(-1);
		// 	// console.log(this.at());

		// 	// Additive expression
		// 	if ( ["+", "-"].includes(token.value) ) {
		// 		return (this.addExpr());
		// 	}

		// 	// Multiplicative expression
		// 	else if ( ["*", "/", "%"].includes(token.value) ) {
		// 		return (this.multExpr());
		// 	}

		// 	// Power expression
		// 	else if ( token.value == "^" ) {
		// 		return (this.powerExpr());
		// 	}

		// }
	}
}

module.exports = (Parser);