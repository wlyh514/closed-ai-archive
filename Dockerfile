# Dockerfile adapted from
# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Bundle app source
COPY . .

RUN pnpm push-db
RUN pnpm build

# production environment
FROM nginx:1.21.6-alpine
# new
COPY nginx/nginx.conf /etc/nginx/sites-enabled/closed-ai-backend
EXPOSE 5000

CMD pnpm start