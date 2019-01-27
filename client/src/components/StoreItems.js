// List all items of store
// Add Item button for owner and buy for everyone else.
import React, { Component } from "react";
import { Layout, List, Card } from "antd";
import "antd/dist/antd.css";
const { Content } = Layout;

class StoreItems extends Component {
  constructor(props) {
    super(props);
    console.log(props);
    this.state = { loading: false, value: "" };
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    this.fetchItems(this.props.storeID);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.contract) {
      this.fetchItems(this.props.storeID);
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
