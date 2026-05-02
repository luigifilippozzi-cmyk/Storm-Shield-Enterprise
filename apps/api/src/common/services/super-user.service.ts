import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SuperUserService {
  private readonly primaryEmail: string;
  private readonly backupEmail: string;
  private readonly backupActive: boolean;

  constructor(private readonly config: ConfigService) {
    this.primaryEmail = (config.get<string>('SUPER_USER_EMAIL', '')).toLowerCase().trim();
    this.backupEmail = (config.get<string>('SUPER_USER_BACKUP_EMAIL', '')).toLowerCase().trim();
    this.backupActive = config.get<string>('SUPER_USER_BACKUP_ACTIVE', 'false') === 'true';
  }

  isSuperUser(email: string): boolean {
    if (!email) return false;
    const normalized = email.toLowerCase().trim();
    if (this.primaryEmail && normalized === this.primaryEmail) return true;
    if (this.backupActive && this.backupEmail && normalized === this.backupEmail) return true;
    return false;
  }

  isConfigured(): boolean {
    return !!this.primaryEmail;
  }
}
