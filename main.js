let util = require ("util");
let fs = require ("fs");

let getFilenameFromArgs = function (args) {

	for (let arg of args) {
		if (arg[0] == "-") {
			continue;
		}

		return arg;
	}

}

let loadStd = function (env) {
	let RuntimeValue = require("./lang/RuntimeValue.js");

	env.declare("log", new RuntimeValue("object", {
		"write": new RuntimeValue("function", function (args, env) {
			process.stdout.write(args[0]._string());

			if (args.length <= 1) {
				return new RuntimeValue("null", null);
			}

			for (let i = 1; i < args.length; i += 1) {
				process.stdout.write(" " + args[i]._string());
			}
		}),

		"writeln": new RuntimeValue("function", function(args, env) {
			process.stdout.write(args[0]._string());

			if (args.length <= 1) {
				process.stdout.write("\n");
				return new RuntimeValue("null", null);
			}

			for (let i = 1; i < args.length; i += 1) {
				process.stdout.write(" " + args[i]._string());
			}

			process.stdout.write("\n");
		}),

		"jsCall": new RuntimeValue("function", function(args, env) {
			try {
				return RuntimeValue.toRtValue(eval(args[0]._string()));
			} catch (e) {
				return new RuntimeValue("string", `${e}`);
			}
		}),

		"setObjectProperty": new RuntimeValue("function", function(args, env) {
			let path = [];

			for (let i = 1; i < args.length; i += 1) {
				if (i == args.length - 1) {
					let current = env.variables[args[0]._string()].value.value;

					for (let j = 0; j < path.length; j += 1) {
						current = current[path[j]].value;
						if (!current) return new RuntimeValue("null", null);
					}

					current = args[i];
					return new RuntimeValue("null", null);
				}

				path.push(args[i]._string());
			}
		})
	}), "object");
}

let run = function(filename, code, args) {

	let Lexer = require ("./lang/Lexer.js");
	let Parser = require ("./lang/Parser.js");
	let Interpreter = require ("./lang/Interpreter.js");
	let Environment = require ("./lang/Environment.js");

	// Lexer
	let lexer = new Lexer(filename, code);
	let tokens = lexer.lexerize();

	if (args.includes("--lexer")) console.log(tokens);

	// Parser
	let parser = new Parser(tokens);
	let ast;

	try {
		ast = parser.parse();
	} catch (error) {
		if (!error._string) {
			return console.error(error);
		}

		return console.log(error._string());
	}

	if (args.includes("--parser")) console.log(util.inspect(ast, {depth: null, colors: true}));

	// Interpreter
	let env = new Environment();
	loadStd(env);
	let interpreter = new Interpreter();
	let result = null;

	try {
		result = interpreter.primary(ast, env);
	} catch (error) {
		if (!error._string) {
			return console.error(error);
		}
		
		return console.log(error._string());
	}

	if (args.includes("--last-eval")) console.log(result);
	if (args.includes("--env")) console.log(util.inspect(env, {depth: null, colors: true}));

}

let main = function() {
	let args = [];
	process.argv.splice(0, 2);
	args = process.argv;
	let filename = getFilenameFromArgs(args);

	if (!filename) {
		return console.log( "Filename not specified!" );
	} else if (!fs.existsSync(filename)) {
		return console.log( `File '${filename}' not found!` );
	}

	let code = fs.readFileSync(filename, { mode: "r", encoding: "utf-8" });
	run(filename, code, args);
}
main();