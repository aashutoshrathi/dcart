import React, { Component } from "react";
import { Button, Layout, Form, Input, List } from "antd";
import "antd/dist/antd.css";
const { Content } = Layout;

class Store extends Component {
  constructor(props) {
    super(props);
    console.log(props);
    this.state = { loading: false, value: "" };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    this.fetchStores();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.contract) {
      this.fetchStores();
    }
  }

  async handleSubmit(event) {
    this.setState({ loading: true });
    const { accounts, contract } = this.props;
    var name = this.state.value;
    console.log(name);
    await contract.methods
      .addStore(name, accounts[0], 0)
      .send({ from: accounts[0] });
    this.setState({ loading: false, value: "" });
    this.fetchStores();
  }

  handleChange = event => {
    this.setState({ value: event.target.value });
  };

  fetchStores() {
    if (!this.props.contract) {
      return;
    }
    let storeMap = {};
    this.props.contract.methods
      .getStoreCount()
      .call()
      .then(num => {
        for (let i = num - 1; i >= 0; i--) {
          this.props.contract.methods
            .getStore(i)
            .call()
            .then(res => {
              storeMap[i] = res[0];
              console.log(res);
            })
            .catch(console.error)
            .finally(() => {
              let stores = [];
              for (let i = num - 1; i >= 0; i--) {
                if (i in storeMap) {
                  stores.push(storeMap[i]);
                }
              }
              this.setState({ stores });
            });
        }
      })
      .catch(console.error);
  }

  render() {
    return (
      <Content style={{ padding: "0 50px", marginTop: 64 }}>
        <br />
        <div style={{ background: "#fff", padding: 24, minHeight: 380 }}>
          <div>
            <h3>Add Store</h3>
          </div>
          <Form layout="inline">
            <Form.Item
              label="Store Name"
              labelCol={{ span: 7 }}
              wrapperCol={{ span: 14 }}
            >
              <Input value={this.state.value} onChange={this.handleChange} />
            </Form.Item>
            <Form.Item wrapperCol={{ span: 10, offset: 5 }}>
              <Button
                type="primary"
                htmlType="submit"
                onClick={this.handleSubmit}
                disabled={!this.state.value || this.state.value.length > 20}
                loading={this.state.loading}
              >
                Add New Store
              </Button>
            </Form.Item>
          </Form>
          <br />
          <hr />

          <List
            size="large"
            header={
              <div>
                <h3>Stores</h3>
              </div>
            }
            bordered
            dataSource={this.state.stores}
            renderItem={item => <List.Item>{item}</List.Item>}
          />
        </div>
      </Content>
    );
  }
}

export default Store;
