import { resolvePath } from './deps.ts';

const LogLevel = {
  debug: 0,
  log: 1,
  warn: 2,
  error: 3,
} as const;
type LogLevel = typeof LogLevel[keyof typeof LogLevel];

class LoggerService {
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
  }

  setLevel(level: LogLevel): void {
    this.#minimalLevel = level;
  }

  #write(level: keyof typeof LogLevel, ...data: any[]): void {
    for (const item of data) {
      this.#output.writeSync(
        new TextEncoder().encode(
          `${new Date().toISOString()}\t${level}\t${
            typeof item === 'string' ? item : JSON.stringify(item)
          }\n`,
        ),
      );
    }

    LogLevel[level] >= this.#minimalLevel && console[level](...data);
  }

  debug(...data: any[]): void {
    this.#write('debug', ...data);
  }

  log(...data: any[]): void {
    this.#write('log', ...data);
  }

  warn(...data: any[]): void {
    this.#write('warn', ...data);
  }

  error(...data: any[]): void {
    this.#write('error', ...data);
  }
}

const output = resolvePath(Deno.cwd(), `output-${Date.now()}.log`);
export const logger = new LoggerService(output);
