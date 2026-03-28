import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { InternalException } from '../../exception/internal.exception';

@Catch(InternalException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: InternalException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(exception.httpCode).json({
      statusCode: exception.httpCode,
      error: exception.name,
      message: exception.message,
    });
  }
}
