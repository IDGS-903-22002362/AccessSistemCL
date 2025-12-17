import { Injectable, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { UsersService } from './users.service';
import { RolesService } from './roles.service';

export interface UserRoleData {
  roleName: string | null;
  roleId: string | null;
  loading: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserRoleService {
  private auth = inject(Auth);
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);

  private userRoleSubject = new BehaviorSubject<UserRoleData>({
    roleName: null,
    roleId: null,
    loading: true,
  });

  public userRole$ = this.userRoleSubject.asObservable();

  constructor() {
    this.initRoleListener();
  }

  private initRoleListener() {
    authState(this.auth).subscribe(async (user) => {
      if (!user || !user.email) {
        this.userRoleSubject.next({
          roleName: null,
          roleId: null,
          loading: false,
        });
        return;
      }

      try {
        await this.loadUserRole(user.email);
      } catch (error) {
        console.error('Error loading user role:', error);
        this.userRoleSubject.next({
          roleName: null,
          roleId: null,
          loading: false,
        });
      }
    });
  }

  async loadUserRole(email: string): Promise<void> {
    try {
      this.userRoleSubject.next({
        ...this.userRoleSubject.value,
        loading: true,
      });

      const userData = await this.usersService.getUserByEmail(email);

      if (!userData || !userData.role) {
        this.userRoleSubject.next({
          roleName: null,
          roleId: null,
          loading: false,
        });
        return;
      }

      const roles = await this.rolesService.getRoles();
      const role = roles.find((r) => r.id === userData.role);

      this.userRoleSubject.next({
        roleName: role?.name || null,
        roleId: userData.role,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading user role:', error);
      this.userRoleSubject.next({
        roleName: null,
        roleId: null,
        loading: false,
      });
    }
  }

  getCurrentRoleName(): string | null {
    return this.userRoleSubject.value.roleName;
  }

  getCurrentRoleId(): string | null {
    return this.userRoleSubject.value.roleId;
  }

  isLoading(): boolean {
    return this.userRoleSubject.value.loading;
  }

  async refreshRole(): Promise<void> {
    const user = this.auth.currentUser;
    if (user?.email) {
      await this.loadUserRole(user.email);
    }
  }
}
