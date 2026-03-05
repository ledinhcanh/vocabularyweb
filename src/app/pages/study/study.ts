import { Component, inject, OnInit, signal, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VocabularyService } from '../../services/vocabulary.service';
import { StudyItem, SubmitReviewRequest, VocabularyItem } from '../../models/api.models';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-study',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './study.html',
    styles: [`
        .study-container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .pulse-streak {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .level-badge {
            background: linear-gradient(45deg, #FFD700, #FFA500);
            color: #fff;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
            border: 2px solid #FF8C00;
        }

        .flashcard {
            perspective: 1000px;
            height: 400px; cursor: pointer;
            position: relative;
        }
        .flashcard-inner {
            position: relative;
            width: 100%;
            height: 100%;
            transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            transform-style: preserve-3d;
        }
        .flashcard.flipped .flashcard-inner {
            transform: rotateY(180deg);
        }
        .flashcard-front, .flashcard-back {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 2rem;
            padding: 2.5rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .flashcard-front {
            background: var(--bs-body-bg);
        }
.flashcard-back {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: #f8fafc; /* Force light text on dark gradient */
            transform: rotateY(180deg);
            overflow: hidden; /* Prevent ugly scrollbars */
        }
        .quality-btn {
            transition: all 0.2s ease;
            border: 2px solid transparent;
        }
        .quality-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .quality-btn.active-rating {
            transform: scale(0.95) !important;
            box-shadow: 0 0 20px currentColor !important;
            opacity: 0.8;
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .mode-btn {
            transition: all 0.2s;
        }
        .mode-btn:hover {
            transform: translateY(-2px);
        }
        .quiz-option {
            transition: all 0.2s;
            cursor: pointer;
        }
        .quiz-option:hover:not(:disabled) {
            background-color: var(--bs-primary-bg-subtle);
            border-color: var(--bs-primary);
        }
    `]
})
export class Study implements OnInit {
    vocabService = inject(VocabularyService);
    route = inject(ActivatedRoute);

    studyList = signal<StudyItem[]>([]);
    originalList: StudyItem[] = []; // Cache session
    currentIndex = signal(0);
    isFlipped = signal(false);
    isLoading = signal(true);
    isFinished = signal(false);
    topicId: number | null = null;
    autoPlay = signal(true);

    studyMode = signal<'list' | 'flashcard' | 'quiz' | 'typing' | 'test'>('list');
    activeRating = signal<number | null>(null);

    // Quiz Data
    quizOptions = signal<{ word: string, meaning: string, isCorrect: boolean }[]>([]);
    quizAnswered = signal(false);
    quizCorrect = signal(false);

    // Typing Data
    typingInput = signal('');
    typingAnswered = signal(false);
    typingCorrect = signal(false);
    showHint = signal(false); // Signal dùng cho gợi ý Typing
    scrambledLetters = signal<{ id: number, char: string, used: boolean }[]>([]); // Gợi ý các chữ cái bị đảo lộn
    @ViewChild('typingField') typingField?: ElementRef;

    // Gamification Data
    xp = signal(0);
    level = signal(1);
    streak = signal(0);
    showXpAnimation = signal(false);
    xpEarned = signal(0);

    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (this.isLoading() || this.isFinished()) return;

        const key = event.key;

        // Flip with Space or ArrowUp/Down
        if (key === ' ' || key === 'ArrowUp' || key === 'ArrowDown') {
            event.preventDefault();
            this.toggleFlip();
        }

        // Next Card with ArrowRight or . or >
        if (key === 'ArrowRight' || key === '.' || key === '>') {
            this.nextCard();
        }

        // Previous Card with ArrowLeft or , or <
        if (key === 'ArrowLeft' || key === ',' || key === '<') {
            this.prevCard();
        }

        // Ratings - Only if flipped
        if (this.isFlipped() && this.activeRating() === null) {
            // Map keys 1, 2, 3, 4 to qualities 0, 2, 3, 5
            if (key === '1') this.submitReview(0, 0); // 1 = Quên (quality 0)
            if (key === '2') this.submitReview(2, 2); // 2 = Khó (quality 2)
            if (key === '3') this.submitReview(3, 3); // 3 = Nhớ (quality 3)
            if (key === '4') this.submitReview(5, 5); // 4 = Dễ (quality 5)
        }

