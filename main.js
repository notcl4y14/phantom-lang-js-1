let util = require ("util");
let Lexer = require ("./lang/Lexer.js");
let Parser = require ("./lang/Parser.js");
let Interpreter = require ("./lang/Interpreter.js");

let main = function() {
	let args = [];
	process.argv.splice(0, 2);
	args = process.argv;

	let lexer = new Lexer("<stdin>", "(((1 + 1) + 1) + 1)");
	let tokens = lexer.lexerize();

	if (args.includes("--lexer"))
		console.log( util.inspect(tokens, { depth: null, colors: true, }) );

	let parser = new Parser(tokens);
	let ast = parser.parse();

	if (ast.error) return console.log( ast.error._string() );

	if (args.includes("--parser"))
		console.log( util.inspect(ast.value, { depth: null, colors: true }) );

	let interpreter = new Interpreter();
	let result = interpreter.primary(ast.value);

	if (result.error) return console.log( result.error._string() );

	if (args.includes("--last-eval"))
		console.log( util.inspect(result.value, { depth: null, colors: true }) );
}
main();