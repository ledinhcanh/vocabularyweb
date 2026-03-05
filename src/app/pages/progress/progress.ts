import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VocabularyService } from '../../services/vocabulary.service';
import { ProgressItem } from '../../models/api.models';

@Component({
    selector: 'app-progress',
    standalone: true,
    imports: [CommonModule, RouterModule, DatePipe, FormsModule],
    templateUrl: './progress.html'
})
export class ProgressComponent implements OnInit {
    vocabService = inject(VocabularyService);
    route = inject(ActivatedRoute);

    progressList = signal<ProgressItem[]>([]);
    isLoading = signal(true);
    topicId: number | null = null;

    // --- Bộ lọc ---
    searchText = signal('');
    statusFilter = signal<'all' | 'not_learned' | 'learning' | 'mastered'>('all');

    filteredProgressList = computed(() => {
        let list = this.progressList();

        // 1. Lọc theo trạng thái
        const status = this.statusFilter();
        if (status !== 'all') {
            list = list.filter(item => {
                const isMastered = item.progress && item.progress.easeFactor > 2.6 && item.progress.intervalDays > 14;
                if (status === 'not_learned') return !item.progress;
                if (status === 'mastered') return isMastered;
                if (status === 'learning') return item.progress && !isMastered;
                return true;
            });
        }

        // 2. Lọc theo văn bản (word hoặc meaning)
        const text = this.searchText().toLowerCase().trim();
        if (text) {
            list = list.filter(item =>
                item.vocab.word.toLowerCase().includes(text) ||
                item.vocab.meaning.toLowerCase().includes(text) ||
                (item.vocab.phonetic && item.vocab.phonetic.toLowerCase().includes(text))
            );
        }

        return list;
    });

    ngOnInit() {
        this.route.queryParamMap.subscribe(params => {
            const id = params.get('topicId');
            if (id) {
                this.topicId = parseInt(id, 10);
            } else {
                this.topicId = null;
            }
            this.loadProgressList();
        });
    }

    loadProgressList() {
        this.isLoading.set(true);
        this.vocabService.getVocabularyProgress(this.topicId || undefined).subscribe(res => {
            this.isLoading.set(false);
            if (res.isSuccess) {
                this.progressList.set(res.data);
            } else {
                this.progressList.set([]);
            }
        });
    }

    resetWordProgress(vocabId: number) {
        if (!confirm('Bạn có chắc chắn muốn xóa tiến độ học của từ này không? Nó sẽ được đưa về trạng thái Chưa học.')) {
            return;
        }

        this.vocabService.resetProgress(vocabId).subscribe(res => {
            if (res.isSuccess) {
                // Tùy chỉnh trực tiếp danh sách trên giao diện
                this.progressList.update(list =>
                    list.map(item => item.vocab.id === vocabId ? { ...item, progress: null } : item)
                );
            } else {
                alert(res.message || 'Có lỗi xảy ra.');
            }
        });
    }

    resetTopicProgress() {
        const message = this.topicId
            ? 'Hành động này sẽ XÓA SẠCH tiến độ học của toàn bộ từ vựng trong chủ đề này. Bạn có chắc chắn không?'
            : 'Hành động này sẽ XÓA SẠCH tiến độ học của TOÀN BỘ từ vựng. Bạn có chắc chắn không?';

        if (!confirm(message)) {
            return;
        }

        const request = this.topicId
            ? this.vocabService.resetTopicProgress(this.topicId)
            : this.vocabService.resetAllProgress();

        request.subscribe(res => {
            if (res.isSuccess) {
                // Xoá toàn bộ object progress
                this.progressList.update(list =>
                    list.map(item => ({ ...item, progress: null }))
                );
            } else {
                alert(res.message || 'Có lỗi xảy ra.');
            }
        });
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
