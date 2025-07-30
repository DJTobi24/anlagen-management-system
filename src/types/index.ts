export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  mandantId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  TECHNIKER = 'techniker',
  AUFNEHMER = 'aufnehmer',
  MITARBEITER = 'mitarbeiter',
  SUPERVISOR = 'supervisor'
}

export interface Mandant {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Liegenschaft {
  id: string;
  mandantId: string;
  name: string;
  address: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Objekt {
  id: string;
  liegenschaftId: string;
  name: string;
  description?: string;
  floor?: string;
  room?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Anlage {
  id: string;
  objektId: string;
  tNummer?: string;
  aksCode: string;
  qrCode: string;
  name: string;
  description?: string;
  status: AnlageStatus;
  zustandsBewertung: number;
  dynamicFields: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum AnlageStatus {
  AKTIV = 'aktiv',
  INAKTIV = 'inaktiv',
  WARTUNG = 'wartung',
  DEFEKT = 'defekt'
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: User;
  mandantId?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  mandantId: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}