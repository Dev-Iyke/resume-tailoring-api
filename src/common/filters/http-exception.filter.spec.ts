import {
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { HttpExceptionFilter } from './http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  const response = {};
  const httpAdapter = { reply: vi.fn() };
  const adapterHost = { httpAdapter } as unknown as HttpAdapterHost;
  const context = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as never;
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    vi.clearAllMocks();
    filter = new HttpExceptionFilter(adapterHost);
  });

  it('normalizes HTTP exceptions to the documented error shape', () => {
    filter.catch(new BadRequestException('Invalid request body.'), context);

    expect(httpAdapter.reply).toHaveBeenCalledWith(
      response,
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body.',
        },
      },
      HttpStatus.BAD_REQUEST,
    );
  });

  it('joins validation messages into one message', () => {
    filter.catch(
      new BadRequestException({ message: ['email must be valid', 'name required'] }),
      context,
    );

    expect(httpAdapter.reply).toHaveBeenCalledWith(
      response,
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'email must be valid; name required',
        },
      },
      HttpStatus.BAD_REQUEST,
    );
  });

  it('does not expose details from unexpected server errors', () => {
    filter.catch(new Error('database password or stack detail'), context);

    expect(httpAdapter.reply).toHaveBeenCalledWith(
      response,
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error.',
        },
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });

  it('preserves the status and message from non-validation HTTP exceptions', () => {
    filter.catch(new HttpException('Not allowed.', HttpStatus.FORBIDDEN), context);

    expect(httpAdapter.reply).toHaveBeenCalledWith(
      response,
      { error: { code: 'FORBIDDEN', message: 'Not allowed.' } },
      HttpStatus.FORBIDDEN,
    );
  });
});
