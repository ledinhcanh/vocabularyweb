import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-web-layout',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './web-layout.html',
  styleUrl: './web-layout.scss',
})
export class WebLayout {

}
