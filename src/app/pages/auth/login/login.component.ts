import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    loginForm = this.fb.group({
        username: ['', Validators.required],
        password: ['', Validators.required],
        captcha: ['', Validators.required]
    });

    isLoading = signal(false);
    errorMsg = signal('');

    // Captcha State
    captchaNum1 = signal(0);
    captchaNum2 = signal(0);

    constructor() {
        if (this.authService.isLoggedIn) {
            this.redirectUser();
        }
    }

    ngOnInit() {
        this.generateCaptcha();
    }

    generateCaptcha() {
        this.captchaNum1.set(Math.floor(Math.random() * 10) + 1);
        this.captchaNum2.set(Math.floor(Math.random() * 10) + 1);
        this.loginForm.controls['captcha'].setValue('');
    }

    private redirectUser() {
        if (this.authService.isAdmin) {
            this.router.navigate(['/admin/dashboard']);
        } else {
            this.router.navigate(['/']);
        }
    }

    onSubmit() {
        this.errorMsg.set('');

        if (this.loginForm.invalid) {
            this.errorMsg.set('Vui lòng điền đầy đủ thông tin.');
            return;
        }

        const { username, password, captcha } = this.loginForm.value;
        const expectedCaptcha = this.captchaNum1() + this.captchaNum2();

        if (parseInt(captcha!) !== expectedCaptcha) {
            this.errorMsg.set('Mã xác nhận không đúng!');
            this.generateCaptcha();
            return;
        }

        this.isLoading.set(true);

        this.authService.login({ username, password }).subscribe({
            next: (res) => {
                this.isLoading.set(false);
                if (res.isSuccess) {
                    this.redirectUser();
                } else {
                    this.errorMsg.set(res.message || 'Đăng nhập thất bại.');
                    this.generateCaptcha();
                }
            },
            error: (err) => {
                this.isLoading.set(false);
                console.error('Login error:', err);
                if (err.status === 0) {
                    this.errorMsg.set('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại CORS hoặc chứng chỉ SSL.');
                } else {
                    this.errorMsg.set(err.error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
                }
                this.generateCaptcha();
            }
        });
    }
}
