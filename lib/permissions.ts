// Host access to Steam's login API only (skinvault-api's ADR-023): the two
// calls a web page can't make. Browsers grant host permissions per host, so
// the path documents intent rather than narrowing the grant.
export const HOST_PERMISSIONS = ['https://api.steampowered.com/IAuthenticationService/*'];
