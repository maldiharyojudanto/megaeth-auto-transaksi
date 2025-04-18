import { Web3 } from "web3";
import chalk from "chalk";

const CA_cUSD = "0xE9b6e75C243B6100ffcb1c66e8f78F96FeeA727F"
const CA_WETH = "0x776401b9BC8aAe31A685731B7147D4445fD9FB19"
const SC_ROUTER_cUSD_WETH = "0xA6b579684E943F7D00d616A48cF99b5147fC57A5"
const PATH_ROUTER = [CA_cUSD, CA_WETH] // sell cUSD => get WETH

async function getGasEstimate(fromAddress, toSC, data) {
    const url = "https://carrot.megaeth.com/rpc"

    const payload = JSON.stringify({
        "method": "eth_estimateGas",
        "params": [
            {
                "from": fromAddress,
                "to": toSC,
                "data": data
            }
        ],
        "id": 1,
        "jsonrpc": "2.0"
    })

    const headers = {
        'Content-Type': 'application/json'
    }

    while (true) {
        try {
            const response = await fetch(url, {
                method: "POST",
                body: payload,
                headers: headers
            })

            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`)
            }

            return await response.json()
        } catch (err) {
            console.log(chalk.red(`⛔ ${err.message}`))
        }
    }
}

const approvecUSDETH = async (web3, account, amount) => {
    // eksekusi 1 (approve cUSD) 
    const abiERC20 = [
        {
            "constant": true,
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
                ],
                "name": "allowance",
                "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
              {
                "internalType": "address",
                "name": "spender",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
              }
            ],
            "name": "approve",
            "outputs": [
              {
                "internalType": "bool",
                "name": "",
                "type": "bool"
              }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
              {
                "internalType": "address",
                "name": "",
                "type": "address"
              }
            ],
            "name": "balanceOf",
            "outputs": [
              {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
              }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ]

    let contract = new web3.eth.Contract(abiERC20, CA_cUSD)

    const izinkan = await contract.methods.allowance(account.address, SC_ROUTER_cUSD_WETH).call()
    const izinkanKah = izinkan!=0?chalk.green('Sudah'):chalk.red('Belum')
    // console.log(`❓ Apakah sudah di approve? ${izinkanKah}`)
    const jumlahIzin = web3.utils.fromWei(izinkan, 'ether')
    
    const balanceMyWei = await contract.methods.balanceOf(account.address).call()
    const balanceMyEther = web3.utils.fromWei(balanceMyWei, 'ether')
    console.log(`💲 Saldo cUSD: ${chalk.yellow(`${balanceMyEther} cUSD`)} `)

    if (Number(balanceMyEther) > Number(amount)) { // jika balance cusd kita lebih besar dari amount yang ingin di swap maka lakukan swap
        if(izinkan==0 || Number(jumlahIzin) < Number(amount)) { // jika belum di allow dan izin kurang dari jumlah yg mau di swap
            const tokenAmount = web3.utils.toWei(amount, 'ether')
            const dataABI = contract.methods.approve(SC_ROUTER_cUSD_WETH, tokenAmount).encodeABI() // sc router bukan cusd
            // console.log(dataABI)
    
            while (true) {
                try {
                    const getgasprice = await web3.eth.getGasPrice() //1000000n wei or 0.001 gwei
                    // console.log(getgasprice)
    
                    const resGasMethod = await getGasEstimate(account.address, CA_cUSD, dataABI)
                    const estGas = BigInt(resGasMethod.result)
                    // console.log(estGas)
    
                    const estTxFee = web3.utils.fromWei(estGas, 'Gwei') * web3.utils.fromWei(getgasprice, "Gwei") 
                    // console.log(estTxFee) 
    
                    const saldoMy = web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether') // saldo eth saya
    
                    if (estTxFee <= Number(saldoMy) && Number(saldoMy) >= 0) {
                        console.log("   Saldo ETH mencukupi, transaksi diproses...")
                        console.log(`✅ Sedang melakukan approve ${chalk.yellow(`${web3.utils.fromWei(tokenAmount, 'ether')} testnet cUSD`)}`)
    
                        // get fee data terkini
                        const feeData = await web3.eth.calculateFeeData();
    
                        // raw tx
                        const transaction = {
                            from: account.address,
                            to: CA_cUSD,
                            gasprice: estGas*4n,
                            maxFeePerGas: feeData.maxFeePerGas,
                            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                            nonce: await web3.eth.getTransactionCount(account.address),
                            data: dataABI,
                        };
    
                        // sign tx
                        const signedTransaction = await web3.eth.accounts.signTransaction(
                            transaction,
                            account.pkey,
                        );
    
                        // send sign tx
                        try {
                            const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
                            console.log(`   Transaction hash: ${chalk.green(`https://www.megaexplorer.xyz/tx/${receipt.transactionHash}`)}`);
                            console.log(`   Transaction fee: ${chalk.yellow(`${web3.utils.fromWei(receipt.effectiveGasPrice * receipt.gasUsed, 'ether')} Mega ETH`)}`)
                            const txStat = await web3.eth.getTransactionReceipt(receipt.transactionHash)
                            
                            if (web3.utils.toNumber(txStat.status) == 1) {
                                return 1
                            } else {
                                continue
                            }
                        } catch (err) {
                            console.log(chalk.red(`⛔ ${err.message}`))
                        }
                    } else {
                        return
                    }
                } catch (err) {
                    console.log(chalk.red(`⛔ Tidak dapat di approve karena ${err.message}`))
                }
            }
        } else { // jika 
            console.log(`   Jumlah maksimal yang dapat di swap ${chalk.yellow(`${jumlahIzin} cUSD`)}`)
            return 2 // 2 dianggap oke berhasil
        }
    } else { // jika tidak mencukupi balance cusd skip dan return
        console.log(chalk.red(`⛔ Tidak dapat swap cUSD ke WETH karena balance cUSD kurang dari jumlah yang akan atau telah di approve`))
        return
    }
}

async function convertcUSDtoWETH() { // 1 cusd => weth
    const url = "https://testnet.gte.xyz/api/rpc"

    const payload = JSON.stringify({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "eth_call",
        "params": [
            {
                "data": "0xd06ca61f0000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000e9b6e75c243b6100ffcb1c66e8f78f96feea727f000000000000000000000000776401b9bc8aae31a685731b7147d4445fd9fb19",
                "to": "0xA6b579684E943F7D00d616A48cF99b5147fC57A5"
            },
            "latest"
        ]
    })

    const headers = {
        'origin': 'https://testnet.gte.xyz',
        'priority': 'u=1, i',
        'referer': 'https://testnet.gte.xyz/swap',
        'Content-Type': 'application/json'
    }

    while (true) {
        try {
            const response = await fetch(url, {
                method: "POST",
                body: payload,
                headers: headers
            })

            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`)
            }

            return await response.json()
        } catch (err) {
            console.log(chalk.red(`⛔ ${err.message}`))
        }
    }
}

