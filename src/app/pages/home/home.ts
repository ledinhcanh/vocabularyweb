import { Component, inject, OnInit, signal } from '@angular/core';
import { PostService } from '../../services/post.service';
import { TopicService } from '../../services/topic.service';
import { PostItem, TopicItem } from '../../models/api.models';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  postService = inject(PostService);
  topicService = inject(TopicService);
  router = inject(Router);

  recentPosts = signal<PostItem[]>([]);
  featuredTopics = signal<TopicItem[]>([]);
  searchKeyword = signal<string>('');

  onSearch() {
    if (this.searchKeyword().trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchKeyword().trim() } });
    }
  }

  ngOnInit() {
    this.postService.searchPosts({ pageIndex: 0, pageSize: 3, isPublished: true }).subscribe(res => {
      if (res.isSuccess) {
        this.recentPosts.set(res.data);
      }
    });

    this.topicService.getTopics().subscribe(res => {
      if (res.isSuccess) {
        this.featuredTopics.set(res.data.slice(0, 4));
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
