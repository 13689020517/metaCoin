import React, { Component } from 'react'
import MetaCoinContract from '../build/contracts/MetaCoin.json'

import getWeb3 from './utils/getWeb3'
import $ from 'jquery';

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'
import './css/main.css'

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      myAddr:null,  //本用户钱包地址
      tx_Addr:null, //保存合约地址
      web3: null,   //保存web3实例
      accounts:[],  //保存所有账户
      metaCoinInstance:null, //保存合约实例，方便在其他地方调用
      balance:0,    //保存查询账户代币余额
      ethBalance:0  //保存查询账户ETH余额
    }
  }

  /**
   * 初始化
   * 把web3保存在state中。
   */
  componentWillMount() {
    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })
      this.initMyData()
    })
    .catch((err) => {
      console.log('创建web3实例时出现了error',err)
    })
  }

  initMyData(){
      let username = window.location.href.split('=')[1];
      console.log('用户名：'+username)
      $.ajax({
          type: "post",
          url: "http://localhost:1993/toMain",
          dataType:'JSON',
          data:{ username: username },
          success: data => {
              //接受返回的数据，前端判断采取的动作
              if(data){
                  if(data.message){
                      this.queryData(data.data[0])
                  }else{
                      alert('查询钱包数据失败！');
                  }
              }
          }
      });
  }

    queryData(data) {
        console.log('查询的数据：'+data)
        var username = data.username;
        console.log('查询的数据11：'+username)
        var password = data.userpassword;
        console.log('查询的数据22：'+password)
        var keystore = data.keystore;
        console.log('查询的数据33：'+keystore)
        var temp = lightwallet.keystore.deserialize(keystore);
        console.log('查询的数据44：'+temp)
        /*以用户密码作为输出，产生的Uint8类型的数组的对称密钥，这个密钥用于加密和解密keystore*/
        temp.keyFromPassword(password, function (err, pwDerivedKey) {
            console.log('走是走到了')
            if(err) {
                document.getElementById("info").innerHTML = err;
            } else {
                /*通过seed助记词密码在keystore产生totalAddresses个地址/私钥对。这个地址/私钥对可通过ks.getAddresses()函数调用返回*/
                temp.generateNewAddress(pwDerivedKey, 1);
                this.setState({
                    myAddr: temp.getAddresses()
                })
                this.instantiateContract()
            }
        });
    }

  instantiateContract() {
    const contract = require('truffle-contract')
    const MetaCoin = contract(MetaCoinContract)
    MetaCoin.setProvider(this.state.web3.currentProvider)
    //获取本测试网络所有节点地址，用来做列表显示
    this.state.web3.eth.getAccounts((error, accounts) => {
      
      this.setState({
        accounts:accounts
      })

      //部署合约，保存合约实例
      MetaCoin.deployed()
      .then(async (instance) => {
          this.setState({
              metaCoinInstance:instance,
              tx_Addr:await instance.getContractAddr()
        })
      }).catch(error =>{
          console.log(error)
      })
      //设置默认账户。
        console.log(this.state.myAddr)
        MetaCoin.defaults(this.state.myAddr)
    })
  }

  /**
   * 代币转账
   * 获取输入框中的转账地址
   * 接受地址和金额
   * 调用web3的api转账
   */
  sendCoin(){
      let address_from = this.refs.address_from.value;
      let address_to = this.refs.address_to.value;
      let trans_value = this.refs.trans_value.value;
      if(address_to != "" && trans_value != ""){
        
        this.state.metaCoinInstance.sendCoin(address_from,address_to,trans_value)

        //转账完成后吧输入框清空
        this.refs.address_from.value = "";
        this.refs.address_to.value = "";
        this.refs.trans_value.value = "";
      }
  }

  /**
   * 查询余额
   * metaCoinInstance.getBalance(查询地址)
   */
  getBalance(){
      let address_check = this.refs.address_check.value;

      //查询代币余额
      this.state.metaCoinInstance.getBalance(address_check)
      .then( result => {
          this.setState({
              balance: result.toString()
          })
      })
      //查询ETH余额
      let eth = this.state.web3.fromWei(this.state.web3.eth.getBalance(address_check).toString(), 'ether');
      this.setState({
          ethBalance: eth
      })
      this.refs.address_check.value=''
  }

    /**
     * ETH转账
     * 获取输入框中的转账地址
     * 接受地址和金额
     * 调用web3的api转账
     */
  transfer(){
      // 以太币转账
      let web3 = this.state.web3;
      web3.eth.sendTransaction({
           from: this.refs.address_from_eth.value,
           to: this.refs.address_to_eth.value,
           value: web3.toWei(this.refs.trans_value_eth.value, 'ether')
      })
  }

    /**
     * 用ETH购买代币
     * 获取输入框中的购买地址
     * 接受地址和金额
     * 调用web3的api转出ETH，调用智能合约的api转入代币
     */
  buyMetaCoin(){
      let trans_value = this.refs.spend_value_eth.value;
      //先进行ETH转账
      let web3 = this.state.web3;
      web3.eth.sendTransaction({
          from: this.state.accounts[0],
          to: this.state.tx_Addr,
          value: web3.toWei(trans_value, 'ether')
      })
      //转账完成后吧输入框清空
      this.refs.spend_value_eth.value = "";
  }

    /**
     * 用代币赎回ETH
     * 获取输入框中的赎回地址
     * 接受地址和金额
     * 调用智能合约的api转出代币
     */
  withDrawEth(){
      this.state.metaCoinInstance.withDrawETH(this.refs.spend_value_coin.value)
        this.refs.spend_value_coin.value = ''
  }

  render() {
    return (
      <div className="App">
        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1 list-container">
              <h1>账户列表</h1>
              <div>
                { this.state.accounts.map( acc => <div className="list-item" key={acc}>{acc}</div> ) }
              </div>
                <div>转出代币地址：<input ref="address_from"/></div>
                <div>转入代币地址：<input ref="address_to"/></div>
                <div>转入代币金额：<input ref="trans_value"/></div>
                <div><button onClick={this.sendCoin.bind(this)}>确定</button></div>

                <div>转出ETH地址：<input ref="address_from_eth"/></div>
                <div>转入ETH地址：<input ref="address_to_eth"/></div>
                <div>转入ETH金额：<input ref="trans_value_eth" placeholder='单位(ether)'/></div>
                <div><button onClick={this.transfer.bind(this)}>确定</button></div>

                <div>花费多少ETH：<input ref="spend_value_eth" placeholder='单位(ether)'/></div>
                <div><button onClick={this.buyMetaCoin.bind(this)}>确定</button></div>

                <div>花费多少代币：<input ref="spend_value_coin" /></div>
                <div><button onClick={this.withDrawEth.bind(this)}>确定</button></div>

                <div>
                <h1>查询余额</h1>
                <h3>代币余额：{this.state.balance}</h3>
                <h3>ETH余额：{this.state.ethBalance}</h3>
                <div>地址：<input ref="address_check"/></div>
                <div><button onClick={this.getBalance.bind(this)}>查询</button></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

}

export default App
