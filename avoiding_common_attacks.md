# Avoiding Common Attacks

### DDoS

We are using the pull over push payments method and thus it protects against the threat of DDoS.

### Admin Profile

The constructor initializes the owner's profile using Ownable ❤️.

### Reentrancy

We are using the withdrawl pattern in the Smart Contract. The withdraw function is a used by user to withdraw their funds. By using the transfer() function instead of call.value() we limit the amount of wei transmitted to any fallback function.

### Integer overflows/underflows 🔬

Used the [SafeMath](https://github.com/OpenZeppelin/openzeppelin-solidity/raw/master/contracts/math/SafeMath.sol) contract.
Thanks to OpenZeppelin.

### Timestamping

I have not interacted with any timestamps as of now, so no worries.
