import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TopicService } from '../../../services/topic.service';
import { TopicItem, CreateTopicRequest, UpdateTopicRequest } from '../../../models/api.models';

@Component({
    selector: 'app-admin-topics',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './topics.component.html'
})
export class AdminTopics implements OnInit {
    topicService = inject(TopicService);
    fb = inject(FormBuilder);

    topics = signal<TopicItem[]>([]);

    topicForm = this.fb.group({
        name: ['', Validators.required],
        description: ['', Validators.required],
        imageUrl: ['']
    });

    isSubmitting = false;
    successMsg = '';
    editingId: number | null = null;
    showForm = false;

    constructor() { }

    ngOnInit() {
        this.loadTopics();
    }

    loadTopics() {
        this.topicService.getTopics().subscribe(res => {
            if (res.isSuccess) {
                this.topics.set(res.data);
            }
        });
    }

    toggleForm() {
        this.showForm = !this.showForm;
        if (!this.showForm) {
            this.resetForm();
        }
    }

    onSubmit() {
        if (this.topicForm.valid) {
            this.isSubmitting = true;
            const formValue = this.topicForm.value;

            if (this.editingId) {
                const payload: UpdateTopicRequest = {
                    id: this.editingId,
                    name: formValue.name!,
                    description: formValue.description!,
                    imageUrl: formValue.imageUrl || ''
                };

                this.topicService.updateTopic(payload).subscribe({
                    next: (res) => {
                        this.isSubmitting = false;
                        if (res.isSuccess) {
                            this.successMsg = 'Cập nhật chủ đề thành công!';
                            this.resetForm();
                            this.loadTopics();
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
                const payload: CreateTopicRequest = {
                    name: formValue.name!,
                    description: formValue.description!,
                    imageUrl: formValue.imageUrl || ''
                };

                this.topicService.createTopic(payload).subscribe({
                    next: (res) => {
                        this.isSubmitting = false;
                        if (res.isSuccess) {
                            this.successMsg = 'Thêm chủ đề thành công!';
                            this.resetForm();
                            this.loadTopics();
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

    onEdit(topic: TopicItem) {
        this.editingId = topic.id;
        this.showForm = true;
        this.topicForm.patchValue({
            name: topic.name,
            description: topic.description,
            imageUrl: topic.imageUrl
        });
    }

    onDelete(id: number) {
        if (confirm('Bạn có chắc chắn muốn xóa chủ đề này?')) {
            this.topicService.deleteTopic(id).subscribe(res => {
                if (res.isSuccess) {
                    this.successMsg = 'Đã xóa chủ đề.';
                    this.loadTopics();
                    setTimeout(() => this.successMsg = '', 3000);
                } else {
                    alert(res.message || 'Xóa thất bại');
                }
            });
        }
    }

    private resetForm() {
        this.editingId = null;
        this.showForm = false;
        this.topicForm.reset();
    }

    getImageUrl(url: string | undefined): string {
        if (!url || url.trim() === '' || url.includes('/string')) {
            return 'https://placehold.co/200x200?text=No+Image';
        }
        return url;
    }
}
