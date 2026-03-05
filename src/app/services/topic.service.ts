import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, TopicItem, CreateTopicRequest, UpdateTopicRequest } from '../models/api.models';

@Injectable({
    providedIn: 'root'
})
export class TopicService {
    private apiUrl = '/api/topics';

    constructor(private http: HttpClient) { }

    getTopics(): Observable<ApiResponse<TopicItem[]>> {
        return this.http.get<ApiResponse<TopicItem[]>>(`${this.apiUrl}`);
    }

    getTopicById(id: number): Observable<ApiResponse<TopicItem>> {
        return this.http.get<ApiResponse<TopicItem>>(`${this.apiUrl}/${id}`);
    }

    createTopic(payload: CreateTopicRequest): Observable<ApiResponse<TopicItem>> {
        return this.http.post<ApiResponse<TopicItem>>(`${this.apiUrl}/create`, payload);
    }

    updateTopic(payload: UpdateTopicRequest): Observable<ApiResponse<TopicItem>> {
        return this.http.put<ApiResponse<TopicItem>>(`${this.apiUrl}/update`, payload);
    }

    deleteTopic(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/delete/${id}`);
    }
}
