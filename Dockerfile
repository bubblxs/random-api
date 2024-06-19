FROM node:22.3-alpine3.19

WORKDIR /usr/src/app

EXPOSE 4242

COPY * ./

USER node

COPY --chown=node:node . .

CMD [ "node", "./index.js" ]