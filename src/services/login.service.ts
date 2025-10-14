import { Injectable, inject } from '@angular/core';
import { BrokerService } from './broker.service.js';
import { User } from '../models/user.model.js';

const SERVICE_NAME = 'loginService';

interface LoginResponse {
    token: string;
    user: {
        id: string;
        username: string;
        name: string;
        avatar: string;
        bio: string;
        displayName?: string;
    }
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private brokerService = inject(BrokerService);

  async login(brokerUrl: string, username: string, password: string): Promise<User> {
    const response = await this.brokerService.submitRequest<LoginResponse>(brokerUrl, SERVICE_NAME, 'login', {
        alias: username,
        identifier: password
    });
    
    if (!response || !response.user) {
        throw new Error('Login response is missing user data.');
    }
    
    const userDto = response.user;
    
    // Map from the DTO to the frontend User model.
    return {
        id: userDto.id,
        username: userDto.username,
        name: (userDto as any).displayName || userDto.name || '',
        avatar: userDto.avatar || '',
        bio: userDto.bio || ''
    };
  }
}
