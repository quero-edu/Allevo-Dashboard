FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV HOST=0.0.0.0
ENV DISABLE_HMR=true
EXPOSE 3000

CMD ["npm", "run", "dev"]
