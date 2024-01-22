// let Token = require("./lang/Token.js");
let Lexer = require("./lang/Lexer.js");

let main = function() {
	// console.log("Hello World!");
	// let token = new Token("string", "Hello World!");
	// console.log(token.string());
	let lexer = new Lexer("<stdin>", "+-*/%^ ++ -- += -= *= /= %= ^= =\n// a comment\n/* multiline\ncomment */");
	let tokens = lexer.lexerize();

	console.log(tokens);
	// console.log(lexer.pos);
	// console.log(lexer.pos.string(0));
	// console.log(lexer.pos.string(1));
	// console.log(lexer.pos.string(2));
	// console.log(lexer.pos.string(3));
}
main();