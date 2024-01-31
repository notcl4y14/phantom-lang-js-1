# phantom-lang

This is a language that has a JS/TS-like syntax and is going to probably have some other features. Writing this made me feel like this is actually the same (except it has a different file including and type strictness) and I could use JS/TS instead.

Possible features:
- Different reference types
	+ Two-sided
	```ts
	let y = *x; // Two-sided, both can change each other
	```
	+ No reference
	```ts
	let y = &x; // No reference, neither can change each other
	```
	+ Default
	```ts
	let y = x; // Default, y can change x but x cannot change y
	```
- Different number size
	```ts
	let x: number = 2; // 32/64-bit
	let y: number<8> = 4; // 8-bit
	let z: number<32> = 1029443; // 32-bit
	let num: number<-1> = 0; // Error: invalid number size
	```

Example:
```ts
require ("Player.pha");

class Game {

	public display: Display;
	public engine: Engine;
	public world: World;

	public constructor () {
		this.display = new Display(window.getElementById("canvas"));
		this.engine = new Engine();
		this.world = new World();

		this.init_world();
	};

	public init_world () {
		this.world.add(new Player(20, 50));
	};

	// ...
}

let game: Game;

window.onload = function () {
	game = new Game();
	game.start();
}
```

The file extensions are:
- .pht
- .pha
- .phnt

Folders:
- lang: Language components, such as lexer, token and error
- tests: Different files to test the new features

TODO:
- Clean up the code