import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, UserItem, CreateUserRequest, UpdateUserRequest } from '../models/api.models';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = '/api/users';
    private http = inject(HttpClient);

    constructor() { }

    getUsers(): Observable<ApiResponse<UserItem[]>> {
        return this.http.get<ApiResponse<UserItem[]>>(this.apiUrl);
    }

    getUser(id: number): Observable<ApiResponse<UserItem>> {
        return this.http.get<ApiResponse<UserItem>>(`${this.apiUrl}/${id}`);
    }

    createUser(request: CreateUserRequest): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/create`, request);
    }

    updateUser(request: UpdateUserRequest): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/update`, request);
    }

    deleteUser(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/delete/${id}`);
    }
}
