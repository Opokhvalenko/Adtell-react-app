import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

export default {
	darkMode: "class",
	content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				sans: ['"Open Sans"', "ui-sans-serif", "system-ui"],
			},
		},
	},
	// important: "#root",
	plugins: [forms({ strategy: "class" }), typography],
};
