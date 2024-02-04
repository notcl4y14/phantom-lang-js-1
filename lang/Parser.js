let Error = require ("./Error.js");

module.exports = (class {

	constructor (tokens) {
		this.tokens = tokens;
		this.pos = -1;

		this.yumToken();
	}

	///////////////////

	// Returns the current token
	at (delta = 0) {
		let arr = this.tokens;
		let pos = this.pos;
		return arr[pos + delta];
	}

	// Returns the next token
	next () {
		return this.at(1);
	}

	// Returns the token and advances to the next one
	yumToken (delta = 1) {
		let prev = this.at();
		this.pos += delta;
		return prev;
	}

	// Gets the token and checks if the type and the value match with the given ones
	expect (type, value, error) {
		let prev = this.at();

		if (prev.type != type || prev.value != value) {
			throw error;
		}

		this.yumToken();
		return prev;
	}

	// Gets the token and checks if the type matches with the given one
	expectType (type, error) {
		let prev = this.at();

		if (prev.type != type) {
			throw error;
		}

		this.yumToken();
		return prev;
	}

	// Checks if the parser has reached EOF
	isEOF() {
		let token = this.at();
		return token.type == "EOF";
	}

	///////////////////

	// Parses, duh
	parse () {

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
			let expr = this.statement();

			// Pushing the expression
			if (expr) program.body.push(expr);

		}

		return program;

	}

	///////////////////

	// Binary Expression
	_binaryExpr (ops, func) {

		let left = func.call(this);

		while (!this.isEOF() && ops.includes(this.at().value)) {

			let operator = this.yumToken().value;
			let right = func.call(this);

			return {
				type: "BinaryExpr",
				left, operator, right,

				pos: [left.pos[0], right.pos[1]]
			};

		}

		return left;

	}

	// Gets the runtime type
	_getType () {

		if (this.at().type == "symbol" && this.at().value == ":") {
			this.yumToken();
		}

		return this.primaryExpr();

	}

	////////////////

	  ////////////////
	 // STATEMENTS //
	////////////////

	statement () {

		// Variable Declaration
		if (this.at().matches("keyword", "let")) {
			return this.varDeclaration();
		}

		// If Statement
		else if (this.at().matches("keyword", "if")) {
			return this.ifStatement();
		}

		// While Statement
		else if (this.at().matches("keyword", "while")) {
			return this.whileStatement();
		}

		return this.expression();

	}

	// Variable Declaration
	varDeclaration () {

		let keyword = this.yumToken();
		let name = this.primaryExpr();

		if (name.type != "Identifier") {
			throw new Error("Expected identifier", name.pos);
		}

		let rtType = null;
		let value = { type: "Literal", value: "null" };

		if (this.at().matches("symbol", ":")) {
			rtType = this._getType();
		}

		if (!this.yumToken().matches("operator", "=")) {
			return {
				type: "VarDeclaration",
				name, rtType, value,

				pos: [keyword.pos[0], name.pos[1]]
			};
		}

		value = this.expression();

		return {
			type: "VarDeclaration",
			name: name,
			rtType: rtType,
			value: value,

			pos: [keyword.pos[0], value.pos[1]]
		};

	}

	ifStatement () {

		let keyword = this.yumToken();
		let condition = this.expression();
		let block = this.blockStatement();
		let alternate = null;

		if (this.at().matches("keyword", "else")) {
			this.yumToken();

			if (this.at().matches("keyword", "if")) {
				alternate = this.ifStatement();
			} else {
				alternate = this.blockStatement();
			}
		}

		return {
			type: "IfStatement",
			condition: condition,
			block: block,
			alternate: alternate,

			pos: [
				keyword.pos[0],
				block.pos[1]
			]
		};

	}

	whileStatement () {

		let keyword = this.yumToken();
		let condition = this.expression();
		let block = this.blockStatement();

		return {
			type: "WhileStatement",
			condition: condition,
			block: block,

			pos: [
				keyword.pos[0],
				block.pos[1]
			]
		};

	}

	blockStatement () {

		let leftBrace = this.expect(
			"closure", "{",
			new Error("Expected '{'", this.at().pos)
		);

		let body = [];

		while (!this.isEOF() && !this.at().matches("closure", "}")) {
			if (this.at().type == "comment") {
				this.yumToken();
				continue;
			}

			let expr = this.statement();
			if (expr) body.push(expr);
		}

		let rightBrace = this.expect(
			"closure", "}",
			new Error("Expected '}'", this.at().pos)
		);

		return {
			type: "BlockStatement",
			body: body,

			pos: [
				leftBrace.pos[0],
				rightBrace.pos[1]
			]
		};

	}

	  /////////////////
	 // EXPRESSIONS //
	/////////////////

	expression () {

		// Assignment Expression
		if
			(this.at().type == "identifier" &&
			this.next().type == "operator" &&
			this.next().value.includes("="))
		{
			return this.assignmentExpr();
		}

		return this.compExpr();

	}

	// Assignment Expr
	assignmentExpr () {

		// Getting identifier
		let ident = this.primaryExpr();

		// Checking if it's an identifier
		if (ident.type != "Identifier") {
			throw new Error("Expected identifier", ident.pos);
		}

		// Checking for an operator
		let operator = this.expectType("operator", new Error("Expected operator", this.at().pos));

		// Getting value
		let value = this.expression();

		// Returning result
		return {
			type: "AssignmentExpr",
			ident: ident,
			operator: operator,
			value: value,

			pos: [
				ident.pos[0],
				value.pos[1]
			]
		};

	}

	////////////////

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

	////////////////

	// Primary Expression
	primaryExpr () {

		let token = this.at();

		// Numeric literal
		if (token.type == "number") {
			return this.numericLiteral();
		}

		// String literal
		else if (token.type == "string") {
			return this.stringLiteral();
		}

		// Identifier
		else if (token.type == "identifier") {
			return this.identifier();
		}

		// Literal
		else if (token.type == "literal") {
			return this.literal();
		}

		// Array literal
		else if (token.matches("closure", "[")) {
			return this.arrayLiteral();
		}

		// Parenthesised expression
		else if (token.type == "closure" && token.value == "(") {

			return this.parenthesisedExpr();

		}

		// Unary expression
		else if (token.matches("operator", "-") ||
		         token.matches("symbol", "!") ||
		         token.matches("keyword", "delete"))
		{

			return this.unaryExpr();

		}

		// Semicolon
		else if (token.type == "symbol" && token.value == ";") {
			this.yumToken();
			return null;
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
		throw new Error(`Unexpected token '${token.value}'`, token.pos);
	}

	  //////////////
	 // LITERALS //
	//////////////

	numericLiteral () {
		let token = this.yumToken();

		return {
			type: "NumericLiteral",
			value: token.value,

			pos: token.pos
		};
	}

	stringLiteral () {
		let token = this.yumToken();

		return {
			type: "StringLiteral",
			value: token.value,

			pos: token.pos
		};
	}

	identifier () {
		let token = this.yumToken();

		return {
			type: "Identifier",
			value: token.value,

			pos: token.pos
		};
	}

	literal () {
		let token = this.yumToken();

		return {
			type: "Literal",
			value: token.value,

			pos: token.pos
		};
	}

	arrayLiteral () {

		let leftBracket = this.expect("closure", "[",
			new Error("Expected '['", this.at().pos));

		let values = [];

		while (!this.isEOF() && !this.at().matches("closure", "]")) {

			let value = this.expression();
			values.push(value);

			if (!this.at().matches("symbol", ",")) {
				if (this.at().matches("closure", "]")) {
					break;
				}

				throw new Error("Expected ',' | ']'", this.at().pos);
			}

			// Advancing past comma
			this.yumToken();

		}

		let rightBracket = this.expect("closure", "]",
			new Error("Expected ']'", this.at().pos));

		return {
			type: "ArrayLiteral",
			values: values,

			pos: [
				leftBracket.pos[0],
				rightBracket.pos[1]
			]
		};

	}

	parenthesisedExpr () {
		this.expect("closure", "(", new Error("Expected '('", this.at().pos));

		let value = this.expression();

		this.expect("closure", ")", new Error("Expected ')'", this.at().pos));

		return value;
	}

	unaryExpr () {
		let operator = this.yumToken();
		let value = this.primaryExpr();

		return {
			type: "UnaryExpr",
			operator: operator.value,
			argument: value,

			pos: [operator.pos[0], value.pos[1]]
		};
	}
});