import { toast } from 'svelte-sonner';

export type AppNotification = {
	id: string;
	title: string;
	message: string;
	timestamp: number;
	read: boolean;
	roleTarget: 'nurse' | 'doctor' | 'pharmacy' | 'all';
	link?: string;
};

class NotificationStore {
	items = $state<AppNotification[]>([]);
	unreadCount = $derived(this.items.filter(n => !n.read).length);
	
	private bc: BroadcastChannel | null = null;
	private currentRole = 'all';

	constructor() {
		if (typeof window !== 'undefined') {
			this.bc = new BroadcastChannel('clinicflow_notifications');
			this.bc.onmessage = (event) => {
				this.handleIncoming(event.data);
			};
			
			// Load from local storage for persistence across tabs
			const saved = localStorage.getItem('clinicflow_notifications');
			if (saved) {
				try {
					this.items = JSON.parse(saved);
				} catch (e) {
					console.error('Failed to parse notifications');
				}
			}
		}
	}

	setRole(role: string) {
		this.currentRole = role;
	}

	private handleIncoming(notification: AppNotification) {
		// Only process if it targets 'all' or the current user's role
		if (notification.roleTarget === 'all' || notification.roleTarget === this.currentRole) {
			this.items = [notification, ...this.items].slice(0, 50); // Keep last 50
			this.save();
			toast(notification.title, {
				description: notification.message,
				action: notification.link ? {
					label: 'View',
					onClick: () => { window.location.href = notification.link!; }
				} : undefined
			});
		}
	}

	// Trigger a notification across all tabs/windows (and over local network if we use a relay)
	// For this demo, BroadcastChannel works great for same-device cross-tab communication.
	// For actual multi-device LAN, this would tie into the sync engine or a local websocket.
	broadcast(title: string, message: string, roleTarget: 'nurse' | 'doctor' | 'pharmacy' | 'all', link?: string) {
		const notification: AppNotification = {
			id: crypto.randomUUID(),
			title,
			message,
			timestamp: Date.now(),
			read: false,
			roleTarget,
			link
		};
		
		// Handle locally if applicable
		this.handleIncoming(notification);
		
		// Broadcast to other tabs
		if (this.bc) {
			this.bc.postMessage(notification);
		}
	}

	markAsRead(id: string) {
		const item = this.items.find(n => n.id === id);
		if (item) {
			item.read = true;
			this.items = [...this.items];
			this.save();
		}
	}
	
	markAllAsRead() {
		this.items = this.items.map(n => ({ ...n, read: true }));
		this.save();
	}

	private save() {
		if (typeof window !== 'undefined') {
			localStorage.setItem('clinicflow_notifications', JSON.stringify(this.items));
		}
	}
}

export const notificationStore = new NotificationStore();
