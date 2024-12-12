import { logger } from './logger.js';

export class ApiError extends Error {
  constructor(service, operation, originalError) {
    const message = `${service} API error while ${operation}: ${originalError.message}`;
    super(message);
    this.name = 'ApiError';
    this.service = service;
    this.operation = operation;
    this.originalError = originalError;
    this.isAuthError = isAuthenticationError(originalError);
  }
}

function isAuthenticationError(error) {
  const authErrors = [
    'invalid_grant',
    'invalid_token',
    'expired_token',
    'unauthorized',
    '401'
  ];
  
  return authErrors.some(errType => 
    error.message.toLowerCase().includes(errType.toLowerCase()) ||
    error.code === 401
  );
}

export function handleApiError(service, operation, error) {
  const apiError = new ApiError(service, operation, error);
  
  if (apiError.isAuthError) {
    logger.error(`Authentication error with ${service} API. Please refresh your OAuth tokens.`);
    logger.error('To fix this:');
    logger.error('1. Generate new OAuth tokens through Google Cloud Console');
    logger.error('2. Update your tokens in the configuration');
    logger.error('3. Restart the application');
  } else {
    logger.error(`Error in ${service} API while ${operation}:`, error.message);
  }
  
  return apiError;
}
