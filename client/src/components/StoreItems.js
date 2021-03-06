// List all items of store
// Add Item button for owner and buy for everyone else.
import React, { Component } from "react";
import { Row, Col, Layout, List, Card, Modal, Button, Input } from "antd";
import "antd/dist/antd.css";
import Logo from "../assets/logo.png";
import ipfs from "../ipfs";
const { Content } = Layout;

class StoreItems extends Component {
  constructor(props) {
    super(props);
    // console.log(props);
    this.state = {
      loading: false,
      name: "",
      price: "",
      quantity: "",
      visible: false,
      buying: false,
      storeName: "",
      isOwner: false,
      items: [],
      storeBalance: 0,
      buffer: null,
      imageHash: ""
    };
    this.handleChange = this.handleChange.bind(this);
    this.getImage = this.getImage.bind(this);
    this.fetchItems = this.fetchItems.bind(this);
  }

  showModal = () => {
    this.setState({
      visible: true
    });
  };

  handleCancel = () => {
    this.setState({
      visible: false
    });
  };

  addItem = async event => {
    this.setState({ loading: true, visible: false });
    const { accounts, contract, storeID } = this.props;
    await ipfs.files.add(this.state.buffer, (err, res) => {
      if (err) {
        console.log(err);
        return;
      }
      // console.log(res[0].hash);
      this.setState({ imageHash: res[0].hash });
      // console.log(this.state.imageHash);
      const { name, price, quantity } = this.state;
      contract.methods
        .addItem(name, price, quantity, storeID, res[0].hash)
        .send({ from: accounts[0] })
        .then(() => {
          this.setState({ loading: false, value: "" });
          this.fetchItems();
        });
    });
  };

  componentDidMount() {
    if (!this.props.contract) {
      // console.log("No contract found");
      return;
    }
    // console.log(this.props);
    this.props.contract.methods
      .getStore(this.props.storeID)
      .call()
      .then(res => {
        // console.log(res);
        this.setState({
          storeName: res[0],
          isOwner: res[1] === this.props.accounts[0]
        });
      });
    this.fetchItems();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.contract) {
      this.fetchItems();
      this.props.contract.methods
        .getStore(this.props.storeID)
        .call()
        .then(res => {
          // console.log(res);
          this.setState(
            {
              storeName: res[0],
              isOwner: res[1] === this.props.accounts[0]
            },
            this.props.accounts[0] === res[1]
              ? this.getStoreBalance()
              : console.log("Not owner")
          );
        });
    }
  }

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
    // console.log(this.state);
  };

  getImage = event => {
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) });
      // console.log(this.state.buffer);
    };
  };

  buyItem = async (itemIndex, price) => {
    // console.log(itemIndex, this.props.storeID);
    this.setState({ buying: true });
    await this.props.contract.methods
      .buyItem(itemIndex, 1, this.props.storeID)
      .send({ from: this.props.accounts[0], value: price });
    this.setState({ buying: false });
    this.fetchItems();
  };

  getStoreBalance = () => {
    let balance = 0;
    this.props.contract.methods
      .getStoreBalance(this.props.storeID)
      .call()
      .then(bal => {
        // console.log(this.props.storeID);
        balance = bal;
      })
      .then(() => {
        this.setState({ storeBalance: balance });
      });
  };

  withdrawBalance = () => {
    var curBalance = this.state.storeBalance;
    console.log(curBalance);
    this.props.contract.methods
      .withdrawStoreBalance(this.props.storeID, curBalance)
      .send({ from: this.props.accounts[0] });
    this.getStoreBalance();
  };

  fetchItems = () => {
    if (!this.props.contract) {
      return;
    }
    var storeID = this.props.storeID;
    let items = [];
    let finalItems = [];
    this.props.contract.methods
      .getStoreItemCount(storeID)
      .call()
      .then(num => {
        for (let i = num - 1; i >= 0; i--) {
          this.props.contract.methods
            .fetchItem(i, storeID)
            .call()
            .then(res => {
              // console.log(res)
              items[i] = {
                index: i,
                name: res[0],
                quantity: res[1],
                price: res[2],
                image: res[3] === "" ? { Logo } : res[3]
              };
              // console.log(res);
            })
            .catch(console.error)
            .finally(() => {
              finalItems.push(items[i]);
            });
        }
        this.setState({ items: finalItems });
      })
      .catch(console.error);
  };

  render() {
    return (
      <Content style={{ padding: "0 50px", marginTop: 64 }}>
        <br />
        <div style={{ background: "#fff", padding: 24, minHeight: 380 }}>
          <List
            size="default"
            grid={{ gutter: 10, column: 4 }}
            header={
              <div>
                <Row gutter={3}>
                  <Col xs={2} sm={4} md={6} lg={8} xl={10}>
                    <h3>
                      <b>{this.state.storeName}</b>
                    </h3>
                  </Col>

                  {this.state.isOwner ? (
                    <div className="addItem">
                      <Col xs={2} sm={4} md={6} lg={8} xl={10}>
                        <p>
                          <b>Store Balance: </b>
                          {this.state.storeBalance} wei
                        </p>
                      </Col>
                      <Col xs={2} sm={4} md={6} lg={8} xl={10}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          onClick={this.showModal}
                          loading={this.state.loading}
                        >
                          Add Item
                        </Button>
                      </Col>
                      <Col xs={2} sm={4} md={6} lg={8} xl={10}>
                        <Button
                          type="danger"
                          ghost
                          htmlType="submit"
                          onClick={() => this.withdrawBalance()}
                        >
                          Withdraw Balance
                        </Button>
                      </Col>
                      <Modal
                        title={"Add Item to " + this.state.storeName}
                        visible={this.state.visible}
                        onOk={this.addItem}
                        onCancel={this.handleCancel}
                      >
                        <div>
                          <Input
                            name="name"
                            onChange={this.handleChange}
                            placeholder="Item Name"
                          />
                          <br />
                          <br />
                          <Input
                            name="price"
                            onChange={this.handleChange}
                            placeholder="Item Price"
                          />
                          <br />
                          <br />
                          <Input
                            name="quantity"
                            onChange={this.handleChange}
                            placeholder="Item Quantity"
                          />
                          <br />
                          <br />
                          <Input
                            type="file"
                            name="image"
                            onChange={this.getImage}
                          />
                        </div>
                      </Modal>
                    </div>
                  ) : (
                    <div />
                  )}
                </Row>
              </div>
            }
            dataSource={this.state.items}
            renderItem={item => (
              <List.Item>
                <Card
                  title={item.name}
                  cover={
                    <img
                      alt={item.name}
                      style={{ width: 225 }}
                      src={"https://ipfs.io/ipfs/" + item.image}
                    />
                  }
                >
                  <b>Price:</b> {item.price} wei
                  <br />
                  <b>Quantity:</b> {item.quantity} sku
                  <br />
                  {this.state.isOwner ? (
                    <span />
                  ) : (
                    <Button
                      onClick={() => this.buyItem(item.index, item.price)}
                      type="primary"
                      disabled={item.quantity === "0" || item.quantity === 0}
                      loading={this.state.buying}
                    >
                      {this.state.buying ? "Buying" : "Buy"}
                    </Button>
                  )}
                </Card>
              </List.Item>
            )}
          />
        </div>
      </Content>
    );
  }
}

export default StoreItems;
