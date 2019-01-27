import React, { Component } from "react";
import { Button, Layout, Form, Input, List, Card } from "antd";
import "antd/dist/antd.css";
import { Link } from "react-router-dom";
const { Content } = Layout;

class Store extends Component {
  constructor(props) {
    super(props);
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
    // console.log(name);
    await contract.methods
      .addStore(name, accounts[0], 0)
      .send({ from: accounts[0] });
    this.setState({ loading: false, value: "" });
    this.fetchStores();
  }

  handleChange = event => {
    this.setState({ value: event.target.value });
  };

  async fetchStores() {
    if (!this.props.contract) {
      return;
    }
    let stores = [];
    this.props.contract.methods
      .getStoreCount()
      .call()
      .then(num => {
        for (let i = num - 1; i >= 0; i--) {
          this.props.contract.methods
            .getStore(i)
            .call()
            .then(res => {
              stores[i] = {
                storeID: i,
                name: res[0],
                owner: res[1]
              };
              // console.log(res);
            })
            .catch(console.error)
            .finally(() => {
              this.setState({ stores: stores });
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
            size="default"
            grid={{ gutter: 16, column: 3 }}
            header={
              <div>
                <h3>
                  <b>Stores</b>
                </h3>
              </div>
            }
            dataSource={this.state.stores}
            renderItem={item => (
              <List.Item>
                <Link to={`/stores/${item.storeID}`}>
                  <Card title={item.name}>{item.owner}</Card>
                </Link>
              </List.Item>
            )}
          />
        </div>
      </Content>
    );
  }
}

export default Store;
