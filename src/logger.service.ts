import { resolvePath } from './deps.ts';

const LogLevel = {
  debug: 0,
  log: 1,
  warn: 2,
  error: 3,
} as const;
type LogLevel = typeof LogLevel[keyof typeof LogLevel];

class Logger {
  #outputPath: string;
  #output: Deno.FsFile;
  #minimalLevel: LogLevel;

  constructor(outputPath: string, level?: LogLevel) {
    this.#outputPath = outputPath;
    this.#output = Deno.openSync(this.#outputPath, {
      write: true,
      createNew: true,
    });
    this.#minimalLevel = level ?? LogLevel.log;

    globalThis.addEventListener(
      'unload',
      this.#output.close.bind(this.#output),
    );

    this.log(`💡 Full logs will be stored at "${this.#outputPath}"`);
  }

  setLevel(level: LogLevel): void {
    this.#minimalLevel = level;
  }

  // deno-lint-ignore no-explicit-any
  #write(level: keyof typeof LogLevel, ...data: any[]): void {
    this.#output.writeSync(
      new TextEncoder().encode(
        `${
          JSON.stringify({
            time: new Date().toISOString(),
            level,
            data,
          })
        }\n`,
      ),
    );

    LogLevel[level] >= this.#minimalLevel && console[level](...data);
  }

  // deno-lint-ignore no-explicit-any
  debug(...data: any[]): void {
    this.#write('debug', ...data);
  }

  // deno-lint-ignore no-explicit-any
  log(...data: any[]): void {
    this.#write('log', ...data);
  }

  // deno-lint-ignore no-explicit-any
  warn(...data: any[]): void {
    this.#write('warn', ...data);
  }

  // deno-lint-ignore no-explicit-any
  error(...data: any[]): void {
    this.#write('error', ...data);
  }
}

const output = resolvePath(Deno.cwd(), `output-${Date.now()}.log`);

export const logger = new Logger(output);
export type LoggerService = Logger;
