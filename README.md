<h1 align="center">random api</h1>

> node.js api that displays random images of cats, dogs, and cute quotes. enjoy the randomness! >:3

### usage
```
git clone https://github.com/bubblxs/random-api.git
```
```
cd random-api && node ./index.js
```
the server will start running on port ``4242``

### endpoints

#### get random cat image
- **endpoint:** /api/cat
- **method:** GET
- **description:** returns a random image of a cat.
---

#### get cat image by id
- **endpoint:** /api/cat?id=**int**
- **method:** GET
- **description:** returns the image with the associated id.
---

#### get random dog image
- **endpoint:** /api/dog
- **method:** GET
- **description:** returns a random image of a dog.
---

#### get dog image by id
- **endpoint:** /api/dog?id=**int**
- **method:** GET
- **description:** returns the image with the associated id.
---

#### get random quote
- **endpoint:** /api/quote
- **method:** GET
- **description:** returns a random quote.
---

#### get quote by id
- **endpoint:** /api/quote?id=**int**
- **method:** GET
- **description:** returns the quote with the associated id.
---

### credits
<p>cat images were taken from <a href="https://thecatapi.com/">The Cat API.</a></p>
<p>dog images were taken from <a href="https://thedogapi.com/">The Dog API.</a></p>
