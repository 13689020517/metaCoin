pragma solidity ^0.4.18;
import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';

contract MetaCoin is StandardToken {

	string public name = 'MyCoin';
	string public symbol = 'MC';
	uint8 public decimals = 2;

	mapping (address => uint) balances;

	constructor () payable public {

	}

	//代币转账
	function sendCoin(address sender ,address receiver, uint amount)public returns(bool sufficient) {
		if (balances[sender] < amount) return false;
		balances[sender] -= amount;
		balances[receiver] += amount;
		return true;
	}

	//获取传入地址的代币余额
	function getBalance(address addr) constant public returns(uint) {
		return balances[addr];
	}

	//以1：100的比例赎回ETH
	function withDrawETH(uint count) public returns (bool) {
		uint value = (count/10**14);
		msg.sender.transfer(value);
		balances[msg.sender]-= count;
		return true;
	}

	//以1：100的比例买入代币
	function buyCoin() public payable {
		balances[msg.sender] += (msg.value/10**14);
	}

	//获取合约地址ETH余额
	function getTotal() public view returns(uint){
		return address(this).balance;
	}

	//获取合约地址
	function getContractAddr() public view returns(address){
		return address(this);
	}

	function () public payable {
		if(msg.value>0){
			buyCoin();
		}
	}

}