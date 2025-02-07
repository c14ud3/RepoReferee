import { Logger as PinoLogger } from "pino";

export class ProbotLogger {
  private logger: PinoLogger;

  constructor(logger: PinoLogger) {
    this.logger = logger;
  }

  info(message: string): void {
    this.logger.info(message);
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  error(message: string): void {
    this.logger.error(message);
  }

  debug(message: string): void {
    this.logger.debug(message);
  }
}
