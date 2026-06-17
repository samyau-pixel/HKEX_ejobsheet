import jwt from 'jsonwebtoken';
import { AuthPayload, User } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

export class AuthService {
  static generateToken(user: User): string {
    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    };

    return jwt.sign(payload, JWT_SECRET);
  }

  static verifyToken(token: string): AuthPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch (err) {
      return null;
    }
  }

  static decodeToken(token: string): AuthPayload | null {
    try {
      return jwt.decode(token) as AuthPayload | null;
    } catch (err) {
      return null;
    }
  }

  static isTokenExpired(payload: AuthPayload): boolean {
    return payload.exp < Math.floor(Date.now() / 1000);
  }
}
