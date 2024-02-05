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

	expectNode (func, type, error) {
		let node = func.call(this);

		if (node.type != type) {
			throw error;
		}

		return node;
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

			// YES, LOOKS LIKE I FIGURED IT OUT!
			// REPETITIVE BINARY EXPRESSIONS!!! :D
			// I just thought of why do we use
			// while statement in the binary expression lol
			// Also, CREDIT: CodePulse
			left = {
				type: "BinaryExpr",
				left, operator, right,
				pos: [left.pos[0], right.pos[1]]
			};
		}

		return left;

	}

	// Gets the runtime type
	_getType () {
		if (this.at().matches("symbol", ":")) this.yumToken();
		return this.primaryExpr();
	}

	_args () {
		this.expect("closure", "(", new Error("Expected '('", this.at().pos));
		let args = this.at().matches("closure", ")")
			? []
			: this._argsList();
		// this.expect("closure", ")", new Error("Expected ')'", this.at().pos));

		return args;
	}

	_argsList () {
		let args = [this.expression()];

		while (!this.isEOF() && this.at().matches("symbol", ",") && this.yumToken()) {
			args.push(this.expression());
		}

		this.expect("closure", ")", new Error("Expected ')'", this.at().pos));

		return args;
	}

	_body (until, func = this.statement) {
		let body = [];

		while (!this.isEOF() && !until) {
			if (this.at().type == "comment") {
				this.yumToken();
				continue;
			}

			let expr = func.call(this);
			if (expr) body.push(expr);
		}

		return body;
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
		let name = this.expectNode(this.primaryExpr, "Identifier", new Error("Expected identifier", this.at().pos));
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
		// let body = [];

		let leftBrace = this.expect("closure", "{", new Error("Expected '{'", this.at().pos));
		let body = this._body(!this.at().matches("closure", "}"));
		let rightBrace = this.expect("closure", "}", new Error("Expected '}'", this.at().pos));

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
		return this.assignmentExpr();
	}

	// Assignment Expr
	assignmentExpr () {
		let left = this.objectExpr();

		if (this.at().type == "operator" && this.at().value.includes("=")) {
			let operator = this.expectType("operator", new Error("Expected operator", this.at().pos));
			// let ident = this.expectNode(this.primaryExpr, "Identifier", new Error("Expected identifier", this.at().pos));
			let value = this.expression();

			return {
				type: "AssignmentExpr",
				ident: left,
				operator: operator,
				value: value,

				pos: [
					left.pos[0],
					value.pos[1]
				]
			};
		}

		return left;
	}

	// CREDIT: tylerlaceby

	objectExpr() {

		if (!this.at().matches("closure", "{")) {
			return this.compExpr();
		}

		let leftBrace = this.yumToken();
		let properties = [];

		while (!this.isEOF() && !this.at().matches("closure", "}")) {
			let key = this.yumToken();
				// this.expect("Identifier",
					// new Error("Object literal key exprected", this.at().pos)
				// ).value;

			if (key.type != "identifier" && key.type != "string") {
				throw new Error("Object literal key expected", key.pos);
			}

			key = key.value;

			if (this.at().matches("symbol", ",")) {
				this.yumToken();
				properties.push({ type: "Property", key });
				continue;
			} else if (this.at().matches("closure", "}")) {
				properties.push({ type: "Property", key });
				continue;
			}

			this.expect("symbol", ":",
				new Error("Missing colon following identifier", this.at().pos)
			);

			let value = this.expression();

			properties.push({ type: "Property", key, value });
			if (!this.at().matches("closure", "}")) {
				this.expect("symbol", ",",
					new Error("Expected comma or closing bracket following property", this.at().pos)
				);
			}
		}

		// console.log(this.at());

		let rightBrace = this.expect("closure", "}", new Error("Missing closing brace in object literal", this.at().pos));

		return {
			type: "ObjectLiteral",
			properties: properties,
			pos: [leftBrace.pos[0], rightBrace.pos[1]]
		};
	}

	////////////////

	compExpr =	() => this._binaryExpr( ["==", "!=", "<", ">", "<=", ">="], this.addExpr );
	addExpr =	() => this._binaryExpr( ["+", "-"], this.multExpr );
	multExpr =	() => this._binaryExpr( ["*", "/", "%"], this.powerExpr );
	powerExpr =	() => this._binaryExpr( ["^"], this.callMemberExpr );

	////////////////

	// CREDIT: tylerlaceby
	// https://youtu.be/pzqsQ7Xflw4

	callMemberExpr () {
		let member = this.memberExpr();

		if (this.at().matches("closure", "(")) {
			return this.callExpr(member);
		}

		return member;
	}

	callExpr (caller) {
		let callExpr = {
			type: "CallExpr",
			caller: caller,
			args: this._args(),
			// TODO: change position
			pos: caller.pos
		};

		if (this.at().matches("closure", "(")) {
			callExpr = this.callExpr(callExpr);
		}

		return callExpr;
	}

	memberExpr () {
		let object = this.primaryExpr();

		while
			(!this.isEOF() &&
			(this.at().matches("symbol", ".") ||
			this.at().matches("closure", "[")))
		{
			let operator = this.yumToken();

			let property = null;
			let computed = null;

			if (operator.matches("symbol", ".")) {
				computed = false;
				property = this.primaryExpr();

				if (property.type != "Identifier") {
					throw new Error("Cannot use dot operator without an identifier", this.at().pos);
				}
			} else if (operator.matches("closure", "[")) {
				computed = true;
				property = this.expression();

				this.expect("closure", "]", new Error("Missing closing bracket in computed property", this.at().pos));
			}

			object = {
				type: "MemberExpr",
				object: object,
				property: property,
				computed: computed,
				pos: [object.pos[0], property.pos[1]]
			};
		}

		return object;
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