import { command } from '$app/server';
import * as v from 'valibot';

export const submitInquiry = command(
	v.object({
		name: v.pipe(v.string(), v.nonEmpty('Please enter your full name')),
		email: v.pipe(v.string(), v.email('Please enter a valid email address')),
		phone: v.optional(v.string(), ''),
		organization: v.pipe(v.string(), v.nonEmpty('Please enter your facility or organization name')),
		state: v.pipe(v.string(), v.nonEmpty('Please specify your state')),
		inquiryType: v.picklist([
			'pilot_application',
			'state_procurement',
			'ngo_partnership',
			'general'
		]),
		message: v.pipe(v.string(), v.nonEmpty('Please enter a brief message'))
	}),
	async (data) => {
		// Log lead/inquiry securely
		console.log('[Institutional Inquiry Received]:', {
			name: data.name,
			email: data.email,
			organization: data.organization,
			state: data.state,
			inquiryType: data.inquiryType,
			timestamp: new Date().toISOString()
		});

		return {
			success: true,
			message:
				'Thank you! Your inquiry has been received. Our team will contact you within 24 to 48 hours.'
		};
	}
);
