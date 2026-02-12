import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      // Error handling logic will be implemented in a future step.
      console.error('HTTP Error:', error);
      return throwError(() => error);
    })
  );
};