const swapcUSDETH = async (web3, account, amount) => {
    // eksekusi 2
    const abiRouter = [
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "amountIn",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "amountOutMin",
                    "type": "uint256"
                },
                {
                    "internalType": "address[]",
                    "name": "path",
                    "type": "address[]"
                },
                {
                    "internalType": "address",
                    "name": "to",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "deadline",
                    "type": "uint256"
                }
            ],
            "name": "swapExactTokensForETH",
            "outputs": [
                {
                    "internalType": "uint256[]",
                    "name": "amounts",
                    "type": "uint256[]"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]

    const contract = new web3.eth.Contract(abiRouter, SC_ROUTER_cUSD_WETH)

    const tokenAmountIn = web3.utils.toWei(amount, 'ether')

    while (true) {
        const convert_cusd_weth = await convertcUSDtoWETH()  // dapatkan konversi 1 cusd ke eth saat ini
        
        const hex_cv_cusd_weth = convert_cusd_weth.result; // ambil result tipe uint256 0x
        let cv_cusd_weth = hex_cv_cusd_weth.slice(2);  // hilangkan 0x
        const cv_cusd_weth_32 = cv_cusd_weth.match(/.{1,64}/g); // bagi array of 32-byte words (4 bagian)
        cv_cusd_weth ="0x"+cv_cusd_weth_32[cv_cusd_weth_32.length - 1] // konversi ke hex
        
        const tokenAmountOut = BigInt(cv_cusd_weth)*BigInt(web3.utils.fromWei(tokenAmountIn, 'ether')) // 1 cUSD * Amount in
        const tokenAmountOutWithSlippage = tokenAmountOut - ((tokenAmountOut * 1n) / 100n) // 1% slippage
        
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // buat 20 menit dari sekarang

        const dataABI = contract.methods.swapExactTokensForETH(
            tokenAmountIn,
            tokenAmountOutWithSlippage,
            PATH_ROUTER,
            account.address,
            deadline
        ).encodeABI()
        // console.log(dataABI)

        const status_approve = await approvecUSDETH(web3, account, amount)
        if(status_approve==undefined) {
            return
        }
        await new Promise(resolve => setTimeout(resolve, 200)) // delay 2 detik

        while (true) { 
            try {
                const getgasprice = await web3.eth.getGasPrice() //1000000n
                // console.log(getgasprice)

                const resGasMethod = await getGasEstimate(account.address, SC_ROUTER_cUSD_WETH, dataABI)
                const estGas = BigInt(resGasMethod.result) // 140000n
                // console.log(estGas)

                const estTxFee = web3.utils.fromWei(estGas, 'Gwei') * web3.utils.fromWei(getgasprice, "Gwei")
                // console.log(estTxFee) 

                const saldoMy = web3.utils.fromWei(await web3.eth.getBalance(account.address), 'ether') // saldo eth saya

                if (estTxFee <= Number(saldoMy) && Number(saldoMy) >= 0) {
                    console.log("   Saldo ETH mencukupi, transaksi diproses...")
                    console.log(`🔄 Sedang melakukan swap ${chalk.yellow(`${web3.utils.fromWei(tokenAmountIn, 'ether')} cUSD`)} ke ${chalk.yellow(`${web3.utils.fromWei(tokenAmountOutWithSlippage, 'ether')} ETH`)}`)
                    console.log(`   Amount in: ${chalk.yellow(`${web3.utils.fromWei(tokenAmountIn, 'ether')} cUSD`)}`)
                    console.log(`   Amount out min (slippage 1%): ${chalk.yellow(`${web3.utils.fromWei(tokenAmountOutWithSlippage, 'ether')} ETH`)}`)

                    // get fee data terkini
                    const feeData = await web3.eth.calculateFeeData();

                    // raw tx
                    const transaction = {
                        from: account.address,
                        to: SC_ROUTER_cUSD_WETH,
                        gasprice: estGas*4n,
                        maxFeePerGas: feeData.maxFeePerGas,
                        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
                        nonce: await web3.eth.getTransactionCount(account.address),
                        data: dataABI,
                    };

                    // sign tx
                    const signedTransaction = await web3.eth.accounts.signTransaction(
                        transaction,
                        account.pkey,
                    );

                    // send sign tx
                    try {
                        const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
                        console.log(`   Transaction hash: ${chalk.green(`https://www.megaexplorer.xyz/tx/${receipt.transactionHash}`)}`);
                        console.log(`   Transaction fee: ${chalk.yellow(`${web3.utils.fromWei(receipt.effectiveGasPrice * receipt.gasUsed, 'ether')} Mega ETH`)}`)
                        const txStat = await web3.eth.getTransactionReceipt(receipt.transactionHash)
                        
                        if (web3.utils.toNumber(txStat.status) == 1) {
                            if (status_approve == 1) {
                                return 2
                            }
                            if (status_approve == 2) {
                                return 1
                            }
                        } else {
                            continue
                        }
                    } catch (err) {
                        console.log(chalk.red(`⛔ ${err.message}`))
                    }
                } else {
                    return
                }
            } catch (err) {
                console.log(chalk.red(`⛔ Tidak dapat melakukan swap karena ${err.message}`))
                break
            }
        }
    }
}

export { SC_ROUTER_cUSD_WETH, getGasEstimate, swapcUSDETH }