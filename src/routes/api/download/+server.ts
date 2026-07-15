import { redirect } from '@sveltejs/kit';

export async function GET({ url }) {
	const os = url.searchParams.get('os');

	// Mock GitHub Releases redirect for Demo
	// In a real scenario, this would dynamically query api.github.com/repos/org/repo/releases/latest
	// and find the asset matching the requested OS.

	if (os === 'windows') {
		// Redirect to a mock MSI release URL
		redirect(
			302,
			'https://github.com/mudiageo/clinic-flow/releases/download/v1.0.0/ClinicFlow_1.0.0_x64_en-US.msi'
		);
	} else if (os === 'android') {
		// Redirect to a mock APK release URL
		redirect(
			302,
			'https://github.com/mudiageo/clinic-flow/releases/download/v1.0.0/ClinicFlow_1.0.0_arm64.apk'
		);
	}

	redirect(302, '/download?error=invalid_os');
}
