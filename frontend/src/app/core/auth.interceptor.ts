import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Interceptor funcional: agrega el token JWT a cada peticion y, ante un 401,
// cierra la sesion y redirige al login (salvo en las rutas de autenticacion).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const esRutaPublica = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  const peticion = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !esRutaPublica) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
