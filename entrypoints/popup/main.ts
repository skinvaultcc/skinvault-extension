import { renderPopup } from '@/lib/popup';
import './style.css';

document.documentElement.lang = browser.i18n.getUILanguage();
document.documentElement.dir = browser.i18n.getMessage('@@bidi_dir') || 'ltr';

void renderPopup(document.getElementById('app')!, {
	t: (key) => browser.i18n.getMessage(key as Parameters<typeof browser.i18n.getMessage>[0]),
	hasAccess: (query) => browser.permissions.contains(query),
	requestAccess: (query) => browser.permissions.request(query)
});
