FROM node:10

WORKDIR /home/ubuntu/git/Joker

COPY package*.json ./

RUN npm install

COPY . .

ENV NAME joker

CMD ["npm", "start"]