import type { User, Session } from 'better-auth';

declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: Session;
			phcId?: string | null;
			role?: 'receptionist' | 'nurse' | 'doctor' | 'pharmacy' | 'admin' | null;
		}
	}
}

export {};
