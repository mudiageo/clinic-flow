import { redirect } from '@sveltejs/kit';

export async function GET({ url }) {
	const os = url.searchParams.get('os');
	const arch = url.searchParams.get('arch') || 'x64';
	const version = url.searchParams.get('version');

	let filenameVersion = '';
	let releasePath = '';
	
	if (version) {
		filenameVersion = version.replace(/^app-v/, '');
		releasePath = `download/${version}`;
	} else {
		try {
			const res = await fetch('https://api.github.com/repos/mudiageo/clinic-flow/releases/latest');
			if (res.ok) {
				const data = await res.json();
				const tagName = data.tag_name;
				filenameVersion = tagName.replace(/^app-v/, '');
				releasePath = `download/${tagName}`;
			} else {
				filenameVersion = '0.1.0';
				releasePath = 'latest/download';
			}
		} catch (e) {
			filenameVersion = '0.1.0';
			releasePath = 'latest/download';
		}
	}

	let filename = '';

	if (os === 'windows') {
		filename = `ClinicFlow_${filenameVersion}_x64-setup.exe`;
	} else if (os === 'macos') {
		filename = arch === 'aarch64' 
			? `ClinicFlow_${filenameVersion}_aarch64.dmg`
			: `ClinicFlow_${filenameVersion}_x64.dmg`;
	} else if (os === 'linux') {
		filename = arch === 'aarch64'
			? `clinic-flow_${filenameVersion}_arm64.deb`
			: `clinic-flow_${filenameVersion}_amd64.deb`;
	} else if (os === 'android') {
		filename = `ClinicFlow_${filenameVersion}_${arch}.apk`;
	}

	if (filename) {
		redirect(
			302,
			`https://github.com/mudiageo/clinic-flow/releases/${releasePath}/${filename}`
		);
	}

	redirect(302, '/download?error=invalid_os');
}
