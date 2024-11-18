// workbox-config.cjs
module.exports = {
	globDirectory: 'src/',
	globPatterns: [
		'**/*.{js,html,svg}'
	],
	swDest: 'src/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};