        // Replay audio with 'v' or 'a' or 'r'
        if ((key === 'v' || key === 'a' || key === 'r') && this.currentCard) {
            this.playAudio(this.currentCard.vocab.audioUrl, this.currentCard.vocab.word);
        }
    }

    ngOnInit() {
        this.route.queryParamMap.subscribe(params => {
            const id = params.get('topicId');
            if (id) {
                this.topicId = parseInt(id, 10);
            } else {
                this.topicId = null;
            }
            this.loadStudyList();
            this.loadGamificationData(); // Tải dữ liệu Game ngay khi vào
        });
    }

    loadGamificationData() {
        this.vocabService.getGamificationProfile().subscribe(res => {
            if (res.isSuccess) {
                this.xp.set(res.data.xp);
                this.level.set(res.data.level);
                this.streak.set(res.data.streak);
            }
        });
    }

    awardXP(amount: number) {
        this.vocabService.submitXP(amount).subscribe(res => {
            if (res.isSuccess) {
                this.xp.set(res.data.xp);
                this.level.set(res.data.level);
                this.streak.set(res.data.streak);

                // Hiệu ứng cộng điểm
                this.xpEarned.set(amount);
                this.showXpAnimation.set(true);
                setTimeout(() => this.showXpAnimation.set(false), 2000);
            }
        });
    }

    playCorrectSound() {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }

    playWrongSound() {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2951/2951-preview.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }

    loadStudyList() {
        this.isLoading.set(true);
        const req = this.topicId
            ? this.vocabService.getStudyVocabulariesByTopic(this.topicId)
            : this.vocabService.getStudyVocabularies();

        req.subscribe(res => {
            this.isLoading.set(false);
            if (res.isSuccess && res.data.length > 0) {
                this.studyList.set(res.data);
                this.originalList = [...res.data];
                this.studyMode.set('list'); // Luôn bắt đầu bằng list
            } else {
                this.isFinished.set(true);
            }
        });
    }

    get currentCard() {
        return this.studyList()[this.currentIndex()];
    }

    get progress() {
        if (this.studyList().length === 0) return 0;
        return ((this.currentIndex() + 1) / this.studyList().length) * 100;
    }

    // Lấy chuỗi gợi ý cho tính năng gõ chữ (Ví dụ: hello -> h _ _ _ o)
    get maskedWord() {
        const word = this.currentCard?.vocab?.word;
        if (!word) return '';
        if (word.length <= 2) return '_'.repeat(word.length);

        // Hiện kí tự đầu và kí tự cuối, giữa mã hoá thành dấu gạch dưới
        return word[0] + ' _ '.repeat(word.length - 2) + word[word.length - 1];
    }

    generateScrambledLetters() {
        const word = this.currentCard?.vocab?.word;
        if (!word) {
            this.scrambledLetters.set([]);
            return;
        }

        // Chỉ xáo trộn các ký tự không phải khoảng trắng
        const chars = word.replace(/\s/g, '').split('');
        const shuffled = chars.sort(() => 0.5 - Math.random());

        this.scrambledLetters.set(shuffled.map((char, index) => ({
            id: index,
            char: char,
            used: false
        })));
    }

    toggleFlip() {
        const jumpingToBack = !this.isFlipped();
        this.isFlipped.update(v => !v);

        if (jumpingToBack && this.autoPlay() && this.currentCard) {
            setTimeout(() => this.playAudio(this.currentCard.vocab.audioUrl, this.currentCard.vocab.word), 300);
        }
    }

    startMode(mode: 'flashcard' | 'quiz' | 'typing') {
        this.studyMode.set(mode);
        this.currentIndex.set(0);
        this.isFlipped.set(false);

        if (mode === 'quiz') {
            this.generateQuizOptions();
        } else if (mode === 'typing') {
            this.onTypingInputChange('');
            this.typingAnswered.set(false);
            this.showHint.set(false);
            this.generateScrambledLetters();
            setTimeout(() => this.typingField?.nativeElement.focus(), 100);
        }

        if (this.autoPlay() && this.currentCard) {
            setTimeout(() => this.playAudio(this.currentCard.vocab.audioUrl, this.currentCard.vocab.word), 500);
        }
    }

    startTestMode() {
        this.isLoading.set(true);
        this.vocabService.getLearnedWordsForTest(this.topicId || undefined).subscribe(res => {
            this.isLoading.set(false);
            if (res.isSuccess && res.data.length > 0) {
                // Thay thế data hiện tại bằng bài test
                this.studyList.set(res.data);
                this.originalList = [...res.data];

                this.studyMode.set('test');
                this.currentIndex.set(0);
                this.isFlipped.set(false);
                this.generateQuizOptions(); // Dùng logic trắc nghiệm cho bài test

                if (this.autoPlay() && this.currentCard) {
                    setTimeout(() => this.playAudio(this.currentCard.vocab.audioUrl, this.currentCard.vocab.word), 500);
                }
            } else {
                alert('Bạn chưa học từ nào để làm bài kiểm tra!');
            }
        });
    }

    // --- Quiz Logic ---
    generateQuizOptions() {
        this.quizAnswered.set(false);
        const card = this.currentCard;
        if (!card) return;

        // Lấy 3 từ sai ngẫu nhiên từ danh sách hiện tại
        const others = this.originalList.filter(x => x.vocab.id !== card.vocab.id);
        const shuffledOthers = others.sort(() => 0.5 - Math.random()).slice(0, 3);

        const options = [
            { word: card.vocab.word, meaning: card.vocab.meaning, isCorrect: true },
            ...shuffledOthers.map(x => ({ word: x.vocab.word, meaning: x.vocab.meaning, isCorrect: false }))
        ];

        // Shuffle options
        this.quizOptions.set(options.sort(() => 0.5 - Math.random()));
    }

    selectQuizOption(option: any) {
        if (this.quizAnswered()) return;
        this.quizAnswered.set(true);
        this.quizCorrect.set(option.isCorrect);

        if (option.isCorrect) {
            this.playCorrectSound();
            this.awardXP(2); // Thưởng XP ngay lập tức (Quiz đúng lần đầu được điểm nhỏ)
            // Đúng -> Gọi submit review mức 4 (Dễ) luôn cho lẹ, lưu đáp án 1.5s rồi tự nhảy
            this.submitReview(4, 4, 1500);
        } else {
            this.playWrongSound();
            // Sai -> Phải học lại (chọn mức 1 Quên), delay 2.5s để xem đáp án đúng
            this.submitReview(0, 1, 2500);
        }
    }

    // --- Typing Logic ---
    checkTyping() {
        if (this.typingAnswered() || !this.typingInput().trim()) return;

        const answer = this.typingInput().replace(/\s/g, '').toLowerCase();
        const expected = this.currentCard.vocab.word.replace(/\s/g, '').toLowerCase();

        this.typingAnswered.set(true);
        const isCorrect = answer === expected;
        this.typingCorrect.set(isCorrect);

        if (isCorrect) {
            this.playCorrectSound();
            this.awardXP(5); // Thưởng nhiều XP cho nhập đúng
            this.submitReview(4, 4, 1500); // Lưu và tự động Next sau 1.5s
        } else {
            this.playWrongSound();
            this.submitReview(0, 1, -1); // Truyền -1 để không tự động Next, cho phép User ấn tay
        }
    }

    skipTyping() {
        if (this.typingAnswered()) return;
        this.typingAnswered.set(true);
        this.typingCorrect.set(false);
        this.onTypingInputChange(''); // Xoá trắng và Reset phím bấm
        this.playWrongSound();
        this.submitReview(0, 1, -1); // Truyền -1 để chờ User ấn nút Tiếp Tục hiển thị Text Đúng sai
    }

    selectLetter(letter: { id: number, char: string, used: boolean }) {
        if (letter.used || this.typingAnswered()) return;

        const currentInput = this.typingInput() + letter.char;
        this.onTypingInputChange(currentInput);

        // Tự động focus lại
        this.typingField?.nativeElement.focus();
    }

    revealOneLetter() {
        if (this.typingAnswered()) return;

        const expectedWord = this.currentCard.vocab.word.replace(/\s/g, ''); // Bỏ khoảng trắng
        let currentInput = this.typingInput().replace(/\s/g, '');

        // Nếu đã gõ đủ text mà vẫn sai, xoá hết đi làm lại từ đầu hoặc xoá dần tuỳ logic
        // Ở đây ta xoá chuỗi từ vị trí sai đầu tiên, sau đó đắp 1 ký tự đúng vào
        let firstWrongIndex = -1;
        for (let i = 0; i < currentInput.length; i++) {
            if (currentInput[i].toLowerCase() !== expectedWord[i].toLowerCase()) {
                firstWrongIndex = i;
                break;
            }
        }

        if (firstWrongIndex !== -1) {
            // Có ký tự sai -> Cắt bỏ từ chỗ sai trở đi, và nối thêm 1 chữ đúng
            currentInput = currentInput.substring(0, firstWrongIndex) + expectedWord[firstWrongIndex];
        } else if (currentInput.length < expectedWord.length) {
            // Đã gõ đúng 1 nửa, nhưng chưa đủ độ dài -> Thêm chữ cái tiếp theo
            currentInput += expectedWord[currentInput.length];
        } else {
            // Gõ đúng hết cỡ nhưng do lỗi gì đó chưa Enter (vd: chưa gọi submit)
            return;
        }

        // Cập nhật lại state và tính toán lại bàn phím
        this.onTypingInputChange(currentInput);
        this.typingField?.nativeElement.focus();
    }

    onTypingInputChange(value: string) {
        this.typingInput.set(value);

        // Tính toán lại các phím đã sử dụng dựa trên chuỗi nhập vào để đồng bộ UI
        const letters = this.scrambledLetters();
        const newLetters = letters.map(l => ({ ...l, used: false }));

        const inputChars = value.replace(/\s/g, '').toLowerCase().split('');
        for (const char of inputChars) {
            const available = newLetters.find(l => !l.used && l.char.toLowerCase() === char);
            if (available) {
                available.used = true;
            }
        }

        this.scrambledLetters.set(newLetters);
    }

    submitReview(quality: number, ratingKey: number = quality, autoNextDelay: number = 400) {
        const card = this.currentCard;
        if (!card) return;

        this.activeRating.set(ratingKey); // Bật hiệu ứng sáng nút

        const payload: SubmitReviewRequest = {
            vocabId: card.vocab.id,
            quality: quality
        };

        this.vocabService.submitReview(payload).subscribe(res => {
            if (res.isSuccess) {
                // Thưởng XP khi học thẻ bình thường
                if (this.studyMode() === 'flashcard') {
                    const xpMap: Record<number, number> = { 0: 1, 2: 2, 3: 3, 5: 4 };
                    this.awardXP(xpMap[quality] || 1);
                }

                // Nếu điểm chất lượng thấp (quên/khó), thêm thẻ vào cuối danh sách để học lại trong phiên này
                if (quality <= 2) {
                    this.studyList.update(list => [...list, card]);
                }

                // Đợi một chút để người dùng thấy nút bấm sáng lên rồi mới chuyển thẻ
                if (autoNextDelay >= 0) {
                    setTimeout(() => {
                        this.activeRating.set(null); // Tắt hiệu ứng
                        this.nextCard();
                    }, autoNextDelay);
                } else {
                    this.activeRating.set(null); // Không tự Next
                }
            } else {
                this.activeRating.set(null); // Tắt hiệu ứng nếu lỗi
            }
        });
    }

    nextCard() {
        if (this.currentIndex() < this.studyList().length - 1) {
            this.isFlipped.set(false);
            setTimeout(() => {
                this.currentIndex.update(i => i + 1);

                // Cập nhật state cho các mode
                if (this.studyMode() === 'quiz' || this.studyMode() === 'test') {
                    this.generateQuizOptions();
                } else if (this.studyMode() === 'typing') {
                    this.onTypingInputChange('');
                    this.typingAnswered.set(false);
                    this.showHint.set(false);
                    this.generateScrambledLetters();
                    setTimeout(() => this.typingField?.nativeElement.focus(), 100);
                }

                if (this.autoPlay() && this.currentCard) {
                    this.playAudio(this.currentCard.vocab.audioUrl, this.currentCard.vocab.word);
                }
            }, 300);
        } else {
            this.isFinished.set(true);
        }
    }

    prevCard() {
        if (this.currentIndex() > 0) {
            this.isFlipped.set(false);
            setTimeout(() => {
                this.currentIndex.update(i => i - 1);
                if (this.autoPlay() && this.currentCard) {
                    this.playAudio(this.currentCard.vocab.audioUrl, this.currentCard.vocab.word);
                }
            }, 300);
        }
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

    reset() {
        this.currentIndex.set(0);
        this.isFlipped.set(false);
        this.isFinished.set(false);
        this.studyMode.set('list');

        // Gọi API tải lô từ vựng tiếp theo thay vì học lại lặp vòng
        this.loadStudyList();
    }
}
