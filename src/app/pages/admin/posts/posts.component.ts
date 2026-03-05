import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { PostService } from '../../../services/post.service';
import { CategoryService } from '../../../services/category.service';
import { PostItem, PostSearchRequest, CreatePostRequest, CategoryNode } from '../../../models/api.models';

@Component({
    selector: 'app-admin-posts',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './posts.component.html'
})
export class AdminPosts implements OnInit {
    postService = inject(PostService);
    categoryService = inject(CategoryService);
    fb = inject(FormBuilder);

    posts = signal<PostItem[]>([]);
    totalRows = signal(0);
    pageIndex = signal(0);
    pageSize = 10;

    postForm = this.fb.group({
        title: ['', Validators.required],
        summary: ['', Validators.required],
        content: ['', Validators.required],
        thumbnailUrl: [''],
        categoryId: [0, [Validators.required, Validators.min(1)]],
        isPublished: [true]
    });

    searchForm = this.fb.group({
        keySearch: ['']
    });

    isSubmitting = false;
    successMsg = '';
    editingId: number | null = null;
    showForm = false;

    constructor() { }

    ngOnInit() {
        this.loadPosts();
        this.categoryService.getCategories().subscribe();
    }

    loadPosts() {
        const request: PostSearchRequest = {
            pageIndex: this.pageIndex(),
            pageSize: this.pageSize,
            keySearch: this.searchForm.value.keySearch || undefined
        };

        this.postService.searchPosts(request).subscribe(res => {
            if (res.isSuccess) {
                this.posts.set(res.data);
                this.totalRows.set(res.paging.totalRows);
            }
        });
    }

    onSearch() {
        this.pageIndex.set(0);
        this.loadPosts();
    }

    onPageChange(index: number) {
        this.pageIndex.set(index);
        this.loadPosts();
    }

    toggleForm() {
        this.showForm = !this.showForm;
        if (!this.showForm) {
            this.resetForm();
        }
    }

    onSubmit() {
        if (this.postForm.valid) {
            this.isSubmitting = true;
            const formValue = this.postForm.value;

            if (this.editingId) {
                const payload = {
                    postId: this.editingId,
                    title: formValue.title!,
                    summary: formValue.summary!,
                    content: formValue.content!,
                    thumbnailUrl: formValue.thumbnailUrl || '',
                    categoryId: Number(formValue.categoryId),
                    isPublished: formValue.isPublished !== false
                };

                this.postService.updatePost(this.editingId, payload).subscribe({
                    next: (res) => {
                        this.isSubmitting = false;
                        if (res.isSuccess) {
                            this.successMsg = 'Cập nhật bài viết thành công!';
                            this.resetForm();
                            this.loadPosts();
                            setTimeout(() => this.successMsg = '', 3000);
                        } else {
                            alert(res.message || 'Cập nhật thất bại');
                        }
                    },
                    error: (err) => {
                        this.isSubmitting = false;
                        alert('Đã xảy ra lỗi khi cập nhật');
                    }
                });
            } else {
                const payload: CreatePostRequest = {
                    title: formValue.title!,
                    summary: formValue.summary!,
                    content: formValue.content!,
                    thumbnailUrl: formValue.thumbnailUrl || '',
                    categoryId: Number(formValue.categoryId),
                    isPublished: formValue.isPublished !== false
                };

                this.postService.createPost(payload).subscribe({
                    next: (res) => {
                        this.isSubmitting = false;
                        if (res.isSuccess) {
                            this.successMsg = 'Thêm bài viết thành công!';
                            this.resetForm();
                            this.loadPosts();
                            setTimeout(() => this.successMsg = '', 3000);
                        } else {
                            alert(res.message || 'Thêm mới thất bại');
                        }
                    },
                    error: (err) => {
                        this.isSubmitting = false;
                        alert('Đã xảy ra lỗi khi thêm mới');
                    }
                });
            }
        }
    }

    onEdit(post: PostItem) {
        this.editingId = post.postId;
        this.showForm = true;
        this.postService.getPostById(post.postId).subscribe(res => {
            if (res.isSuccess) {
                const data = res.data;
                this.postForm.patchValue({
                    title: data.title,
                    summary: data.summary,
                    content: data.content,
                    thumbnailUrl: data.thumbnailUrl,
                    categoryId: data.categoryId,
                    isPublished: data.isPublished
                });
            }
        });
    }

    onDelete(id: number) {
        if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
            this.postService.deletePost(id).subscribe(res => {
                if (res.isSuccess) {
                    this.successMsg = 'Đã xóa bài viết.';
                    this.loadPosts();
                    setTimeout(() => this.successMsg = '', 3000);
                }
            });
        }
    }

    private resetForm() {
        this.editingId = null;
        this.showForm = false;
        this.postForm.reset({ isPublished: true, categoryId: 0 });
    }

    get flatCategories(): any[] {
        const flat: any[] = [];
        const traverse = (nodes: CategoryNode[], level = 0) => {
            for (const node of nodes) {
                const prefix = '-- '.repeat(level);
                flat.push({
                    ...node.item,
                    displayName: prefix + node.item.name
                });
                if (node.children && node.children.length > 0) {
                    traverse(node.children, level + 1);
                }
            }
        };
        traverse(this.categoryService.categories());
        return flat;
    }

    get totalPages(): number {
        return Math.ceil(this.totalRows() / this.pageSize);
    }

    get pageNumbers(): number[] {
        return Array.from({ length: this.totalPages }, (_, i) => i);
    }

    getThumbnailUrl(url: string | undefined): string {
        if (!url || url.trim() === '' || url.includes('/string')) {
            return 'https://placehold.co/200x200?text=No+Image';
        }
        return url;
    }
}
