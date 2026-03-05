import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { VocabularyService } from '../../../services/vocabulary.service';
import { TopicService } from '../../../services/topic.service';
import { VocabularyItem, CreateVocabularyRequest, UpdateVocabularyRequest, TopicItem } from '../../../models/api.models';

@Component({
    selector: 'app-admin-vocabularies',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './vocabularies.component.html'
})
export class AdminVocabularies implements OnInit {
    vocabService = inject(VocabularyService);
    topicService = inject(TopicService);
    fb = inject(FormBuilder);

    topics = signal<TopicItem[]>([]);
    selectedTopicId = signal<number>(0);
    vocabularies = signal<VocabularyItem[]>([]);

    vocabForm = this.fb.group({
        topicId: [0, [Validators.required, Validators.min(1)]],
        word: ['', Validators.required],
        meaning: ['', Validators.required],
        phonetic: [''],
        audioUrl: [''],
        imageUrl: [''],
        exampleSentence: ['']
    });

    isSubmitting = false;
    successMsg = '';
    showForm = false;
    editingId = signal<number | null>(null);

    constructor() { }

    ngOnInit() {
        this.loadTopics();
    }

    loadTopics() {
        this.topicService.getTopics().subscribe(res => {
            if (res.isSuccess) {
                this.topics.set(res.data);
                // Auto select first topic if available
                if (res.data.length > 0) {
                    this.onTopicChange(res.data[0].id);
                }
            }
        });
    }

    onTopicChange(event: any) {
        const topicId = Number(event?.target?.value || event);
        this.selectedTopicId.set(topicId);
        this.vocabForm.patchValue({ topicId: topicId });
        this.loadVocabularies();
    }

    loadVocabularies() {
        if (this.selectedTopicId() > 0) {
            this.vocabService.getVocabulariesByTopic(this.selectedTopicId()).subscribe(res => {
                if (res.isSuccess) {
                    this.vocabularies.set(res.data);
                }
            });
        }
    }

    toggleForm() {
        if (this.showForm && !this.editingId()) {
            this.showForm = false;
        } else {
            this.showForm = !this.showForm;
        }

        if (!this.showForm) {
            this.resetForm();
        } else if (!this.editingId()) {
            this.vocabForm.patchValue({ topicId: this.selectedTopicId() });
        }
    }

    onEdit(v: VocabularyItem) {
        this.editingId.set(v.id);
        this.vocabForm.patchValue({
            topicId: v.topicId,
            word: v.word,
            meaning: v.meaning,
            phonetic: v.phonetic,
            audioUrl: v.audioUrl,
            imageUrl: v.imageUrl,
            exampleSentence: v.exampleSentence
        });
        this.showForm = true;
    }

    onSubmit() {
        if (this.vocabForm.valid) {
            this.isSubmitting = true;
            const formValue = this.vocabForm.value;

            if (this.editingId()) {
                const payload: UpdateVocabularyRequest = {
                    id: this.editingId()!,
                    topicId: Number(formValue.topicId),
                    word: formValue.word!,
                    meaning: formValue.meaning!,
                    phonetic: formValue.phonetic || null,
                    audioUrl: formValue.audioUrl || null,
                    imageUrl: formValue.imageUrl || null,
                    exampleSentence: formValue.exampleSentence || null
                };

                this.vocabService.updateVocabulary(payload).subscribe({
                    next: (res) => {
                        this.isSubmitting = false;
                        if (res.isSuccess) {
                            this.successMsg = 'Cập nhật từ vựng thành công!';
                            this.resetForm();
                            this.loadVocabularies();
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
                const payload: CreateVocabularyRequest = {
                    topicId: Number(formValue.topicId),
                    word: formValue.word!,
                    meaning: formValue.meaning!,
                    phonetic: formValue.phonetic || null,
                    audioUrl: formValue.audioUrl || null,
                    imageUrl: formValue.imageUrl || null,
                    exampleSentence: formValue.exampleSentence || null
                };

                this.vocabService.createVocabulary(payload).subscribe({
                    next: (res) => {
                        this.isSubmitting = false;
                        if (res.isSuccess) {
                            this.successMsg = 'Thêm từ vựng thành công!';
                            this.resetForm();
                            this.loadVocabularies();
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

    onDelete(id: number) {
        if (confirm('Bạn có chắc chắn muốn xóa từ vựng này?')) {
            this.vocabService.deleteVocabulary(id).subscribe(res => {
                if (res.isSuccess) {
                    this.successMsg = 'Đã xóa từ vựng.';
                    this.loadVocabularies();
                    setTimeout(() => this.successMsg = '', 3000);
                } else {
                    alert(res.message || 'Xóa thất bại');
                }
            });
        }
    }

    private resetForm() {
        this.showForm = false;
        this.editingId.set(null);
        this.vocabForm.reset({ topicId: this.selectedTopicId() });
    }

    getImageUrl(url: string | null | undefined): string {
        if (!url || url.trim() === '' || url.includes('/string')) {
            return 'https://placehold.co/100x100?text=No+Image';
        }
        return url;
    }

    playAudio(url: string | null | undefined, fallbackWord?: string) {
        const playFallback = () => {
            if (fallbackWord && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(fallbackWord);
                utterance.lang = 'en-US';
                window.speechSynthesis.speak(utterance);
            }
        };

        if (url) {
            const audio = new Audio(url);
            audio.play().catch(e => {
                console.error('Audio play failed', e);
                playFallback();
            });
        } else {
            playFallback();
        }
    }
}
