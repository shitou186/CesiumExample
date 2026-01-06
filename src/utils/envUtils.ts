const TEST_HOST = import.meta.env.VITE_TEST_IP;
export function getWsUrl() {
	return "ws://" + getHost();
}

export function getHost() {
	return isDev() ? TEST_HOST : location.host;
}

export function getOrigin() {
	return "http://" + getHost();
}

export function getProtocolHostname() {
	const { protocol, hostname } = window.location;
	return isDev() ? `${protocol}//${TEST_HOST}` : `${protocol}//${hostname}`;
}

export const isDev = () => import.meta.env.DEV;
