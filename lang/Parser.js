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
		return arr[pos + delta];
	}

	advance (delta = 1) {
		let prev = this.at();
		this.pos += delta;
		return prev;
	}

	next () {
		return this.at(1);
	}

	isEOF() {
		let token = this.at();
		return token.type == "EOF";
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

		return res.success(program);
	}

	// -----------------------------------------------------------------------

	_binaryExpr (ops, func) {
		let res = new Result();

		let left = res.register(func.call(this));
		if (res.error) return res;

		while ( !this.isEOF() && ops.includes(this.at().value) ) {
			let op = this.advance().value;
			let right = res.register(func.call(this));
			if (res.error) return res;

			return res.success({
				type: "BinaryExpr",
				left, op, right,

				pos: [left.pos[0], right.pos[1]]
			});
		}

		return res.success(left);
	}

	_getType () {
		let res = new Result();
		if (this.at().type == "symbol" && this.at().value == ":") this.advance();

		let expr = res.register(this.primaryExpr());
		if (res.error) return res;

		return res.success(expr);
	}

	// -----------------------------------------------------------------------

	// Statements
	stmt () {
		if (this.at().type == "keyword" && this.at().value == "let") {
			return this.varDeclaration();
		}

		return this.expr();
	}

	varDeclaration () {
		let res = new Result();

		let keyword = this.advance();
		let name = res.register(this.primaryExpr());
		if (res.error) return res;

		if (name.type != "Identifier")
			return res.failure( new Error("Expected identifier", name.pos) );

		let rtType = null;
		let value = { type: "Literal", value: "null" };

		if (this.at().matches("symbol", ":")) {
			rtType = res.register(this._getType());
			if (res.error) return res;
		}

		if (!this.at().matches("operator", "=")) {
			return res.success({
				type: "VarDeclaration",
				name, rtType, value,

				pos: [keyword.pos[0], name.pos[1]]
			});
		}

		this.advance();

		value = res.register(this.expr());
		if (res.error) return res;

		return res.success({
			type: "VarDeclaration",
			name, rtType, value,

			pos: [keyword.pos[0], value.pos[1]]
		});
	}

	// Expressions
	expr () {
		if (this.at().type == "identifier" && this.next().matches("operator", "=")) {
			return this.assignmentExpr();
		}

		return this.addExpr();
	}

	assignmentExpr () {
		let res = new Result();
		let ident = res.register(this.primaryExpr());
		if (res.error) return res;

		if (ident.type != "Identifier") {
			return res.failure( new Error("Expected identifier", ident.pos) );
		}

		if (!(this.at().type == "operator" && this.at().value == "=")) {
			return res.failure( new Error("Expected '='", this.at().pos) );
		}

		this.advance();

		let value = res.register(this.expr());
		if (res.error) return res;

		return res.success({
			type: "AssignmentExpr",
			ident, value
		});
	}

	// -----------------------------------------------------------------------

	addExpr () {
		return this._binaryExpr( ["+", "-"], this.multExpr );
	}

	multExpr () {
		return this._binaryExpr( ["*", "/", "%"], this.powerExpr );
	}

	powerExpr () {
		return this._binaryExpr( ["^"], this.primaryExpr );
	}

	// -----------------------------------------------------------------------

	primaryExpr () {
		let res = new Result();
		let token = this.advance();

		// NumericLiteral
		if (token.type == "number") {
			return res.success({
				type: "NumericLiteral",
				value: token.value,

				pos: token.pos
			});
		}

		// StringLiteral
		else if (token.type == "string") {
			return res.success({
				type: "StringLiteral",
				value: token.value,

				pos: token.pos
			});
		}

		// Identifier
		else if (token.type == "identifier") {
			return res.success({ type:
				"Identifier",
				value: token.value,

				pos: token.pos
			});
		}

		// Literal
		else if (token.type == "literal") {
			return res.success({
				type: "Literal",
				value: token.value,

				pos: token.pos
			});
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

			return res.success(value);
		}

		// Unary expression
		else if
			((token.type == "operator" && token.value == "-")
			|| (token.type == "symbol" && token.value == "!"))
		{
			let value = res.register(this.primaryExpr());

			return res.success({
				type: "UnaryExpr",
				operator: token.value,
				argument: value,

				pos: [token.pos[0], value.pos[1]]
			});
		}

		// Semicolon
		else if (token.type == "symbol" && token.value == ";") {
			return res.success();
		}

		// Repeatable binary expression
		// I don't really think it works
		// else if (token.type == "operator") {

		// 	// if ( token.value != "=" ) this.advance(-1);
		// 	// console.log(this.at());

		// 	// Additive expression
		// 	if ( ["+", "-"].includes(token.value) ) {
		// 		return this.addExpr();
		// 	}

		// 	// Multiplicative expression
		// 	else if ( ["*", "/", "%"].includes(token.value) ) {
		// 		return this.multExpr();
		// 	}

		// 	// Power expression
		// 	else if ( token.value == "^" ) {
		// 		return this.powerExpr();
		// 	}

		// }

		return res.failure( new Error(`Unexpected token '${token.value}'`, token.pos) );
	}
}

module.exports = Parser;