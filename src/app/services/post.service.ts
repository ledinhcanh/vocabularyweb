import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PagedResponse, PostItem, PostSearchRequest, CreatePostRequest, UpdatePostRequest } from '../models/api.models';

@Injectable({
    providedIn: 'root'
})
export class PostService {
    private apiUrl = '/api/posts';

    constructor(private http: HttpClient) { }

    searchPosts(request: PostSearchRequest): Observable<PagedResponse<PostItem>> {
        return this.http.post<PagedResponse<PostItem>>(`${this.apiUrl}/search`, request);
    }

    getPostById(id: number): Observable<ApiResponse<PostItem>> {
        return this.http.get<ApiResponse<PostItem>>(`${this.apiUrl}/${id}`);
    }

    createPost(payload: CreatePostRequest): Observable<ApiResponse<number>> {
        return this.http.post<ApiResponse<number>>(`${this.apiUrl}`, payload);
    }

    updatePost(id: number, payload: UpdatePostRequest): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/${id}`, payload);
    }

    deletePost(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`);
    }
}
