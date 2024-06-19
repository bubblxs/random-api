const http = require("node:http");
const assert = require("assert");
const { join, extname, resolve } = require("path");
const { renameSync, existsSync, readdirSync, readFileSync } = require("fs");

const PORT = 4242;
const DATA_PATHS_INFO = {
    dogs: {
        path: "./data/dogs",
        size: 0,
    },
    cats: {
        path: "./data/cats",
        size: 0
    },
    quotes: {
        path: "./data/quotes.json",
        size: 0
    }
};
const MIME_TYPE = {
    js: "text/javascript",
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

const init = () => {
    for (let obj of Object.entries(DATA_PATHS_INFO)) {
        const path = resolve(__dirname, obj[1].path);

        if (path.endsWith(".json") && existsSync(path)) {
            const { quotes } = JSON.parse(readFileSync(path));

            obj[1].size = quotes.length;

            continue;
        }

        if (!existsSync(path)) continue;

        const files = readdirSync(path);

        files.forEach((el, idx) => {
            renameSync(join(path, el), join(path, `${idx}${extname(el)}`));
        });

        obj[1].size = files.length;
    }

    assert(DATA_PATHS_INFO.cats.size > 0, "we need at least one cat pic :3");
    assert(DATA_PATHS_INFO.dogs.size > 0, "we need at least one dog pic :P");
    assert(DATA_PATHS_INFO.quotes.size > 0, "can we need at least one cool quote? XD");
};

const handleStatic = (req, res, next, fileName) => {
    try {
        const files = readdirSync(join(__dirname, "/public"));
        const idx = files.indexOf(fileName);

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

    return res.end(msg);
};

/* ?? idk what name give to this */
const handleImages = (req, res, next, dataPath, pathSize) => {
    try {
        const { searchParams } = new URL(`http://${req.headers.host}${req.url}`);
        const id = searchParams.get("id") !== '' ? searchParams.get("id") : null;

        if (id && !isNumeric(id)) {
            return next({ message: "bad request", status: 400 }, req, res);
        }

        const idx = id ?? Math.floor(Math.random() * pathSize - 1);
        const file = readdirSync(dataPath).at(parseInt(idx));

        if (!file) {
            return next({ message: "not found", status: 404 }, req, res);
        }

        const buffer = readFileSync(resolve(dataPath, file));

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

    const { quotes } = require(resolve(__dirname, DATA_PATHS_INFO.quotes.path));
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
        return handleError({ message: "not allowed", status: 403 }, req, res);
    }

    if (pathname === "/") {
        const page = readFileSync("./public/index.html");

        res.writeHead(200, {
            "content-length": page.byteLength,
            "content-type": MIME_TYPE.html,
        });

        return res.end(page);

    } else if (catsRegex.test(pathname) && pathname.replace(catsRegex, "").length === 0) {
        handleImages(req, res, handleError, DATA_PATHS_INFO.cats.path, DATA_PATHS_INFO.cats.size);

    } else if (dogsRegex.test(pathname) && pathname.replace(dogsRegex, "").length === 0) {
        handleImages(req, res, handleError, DATA_PATHS_INFO.dogs.path, DATA_PATHS_INFO.dogs.size);

    } else if (quotesRegex.test(pathname) && pathname.replace(quotesRegex, "").length === 0) {
        handleQuotes(req, res, handleError);

    } else if (publicFilesRegex.test(pathname) && MIME_TYPE[pathname.replace(publicFilesRegex, "").split(".").at(-1)]) {
        handleStatic(req, res, handleError, pathname.replace(publicFilesRegex, ""));

    } else {
        handleError({ message: "how did you get here?", status: 404 }, req, res);

    }
});

init();

server.listen(PORT, () => console.log(`::${PORT}`));