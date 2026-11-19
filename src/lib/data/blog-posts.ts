export interface BlogPost {
	slug: string;
	title: string;
	summary: string;
	date: string;
	readTime: string;
	category: string;
	author: {
		name: string;
		role: string;
		avatar?: string;
	};
	content: string[];
}

export const blogPosts: BlogPost[] = [
	{
		slug: 'why-cloud-emrs-fail-rural-clinics-nigeria',
		title: 'Why Traditional Cloud EMRs Fail Rural Primary Health Centres in Nigeria',
		summary: 'A critical analysis of imported health software assumptions versus the everyday electrical and connectivity realities of rural Nigerian clinics.',
		date: '14 November 2026',
		readTime: '6 min read',
		category: 'Public Health & Infrastructure',
		author: {
			name: 'Mudiaga Arharhire',
			role: 'Founder & Lead Engineer, ClinicFlow'
		},
		content: [
			'In 2020, researchers assessed all 10 public Primary Health Centres across Egor Local Government Area in Benin City (Adam & Nwaogwugwu, Annals of Clinical and Biomedical Research). The audit revealed a stark reality: zero medical records officers, only one medical officer across ten facilities, and not a single clinic offering 24-hour care. Every single facility operated entirely through stacks of paper registers.',
			'Over the past decade, dozens of well-funded electronic medical record (EMR) initiatives have attempted to digitize Nigerian healthcare. Yet visit almost any rural or peri-urban PHC today, and nurses are still searching through worn paper ledger books. Why do cloud-first EMRs consistently fail in these settings?',
			'The fundamental error is an imported assumption: that connectivity is a given commodity. Traditional web-based hospital software treats the internet as a continuous utility, similar to electricity in a metropolitan hospital. When a nurse clicks "Save Encounter", the browser issues an asynchronous POST request to a server in Frankfurt, Dublin, or Lagos. If the cell tower is down or mobile airtime has expired, the spinner freezes, the request times out, and clinical care grinds to a halt.',
			'A recent July 2026 field survey published in IJRSI revealed that 76% of Nigerian primary healthcare workers cite recurring power and internet outages as their primary operational bottleneck. When power cuts out or mobile network bands drop to 2G, healthcare workers cannot afford to tell a feverish child’s mother to wait until the internet reconnects. They immediately abandon the computer and return to the trusty physical paper book.',
			'To succeed in Nigerian primary healthcare, digital systems must invert the architecture: offline must be the primary operating mode, and the cloud must be an occasional backup target. Software must run completely from device storage, communicate across local battery-powered Wi-Fi routers, and sync silently when uplink connections return. That is the foundational thesis upon which ClinicFlow was engineered.'
		]
	},
	{
		slug: 'offline-first-architecture-dexie-sqlite-mdns',
		title: 'Architecting for Blackouts: How ClinicFlow Achieves Zero-Downtime Offline Sync',
		summary: 'A deep technical dive into SvelteKit 5, Dexie IndexedDB, edge SQLite, and mDNS zero-configuration networking in low-resource environments.',
		date: '28 October 2026',
		readTime: '8 min read',
		category: 'Engineering & Architecture',
		author: {
			name: 'Mudiaga Arharhire',
			role: 'Founder & Lead Engineer, ClinicFlow'
		},
		content: [
			'When we set out to build ClinicFlow, the non-negotiable architectural invariant was simple: if a clinic loses internet for four consecutive weeks, not a single patient registration, triage calculation, or medication dispensation should be blocked.',
			'To achieve this without burdening clinic staff with complex IT administration, we combined three core technologies into a unified edge runtime:',
			'1. Reactive IndexedDB with Dexie: In the client application, all domain tables (patients, encounters, vitals, queues, prescriptions) are mapped to IndexedDB using Dexie, sealed behind reactive class-based Svelte 5 stores. Every write commits synchronously to local disk before any network attempt is made. Read operations run with sub-millisecond latency directly from device RAM and flash storage.',
			'2. Zero-Config LAN Discovery via mDNS: In low-resource clinics, staff cannot be expected to configure static IP addresses or troubleshoot DHCP server tables. When a designated clinic server or primary terminal starts up, it announces itself on the local Wi-Fi subnet as clinicflow.local using multicast DNS (mDNS). Peripheral tablets used by triage nurses and pharmacists automatically resolve this hostname and establish bidirectional local synchronization over standard WebSockets.',
			'3. Deterministic Batch Synchronization: When an internet connection becomes available (such as when an administrator connects a mobile hotspot), ClinicFlow’s sync engine initiates a pushOperations and pullChanges pipeline. Mutations are serialized as an append-only operation log with monotonic sequence numbers, ensuring idempotent reconciliation without data corruption or merge collisions.',
			'By removing external network dependencies from the critical path of patient care, ClinicFlow ensures that healthcare delivery remains resilient, deterministic, and autonomous.'
		]
	},
	{
		slug: 'ai-clinical-decision-safety-dr-assist-rxbrain',
		title: 'Guardrails First: How Dr. Assist and RxBrain Bring Safe AI to Frontline CHEWs',
		summary: 'Balancing generative AI decision support with strict clinical boundaries to protect patients in under-staffed health clinics.',
		date: '10 October 2026',
		readTime: '7 min read',
		category: 'AI & Clinical Safety',
		author: {
			name: 'Mudiaga Arharhire',
			role: 'Founder & Lead Engineer, ClinicFlow'
		},
		content: [
			'In Nigeria’s roughly 30,000 public Primary Health Centres, the majority of consultations are conducted not by fully certified medical doctors, but by Community Health Extension Workers (CHEWs) and community nurses. These dedicated frontline staff manage immense daily caseloads with limited specialist supervision.',
			'Integrating artificial intelligence into such high-stakes clinical workflows demands extreme caution. LLM hallucinations in a consumer chatbot may produce amusing text; an unvalidated drug recommendation in a rural pediatric clinic can prove fatal.',
			'When we designed Dr. Assist and RxBrain for ClinicFlow, we established three non-negotiable safety guardrails:',
			'First, Advisory Decision Support Only: AI is never permitted to finalize a diagnosis or issue a prescription autonomously. All AI outputs are framed as advisory prompts and clearly marked with clinical warning disclaimers. The human clinician must explicitly review and sign off on any suggested medication or diagnostic pathway.',
			'Second, Deterministic Rules Before Generative Prompts: Before an encounter is routed to a generative language model, it passes through a hardcoded clinical rules engine. Critical triage alerts (such as pediatric fever combined with lethargy, or extreme systolic blood pressure) trigger deterministic Red-level alerts governed by standard clinical protocols, independent of any LLM API availability.',
			'Third, Strict Privacy Striping: Under the Nigeria Data Protection Act (NDPA 2023), health records constitute sensitive personal data. Whenever clinical prompts are formatted for evaluation, patient names, national identifiers, residential addresses, and phone numbers are stripped at the local device level before transmission.',
			'By prioritizing safety over novelty, artificial intelligence can serve as a dependable clinical co-pilot for healthcare workers who need it most.'
		]
	}
];

export function getBlogPost(slug: string): BlogPost | undefined {
	return blogPosts.find((p) => p.slug === slug);
}
