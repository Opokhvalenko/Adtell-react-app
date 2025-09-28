// Єдина точка правди для всіх ads-стилів + компоновщик під різні режими

export const ADS_WRAP_CSS =
	".ads-wrap{position:relative;display:block;margin:0 auto}";

export const ADS_SLOT_CSS =
	".ads-slot{position:relative;display:block;width:100%;height:100%;min-height:50px;overflow:hidden;border:1px solid rgba(0,0,0,.1);border-radius:12px;background:#f3f4f6}";

export const ADS_SLOT_IFRAME_CSS =
	".ads-slot iframe{display:block;border:0;width:100%;height:100%;overflow:hidden}";

export const ADS_PLACEHOLDER_CSS =
	".ads-placeholder{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:.5rem;font:12px/1.2 system-ui;color:#6b7280;background-image:repeating-linear-gradient(45deg,rgba(0,0,0,.03) 0 10px,rgba(0,0,0,.05) 10px 20px)}";

export const ADS_DOT_CSS =
	".ads-dot{width:8px;height:8px;border-radius:9999px;background:#9ca3af;animation:ads-pulse 1.4s ease-in-out infinite}";

export const ADS_KEYFRAMES_CSS =
	"@keyframes ads-pulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.3);opacity:1}}";

export const ADS_SIDE_FIXED_CSS = ".ads-side-fixed{position:fixed;z-index:30}";

// Опційно: house creative (якщо використовуєш у google.only.js)
export const ADS_HOUSE_CSS = `
.ads-house{position:absolute;inset:0;border-radius:12px;overflow:hidden}
.ads-house a{display:block;width:100%;height:100%;text-decoration:none}
.ads-house__img{width:100%;height:100%;display:block;object-fit:cover}
.ads-house__label{position:absolute;top:6px;left:8px;padding:2px 6px;border-radius:6px;font:11px/1 system-ui;background:rgba(17,24,39,.75);color:#e5e7eb}
`.trim();

/**
 * Склеює CSS під конкретний модуль.
 * @param {{includeIframe?: boolean, includeSideFixed?: boolean, includeHouse?: boolean}} opts
 */
export function composeAdsCss(opts = {}) {
	const {
		includeIframe = false,
		includeSideFixed = false,
		includeHouse = false,
	} = opts;
	return [
		ADS_WRAP_CSS,
		ADS_SLOT_CSS,
		includeIframe ? ADS_SLOT_IFRAME_CSS : "",
		ADS_PLACEHOLDER_CSS,
		ADS_DOT_CSS,
		ADS_KEYFRAMES_CSS,
		includeSideFixed ? ADS_SIDE_FIXED_CSS : "",
		includeHouse ? ADS_HOUSE_CSS : "",
	]
		.filter(Boolean)
		.join("\n");
}
