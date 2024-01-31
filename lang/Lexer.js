let Position = require ("./Position.js");
let Token = require ("./Token.js");

let Lexer = class {
	constructor (filename, code) {
		this.code = code;
		this.pos = new Position(filename, -1, 0, -1);

		this.advance();
	}

	// -----------------------------------------------------------------------

	at (range = 1) {
		if (range > 1) return this.code.substr(this.pos.index, range);
		return this.code[this.pos.index];
	}

	next (delta = 1) {
		return this.code[this.pos.index + delta];
	}

	advance (delta = 1) {
		let prev = this.at();
		this.pos.advance(this.at(), delta);
		return prev;
	}

	isEOF () {
		return this.pos.index >= this.code.length;
	}

	// -----------------------------------------------------------------------

	lexerize () {
		let tokens = [];

		while (!this.isEOF()) {
			let pos = this.pos.clone();
			let token = this.lexerizeToken();

			if (token == null) {
				this.advance();
				continue;
			}

			if (!token.pos[0]) {
				token.pos[0] = pos.clone();
			}

			if (!token.pos[1]) {
				token.pos[1] = pos.clone().advance();
			}

			// if (token != null) tokens.push(token);
			tokens.push(token);

			this.advance();
		}

		tokens.push(
			new Token("EOF").setPos(
				this.pos.clone(),
				this.pos.clone().advance()
			)
		);

		return tokens;
	}

	lexerizeToken () {
		let char = this.at();

		if ((" \t\r\n").includes(this.at())) return (null);

		// Operator | Comment
		if (("+-*/%^!=<>").includes(this.at())) {
			let op = this.at();

			// += | -= | *= | /= | %= | ^= | <= | >= | == | !=
			if (this.next() == "=") {
				op += this.next();
				this.advance();

				return new Token("operator", op);
			}

			// ++ | --
			if
				(("+-").includes(this.at()) &&
				this.at() == this.next())
			{
				op += this.next();
				this.advance();

				return new Token("operator", op);
			}

			// Comment
			if (this.at() == "/" && this.next() == "/") {
				return this.lexerizeComment();
			} else if (this.at() == "/" && this.next() == "*") {
				return this.lexerizeMultComment();
			}
				
			return new Token("operator", op);
		}

		// Symbol
		else if ((".,:;&|").includes(this.at())) {
			return new Token("symbol", this.at());
		}

		// Closure
		else if (("()[]{}").includes(this.at())) {
			return new Token("closure", this.at());
		}

		// Number
		else if (("1234567890").includes(this.at())) {
			return this.lexerizeNumber();
		}

		// String
		else if (("\"'").includes(this.at())) {
			return this.lexerizeString();
		}

		// Identifier | Literal | Keyword
		return this.lexerizeIdentifier();
	}

	lexerizeComment () {
		let pos = this.pos.clone();
		let commentStr = "";

		this.advance();

		while (!this.isEOF() && this.at() != "\n") {
			commentStr += this.advance();
		}

		return new Token("comment", commentStr)
			.setPos(pos, this.pos.clone());
	}

	lexerizeMultComment () {
		let pos = this.pos.clone();
		let commentStr = "";

		this.advance();

		while (!this.isEOF() && this.at(2) != "*/") {
			commentStr += this.advance();
		}

		this.advance();

		return new Token("comment", commentStr)
			.setPos(pos, this.pos.clone());
	}

	lexerizeNumber () {
		let leftPos = this.pos.clone();
		let numStr = "";
		let float = false;

		while
			(!this.isEOF() &&
			("1234567890.").includes(this.at()))
		{
			if (this.at() == ".") {
				if (float) break;
				float = true;
			}

			numStr += this.at();
			this.advance();
		}

		let rightPos = this.pos.clone();

		this.advance(-1);

		return new Token("number", Number(numStr))
			.setPos(leftPos, rightPos);
	}

	lexerizeString () {
		let leftPos = this.pos.clone();
		let str = "";
		let quote = this.advance();

		while (!this.isEOF() && this.at() != quote) {
			str += this.advance();
		}

		let rightPos = this.pos.clone();

		return new Token("string", str)
			.setPos(leftPos, rightPos);
	}

	lexerizeIdentifier () {
		let leftPos = this.pos.clone();
		let identStr = "";

		while
			(!this.isEOF() &&
			!(" \t\r\n.,:;!&|\"'+-*/%^=()[]{}<>").includes(this.at()))
		{
			identStr += this.advance();
		}

		let rightPos = this.pos.clone();

		this.advance(-1);

		switch (identStr) {
			case "null":
			case "true":
			case "false":
				return new Token("literal", identStr)
					.setPos(leftPos, rightPos);

			case "let":
			case "if":
			case "else":
			case "while":
			case "for":
			case "function":
			case "delete":
				return new Token("keyword", identStr)
					.setPos(leftPos, rightPos);
		}

		return new Token("identifier", identStr)
			.setPos(leftPos, rightPos);
	}
}

module.exports = Lexer;