/** @type {import('tailwindcss').Config} */
export default {
	darkMode: "class",
	content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
	theme: {
		extend: {
			fontFamily: {
				sans: ['"Open Sans"', "sans-serif"],
			},
		},
	},
	plugins: [],
};
