import { createHttpHeaders } from '@typespec/ts-http-runtime'
import type { HttpClient, PipelineRequest, PipelineResponse } from '@typespec/ts-http-runtime'

import { ApiV1Client } from '@/api/generated'
import type { ApiError as ApiErrorBody } from '@/api/generated'
import { RestError } from '@/api/generated/helpers/error.js'

// Транспорт поверх глобального fetch: одинаково работает в браузере и тестах,
// поэтому запросы можно перехватывать через vi.stubGlobal('fetch', ...).
const fetchHttpClient: HttpClient = {
  async sendRequest(request: PipelineRequest): Promise<PipelineResponse> {
    const headers: Record<string, string> = {}
    for (const [name, value] of request.headers) {
      headers[name] = value
    }

    const response = await fetch(request.url, {
      method: request.method,
      headers,
      body: typeof request.body === 'string' ? request.body : undefined,
      signal: request.abortSignal,
    })

    return {
      request,
      status: response.status,
      headers: createHttpHeaders(Object.fromEntries(response.headers)),
      bodyAsText: await response.text(),
    }
  },
}

// Единый клиент сгенерированного SDK. Абсолютный origin нужен рантайму
// @typespec/ts-http-runtime; в dev-режиме запросы уходят через Vite-proxy.
export const api = new ApiV1Client({
  endpoint: window.location.origin,
  // Локальная разработка и тесты идут по http
  allowInsecureConnection: true,
  httpClient: fetchHttpClient,
  // Не ретраим: падение запроса должно сообщаться сразу (как раньше)
  retryOptions: { maxRetries: 0 },
})

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Достаёт человекочитаемое сообщение из тела ошибки: v1 `{ error: { message } }`
// либо легаси `{ error: 'текст' }`.
function messageFromBody(body: unknown): string | null {
  if (typeof body === 'string') {
    try {
      return messageFromBody(JSON.parse(body))
    } catch {
      return null
    }
  }

  if (body === null || typeof body !== 'object') {
    return null
  }

  const error = (body as { error?: unknown }).error

  if (typeof error === 'string' && error.trim() !== '') {
    return error
  }

  if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }

  return null
}

// Разворачивает результат SDK-операции: на успех возвращает модель,
// на ошибку — ApiError с сообщением из ответа.
export async function call<T>(promise: Promise<T | ApiErrorBody>): Promise<T> {
  try {
    return (await promise) as T
  } catch (error) {
    if (error instanceof RestError) {
      const message = messageFromBody(error.body) ?? `Ошибка запроса: ${error.status}`
      throw new ApiError(Number(error.status), message)
    }

    throw error
  }
}
