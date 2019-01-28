// List all items of store
// Add Item button for owner and buy for everyone else.
import React, { Component } from "react";
import { Row, Col, Layout, List, Card, Modal, Button, Input } from "antd";
import "antd/dist/antd.css";
const { Content } = Layout;
const InputGroup = Input.Group;

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
      storeName: "",
      isOwner: false,
      items: [],
      storeBalance: 0
    };
    this.handleChange = this.handleChange.bind(this);
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

  addItem = event => {
    const { accounts, contract, storeID } = this.props;
    const { name, price, quantity } = this.state;
    contract.methods
      .addItem(name, price, quantity, storeID)
      .send({ from: accounts[0] });
    this.setState({ loading: false, value: "", visible: false });
    this.fetchItems();
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

  buyItem = (itemIndex, price) => {
    // console.log(itemIndex, this.props.storeID);
    this.props.contract.methods
      .buyItem(itemIndex, 1, this.props.storeID)
      .send({ from: this.props.accounts[0], value: price });
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
                price: res[2]
              };
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
            grid={{ gutter: 16, column: 3 }}
            header={
              <div>
                <Row gutter={4}>
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
                        <InputGroup>
                          <Input
                            name="name"
                            onChange={this.handleChange}
                            placeholder="Item Name"
                          />
                          <Input
                            name="price"
                            onChange={this.handleChange}
                            placeholder="Item Price"
                          />
                          <Input
                            name="quantity"
                            onChange={this.handleChange}
                            placeholder="Item Quantity"
                          />
                        </InputGroup>
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
                <Card title={item.name}>
                  <b>Price:</b> {item.price} wei
                  <br />
                  <b>Quantity:</b> {item.quantity} sku
                  <br />
                  <Button
                    onClick={() => this.buyItem(item.index, item.price)}
                    type="primary"
                    disabled={item.quantity === "0" || item.quantity === 0}
                  >
                    Buy
                  </Button>
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
