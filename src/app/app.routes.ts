import { Routes } from '@angular/router';
import { CompilerPageComponent } from './pages/compiler-page/compiler-page/compiler-page';
import { LoginComponent }        from './pages/login/login.component';
import { authGuard }             from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '',      component: CompilerPageComponent, canActivate: [authGuard] },
  { path: '**',   redirectTo: '' }
];
