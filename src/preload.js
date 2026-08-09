const { ipcRenderer } = require('electron');

const parse_unread_count = (title_str) => {
	/*
	 * Extracts numeric count from document title like '(3) Instagram'.
	 */
	const match = title_str.match(/^\((\d+)\)/);
	if (match && match[1]) {
		return parseInt(match[1], 10);
	}
	return 0;
};

const notify_badge_change = (count_val) => {
	ipcRenderer.send('unread-count', count_val);
};

const observe_title_changes = () => {
	/*
	 * Observes document title mutations to detect unread Instagram messages.
	 */
	let current_count = 0;

	const check_title = () => {
		const new_count = parse_unread_count(document.title);
		if (new_count !== current_count) {
			current_count = new_count;
			notify_badge_change(current_count);
		}
	};

	const observer = new MutationObserver(() => {
		check_title();
	});

	const target_node = document.querySelector('title');
	if (target_node) {
		observer.observe(target_node, {
			subtree: true,
			characterData: true,
			childList: true
		});
	} else {
		window.addEventListener('load', () => {
			const node = document.querySelector('title');
			if (node) {
				observer.observe(node, {
					subtree: true,
					characterData: true,
					childList: true
				});
			}
		});
	}
};

window.addEventListener('DOMContentLoaded', () => {
	observe_title_changes();
});
