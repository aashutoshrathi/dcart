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
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.contract) {
    }
  }

  fetchOrders = () => {
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
      title: "Amount",
      dataIndex: "amount",
      key: "amount"
    }
  ];

  data = [
    {
      key: "1",
      name: "John Brown",
      amount: 32,
      store: "New York No. 1 Lake Park"
    },
    {
      key: "2",
      name: "Jim Green",
      amount: 42,
      store: "London No. 1 Lake Park"
    },
    {
      key: "3",
      name: "Joe Black",
      amount: 32,
      store: "Sidney No. 1 Lake Park"
    }
  ];

  render() {
    return (
      <Content style={{ padding: "0 50px", marginTop: 64 }}>
        <br />
        <div style={{ background: "#fff", padding: 24, minHeight: 380 }}>
          <Table columns={this.columns} dataSource={this.data} />
        </div>
      </Content>
    );
  }
}

export default Orders;
