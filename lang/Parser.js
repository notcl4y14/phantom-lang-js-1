let Result = require ("./Result.js");
let Error = require ("./Error.js");

class Parser {
	constructor (tokens) {
		this.tokens = tokens;
		this.pos = -1;

		this.yumToken();
	}

	// -----------------------------------------------------------------------

	// Returns the current token
	at (delta = 0) {
		let arr = this.tokens;
		let pos = this.pos;
		return arr[pos + delta];
	}

	// Returns the token and advances to the next one
	yumToken (delta = 1) {
		let prev = this.at();
		this.pos += delta;
		return prev;
	}

	// Returns the next token
	next () {
		return this.at(1);
	}

	// Checks if the parser has reached EOF
	isEOF() {
		let token = this.at();
		return token.type == "EOF";
	}

	// -----------------------------------------------------------------------

	// Parses, duh
	parse () {
		let res = new Result();

		let program = {
			type: "Program",
			body: []
		};

		while (!this.isEOF()) {

			// Skipping the comments
			if (this.at().type == "comment") {
				this.yumToken();
				continue;
			}

			// Getting the expression
			let expr = res.register(this.stmt());
			if (res.error) return (res);

			// Pushing the expression
			if (expr) program.body.push(expr);

		}

		return res.success(program);
	}

	// -----------------------------------------------------------------------

	// Binary Expression
	_binaryExpr (ops, func) {
		let res = new Result();

		let left = res.register(func.call(this));
		if (res.error) return res;

		while ( !this.isEOF() && ops.includes(this.at().value) ) {

			let operator = this.yumToken().value;
			let right = res.register(func.call(this));
			if (res.error) return res;

			return res.success({
				type: "BinaryExpr",
				left, operator, right,

				pos: [left.pos[0], right.pos[1]]
			});

		}

		return res.success(left);
	}

	// Gets the runtime type
	_getType () {
		let res = new Result();

		if (this.at().type == "symbol" && this.at().value == ":") {
			this.yumToken();
		}

		let expr = res.register(this.primaryExpr());
		if (res.error) return res;

		return res.success(expr);
	}

	// -----------------------------------------------------------------------

	// Statements
	// -----------------------------------------------------------------------

	stmt () {

		// Variable Declaration
		if (this.at().matches("keyword", "let")) {
			return this.varDeclaration();
		}

		return this.expr();

	}

	// Variable Declaration
	varDeclaration () {
		let res = new Result();

		// Getting keyword
		let keyword = this.yumToken();

		// Getting variable name
		let name = res.register(this.primaryExpr());
		if (res.error) return res;

		// Checking if it's an identifier
		if (name.type != "Identifier") {
			return res.failure( new Error("Expected identifier", name.pos) );
		}

		// Setting runtime type and value
		let rtType = null;
		let value = { type: "Literal", value: "null" };

		// Checking if the declaration has a set type
		if (this.at().matches("symbol", ":")) {
			rtType = res.register(this._getType());
			if (res.error) return res;
		}

		// Checking for assignment
		if (!this.yumToken().matches("operator", "=")) {
			return res.success({
				type: "VarDeclaration",
				name, rtType, value,

				pos: [keyword.pos[0], name.pos[1]]
			});
		}

		// Getting value
		value = res.register(this.expr());
		if (res.error) return res;

		// Returning result
		return res.success({
			type: "VarDeclaration",
			name, rtType, value,

			pos: [keyword.pos[0], value.pos[1]]
		});
	}

	// Expressions
	// -----------------------------------------------------------------------
	expr () {

		// Assignment Expression
		if (this.at().type == "identifier" && this.next().matches("operator", "=")) {
			return this.assignmentExpr();
		}

		return this.compExpr();

	}

	// Assignment Expr
	assignmentExpr () {
		let res = new Result();

		// Getting identifier
		let ident = res.register(this.primaryExpr());
		if (res.error) return res;

		// Checking if it's an identifier
		if (ident.type != "Identifier") {
			return res.failure( new Error("Expected identifier", ident.pos) );
		}

		// Checking for '='
		if (!this.at().matches("operator", "=")) {
			return res.failure( new Error("Expected '='", this.at().pos) );
		}

		this.yumToken();

		// Getting value
		let value = res.register(this.expr());
		if (res.error) return res;

		// Returning result
		return res.success({
			type: "AssignmentExpr",
			ident, value
		});
	}

	// -----------------------------------------------------------------------

	// Comparisonal Expression
	compExpr () {
		return this._binaryExpr( ["==", "!=", "<", ">", "<=", ">="], this.addExpr );
	}

	// Additive Expression
	addExpr () {
		return this._binaryExpr( ["+", "-"], this.multExpr );
	}

	// Multiplicative Expression
	multExpr () {
		return this._binaryExpr( ["*", "/", "%"], this.powerExpr );
	}

	// Power Expression
	powerExpr () {
		return this._binaryExpr( ["^"], this.primaryExpr );
	}

	// -----------------------------------------------------------------------

	// Primary Expression
	primaryExpr () {
		let res = new Result();
		let token = this.yumToken();

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

			if (!this.at().matches("closure", ")")) {
				return res.failure( new Error("Expected closing parenthesis", this.at().pos) );
			}

			this.yumToken();

			return res.success(value);
		}

		// Unary expression
		else if (token.matches("operator", "-") ||
		         token.matches("symbol", "!") ||
		         token.matches("keyword", "delete"))
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

		// 	// if ( token.value != "=" ) this.yumToken(-1);
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

		// Returning an error
		return res.failure( new Error(`Unexpected token '${token.value}'`, token.pos) );
	}
}

module.exports = Parser;