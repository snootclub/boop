let serveHandler = require("serve-handler")

module.exports = async ({request, response, websiteDirectory}) =>
	serveHandler(request, response, {
		headers: [
			{
				source: "**/*.@(org)",
				headers: [{
					key: "content-type",
					value: "text/org"
				}]
			}
		],
		public: websiteDirectory,
		directoryListing: false,
		cleanUrls: true,
	})