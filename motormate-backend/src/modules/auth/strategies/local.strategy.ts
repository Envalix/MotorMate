import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  // Passport calls this with the extracted email + password from req.body.
  // Throwing here causes the guard to return 401 automatically.
  validate(email: string, password: string) {
    return this.authService.validateLocalUser(email, password);
  }
}
