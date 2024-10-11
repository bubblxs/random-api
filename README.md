<h2 align="center">random api</h2>

> node.js api that displays random images of cats, dogs, and cute quotes.

### usage
```
git clone https://github.com/bubblxs/random-api.git
```
```
cd random-api && node ./index.js
```
the server will start running on port ``4242``

### endpoints

- **endpoint:** /api/cat|dog|quote
- **method:** GET
- **description:** returns a random image or quote.
---

- **endpoint:** /api/cat|dog|quote?id=**int**
- **method:** GET
- **description:** returns the image or quote with the associated id.
---

### credits
- <span>cat images were taken from <a href="https://thecatapi.com/">The Cat API.</a></span>

- <span>dog images were taken from <a href="https://thedogapi.com/">The Dog API.</a></span>
