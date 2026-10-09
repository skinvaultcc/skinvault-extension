import { HOST_PERMISSIONS } from './permissions';

const ACCOUNT_URL = 'https://skinvault.cc/account';

type PermissionQuery = { origins: string[] };

export interface PopupDeps {
	t: (key: string) => string;
	hasAccess: (query: PermissionQuery) => Promise<boolean>;
	requestAccess: (query: PermissionQuery) => Promise<boolean>;
}

function element<K extends keyof HTMLElementTagNameMap>(
	tag: K,
	text: string,
	className: string
): HTMLElementTagNameMap[K] {
	const el = document.createElement(tag);
	el.textContent = text;
	el.className = className;
	return el;
}

// The popup of ADR-002: whether the browser granted the host access the
// extension needs (Firefox can leave it to the user under Manifest V3), and
// where linking happens. Built with textContent only, never innerHTML.
export async function renderPopup(root: HTMLElement, deps: PopupDeps): Promise<void> {
	const query = { origins: HOST_PERMISSIONS };
	const granted = await deps.hasAccess(query);

	const status = granted
		? element('p', deps.t('popupReady'), 'popup__status popup__status--ready')
		: element('p', deps.t('popupNeedsAccess'), 'popup__status popup__status--blocked');
	const children: HTMLElement[] = [element('h1', 'SkinVault', 'popup__title'), status];

	if (!granted) {
		const allow = element('button', deps.t('popupAllow'), 'popup__button');
		allow.type = 'button';
		allow.addEventListener('click', () => {
			// requestAccess must run inside the click, which browsers require
			// before showing their permission prompt.
			void deps.requestAccess(query).then(() => renderPopup(root, deps));
		});
		children.push(allow);
	}

	const link = element('a', deps.t('popupOpenAccount'), 'popup__link');
	link.href = ACCOUNT_URL;
	link.target = '_blank';
	link.rel = 'noopener';
	children.push(link, element('p', deps.t('popupHowTo'), 'popup__hint'));

	root.replaceChildren(...children);
}
