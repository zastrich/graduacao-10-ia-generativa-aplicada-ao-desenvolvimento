import { APIGatewayProxyEvent } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { unauthorized } from './response';

const JWT_SECRET = process.env.JWT_SECRET || 'copiloto-jwt-secret-dev';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function extractTokenFromEvent(event: APIGatewayProxyEvent): string | null {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}

export function authenticateEvent(event: APIGatewayProxyEvent): JwtPayload | null {
  const token = extractTokenFromEvent(event);
  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function requireAuth(event: APIGatewayProxyEvent) {
  const user = authenticateEvent(event);
  if (!user) {
    throw { statusCode: 401, message: 'Unauthorized' };
  }
  return user;
}
