import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopicService } from '../../services/topic.service';
import { TopicItem } from '../../models/api.models';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-topics',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './topics.html'
})
export class Topics implements OnInit {
    topicService = inject(TopicService);
    topics = signal<TopicItem[]>([]);
    isLoading = signal(true);

    ngOnInit() {
        this.topicService.getTopics().subscribe(res => {
            this.isLoading.set(false);
            if (res.isSuccess) {
                this.topics.set(res.data);
            }
        });
    }

    getImageUrl(url: string | undefined): string {
        if (!url || url.trim() === '' || url.includes('/string')) {
            return 'https://placehold.co/600x400?text=No+Image';
        }
        return url;
    }
}
