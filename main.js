let util = require ("util");
let Lexer = require ("./lang/Lexer.js");
let Parser = require ("./lang/Parser.js");

let main = function() {
	let lexer = new Lexer("<stdin>", "!(((1 + 1) + 1) + 1)");
	let tokens = lexer.lexerize();

	console.log( util.inspect(tokens, { depth: null, colors: true, }) );

	let parser = new Parser(tokens);
	let ast = parser.parse();

	console.log( util.inspect(ast, { depth: null, colors: true }) );
}
main();