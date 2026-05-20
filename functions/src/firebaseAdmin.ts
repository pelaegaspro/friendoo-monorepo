import * as admin from 'firebase-admin';

let app: admin.app.App | undefined;

export function getAdminApp() {
  if (!app) {
    if (admin.apps.length > 0) {
      app = admin.apps[0] as admin.app.App;
    } else {
      try {
        app = admin.initializeApp();
      } catch (e: any) {
        if (e.code === 'app/no-app' || e.message?.includes('Project Id')) {
          app = admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'friendoo-v1' });
        } else {
          app = admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'friendoo-v1' });
        }
      }
    }
  }
  return app;
}

export function getDb() {
  getAdminApp();
  return admin.firestore();
}

export { admin };

