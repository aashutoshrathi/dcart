import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./utils/getWeb3";
import { Badge, Layout, Menu } from "antd";
import "antd/dist/antd.css";
import "./App.css";
import Home from "./components/Home";

const { Header } = Layout;

var headerStyles = { position: "fixed", zIndex: 1, width: "100%" };
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

  render() {
    return (
      <Layout>
        <Header style={headerStyles}>
          <Menu theme="dark" mode="horizontal" style={{ lineHeight: "64px" }}>
            <div className="status">
              {this.state.connected ? (
                <div className="status">
                  Connected <Badge status="success" />
                </div>
              ) : (
                <div className="status">
                  Disconnected <Badge status="error" />
                </div>
              )}
            </div>
          </Menu>
        </Header>
        <Router>
          <Switch>
            <Route exact path="/" render={() => <Home {...this.state} />} />
          </Switch>
        </Router>
      </Layout>
    );
  }
}

export default App;
