FROM node:12-alpine as BUILD

ARG TOKEN=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

ARG USER_CONTEXT_VER=0.5

ARG TANGO_REST_VER=2.3

RUN apk add --no-cache wget unzip

COPY . /src

WORKDIR /src

RUN echo //npm.pkg.github.com/:_authToken=$TOKEN >> .npmrc

RUN npm install @waltz-controls/waltz-user-context-plugin --registry=https://npm.pkg.github.com/waltz-controls

RUN npm install

RUN npm run build

RUN npm run war

RUN wget https://github.com/waltz-controls/user-context/releases/download/$USER_CONTEXT_VER/user-context.war

RUN wget https://github.com/hzg-wpi/rest-server/releases/download/rest-server-$TANGO_REST_VER/rest-server-$TANGO_REST_VER.zip

RUN unzip rest-server-$TANGO_REST_VER.zip

RUN mv rest-server-$TANGO_REST_VER/tango.war tango.war

FROM tomcat:9-jdk11

COPY --from=BUILD /src/dist/waltz.war /usr/local/tomcat/webapps

COPY --from=BUILD /src/user-context.war /usr/local/tomcat/webapps

COPY --from=BUILD /src/tango.war /usr/local/tomcat/webapps

COPY docker/tomcat/tomcat-users.xml docker/tomcat/server.xml /usr/local/tomcat/conf/
