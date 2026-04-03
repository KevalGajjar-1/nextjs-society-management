import { ApiResponse } from './types'

/**
 * Create successful API response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  }
}

/**
 * Create error API response
 */
export function errorResponse(error: string, details?: any): ApiResponse {
  console.error('[v0] API Error:', error, details)
  return {
    success: false,
    error,
  }
}

/**
 * Handle API errors with consistent format
 */
export function handleApiError(error: any): ApiResponse {
  if (error instanceof Error) {
    return errorResponse(error.message)
  }

  if (typeof error === 'string') {
    return errorResponse(error)
  }

  return errorResponse('An unexpected error occurred')
}
