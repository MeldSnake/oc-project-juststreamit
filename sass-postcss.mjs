#!/usr/bin/env node

import autoprefixer from "autoprefixer";
import postcss from "postcss";
import postcssNested from "postcss-nested";
import postcssAdvancedVariables from 'postcss-advanced-variables';
import sass from "sass";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { exit } from "process";

const watchSignal = new AbortController();
const postCssProcessor = postcss([autoprefixer, postcssNested, postcssAdvancedVariables]);

/**
 * @param {string} filePath
 * @param {string} destPath
 */
async function processSCSS(filePath, destPath) {
    try {
        const compiled = await sass.compileAsync(
            filePath, {
                sourceMap: false,
            }
        );
        const processed = await postCssProcessor
            .process(compiled.css, {
                map: false,
                from: undefined,
            });
        let fd;
        try {
            fd = await fsp.open(destPath, "w");
            await fd.write(processed.css, null, "utf8");
        } finally {
            await fd.close();
        }
    } catch (err) {
        console.error(err);
    }
}

/**
 * @param {string} srcPath
 * @param {string} destPath
 * @param {string} filePath
 */
async function processFile(srcPath, destPath, filePath) {
    console.log("Processing %s -> %s", filePath, destPath);
    {
        if (!fs.existsSync(destPath)) {
            await fsp.mkdir(destPath, {
                recursive: false,
            });
        }
    }
    const fullFilePath = path.join(srcPath, filePath);
    const stat = await fsp.stat(fullFilePath);
    
    if (stat.isFile() && fullFilePath.endsWith('.scss')) {
        const destFile = path.join(destPath, filePath.slice(0, filePath.lastIndexOf('.scss')) + ".css");
        return await processSCSS(fullFilePath, destFile);
    }
}

async function main() {
    await fsp.readdir("./sass")
        .then(async (files) => {
            await Promise.allSettled(files.map(processFile.bind(null, "./sass", "./public/styles")));
        });

    if (["-w", "--watch"].includes(process.argv[2])) {
        try {
            const watcher = fsp.watch("./sass", {
                signal: watchSignal.signal,
            });
            for await (const event of watcher) {
                await processFile("./sass", "./public/styles", event.filename);
            }
        } catch (err) {
            if (err.name === "AbortError") {
                return Promise.resolve();
            }
            throw err;
        }
    }
}

await main();