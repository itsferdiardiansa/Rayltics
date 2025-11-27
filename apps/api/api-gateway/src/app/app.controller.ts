import {
  Controller,
  All,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import type { Request, Response } from 'express'
import { firstValueFrom } from 'rxjs'
import { catchError } from 'rxjs/operators'
import { AxiosError } from 'axios'

@Controller()
export class AppController {
  private AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3333'
  private MATH_URL = process.env.MATH_SERVICE_URL || 'http://math-service:3334'

  constructor(private readonly httpService: HttpService) {}

  @All('health')
  getHealth() {
    return { status: 'Gateway is running' }
  }

  /**
   * Matches /api/auth/* * Strips '/api/auth' so it forwards /login, /register, etc.
   */
  @All('auth/*splat')
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    // e.g. /api/auth/login -> http://auth-service:3333/login
    const target = `${this.AUTH_URL}${req.url.replace('/auth', '')}`

    console.log('Proxying Auth to:', target)
    await this.proxyRequest(req, res, target)
  }

  /**
   * Matches /api/calculations/*
   * Strips '/api' but KEEPS '/calculations' (assuming math-service uses that controller)
   */
  @All('calculations/*splat')
  async proxyMath(@Req() req: Request, @Res() res: Response) {
    // e.g. /api/calculations -> http://math-service:3334/calculations
    const target = `${this.MATH_URL}${req.url.replace('/calculations', '')}`

    console.log('Proxying Math to:', target)
    await this.proxyRequest(req, res, target)
  }

  /**
   * Generic Proxy Function
   */
  private async proxyRequest(req: Request, res: Response, targetUrl: string) {
    try {
      const { data, status } = await firstValueFrom(
        this.httpService
          .request({
            method: req.method,
            url: targetUrl,
            data: req.body,
            params: req.query,
            headers: {
              ...(req.headers.authorization
                ? { authorization: req.headers.authorization }
                : {}),
              'content-type': 'application/json',
            },
          })
          .pipe(
            catchError((error: AxiosError) => {
              const status =
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
              const data = error.response?.data || { message: error.message }

              throw new HttpException(data, status)
            })
          )
      )

      return res.status(status).json(data)
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR
      const response =
        error instanceof HttpException
          ? error.getResponse()
          : { message: 'Gateway Error' }
      return res.status(status).json(response)
    }
  }
}
