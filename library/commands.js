let path = require("path")
let readdir = require("util").promisify(require("fs").readdir)
let checkFileExists = require("./check-file-existence.js")
let execa = require("execa")
let boopsDirectory = "boops"
let colors = require("ansi-colors")

let directoryReducer = (names, entry) =>
	entry.isDirectory() ? names.concat(entry.name) : names

let getBoopNames = async () => {
	let exists = await checkFileExists(boopsDirectory)
	if (!exists) return []

	let dir = await readdir(boopsDirectory, {withFileTypes: true})
	return dir.reduce(directoryReducer, [])
}

let getBoopPathFromName = name => path.resolve(boopsDirectory, name)

let npm = async (commandName, boopName) => {
	let manifestPath = path.resolve(boopsDirectory, boopName, "package.json")
	let isInstall = commandName == "install"
	let hasManifest = await checkFileExists(manifestPath)

	if (hasManifest) {
		let manifest = require(manifestPath)
		let hasScript = manifest.scripts && commandName in manifest.scripts
		if (!hasScript && !isInstall) {
			process.stdout.write(
				colors.grey(`${boopName} doesn't have a ${commandName} script 🐁\n`)
			)
			return
		}
	} else {
		process.stdout.write(colors.grey(`no package.json in ${boopName} 🐇\n`))
		return
	}

	let command = isInstall
		? ["install"]
		: ["run-script", "--scripts-prepend-node-path=true", commandName]

	let prefix = ["--prefix", getBoopPathFromName(boopName)]

	let stdoutBoopPrefix = colors.bold.blue(`${boopName}\t`)

	process.stdout.write(stdoutBoopPrefix + commandName + "\tstart\t🐕\n")

	let subprocess = execa("npm", [...prefix, ...command], {
		extendEnv: true,
		env: {
			BOOP_WEBSITE_DIRECTORY: "website",
			BOOP_PUBLIC_URL: `/${boopName}`,
		},
	})

	subprocess.stdout.on("data", data => {
		process.stdout.write(
			colors.grey(
				data
					.toString()
					.trim()
					.replace(/^/gm, stdoutBoopPrefix) + "\n"
			)
		)
	})

	return subprocess.then(
		result => (
			process.stdout.write(
				stdoutBoopPrefix + commandName + colors.green.bold(" done!\t") + " 🦔\n"
			),
			result
		)
	)
}

let boopInParallel = async fn => {
	let names = await getBoopNames()
	let promises = names.map(name => fn(name))
	return Promise.all(promises)
}

let createTask = taskName => () =>
	boopInParallel(async name => npm(taskName, name))

exports.build = createTask("build")
exports.watch = createTask("watch")
exports.install = createTask("install")
