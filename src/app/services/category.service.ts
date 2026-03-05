import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse, CategoryNode, CreateCategoryRequest } from '../models/api.models';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private apiUrl = '/api';
    categories = signal<CategoryNode[]>([]);

    visibleCategories = computed(() => {
        const filterNodes = (nodes: CategoryNode[]): CategoryNode[] => {
            return nodes
                .filter(node => node.item.isVisible)
                .map(node => ({
                    ...node,
                    children: filterNodes(node.children || [])
                }));
        };
        return filterNodes(this.categories());
    });

    constructor(private http: HttpClient) { }

    getCategories(): Observable<ApiResponse<CategoryNode[]>> {
        return this.http.get<ApiResponse<CategoryNode[]>>(`${this.apiUrl}/categories`).pipe(
            tap(response => {
                if (response.isSuccess) {
                    this.categories.set(response.data);
                }
            })
        );
    }

    createCategory(payload: CreateCategoryRequest): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/categories/create`, payload).pipe(
            tap(response => {
                if (response.isSuccess) {
                    this.getCategories().subscribe();
                }
            })
        );
    }

    getCategoryById(id: number): Observable<ApiResponse<CategoryNode['item']>> {
        return this.http.get<ApiResponse<CategoryNode['item']>>(`${this.apiUrl}/categories/${id}`);
    }

    updateCategory(payload: any): Observable<ApiResponse<any>> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}/categories/update`, payload).pipe(
            tap(response => {
                if (response.isSuccess) {
                    this.getCategories().subscribe();
                }
            })
        );
    }

    deleteCategory(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/categories/delete/${id}`).pipe(
            tap(response => {
                if (response.isSuccess) {
                    this.getCategories().subscribe();
                }
            })
        );
    }
}
