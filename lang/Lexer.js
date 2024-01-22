let Position = require("./Position.js");
let Token = require("./Token.js");

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
			let char = this.at();

			switch (char) {
				case " ":
				case "\t":
				case "\r":
				case "\n":
					break;

				// Behold, the will-need-to-fix mess of operators
				case "+":
					var op = this.at();

					if (this.next() == "=" || this.next() == "+") {
						op += this.next();
						this.advance();
					}

					tokens.push(new Token("operator", op));
					break;

				case "-":
					var op = this.at();

					if (this.next() == "=" || this.next() == "-") {
						op += this.next();
						this.advance();
					}

					tokens.push(new Token("operator", op));
					break;

				case "*":
					var op = this.at();

					if (this.next() == "=") {
						op += this.next();
						this.advance();
					}

					tokens.push(new Token("operator", op));
					break;

				case "/":
					var op = this.at();

					if (this.next() == "=" || this.next() == "/" || this.next() == "*") {
						op += this.next();
						this.advance();
					}

					if (op == "//") {
						tokens.push(this.lexerizeComment());
						break;
					} else if (op == "/*") {
						tokens.push(this.lexerizeMultComment());
						break;
					}

					tokens.push(new Token("operator", op));
					break;

				case "%":
					var op = this.at();

					if (this.next() == "=") {
						op += this.next();
						this.advance();
					}

					tokens.push(new Token("operator", op));
					break;

				case "^":
					var op = this.at();

					if (this.next() == "=") {
						op += this.next();
						this.advance();
					}

					tokens.push(new Token("operator", op));
					break;

				case "=":
					tokens.push(new Token("operator", this.at()));
					break;
			}

			this.advance();
		}

		tokens.push(new Token("EOF"));

		return tokens;
	}

	lexerizeComment () {
		let commentStr = "";

		this.advance();

		while (!this.isEOF() && this.at() != "\n") {
			commentStr += this.advance();
		}

		return new Token("comment", commentStr);
	}

	lexerizeMultComment () {
		let commentStr = "";

		this.advance();

		while (!this.isEOF() && this.at(2) != "*/") {
			commentStr += this.advance();
		}

		this.advance();

		return new Token("comment", commentStr);
	}
}

module.exports = Lexer;