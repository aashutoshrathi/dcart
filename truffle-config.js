const path = require("path");
const HDWalletProvider = require("truffle-hdwallet-provider");

var mnemonic =
  "frost toast island december combine recipe friend bring jungle skin cloth rate";
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: "8545",
      network_id: "*"
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(
          mnemonic,
          "https://rinkeby.infura.io/v3/db991edbf2e14b0dbaccccb35a50de86"
        );
      },
      network_id: 4
    }
  },
  contracts_build_directory: path.join(__dirname, "client/src/contracts")
};
