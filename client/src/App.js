import React, { Component } from "react";
import ReactLoading from "react-loading";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./utils/getWeb3";
import { Button } from "antd";

import "./App.css";

class App extends Component {
  state = {
    connected: false,
    storageValue: 0,
    web3: null,
    accounts: null,
    contract: null,
    loading: false
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance, connected: true });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  handleClick = async event => {
    this.setState({ loading: true });
    const { accounts, contract } = this.state;
    var val = 1;
    const currentBalance = await contract.methods.get().call();
    await contract.methods.set(currentBalance + val).send({ from: accounts[0] });
    const res = await contract.methods.get().call();
    this.setState({ storageValue: res, loading: false });
  };

  render() {
    if (!this.state.web3) {
      return (
        <div className="App center">
          <ReactLoading
            type={"balls"}
            color={"blue"}
            height={"10%"}
            width={"10%"}
          />
        </div>
      );
    }
    return (
      <div className="App">
        {this.state.connected ? <h1>Good to Go!</h1> : <p />}
        <div>The stored value is: {this.state.storageValue}</div>
        <Button
          type="primary"
          loading={this.state.loading}
          onClick={this.handleClick.bind(this)}
        >
          Set Storage
        </Button>
      </div>
    );
  }
}

export default App;
