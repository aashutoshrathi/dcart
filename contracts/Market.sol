
pragma solidity ^0.5.0;

contract Market {

  struct Store {
    address payable storeOwner;
    string storeName;
    uint storeSkuCount;
    mapping (uint=>Item) storeItems;
  }

  enum State {ForSale, Sold, Shipped, Recieved}

  struct Item {
    string name;
    uint sku;
    uint price;
    State state;
  }

  mapping(uint => Item) public items;
  mapping(uint => Store) public stores;
  mapping(address => bool) public isAdmin;

  event ForSale(uint _sku, uint _storeID);
  event Sold(uint _sku, uint _storeID);
  event Shipped(uint _sku, uint _storeID);
  event Recieved(uint _sku, uint _storeID);
  event AdminAdded(address _user);
  event AdminRemoved(address _user);
  event StoreAdded(address _owner, string _name, uint _skuCount, );
  event StoreRemoved(address _user);

  modifier checkOwner () {
    require(msg.sender == owner, "You are not owner");
    _;
  }
  modifier verifyCaller (address _address) { require (msg.sender == _address); _;}

  modifier paidEnough(uint _price) { require(msg.value >= _price); _;}
  modifier checkValue(uint _sku) {
    //refund them after pay for item (why it is before, _ checks for logic before func)
    _;
    uint _price = items[_sku].price;
    uint amountToRefund = msg.value - _price;
    items[_sku].buyer.transfer(amountToRefund);
  }

  modifier forSale(uint _sku) {
    require(items[_sku].state == State.ForSale);
    _;
  }
  modifier sold(uint _sku) {
    require(items[_sku].state == State.Sold);
    _;
  }
  modifier shipped(uint _sku) {
    require(items[_sku].state == State.Shipped);
    _;
  }
  modifier received(uint _sku) {
    require(items[_sku].state == State.Recieved);
    _;
  }


  constructor() public {
    owner = msg.sender;
    skuCount = 0;
  }

  function addItem(string memory _name, uint _price) public returns(bool){
    emit ForSale(skuCount);
    items[skuCount] = Item({name: _name, sku: skuCount, price: _price, state: State.ForSale, seller: msg.sender, buyer: address(0)});
    skuCount += 1;
    return true;
  }

  function buyItem (uint sku)
    public
    payable
    checkValue(sku)
    forSale(sku)
    paidEnough(items[sku].price)
  {
    items[sku].seller.transfer(items[sku].price);
    items[sku].buyer = msg.sender;
    items[sku].state = State.Sold;
    emit Sold(sku);
  }

  function shipItem(uint sku)
    public
    sold(sku)
    verifyCaller(items[sku].seller)
  {
    items[sku].state = State.Shipped;
    emit Shipped(sku);
  }

  function receiveItem(uint sku)
    public
    shipped(sku)
    verifyCaller(items[sku].buyer)
  {
    items[sku].state = State.Recieved;
    emit Recieved(sku);
  }

  function fetchItem(uint _sku) public view returns (string memory name, uint sku, uint price, uint state, address seller, address buyer) {
    name = items[_sku].name;
    sku = items[_sku].sku;
    price = items[_sku].price;
    state = uint(items[_sku].state);
    seller = items[_sku].seller;
    buyer = items[_sku].buyer;
    return (name, sku, price, state, seller, buyer);
  }
}
