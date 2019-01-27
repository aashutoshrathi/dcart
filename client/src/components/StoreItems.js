// List all items of store
// Add Item button for owner and buy for everyone else.
import React, { Component } from "react";
import { Layout, List, Card, Modal, Button } from "antd";
import "antd/dist/antd.css";
const { Content } = Layout;

class StoreItems extends Component {
  constructor(props) {
    super(props);
    console.log(props);
    this.state = {
      loading: false,
      name: "",
      price: "",
      quantity: "",
      visible: false,
      storeName: "",
      isOwner: false
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
    console.log("Added");
  };

  async componentDidMount() {
    this.fetchItems();
    if (!this.props.contract) {
      console.log("No contract found");
      return;
    }
    this.props.contract.methods
      .getStore(this.props.storeID)
      .call()
      .then(res =>
        this.setState({
          storeName: res[0],
          isOwner: res[1] === this.props.accounts[0]
        })
      );
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.contract) {
      this.fetchItems();
    }
  }

  handleChange = event => {
    this.setState({ value: event.target.value });
  };

  async fetchItems() {
    if (!this.props.contract) {
      return;
    }
    var storeID = this.props.storeID;
    let items = [];
    this.props.contract.methods
      .getStoreItemCount(storeID)
      .call()
      .then(num => {
        for (let i = num - 1; i >= 0; i--) {
          this.props.contract.methods
            .fetchItem(i, storeID)
            .call()
            .then(res => {
              items[i] = {
                name: res[0],
                quantity: res[1],
                price: res[2],
                state: res[3]
              };
              console.log(res);
            })
            .catch(console.error)
            .finally(() => {
              this.setState({ items: items });
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
          <List
            size="default"
            grid={{ gutter: 16, column: 3 }}
            header={
              <div>
                <h3>
                  <b>Items</b>
                  {this.state.isOwner ? (
                    <div className="addItem">
                      <Button
                        type="primary"
                        htmlType="submit"
                        onClick={this.showModal}
                      >
                        Add Item
                      </Button>
                      <Modal
                        title={"Add Item to " + this.state.storeName}
                        visible={this.state.visible}
                        onOk={this.addItem}
                        onCancel={this.handleCancel}
                      />
                    </div>
                  ) : (
                    <div />
                  )}
                </h3>
              </div>
            }
            dataSource={this.state.items}
            renderItem={item => (
              <List.Item>
                <Card title={item.name}>{item.owner}</Card>
              </List.Item>
            )}
          />
        </div>
      </Content>
    );
  }
}

export default StoreItems;
