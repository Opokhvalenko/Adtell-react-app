/** @type {import('tailwindcss').Config} */
export default {
	darkMode: "class",
	content: [
		"./index.html",
		"./src/**/*.{js,jsx,ts,tsx}",
		"./src/modules/adserver/ssr/templates/**/*.html",
		"./src/modules/adserver/ssr/pages/**/*.{ts,tsx}",
	],
	theme: {
		extend: {
			fontFamily: { sans: ['"Open Sans"', "ui-sans-serif", "system-ui"] },
		},
	},
};
