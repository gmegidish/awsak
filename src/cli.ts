#!/usr/bin/env node
import {Command} from "commander";
import {AWSAK} from "./awsak";

class Swiss {

	private parse(argv: string[]) {

		const program = new Command();
		const awsak = new AWSAK();

		program
		.name('Another World Swiss Army Knife - awsak')
		.version('0.9.0');

		program
		.command('extract')
		.description('Extract files')
		.requiredOption('--indir <dir>', 'Specify input directory')
		.requiredOption('--outdir <dir>', 'Specify output directory')
		.action((options) => awsak.extract(options));

		program
		.command('pack')
		.description('Pack files')
		.requiredOption('--indir <dir>', 'Specify input directory')
		.requiredOption('--outdir <dir>', 'Specify output directory')
		.action((options) => awsak.pack(options));

		program
		.command('compile')
		.description("Compile assembly to bytecode")
		.requiredOption('--file <path>', 'Specify input filename to compile')
		.requiredOption('--outfile <path>', 'Specify output filename')
		.action((options) => awsak.compile(options));

		program
		.command('decompile')
		.description("Decompile bytecode into assembly")
		.requiredOption('--file <path>', 'Specify input filename to decompile')
		.action((options) => awsak.decompile(options));

		program
		.command('pic2bmp')
		.description("Convert a .pic resource to an 8-bit .bmp")
		.requiredOption('--pic <filename>', 'Specify resource .pic filename')
		.option('--palette <filename>', 'Specify resource .pal filename)')
		.option('--index <filename>', 'Palette index within resource (0-31)')
		.requiredOption('--output <filename>', 'Specify output filename (bmp)')
		.action((options: any) => awsak.pic2bmp(options));

		program
		.command('bmp2pic')
		.description("Convert a .bmp to background resource")
		.requiredOption('--bmp <path>', 'Specify input filename (bmp)')
		.requiredOption('--pic <path>', 'Specify output filename (eg 0013.pic)')
		.action((options: any) => awsak.bmp2pic(options));

		program.parse(argv);
	}

	public static main() {
		const ref = new Swiss();
		ref.parse(process.argv);
	}
}

Swiss.main();
