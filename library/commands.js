let path = require("path")
let fs = require("fs-extra")
let execa = require("execa")

let boopsDirectory = "boops"

let getBoopNames = async () =>
	await fs.pathExists(boopsDirectory)
		? fs.readdir(boopsDirectory)
		: []

let getBoopPathFromName = name =>
	path.resolve(boopsDirectory, name)

let npm = (commandName, boopName) => {
	let command = commandName == "install"
		? ["install"]
		: [
			"run-script",
			"--scripts-prepend-node-path=true",
			commandName
		]

	let prefix = [
		"--prefix",
		getBoopPathFromName(boopName)
	]

	console.log(`running ${commandName} in ${boopName}`)

	return execa("npm", [
		...prefix,
		...command
	], {
		extendEnv: true,
		env: {
			BOOP_WEBSITE_DIRECTORY: "website",
			BOOP_PUBLIC_URL: `/${boopName}`,
			// deprecated, but for old canvas sketches
			SNOOT_OUTPUT_DIRECTORY: "website",
			SNOOT_PUBLIC_URL: `/${boopName}`
		}
	}).then(result => (console.log(`completed ${commandName} in ${boopName}`), result))
}

let boopInParallel = async fn => {
	let names = await getBoopNames()
	let promises = names.map(name => fn(name))
	return Promise.all(promises)
}

let createTask = taskName => () =>
	boopInParallel(async name =>
		npm(taskName, name)
	)

exports.build = createTask("build")
exports.watch = createTask("watch")
exports.install = createTask("install")
