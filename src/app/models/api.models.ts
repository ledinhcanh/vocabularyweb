export interface ApiResponse<T> {
    isSuccess: boolean;
    message: string;
    data: T;
}

export interface User {
    accessToken: string;
    validFrom: string;
    validTo: string;
    unique_name?: string; // JWT claim often appearing as unique_name
    role?: string;
    fullName?: string;
}


export interface CategoryItem {
    categoryId: number;
    parentId: number | null;
    name: string;
    slug: string;
    sortOrder: number;
    isVisible: boolean;
    level?: number;
    treePath?: string;
}

export interface CategoryNode {
    item: CategoryItem;
    children: CategoryNode[];
}

export interface CreateCategoryRequest {
    name: string;
    parentId: number;
    sortOrder: number;
    isVisible: boolean;
}

export interface UpdateCategoryRequest extends CreateCategoryRequest {
    categoryId: number;
}
export interface PagingInfo {
    pageIndex: number;
    pageSize: number;
    currentItemCount: number;
    totalRows: number;
    totalPages: number;
}

export interface PagedResponse<T> {
    isSuccess: boolean;
    message: string;
    paging: PagingInfo;
    data: T[];
}

export interface PostItem {
    postId: number;
    categoryId: number;
    title: string;
    summary: string;
    createdAt: string;
    thumbnailUrl: string;
    content?: string;
    viewCount?: number;
    slug?: string | null;
    categorySeo?: string;
    shareUrl?: string;
    isPublished?: boolean;
}

export interface PostSearchRequest {
    pageIndex: number;
    pageSize: number;
    postId?: number;
    keySearch?: string;
    isPublished?: boolean;
}

export interface CreatePostRequest {
    title: string;
    summary: string;
    content: string;
    thumbnailUrl: string;
    categoryId: number;
    isPublished: boolean;
}

export interface UpdatePostRequest extends CreatePostRequest {
    postId: number;
}

export interface TopicItem {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
}

export interface CreateTopicRequest {
    name: string;
    description: string;
    imageUrl: string;
}

export interface UpdateTopicRequest extends CreateTopicRequest {
    id: number;
}

export interface VocabularyItem {
    id: number;
    topicId: number;
    word: string;
    meaning: string;
    phonetic: string | null;
    audioUrl: string | null;
    imageUrl: string | null;
    exampleSentence: string | null;
    createdDate?: string;
}

export interface CreateVocabularyRequest {
    topicId: number;
    word: string;
    meaning: string;
    phonetic?: string | null;
    audioUrl?: string | null;
    imageUrl?: string | null;
    exampleSentence?: string | null;
}

export interface UpdateVocabularyRequest extends CreateVocabularyRequest {
    id: number;
}

export interface SubmitReviewRequest {
    vocabId: number;
    quality: number; // 0-5
}

export interface StudyItem {
    vocab: VocabularyItem;
    progressId: number;
    type: string;
    easeFactor: number;
    repetitions: number;
}

export interface ProgressItem {
    vocab: VocabularyItem;
    progress: any; // Mapped from LearningProgress (has EaseFactor, Repetitions, NextReviewDate, etc.)
}

// --- Gamification ---
export interface GamificationProfile {
    xp: number;
    level: number;
    streak: number;
    lastStudyDate: string;
}

export interface SubmitXPResponse {
    xp: number;
    level: number;
    streak: number;
}

// --- User Management ---
export interface UserItem {
    userId: number;
    username: string;
    fullName: string | null;
    email: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
}

export interface CreateUserRequest {
    username: string;
    password?: string;
    fullName?: string | null;
    email?: string | null;
    role: string;
    isActive: boolean;
}

export interface UpdateUserRequest {
    userId: number;
    fullName?: string | null;
    email?: string | null;
    role: string;
    isActive: boolean;
    newPassword?: string | null;
}
