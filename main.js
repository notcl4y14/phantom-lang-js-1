let util = require ("util");
let Lexer = require ("./lang/Lexer.js");

let main = function() {
	let lexer = new Lexer("<stdin>", "10 + 4\n\"lol\" 'a' \"string in a 'string'\"\nlet x = 5;\nlet y = (x + 10);\nlet π = 3.14;");
	let tokens = lexer.lexerize();

	console.log( util.inspect(tokens, { depth: null, colors: true, }) );
}
main();