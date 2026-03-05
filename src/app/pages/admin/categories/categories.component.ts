import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Still needed for some pipes if not fully signalized or for structural directives
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { CreateCategoryRequest, CategoryNode } from '../../../models/api.models';

@Component({
    selector: 'app-admin-categories',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './categories.component.html'
})
export class AdminCategories {
    categoryService = inject(CategoryService);
    fb = inject(FormBuilder);

    createForm = this.fb.group({
        name: ['', Validators.required],
        parentId: [0], // Default 0 for root
        sortOrder: [0],
        isVisible: [true]
    });

    isSubmitting = false;
    successMsg = '';
    editingId: number | null = null;

    constructor() {
        this.categoryService.getCategories().subscribe();
    }

    // Helper to flatten categories for the list and dropdown
    get flatCategories(): any[] {
        const flat: any[] = [];

        // Recursive helper
        const traverse = (nodes: CategoryNode[], level = 0) => {
            for (const node of nodes) {
                const prefix = '-- '.repeat(level);
                flat.push({
                    ...node.item,
                    displayName: prefix + node.item.name,
                    isRoot: level === 0
                });
                if (node.children && node.children.length > 0) {
                    traverse(node.children, level + 1);
                }
            }
        };

        traverse(this.categoryService.categories());
        return flat;
    }

    onSubmit() {
        if (this.createForm.valid) {
            this.isSubmitting = true;
            const formValue = this.createForm.value;

            if (this.editingId) {
                // Update
                const payload = {
                    categoryId: this.editingId,
                    name: formValue.name,
                    parentId: Number(formValue.parentId) || 0,
                    sortOrder: Number(formValue.sortOrder) || 0,
                    isVisible: formValue.isVisible !== false
                };

                console.log('Update payload:', payload); // Debug payload
                this.categoryService.updateCategory(payload).subscribe({
                    next: (res) => {
                        console.log('Update response:', res); // Debug response
                        this.isSubmitting = false;
                        if (res.isSuccess) {
                            this.successMsg = 'Cập nhật chuyên mục thành công!';
                            this.resetForm();
                            setTimeout(() => this.successMsg = '', 3000);
                        } else {
                            // Handle failure case
                            alert(res.message || 'Cập nhật thất bại');
                        }
                    },
                    error: (err) => {
                        this.isSubmitting = false;
                        console.error('Update error:', err);
                        alert('Đã xảy ra lỗi khi cập nhật');
                    }
                });
            } else {
                // Create
                const payload: CreateCategoryRequest = {
                    name: formValue.name!,
                    parentId: Number(formValue.parentId) || 0,
                    sortOrder: Number(formValue.sortOrder) || 0,
                    isVisible: formValue.isVisible !== false
                };

                console.log('Create payload:', payload); // Debug create payload
                this.categoryService.createCategory(payload).subscribe({
                    next: (res) => {
                        console.log('Create response:', res); // Debug response
                        this.isSubmitting = false;
                        if (res.isSuccess) {
                            this.successMsg = 'Thêm chuyên mục thành công!';
                            this.resetForm();
                            setTimeout(() => this.successMsg = '', 3000);
                        } else {
                            alert(res.message || 'Thêm mới thất bại');
                        }
                    },
                    error: (err) => {
                        this.isSubmitting = false;
                        console.error('Create error:', err);
                        alert('Đã xảy ra lỗi khi thêm mới');
                    }
                });
            }
        }
    }

    onEdit(cat: any) {
        this.editingId = cat.categoryId;

        // Fetch detail to be sure or just use the passed object? 
        // User provided an API for detail: getCategoryById. Let's use it to be safe, or just patch form if we have data.
        // The list might not have full details if it was a summary. But our CategoryNode seems to have it.
        // Let's call API as requested to demonstrate using the Detail API.

        this.categoryService.getCategoryById(cat.categoryId).subscribe(res => {
            if (res.isSuccess) {
                const data = res.data;
                this.createForm.patchValue({
                    name: data.name,
                    parentId: data.parentId || 0,
                    sortOrder: data.sortOrder,
                    isVisible: data.isVisible
                });
            }
        });
    }

    onDelete(id: number) {
        if (confirm('Bạn có chắc chắn muốn xóa chuyên mục này?')) {
            this.categoryService.deleteCategory(id).subscribe(res => {
                if (res.isSuccess) {
                    this.successMsg = 'Đã xóa chuyên mục.';
                    setTimeout(() => this.successMsg = '', 3000);
                }
            });
        }
    }

    cancelEdit() {
        this.resetForm();
    }

    private resetForm() {
        this.editingId = null;
        this.createForm.reset({ parentId: 0, sortOrder: 0, isVisible: true });
    }
}
