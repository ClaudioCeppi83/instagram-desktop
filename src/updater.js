const { app, dialog, shell } = require('electron');
const https = require('https');

const GITHUB_REPO_OWNER = 'ClaudioCeppi83';
const GITHUB_REPO_NAME = 'instagram-desktop';

const is_newer_version = (latest_tag, current_ver) => {
	/*
	 * Compares semantic version strings e.g. v1.0.1 > 1.0.0.
	 */
	const clean_latest = latest_tag.replace(/^v/, '');
	const clean_current = current_ver.replace(/^v/, '');

	const p1 = clean_latest.split('.').map((x) => parseInt(x, 10));
	const p2 = clean_current.split('.').map((x) => parseInt(x, 10));

	for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
		const v1 = p1[i] || 0;
		const v2 = p2[i] || 0;
		if (v1 > v2) {
			return true;
		}
		if (v1 < v2) {
			return false;
		}
	}
	return false;
};

const check_for_updates = (is_manual_check = false) => {
	/*
	 * Fetches latest release from GitHub API and alerts user if update exists.
	 */
	const options = {
		hostname: 'api.github.com',
		path: `/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`,
		headers: { 'User-Agent': 'Instagram-Desktop-App' }
	};

	https.get(options, (res) => {
		let data_raw = '';
		res.on('data', (chunk) => {
			data_raw += chunk;
		});

		res.on('end', () => {
			if (res.statusCode !== 200) {
				if (is_manual_check) {
					dialog.showMessageBox({
						type: 'info',
						title: 'Instagram Desktop',
						message: 'No se encontraron actualizaciones por ahora.'
					});
				}
				return;
			}
			try {
				const release_info = JSON.parse(data_raw);
				const latest_tag = release_info.tag_name || '1.0.0';
				const current_ver = app.getVersion();

				if (is_newer_version(latest_tag, current_ver)) {
					const choice = dialog.showMessageBoxSync({
						type: 'info',
						title: 'Actualización disponible',
						message: `¡Nueva versión ${latest_tag} disponible!`,
						detail: release_info.body || '¿Deseas descargar la actualización?',
						buttons: ['Descargar', 'Más tarde'],
						defaultId: 0
					});

					if (choice === 0) {
						const download_url = release_info.html_url ||
							`https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases`;
						shell.openExternal(download_url);
					}
				} else if (is_manual_check) {
					dialog.showMessageBox({
						type: 'info',
						title: 'Instagram Desktop',
						message: `Ya tienes la última versión (${current_ver}).`
					});
				}
			} catch (err) {
				/* Silent catch for network or json issues */
			}
		});
	}).on('error', () => {
		if (is_manual_check) {
			dialog.showMessageBox({
				type: 'error',
				title: 'Instagram Desktop',
				message: 'No se pudo conectar con el servidor de actualizaciones.'
			});
		}
	});
};

module.exports = {
	check_for_updates
};
