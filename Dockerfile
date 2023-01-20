FROM node:10

WORKDIR /app

COPY . .

RUN npm uninstall -g truffle

RUN npm install -g truffle@5.0.2

#RUN cd app
# install packages
RUN npm install --save  openzeppelin-solidity@1.10.0
RUN npm install --save  truffle-hdwallet-provider@1.0.2
#RUN npm install truffle-hdwallet-provider@1.0.10
RUN npm install webpack-dev-server -g
RUN npm install web3@1.2.2


# Remove the node_modules  
# remove packages
RUN rm -rf node_modules

# clean cache
#RUN npm cache clean
RUN npm install --cache /tmp/empty-cache
RUN rm package-lock.json
# initialize npm (you can accept defaults)
RUN npm init -y
# install all modules listed as dependencies in package.json
RUN npm install

# installing nano
RUN apt-get -y update
RUN apt-get -y install vim nano

# To deploy via Infura you'll need a wallet provider (like truffle-hdwallet-provider)
# RUN npm install truffle-hdwallet-provider@web3-one
RUN npm install any-promise --save-dev
RUN npm install bindings
RUN npm install --save-dev truffle-assertions

# For truffle
EXPOSE 9545
# For app
EXPOSE 8000