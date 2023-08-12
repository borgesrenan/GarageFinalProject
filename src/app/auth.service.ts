// auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from './user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUser: User | null = null;

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Promise<boolean> {
    // Fazer a chamada para o backend para verificar as credenciais do usuário
    return this.http
      .post<any>('http://localhost:3000/api/login/verify', { email, password })
      .toPromise()
      .then((response) => {
        // Se o backend retornar um usuário válido, armazena-o como usuário logado
        // Caso contrário, limpa o usuário logado (caso haja)
        this.currentUser = response.user ? response.user : null;
        return !!this.currentUser;
      })
      .catch((error) => {
        console.error('Erro ao realizar login:', error);
        return false;
      });
  }

  logout(): void {
    // Limpa o usuário logado ao fazer logout
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    // Retorna o usuário logado ou null se não houver nenhum usuário logado
    return this.currentUser;
  }
}
