// List all items of store
// Add Item button for owner and buy for everyone else.
import React, { Component } from "react";
import { Layout, Table } from "antd";
import "antd/dist/antd.css";
const { Content } = Layout;

class Orders extends Component {
  constructor(props) {
    super(props);
    // console.log(props);
    this.state = {
      loading: false,
      items: []
    };
  }

  componentDidMount() {
    if (!this.props.contract) {
      // console.log("No contract found");
      return;
    }
    this.fetchOrders();
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.contract) {
      this.fetchOrders();
    }
  }

  fetchOrders = async () => {
    if (!this.props.contract) {
      return;
    }
    let items = [];
    let num = await this.props.contract.methods.getStoreCount().call();
    // console.log("No. of stores:", num);
    let itemCount = [];
    let count = 0;
    for (let i = num - 1; i >= 0; i--) {
      var storeName = await this.props.contract.methods.getStore(i).call();
      storeName = storeName[0];
      // console.log(storeName);
      itemCount[i] = await this.props.contract.methods
        .getStoreItemCount(i)
        .call();
      for (let j = itemCount[i] - 1; j >= 0; j--) {
        let fin = await this.props.contract.methods
          .getOrderDetails(i, j)
          .call();
        let itemName = await this.props.contract.methods.fetchItem(j, i).call();
        // console.log(itemName);
        if ((fin[0] === 0 || fin[0] === "0")) {
          items[count] = {
            key: count,
            name: itemName[0],
            quantity: fin[0],
            price: fin[1] + " wei",
            total: fin[1] * fin[0] + " wei",
            store: storeName
          };
        }
        count++;
      }
    }
    // console.log(items);
    this.setState({ items: items });
  };

  columns = [
    {
      title: "Item Name",
      dataIndex: "name",
      key: "name"
    },
    {
      title: "Store Name",
      dataIndex: "store",
      key: "store"
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity"
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price"
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total"
    }
  ];

  render() {
    return (
      <Content style={{ padding: "0 50px", marginTop: 64 }}>
        <br />
        <div style={{ background: "#fff", padding: 24, minHeight: 380 }}>
          <Table columns={this.columns} dataSource={this.state.items} />
        </div>
      </Content>
    );
  }
}

export default Orders;
