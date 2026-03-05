import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { UserItem, CreateUserRequest, UpdateUserRequest } from '../../../models/api.models';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './users.component.html'
})
export class UsersComponent implements OnInit {
    private userService = inject(UserService);
    private fb = inject(FormBuilder);

    users = signal<UserItem[]>([]);
    showForm = false;
    editingId: number | null = null;
    isSubmitting = false;
    successMsg = '';
    errorMsg = '';

    userForm: FormGroup = this.fb.group({
        username: ['', Validators.required],
        password: [''], // Bắt buộc khi tạo, tùy chọn khi sửa
        fullName: [''],
        email: ['', Validators.email],
        role: ['User', Validators.required],
        isActive: [true]
    });

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.userService.getUsers().subscribe(res => {
            if (res.isSuccess && res.data) {
                this.users.set(res.data);
            }
        });
    }

    toggleForm() {
        this.showForm = !this.showForm;
        if (!this.showForm) {
            this.resetForm();
        } else {
            // Khi mở form thêm mới, password là bắt buộc
            this.userForm.get('password')?.setValidators(Validators.required);
            this.userForm.get('password')?.updateValueAndValidity();
        }
    }

    onEdit(user: UserItem) {
        this.showForm = true;
        this.editingId = user.userId;
        this.errorMsg = '';

        // Khi sửa không bắt buộc password
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();

        this.userForm.patchValue({
            username: user.username,
            password: '', // Không tải password về UI
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        });

        // Disable sửa user name
        this.userForm.get('username')?.disable();
    }

    onDelete(id: number) {
        if (confirm('Bạn có chắc chắn muốn xóa tài khoản này? Hành động này rất nguy hiểm.')) {
            this.userService.deleteUser(id).subscribe(res => {
                if (res.isSuccess) {
                    this.loadUsers();
                    this.showSuccess('Xóa tài khoản thành công!');
                } else {
                    this.showError(res.message || 'Lỗi khi xóa.');
                }
            });
        }
    }

    onSubmit() {
        if (this.userForm.invalid) return;

        this.isSubmitting = true;
        this.errorMsg = '';
        const formValue = this.userForm.getRawValue();

        if (this.editingId) {
            // Logic cập nhật
            const updateData: UpdateUserRequest = {
                userId: this.editingId,
                fullName: formValue.fullName,
                email: formValue.email,
                role: formValue.role,
                isActive: formValue.isActive,
                newPassword: formValue.password ? formValue.password : null
            };

            this.userService.updateUser(updateData).subscribe({
                next: (res) => {
                    this.isSubmitting = false;
                    if (res.isSuccess) {
                        this.showSuccess('Cập nhật thành công!');
                        this.loadUsers();
                        this.resetForm();
                    } else {
                        this.showError(res.message || 'Cập nhật thất bại.');
                    }
                },
                error: (err) => {
                    this.isSubmitting = false;
                    this.showError('Đã xảy ra lỗi.');
                }
            });
        } else {
            // Logic thêm mới
            const createData: CreateUserRequest = {
                username: formValue.username,
                password: formValue.password,
                fullName: formValue.fullName,
                email: formValue.email,
                role: formValue.role,
                isActive: formValue.isActive
            };

            this.userService.createUser(createData).subscribe({
                next: (res) => {
                    this.isSubmitting = false;
                    if (res.isSuccess) {
                        this.showSuccess('Tạo tài khoản thành công!');
                        this.loadUsers();
                        this.resetForm();
                    } else {
                        this.showError(res.message || 'Tạo thất bại.');
                    }
                },
                error: (err) => {
                    this.isSubmitting = false;
                    this.showError('Đã xảy ra lỗi hệ thống.');
                }
            });
        }
    }

    cancelEdit() {
        this.resetForm();
    }

    private resetForm() {
        this.showForm = false;
        this.editingId = null;
        this.userForm.get('username')?.enable();
        this.userForm.reset({
            role: 'User',
            isActive: true
        });
    }

    private showSuccess(msg: string) {
        this.successMsg = msg;
        setTimeout(() => this.successMsg = '', 3000);
    }

    private showError(msg: string) {
        this.errorMsg = msg;
        setTimeout(() => this.errorMsg = '', 4000);
    }
}
