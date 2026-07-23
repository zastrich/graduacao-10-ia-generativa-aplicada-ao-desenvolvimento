/**
 * User Service — gerencia usuários administrativos.
 */

import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { config } from '../utils/config';
import { dynamoService } from './dynamoService';
import { generateToken } from '../utils/auth';
import { User, UserPublic, AuthResponse } from '../utils/types';

const TABLE = config.tables.users;

function toPublic(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

export const userService = {
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    // Verifica se email já existe
    const existing = await dynamoService.query(TABLE, { email }, 'email-index');
    if (existing.length > 0) {
      throw { statusCode: 409, message: 'Email já cadastrado' };
    }

    const passwordHash = await bcrypt.hash(password, config.auth.bcryptRounds);
    const user: User = {
      id: uuid(),
      email,
      passwordHash,
      name,
      createdAt: new Date().toISOString(),
    };

    await dynamoService.put(TABLE, user);
    const token = generateToken({ userId: user.id, email: user.email });

    return { token, user: toPublic(user) };
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const users = await dynamoService.query(TABLE, { email }, 'email-index');
    if (users.length === 0) {
      throw { statusCode: 401, message: 'Credenciais inválidas' };
    }

    const user = users[0] as User;
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw { statusCode: 401, message: 'Credenciais inválidas' };
    }

    const token = generateToken({ userId: user.id, email: user.email });
    return { token, user: toPublic(user) };
  },

  async listUsers(): Promise<UserPublic[]> {
    const users = await dynamoService.scan(TABLE) as User[];
    return users.map(toPublic);
  },

  async deleteUser(userId: string): Promise<void> {
    await dynamoService.delete(TABLE, { id: userId });
  },
};
