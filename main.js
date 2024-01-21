let Token = require("./lang/Token.js");

let main = function() {
	// console.log("Hello World!");
	let token = new Token("string", "Hello World!");
	console.log(token.string());
}
main();