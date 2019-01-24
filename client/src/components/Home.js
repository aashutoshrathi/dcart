import React, { Component } from "react";
import { Button, Layout } from "antd";
import "antd/dist/antd.css";
const { Content } = Layout;

class Home extends Component {
  constructor(props) {
    super(props);
    console.log(props);
    this.state = { loading: false, storageValue: this.props.storageValue };
  }

  handleClick = async event => {
    this.setState({ loading: true });
    const { accounts, contract } = this.props;
    var val = 1;
    await contract.methods.set(val).send({ from: accounts[0] });
    const res = await contract.methods.get().call();
    this.setState({ storageValue: res, loading: false });
  };

  render() {
    return (
      <Content style={{ padding: "0 50px", marginTop: 64 }}>
        <br />
        <div style={{ background: "#fff", padding: 24, minHeight: 380 }}>
          <div>The stored value is: {this.state.storageValue}</div>
          <Button
            loading={this.state.loading}
            onClick={this.handleClick.bind(this)}
            type="primary"
          >
            Set Storage
          </Button>
        </div>
      </Content>
    );
  }
}

export default Home;
