import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { ApiResponse, User } from '../models/api.models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = '/api/auth';
    currentUser = signal<User | null>(null);
    private http = inject(HttpClient);
    private router = inject(Router);

    constructor() {
        this.loadUser();
    }

    private loadUser() {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
            try {
                const user: User = JSON.parse(userStr);
                this.setUser(user);
            } catch {
                this.logout();
            }
        }
    }

    private setUser(user: User) {
        // Nếu API dã trả về role trực tiếp (từ sửa đổi C# phía trên) ta dùng ưu tiên
        // Decode token to get role/claims if not already present or to validate
        if (user.accessToken) {
            try {
                const decoded: any = jwtDecode(user.accessToken);
                // Map standard claims or custom claims
                if (!user.role) {
                    user.role = decoded.role || decoded.unique_name || 'User';
                    const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
                    if (decoded[roleClaim]) {
                        user.role = decoded[roleClaim];
                    }
                }

                // Store/Update user
                this.currentUser.set(user);
            } catch (e) {
                console.error('Token decode failed', e);
                this.logout();
            }
        }
    }

    login(payload: any): Observable<ApiResponse<User>> {
        return this.http.post<ApiResponse<User>>(`${this.apiUrl}/login`, payload).pipe(
            tap({
                next: (response) => {
                    console.log('Login successful response:', response);
                    if (response.isSuccess && response.data) {
                        localStorage.setItem('currentUser', JSON.stringify(response.data));
                        this.setUser(response.data);
                    }
                },
                error: (error) => {
                    console.error('Login API error:', error);
                }
            })
        );
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser.set(null);
        this.router.navigate(['/']); // Redirect to home
    }

    get isLoggedIn(): boolean {
        return !!this.currentUser();
    }

    get isAdmin(): boolean {
        const user = this.currentUser();
        return user?.role === 'Admin';
    }
}
