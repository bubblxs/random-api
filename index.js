const http = require("node:http");
const assert = require("node:assert");
const { join, extname, resolve } = require("node:path");
const { renameSync, existsSync, readdirSync, readFileSync } = require("node:fs");

const PORT = 4242;
const RESOURCE_PATHS = {
    dogs: {
        path: resolve(__dirname, "./data/dogs"),
        length: 0,
    },
    cats: {
        path: resolve(__dirname, "./data/cats"),
        length: 0
    },
    quotes: {
        path: resolve(__dirname, "./data/quotes.json"),
        length: 0
    }
};
const MIME_TYPE = {
    txt: "text/plain",
    gif: "image/gif",
    jpg: "image/jpeg",
    png: "image/png",
    css: "text/css",
    html: "text/html",
    json: "application/json"
};
const isNumeric = (n) => {
    return new RegExp(/^\d*$/).test(n);
};
const isPathMatching = (pathname, regex, isLengthMatter = true) => {
    const testPath = regex.test(pathname);

    if (isLengthMatter) return testPath && pathname.replace(regex, "").length === 0;

    return testPath;
};
const init = () => {
    const { quotes } = JSON.parse(readFileSync(RESOURCE_PATHS.quotes.path));

    if (quotes) {
        RESOURCE_PATHS.quotes.length = quotes.length;
    }

    const data = Object.entries(RESOURCE_PATHS);

    for (let i = 0; i < data.length - 1; i++) {
        const { path } = data[i][1];

        if (!existsSync(path)) continue;

        const files = readdirSync(path);

        files.forEach((el, idx) => {
            renameSync(join(path, el), join(path, `${idx}${extname(el)}`));
        });

        data[i][1].length = files.length;
    }

    assert(RESOURCE_PATHS.cats.length > 0, "cat pics not found. we need at least one cat pic :3");
    assert(RESOURCE_PATHS.dogs.length > 0, "dogs pics not found. we need at least one dog pic :P");
    assert(RESOURCE_PATHS.quotes.length > 0, "go write something, m8. can we get at least one cool quote? XD");
};
const handleStaticFiles = (req, res, next, filename) => {
    try {
        const files = readdirSync(join(__dirname, "/public"));
        const idx = files.indexOf(filename);

        if (idx === -1) {
            return next({ message: "not found", status: 404 }, req, res);
        }

        const file = readFileSync(join(__dirname, "/public", files.at(idx)));

        res.writeHead(200, {
            "content-length": file.byteLength,
            "content-type": MIME_TYPE[extname(files.at(idx)).split(".").at(-1)] || MIME_TYPE.txt
        });

        res.end(file);

    } catch (error) {
        console.log(error);

        const err = {
            message: "something went wrong",
            status: 500
        };

        next(err, req, res);
    }
};
const handleError = (err, req, res) => {
    const msg = JSON.stringify({ "message": err.message || "something went wrong" });

    res.writeHead(err.status || 500, {
        "content-length": Buffer.byteLength(msg),
        "content-type": MIME_TYPE.json
    });

    res.end(msg);
};
/* ?? idk what name give to this */
const handleImages = (req, res, next, path, length) => {
    try {
        const { searchParams } = new URL(`http://${req.headers.host}${req.url}`);
        const id = searchParams.get("id") !== '' ? searchParams.get("id") : null;

        if (id && !isNumeric(id)) {
            return next({ message: "bad request", status: 400 }, req, res);
        }

        const idx = id ?? Math.floor(Math.random() * length - 1);
        const file = readdirSync(path).at(parseInt(idx));

        if (!file) {
            return next({ message: "not found", status: 404 }, req, res);
        }

        const buffer = readFileSync(join(path, file));

        res.writeHead(200, {
            "content-length": buffer.byteLength,
            "content-type": MIME_TYPE[extname(file).split(".").at(-1)] || MIME_TYPE.txt
        });

        res.end(buffer);

    } catch (error) {
        console.log(error);

        const err = {
            message: "something went wrong",
            status: 500
        };

        next(err, req, res);
    }
};

const handleQuotes = (req, res, next) => {
    const { searchParams } = new URL(`http://${req.headers.host}${req.url}`);
    const id = searchParams.get("id") !== '' ? searchParams.get("id") : null;

    if (id && !isNumeric(id)) {
        return next({ message: "bad request", status: 400 }, req, res);
    }

    const { quotes } = require(RESOURCE_PATHS.quotes.path);
    const idx = id ?? Math.floor(Math.random() * quotes.length - 1);
    const quote = quotes.at(idx);

    if (!quote) {
        return next({ message: "not found", status: 404 }, req, res);
    }

    const body = JSON.stringify({ quote: quote });

    res.writeHead(200, {
        "content-length": Buffer.byteLength(body),
        "content-type": MIME_TYPE.json
    });

    res.end(body);
};

const server = http.createServer((req, res) => {
    const allowedMethods = ["GET"];
    const method = req.method;
    const { pathname } = new URL(`http://${req.headers.host}${req.url}`);
    const catsRegex = new RegExp(/\/api\/cat(\/?)/g);
    const dogsRegex = new RegExp(/\/api\/dog(\/?)/g);
    const quotesRegex = new RegExp(/\/api\/quote(\/?)/g);
    const publicFilesRegex = new RegExp(/\/public(\/?)/g);

    if (!allowedMethods.includes(method)) {
        return handleError({ message: "not allowed", status: 405 }, req, res);
    }

    if (pathname === "/") {
        const page = readFileSync("./public/index.html");

        res.writeHead(200, {
            "content-length": page.byteLength,
            "content-type": MIME_TYPE.html,
        });

        res.end(page);

    } else if (isPathMatching(pathname, catsRegex)) {
        handleImages(req, res, handleError, RESOURCE_PATHS.cats.path, RESOURCE_PATHS.cats.length);

    } else if (isPathMatching(pathname, dogsRegex)) {
        handleImages(req, res, handleError, RESOURCE_PATHS.dogs.path, RESOURCE_PATHS.dogs.length);

    } else if (isPathMatching(pathname, quotesRegex)) {
        handleQuotes(req, res, handleError);

    } else if (isPathMatching(pathname, publicFilesRegex, false) && MIME_TYPE[pathname.replace(publicFilesRegex, "").split(".").at(-1)]) {
        handleStaticFiles(req, res, handleError, pathname.replace(publicFilesRegex, ""));

    } else {
        handleError({ message: "how did you get here?", status: 404 }, req, res);
    }
});

init();

server.listen(PORT, () => console.log(`::${PORT}`));