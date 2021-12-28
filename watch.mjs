/* c8 ignore start */
import chokidar from "chokidar";
import os from "os";
import fs from "fs";
import { resolve } from "path";
const cwd = process.cwd();

// Watch for any changes
export const watch = (uri, event, timeout = 65) => {
	let lock = false;
	const fn = async () => {
		if (lock) {
			return;
		}
		lock = true;
		await Promise.resolve(event());
		setTimeout(() => {
			lock = false;
		}, timeout);
	};

	if (/(darwin|window)/.test(os.type().toLowerCase())) {
		chokidar.watch(uri).on("all", fn);
		if (fs.statSync(uri).isDirectory()) {
			fs.watch(uri, { recursive: true }, fn);
		} else {
			fs.watchFile(uri, fn);
		}
	} else {
		chokidar.watch(uri).on("all", fn);
	}
};

function fixName(p = "") {
	p = p.replace(/\./g, "");
    p = p.replace(/-/g, "_");
    p = p.replace(/\//g, "_");
    p = p.replace(/\[/g, "_");
    p = p.replace(/\\/g, "_");
    p = p.replace(/:/g, "_");
    p = p.replace(/]/g, "_");
	return p;
}

function makeApiCode() {
	return `
	/* eslint-disable */
	import { createZeroApi } from 'sveltekit-zero-api'
	import type onWatch from 'sveltekit-zero-api/onWatch'

	const routes = createZeroApi<typeof onWatch>({
		// The folder we're in. (/src)
		baseUrl: void 0,

		// GET/POST memo cache time(ms)
		cacheTime: 0,

		// Deal with Error
		onError: async (err) => console.error('[API]', err)
	});

	//   routes.api   is eqv. to   /src/routes/api
	//   change it based on your api directory
	export default routes.api
	`;
}

const fixRealPath = (inPath = "") => {
	inPath = inPath.slice(0, -3); // upload.json.ts → upload.json
	inPath = inPath.replace(/\\/g, "\\\\");
	// const out = inPath.replace(realPath, watchPath);
	// console.log(inPath, realPath, watchPath, out);
	return inPath;
};

function updateAPI(realPath = "", watchPath) {
	let apiDir = {};
	let docDir = {};
	let importCode = "";
	const loadDir = (thePath, obj) => {

		const files = fs.readdirSync(thePath);
		
		files.forEach((file) => {

			const p = resolve(thePath, file);
			const stat = fs.statSync(p);
			const key = "'" + file.replace(/\.(ts|js)/, "") + "'";

			if (stat.isDirectory()) {

				if (!obj[key]) {
					obj[key] = {};
				}
				loadDir(p, obj[key]);

			} else if (/\.(ts|js)$/.test(file) && !/\.d\.ts$/.test(file)) {

				const importName = fixRealPath(p);
				const name = fixName(importName);
				importCode += `import * as ${name} from "${importName}";\n`;
				obj[key] = `f(${name})`;

			}

		});

	};

	loadDir(realPath, apiDir);
	const dirText = JSON.stringify(apiDir).replace(/"/g, "");

	fs.writeFile(
		resolve(cwd, "node_modules", "sveltekit-zero-api", "__temp.ts"),
		`/* eslint-disable */ // Code generated by sveltekit-zero-api, DO NOT EDIT.
import type { FetchApi } from './fetchapi'
${importCode}

// Import module keys returns the actual Response. SvelteKit Zero API returns a "FetchAPI"
// @ts-ignore
const f = <T extends unknown>(importModule: T) => importModule as { [key in keyof T]: ((obj: Parameters<T[key]>[0]) => FetchApi<ReturnType<T[key]>>) & ((obj: Parameters<T[key]>[0], loadFetch: any) => FetchApi<ReturnType<T[key]>>) }
		
export default ${dirText}`,
		(err) => err && console.error(err)
	);
}





export default function ({ routes, src } = {}) {
	routes = routes || "src/routes";
	src = src || "src";
	const realPath = resolve(cwd, routes);

	// Create src/api.ts if doesn't exist
	const zeroPath = resolve(cwd, src, "api.ts");
	if (!fs.existsSync(zeroPath)) {
		fs.writeFile(zeroPath, makeApiCode(), (err) => {
			if (err) {
				console.error(err);
			}
		});
	}

	// Update API — and update on file changes
	updateAPI(realPath, routes);
	watch(realPath, () => {
		updateAPI(realPath, routes);
	});
}
