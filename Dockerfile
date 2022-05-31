FROM alpine:latest
WORKDIR /usr/src/evb-validator
COPY . /usr/src/evb-validator/
RUN apk add --update nodejs npm
RUN npm install
CMD ["npm", "start"]
EXPOSE 80