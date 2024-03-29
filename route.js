let checkFileExists = require("./library/check-file-existence.js")
let path = require("path")
let symbols = require("./symbols.js")
let boopRoot = "boops"

let getName = request => request.url.split("/")[1]

let getNextUrl = request =>
	request.url.slice(getName(request).length + 1) || "/"

let getNextRequest = request => {
	request.url = getNextUrl(request)
	return request
}

module.exports = async (request, response) => {
	let boopName = getName(request)

	let boopDirectory = boopName && path.resolve(boopRoot, boopName)

	if (boopName && (await checkFileExists(boopDirectory))) {
		// at this point we know there's a file at `boops/${boopName}`
		let boopManifestPath = path.resolve(boopDirectory, "package.json")
		let boopWebsitePath = path.resolve(boopDirectory, "website")

		// let's redirect to `module/` because that's expected for a root
		if (request.url == `/${boopName}`) {
			return {
				type: symbols.redirect,
				to: request.url + "/",
			}
		}
		if (await checkFileExists(boopManifestPath)) {
			let {main} = require(boopManifestPath)
			let nextRequest = getNextRequest(request)
			if (main && main.endsWith(".js")) {
				// we found a javascript module, hopefully can handle (request, repons)
				let boop = require(boopDirectory)
				return {
					type: symbols.module,
					module: boop,
					request: nextRequest,
					response: response,
					result: boop(nextRequest, response),
				}
			} else if (await checkFileExists(boopWebsitePath)) {
				// no javascript module, but we have some static files maybe?
				return {
					type: symbols.static,
					request: nextRequest,
					response: response,
					websiteDirectory: boopWebsitePath,
				}
			}
		}
	}

	// found nothing
	return {
		type: symbols.nothing,
	}
}
