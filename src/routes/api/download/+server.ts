import { redirect } from '@sveltejs/kit';

export async function GET({ url }) {
	const os = url.searchParams.get('os');

	const version = url.searchParams.get('version');
	
	const releasePath = version ? `download/${version}` : 'latest/download';
	const filenameVersion = version ? version.replace(/^app-v/, '') : '0.1.0';

	if (os === 'windows') {
		redirect(
			302,
			`https://github.com/mudiageo/clinic-flow/releases/${releasePath}/ClinicFlow_${filenameVersion}_x64-setup.exe`
		);
	} else if (os === 'android') {
		redirect(
			302,
			`https://github.com/mudiageo/clinic-flow/releases/${releasePath}/ClinicFlow_${filenameVersion}_aarch64.apk`
		);
	}

	redirect(302, '/download?error=invalid_os');
}
