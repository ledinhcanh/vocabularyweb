import { Component, inject, OnInit, signal } from '@angular/core';
import { PostService } from '../../services/post.service';
import { TopicService } from '../../services/topic.service';
import { PostItem, TopicItem } from '../../models/api.models';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './search.html',
    styleUrl: './search.scss',
})
export class SearchComponent implements OnInit {
    private postService = inject(PostService);
    private topicService = inject(TopicService);
    private route = inject(ActivatedRoute);

    keyword = signal<string>('');
    posts = signal<PostItem[]>([]);
    topics = signal<TopicItem[]>([]);
    isLoading = signal<boolean>(false);

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            const q = params['q'] || '';
            this.keyword.set(q);
            if (q) {
                this.performSearch(q);
            } else {
                this.posts.set([]);
                this.topics.set([]);
            }
        });
    }

    performSearch(keyword: string) {
        this.isLoading.set(true);

        // Call both API simultaneously
        let topicsLoaded = false;
        let postsLoaded = false;

        const checkComplete = () => {
            if (topicsLoaded && postsLoaded) {
                this.isLoading.set(false);
            }
        };

        this.topicService.getTopics(keyword).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.topics.set(res.data);
                }
                topicsLoaded = true;
                checkComplete();
            },
            error: () => {
                topicsLoaded = true;
                checkComplete();
            }
        });

        this.postService.searchPosts({ pageIndex: 0, pageSize: 50, isPublished: true, keySearch: keyword }).subscribe({
            next: (res) => {
                if (res.isSuccess) {
                    this.posts.set(res.data);
                }
                postsLoaded = true;
                checkComplete();
            },
            error: () => {
                postsLoaded = true;
                checkComplete();
            }
        });
    }

    getThumbnailUrl(url: string | undefined): string {
        if (!url || url.trim() === '' || url.includes('/string')) {
            return 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1000';
        }
        return url;
    }

    getTopicImageUrl(url: string | undefined): string {
        if (!url || url.trim() === '' || url.includes('/string')) {
            return 'https://placehold.co/600x400?text=No+Image';
        }
        return url;
    }
}
