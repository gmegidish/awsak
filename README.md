# Another World Swiss Army Knife (awsak)

Another World Swiss Army Knife is a command-line tool for extracting and manipulating resources from Another World game for MSDOS.

At its current state, it's a very minimalistic and incomplete implementation, and was only used for [Another World Hebrew](https://github.com/gmegidish/another-world-hebrew) project.

For technical details about how this cli tool came to be, as well as other projects I've made during the years regarding Another World and Heart of The Alien, you are welcome to read at the [Another World Hebrew](https://github.com/gmegidish/another-world-hebrew) page. 

## Features

- Extract (unpack) resources from memlist
- Pack resources back into memlist
- Decompile bytecode into assembly code
- Compile assembly code into bytecode
- Convert background resource to a pgm
- Convert shapes into .svg files

## Installation

To get started, simply npm install awsak globally:

```bash
npm install -g git+https://github.com/gmegidish/awsak.git
```

or just git clone this repository manually with
```bash
git clone https://github.com/gmegidish/awsak.git
```

## Usage

```bash
awsak --help
```

```text
Usage: Another World Swiss Army Knife - awsak [options] [command]

Options:
  -V, --version        output the version number
  -h, --help           display help for command

Commands:
  extract              Extract files
  pack [options]       Pack files
  compile [options]    Compile assembly to bytecode
  decompile [options]  Decompile bytecode into assembly
  scr2pgm [options]    Convert background resource to a pgm
  pal2act [options]    Convert a single palette into photoshop act format
  pgm2scr [options]    Convert a png to background resource
  help [command]       display help for command
```

Each command has its own help, for example:
```bash
awsak compile --help
```

## Contribution

You might find awsak useful for your own project, but missing some functionality. If you want to help, please open an issue or a pull request. 

As a rule of thumb, it's always preferred to submit 50 small pull-requests than one unmaintainable patch. I'll do my best to review and merge as soon as possible.

## License

This project is licensed under the GPL License - see the [LICENSE](LICENSE) file for details

## References

* [Another World](https://www.mobygames.com/game/another-world) on MobyGames
* [Another World](https://www.gog.com/game/another_world) on GOG
* [Another World](https://anotherworld.fr/another_world.htm) on Eric Chahi's website. Includes screenshots of editor and assembly language.
* Cyx's [Another World Interpreter](https://github.com/cyxx/rawgl) with support for most released versions.
* [Fabien Sanglard's Another World](https://fabiensanglard.net/another_world_polygons/index.html) with detailed technical explanation of the game's engine.
