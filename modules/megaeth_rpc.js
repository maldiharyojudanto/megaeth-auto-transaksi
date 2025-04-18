import { Web3 } from "web3";

const web3 = new Web3("https://carrot.megaeth.com/rpc");

console.log(await web3.eth.getBlock())