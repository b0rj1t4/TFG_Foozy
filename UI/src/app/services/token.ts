import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private ready: Promise<void>;

  constructor(private storage: Storage) {
    this.ready = this.storage.create().then(() => {});
  }

  private async store(): Promise<Storage> {
    await this.ready;
    return this.storage;
  }

  async getAccessToken(): Promise<string | null> {
    return (await this.store()).get(ACCESS_TOKEN_KEY);
  }

  async getRefreshToken(): Promise<string | null> {
    return (await this.store()).get(REFRESH_TOKEN_KEY);
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    const s = await this.store();
    await Promise.all([
      s.set(ACCESS_TOKEN_KEY, accessToken),
      s.set(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  }

  async clearTokens(): Promise<void> {
    const s = await this.store();
    await Promise.all([
      s.remove(ACCESS_TOKEN_KEY),
      s.remove(REFRESH_TOKEN_KEY),
    ]);
  }
}
