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
		let program = {
			type: "Program",
			body: [],
		};

		while (!this.isEOF()) {
			if (this.at().type == "comment") {
				this.advance();
				continue;
			}

			let expr = this.stmt();
			if (expr) program.body.push(expr);
		}

		return (program);
	}

	// -----------------------------------------------------------------------

	_binaryExpr (ops, func) {
		let left = func.call(this);

		while ( !this.isEOF() && ops.includes(this.at().value) ) {
			let op = this.advance().value;
			let right = func.call(this);

			return ({
				type: "BinaryExpr",
				left, op, right,
			});
		}

		return (left);
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
		let token = this.advance();

		// NumericLiteral
		if (token.type == "number") {
			return ({ type: "NumericLiteral", value: token.value });
		}

		// StringLiteral
		else if (token.type == "string") {
			return ({ type: "StringLiteral", value: token.value });
		}

		// Literal
		else if (token.type == "literal") {
			return ({ type: "literal", value: token.value });
		}

		// Parenthesised expression
		else if (token.type == "closure" && token.value == "(") {
			let value = this.expr();

			// console.log(this.at());
			// TODO: replace this with the error system, if needed
			if (!(this.at().type == "closure" && this.at().value == ")")) {
				throw new Error("Expected closing parenthesis");
			}

			this.advance();

			return (value);
		}

		// Unary expression
		else if
			((token.type == "operator" && token.value == "-")
			|| (token.type == "symbol" && token.value == "!"))
		{
			let value = this.primaryExpr();

			return ({ type: "UnaryExpr", operator: token.value, argument: value });
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

module.exports = Parser;