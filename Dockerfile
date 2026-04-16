FROM node:22-alpine

WORKDIR /usermgmt

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["npm", "start"]

