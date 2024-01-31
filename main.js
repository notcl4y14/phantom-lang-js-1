let util = require ("util");
let fs = require ("fs");
let Lexer = require ("./lang/Lexer.js");
let Parser = require ("./lang/Parser.js");
let Interpreter = require ("./lang/Interpreter.js");
let Environment = require ("./lang/Environment.js");

let logValue = (value) => console.log(util.inspect(value.value, {depth: null, colors: true}));
let logError = (value) => console.log(value.error._string());

let getFilenameFromArgs = function (args) {

	for (let arg of args) {
		if (arg[0] == "-") {
			continue;
		}

		return arg;
	}

}

let run = function(filename, code, args) {

	// Lexer
	let lexer = new Lexer(filename, code);
	let tokens = lexer.lexerize();

	if (args.includes("--lexer")) console.log(tokens);

	// Parser
	let parser = new Parser(tokens);
	let ast = parser.parse();

	if (ast.error) return logError(ast);
	if (args.includes("--parser")) logValue(ast);

	// Interpreter
	let env = new Environment();
	let interpreter = new Interpreter();
	let result = interpreter.primary(ast.value, env);

	if (result.error) return console.log(result.error._string());
	if (args.includes("--last-eval")) logValue(result);
	if (args.includes("--env")) console.log(util.inspect(env, {depth: null, colors: true}));

}

let main = function() {
	let args = [];
	process.argv.splice(0, 2);
	args = process.argv;
	let filename = getFilenameFromArgs(args);

	if (!filename) {
		return writeln( "Filename not specified!" );
	} else if (!fs.existsSync(filename)) {
		return writeln( `File '${filename}' not found!` );
	}

	let code = fs.readFileSync(filename, { mode: "r", encoding: "utf-8" });
	run(filename, code, args);
}
main();