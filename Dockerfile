FROM node:23.11.0

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./

RUN ["yarn"]

COPY . .

CMD ["yarn", "dev"]
