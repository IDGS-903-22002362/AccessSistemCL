import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from './environments/environment';

bootstrapApplication(App, {
  providers: [
    ...appConfig.providers,
    provideFirebaseApp(() =>
      initializeApp(environment.firebaseConfig)
    ),
    provideDatabase(() => getDatabase()),
    provideAuth(() => getAuth()),
  ],
});
