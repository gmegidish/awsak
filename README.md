# Another World Swiss Army Knife (awsak)

Another World Swiss Army Knife is a command-line tool for extracting and manipulating resources from Another World game for MSDOS.

At its current state, it's a very minimalistic and incomplete implementation, and was only used for [Another World Hebrew](https://github.com/gmegidish/another-world-hebrew) project.

For technical details about how this cli tool came to be, as well as other projects I've made during the years regarding Another World and Heart of The Alien, you are welcome to read at the [Another World Hebrew](https://github.com/gmegidish/another-world-hebrew) page. 

## Features

- Extract (unpack) resources from memlist
- Pack resources back into memlist
- Decompile bytecode into assembly code
- Compile assembly code into bytecode
- Convert background resource to a bmp
- Convert shapes into .svg files

## Installation

To get started, simply npm install *awsak* globally:

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
  extract [options]    Extract files
  pack [options]       Pack files
  compile [options]    Compile assembly to bytecode
  decompile [options]  Decompile bytecode into assembly
  pic2bmp [options]    Convert a .pic resource into .bmp
  help [command]       display help for command
```

## Extracting and Packing Resources

Awsak can extract and pack resources back to what is called a memlist. The MSDOS distribution of Another World included these files:

```text
ANOTHER.EXE
MEMLIST.BIN
BANK01
BANK02
BANK03
BANK04
BANK05
BANK06
BANK07
BANK08
BANK09
BANK0A
BANK0B
BANK0C
BANK0D
```

To extract resources, use the `extract` command. Where `disk` is the source directory that includes the files listed above.

```bash
awsak extract --indir disk --outdir resources
```

Upon completion, our `resources` directory will contains these files (and many others):

```text
0010.snd
0011.bin
0012.pic
0013.pic
0014.pal
0015.txt
0016.shp
```

While there are no filenames in the `memlist.bin` file, awsak will use the resource number as the filename, and the resource type as extension:

```text
snd - sound files
pic - 320x200 images (used for logos and some complicated backgrounds)
pal - palette files (32 palettes of 16 colors)
txt - script files
shp - shapes files (vector graphics)
```

To back the resources back into a memlist file, use the `pack` command. So to reverse the process, simply run

```bash
awsak pack --indir resources --outdir disk
```

One thing you will notice, is that current implementation does not support lzss compression when packing. This means that the output files are larger than the originals on disk.

## Modifying Scripts

Another World was written on an Amiga using GFA-Basic. It features a bytecode implementation (a virtual machine) that allowed it to be ported easily to every platform imagined. This virtual machine supports 64 threads running in cooperative mode, with maximum code size of 64KB, and a memory layout of 256 variables. 

Awsak can decompile this bytecode into assembly code, and then compile it back into bytecode form. It was important to keep the format of the files as close as to Eric Chahi's original implementation. You can refer to the technical explanation of the instruction set [here](https://anotherworld.fr/another_world.htm).  

![Screenshot of Eric's editor](https://anotherworld.fr/images/another_world/editeur2.gif)

An output disassembly file will look like this:

```javascript
        seti    v1      50
L0139:  break
        dbra    v1      L0139
        seti    v1      35
        seti    v255    5
L0146:  break
        text    400     3       168     11 // Good evening professor.
        dbra    v1      L0147
        seti    v1      49
        seti    v255    5
L0159:  break
        text    401     3       168     11 // I see you have driven here in your\nFerrari.
        dbra    v1      L0159
        setvec  8       L0290
        break
```

## Development

Once you git clone the repository, and install the dependencies, you are good to go.

You can run the cli without compiling it first using: 
```bash
ts-node src/cli.ts
```

Alternatively, if you want to make sure program is ready for distribution:
```bash
npm remove -g awsak
npm run build
npm install -g .
awsak --help
```

## Contribution

You might find awsak useful for your own project, but missing some functionality. If you want to help, please open an issue or a pull request. 

As a rule of thumb, it's always preferred to submit 50 small pull-requests than one unmaintainable patch. I'll do my best to review and merge as soon as possible.

## License

This project is licensed under the GPL License - see the [LICENSE](LICENSE) file for details

## References

* [Another World](https://www.mobygames.com/game/564/out-of-this-world/) on MobyGames
* [Another World](https://www.gog.com/en/game/another_world_20th_anniversary_edition) on GOG
* [Another World](https://anotherworld.fr/another_world.htm) on Eric Chahi's website. Includes screenshots of editor and assembly language.
* Cyx's [Another World Interpreter](https://github.com/cyxx/rawgl) with support for most released versions.
* [Fabien Sanglard's Another World](https://fabiensanglard.net/another_world_polygons/index.html) with detailed technical explanation of the game's engine.
