import { InjectionToken } from '@angular/core';
import { AuthGateway } from '../ports/auth-gateway.port';
import { ProfileGateway } from '../ports/profile-gateway.port';

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY');
export const PROFILE_GATEWAY = new InjectionToken<ProfileGateway>('PROFILE_GATEWAY');
