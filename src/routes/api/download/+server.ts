import { redirect } from '@sveltejs/kit';

export async function GET({ url }) {
	const os = url.searchParams.get('os');

	// Mock GitHub Releases redirect for Demo
	// In a real scenario, this would dynamically query api.github.com/repos/org/repo/releases/latest
	// and find the asset matching the requested OS.

	if (os === 'windows') {
		// Redirect to the real MSI release URL
		redirect(
			302,
			'https://github.com/mudiageo/clinic-flow/releases/download/app-v0.1.0/ClinicFlow_0.1.0_x64-setup.exe'
		);
	} else if (os === 'android') {
		// Redirect to the real APK release URL
		redirect(
			302,
			'https://github.com/mudiageo/clinic-flow/releases/download/app-v0.1.0/ClinicFlow_0.1.0_aarch64.apk' // Note: change this if the exact APK name differs, based on Android build output
		);
	}

	redirect(302, '/download?error=invalid_os');
}
