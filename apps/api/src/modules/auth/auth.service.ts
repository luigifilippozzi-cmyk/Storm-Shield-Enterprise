import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async login(_credentials: any) {
    // TODO: Implement Auth0/Clerk integration
    return { message: 'Auth service - login endpoint' };
  }

  async validateToken(_token: string) {
    // TODO: Validate JWT token
    return null;
  }
}
