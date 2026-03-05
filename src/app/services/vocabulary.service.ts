import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, VocabularyItem, CreateVocabularyRequest, UpdateVocabularyRequest, StudyItem, SubmitReviewRequest, GamificationProfile, SubmitXPResponse, ProgressItem } from '../models/api.models';

@Injectable({
    providedIn: 'root'
})
export class VocabularyService {
    private apiUrl = '/api/vocabularies';

    constructor(private http: HttpClient) { }

    getVocabulariesByTopic(topicId: number): Observable<ApiResponse<VocabularyItem[]>> {
        return this.http.get<ApiResponse<VocabularyItem[]>>(`${this.apiUrl}/topic/${topicId}`);
    }

    createVocabulary(payload: CreateVocabularyRequest): Observable<ApiResponse<VocabularyItem>> {
        return this.http.post<ApiResponse<VocabularyItem>>(`${this.apiUrl}/create`, payload);
    }

    updateVocabulary(payload: UpdateVocabularyRequest): Observable<ApiResponse<VocabularyItem>> {
        return this.http.put<ApiResponse<VocabularyItem>>(`${this.apiUrl}/update`, payload);
    }

    getStudyVocabularies(): Observable<ApiResponse<StudyItem[]>> {
        return this.http.get<ApiResponse<StudyItem[]>>(`${this.apiUrl}/study`);
    }

    getStudyVocabulariesByTopic(topicId: number): Observable<ApiResponse<StudyItem[]>> {
        return this.http.get<ApiResponse<StudyItem[]>>(`${this.apiUrl}/study/topic/${topicId}`);
    }

    submitReview(payload: SubmitReviewRequest): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/study/submit-review`, payload);
    }

    // --- Progress Management & Testing ---
    getVocabularyProgress(topicId?: number): Observable<ApiResponse<ProgressItem[]>> {
        return topicId
            ? this.http.get<ApiResponse<ProgressItem[]>>(`${this.apiUrl}/progress/topic/${topicId}`)
            : this.http.get<ApiResponse<ProgressItem[]>>(`${this.apiUrl}/progress`);
    }

    resetProgress(vocabId: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/progress/${vocabId}`);
    }

    resetTopicProgress(topicId: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/progress/topic/${topicId}`);
    }

    resetAllProgress(): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/progress/all`);
    }

    getLearnedWordsForTest(topicId?: number): Observable<ApiResponse<StudyItem[]>> {
        return topicId
            ? this.http.get<ApiResponse<StudyItem[]>>(`${this.apiUrl}/study/learned-test/topic/${topicId}`)
            : this.http.get<ApiResponse<StudyItem[]>>(`${this.apiUrl}/study/learned-test`);
    }

    // --- Gamification ---
    getGamificationProfile(): Observable<ApiResponse<GamificationProfile>> {
        return this.http.get<ApiResponse<GamificationProfile>>(`${this.apiUrl}/gamification/profile`);
    }

    submitXP(xpAmount: number): Observable<ApiResponse<SubmitXPResponse>> {
        return this.http.post<ApiResponse<SubmitXPResponse>>(`${this.apiUrl}/gamification/submit-xp/${xpAmount}`, {});
    }

    deleteVocabulary(id: number): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/delete/${id}`);
    }
}
